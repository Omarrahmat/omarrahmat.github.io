// Fostering Today: hands back a small copy of a logo that came in through the mailbox, as text.
// It exists so the logo can be looked at (and a picture of the profile made) from a workspace that cannot open the
// logo store. The only input is the id of a finished request in public.logo_imports, so calling this address without
// one does nothing: that is the check on who may call it. The logos themselves are public already (they show on profiles).
// Deployed to the Supabase project as "ft-logo-copy" with JWT verification off.
//
// Ask from the database:  select net.http_post(url := '<project>/functions/v1/ft-logo-copy', body := jsonb_build_object('id', '<logo_imports id>', 'max', 160));
// then read the answer in net._http_response. "lines" holds the copy in base64, 100 characters a line, each line
// starting with the first four hex digits of its own SHA-256 so a copying slip can be found.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (b: Uint8Array | string) => hex(await crypto.subtle.digest("SHA-256", typeof b === "string" ? new TextEncoder().encode(b) : b));
function base64(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Shrinks an RGBA picture by averaging the pixels each new pixel covers (weighted by how see-through they are). */
function shrink(src: Uint8ClampedArray, sw: number, sh: number, dw: number, dh: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(dw * dh * 4);
  const fx = sw / dw, fy = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = y * fy, y1 = (y + 1) * fy;
    for (let x = 0; x < dw; x++) {
      const x0 = x * fx, x1 = (x + 1) * fx;
      let r = 0, g = 0, b = 0, a = 0, total = 0;
      for (let sy = Math.floor(y0); sy < Math.min(sh, Math.ceil(y1)); sy++) {
        const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
        for (let sx = Math.floor(x0); sx < Math.min(sw, Math.ceil(x1)); sx++) {
          const w = (Math.min(sx + 1, x1) - Math.max(sx, x0)) * wy;
          const i = (sy * sw + sx) * 4, al = src[i + 3] / 255;
          r += src[i] * al * w; g += src[i + 1] * al * w; b += src[i + 2] * al * w; a += al * w; total += w;
        }
      }
      const o = (y * dw + x) * 4;
      if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; }
      out[o + 3] = total > 0 ? (a / total) * 255 : 0;
    }
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let id = "", max = 160, flat = false;
  try {
    const b = await req.json();
    id = String(b.id || "");
    if (Number(b.max)) max = Math.min(512, Math.max(32, Math.round(Number(b.max))));
    flat = b.flat === true; // on white, as a JPEG: smaller, and how a logo shows on its white tile anyway
  } catch { /* no body */ }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) return json({ error: "No such request" }, 404);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: job } = await db.from("logo_imports").select("provider_id,status,detail").eq("id", id).eq("status", "done").maybeSingle();
  if (!job) return json({ error: "No such request" }, 404);

  try {
    const { data: prof } = await db.from("provider_profiles").select("logo_path").eq("provider_id", job.provider_id).maybeSingle();
    const path = String(prof?.logo_path || job.detail || "");
    if (!path || path.startsWith("/")) return json({ error: "This profile has no logo in the logo store" }, 404);
    const got = await db.storage.from("provider-logos").download(path);
    if (got.error || !got.data) return json({ error: `The logo could not be read: ${got.error?.message || "nothing came back"}` }, 502);
    const bytes = new Uint8Array(await got.data.arrayBuffer());

    const pic = await decode(bytes, true) as Image;
    const sw = pic.width, sh = pic.height, src = pic.bitmap as Uint8ClampedArray;
    let clear = 0, white = 0;
    for (let i = 0; i < src.length; i += 4) {
      if (src[i + 3] < 8) clear++;
      else if (src[i] > 244 && src[i + 1] > 244 && src[i + 2] > 244) white++;
    }
    const px = sw * sh;
    const k = Math.min(1, max / Math.max(sw, sh));
    const dw = Math.max(1, Math.round(sw * k)), dh = Math.max(1, Math.round(sh * k));
    const small = k < 1 ? shrink(src, sw, sh, dw, dh) : new Uint8ClampedArray(src);

    const copy = new Image(dw, dh);
    let type = "image/png";
    let out: Uint8Array;
    if (flat) {
      for (let i = 0; i < small.length; i += 4) {
        const al = small[i + 3] / 255;
        small[i] = small[i] * al + 255 * (1 - al); small[i + 1] = small[i + 1] * al + 255 * (1 - al); small[i + 2] = small[i + 2] * al + 255 * (1 - al); small[i + 3] = 255;
      }
      copy.bitmap.set(small);
      out = await copy.encodeJPEG(90);
      type = "image/jpeg";
    } else {
      copy.bitmap.set(small);
      out = await copy.encode(9);
    }

    const text = base64(out);
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += 100) { const part = text.slice(i, i + 100); lines.push(`${(await sha(part)).slice(0, 4)} ${part}`); }
    return json({
      provider: job.provider_id, path,
      original: { bytes: bytes.length, width: sw, height: sh, see_through_share: Math.round((clear / px) * 1000) / 1000, white_share: Math.round((white / px) * 1000) / 1000 },
      copy: { type, width: dw, height: dh, bytes: out.length, base64_chars: text.length, sha256: await sha(out) },
      lines,
    });
  } catch (e) {
    return json({ error: `Unexpected error: ${(e as Error).message}` }, 500);
  }
});
