// Fostering Today: brings a logo that an agency emailed to hello@ into the logo store and onto its profile.
// Called by the database function public.import_logo(), which first records the request in public.logo_imports.
// The only input is the id of a pending request, so calling this address without one does nothing: that is the
// check on who may call it (no key is needed, and none is accepted).
// Deployed to the Supabase project as "ft-import-logo" with JWT verification off (see supabase/migrations/012_logo_imports.sql).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MAX_BYTES = 1048576; // the same 1 MB limit as the portal upload
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Works out the image type from the first bytes of the file, never from its name or what the sender says. */
function imageKind(b: Uint8Array): { type: string; ext: string } | null {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return { type: "image/png", ext: "png" };
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { type: "image/webp", ext: "webp" };
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let id = "";
  try { id = String((await req.json()).id || ""); } catch { /* no body */ }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) return json({ error: "No such request" }, 404);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Take the request only if it is still waiting, so a repeated call cannot run it twice.
  const { data: job } = await db.from("logo_imports").update({ status: "working" }).eq("id", id).eq("status", "pending").select().maybeSingle();
  if (!job) return json({ error: "No such request" }, 404);

  const finish = async (status: "done" | "failed", detail: string) => {
    await db.from("logo_imports").update({ status, detail, done_at: new Date().toISOString() }).eq("id", id);
    return json({ status, detail }, status === "done" ? 200 : 422);
  };

  try {
    const pid = String(job.provider_id);
    const { count } = await db.from("claim_requests").select("id", { count: "exact", head: true }).eq("provider_id", pid).eq("status", "approved");
    if (!count) return await finish("failed", "This profile has no approved claim");

    let url: URL;
    try { url = new URL(String(job.source_url)); } catch { return await finish("failed", "The link is not a web address"); }
    if (url.protocol !== "https:" || url.hostname !== "cdn.agentmail.to") return await finish("failed", "Only attachments from the hello@ mailbox can be imported");

    const res = await fetch(url, { redirect: "error" });
    if (!res.ok) return await finish("failed", `The attachment could not be fetched (${res.status}). Its link lasts about an hour: get a new one and try again`);
    if (Number(res.headers.get("content-length") || 0) > MAX_BYTES) return await finish("failed", "The file is over 1 MB");
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > MAX_BYTES) return await finish("failed", "The file is over 1 MB");
    const kind = imageKind(bytes);
    if (!kind) return await finish("failed", "The file is not a PNG, JPG or WebP image");

    const path = `${pid}/logo-${Date.now()}.${kind.ext}`;
    const up = await db.storage.from("provider-logos").upload(path, bytes, { contentType: kind.type, upsert: true });
    if (up.error) return await finish("failed", `The logo store refused the file: ${up.error.message}`);
    const saved = await db.from("provider_profiles").upsert({ provider_id: pid, logo_path: path }, { onConflict: "provider_id" });
    if (saved.error) return await finish("failed", `The file was stored but the profile could not be updated: ${saved.error.message}`);
    return await finish("done", path);
  } catch (e) {
    return await finish("failed", `Unexpected error: ${(e as Error).message}`);
  }
});
