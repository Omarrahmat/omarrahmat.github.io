// Form submissions. When Supabase is configured they are stored there (insert-only);
// otherwise they are kept in this browser only so the screens can be tried out.
export interface SubmitResult { mode: 'live' | 'demo' }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function submitForm(table: string, payload: Record<string, unknown>): Promise<SubmitResult> {
  if (url && key) {
    // Legacy anon keys are JWTs and go in Authorization too; the newer sb_publishable_ keys go in apikey only.
    const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
    if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(`${url}/rest/v1/${table}`, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Submission failed (${res.status})`);
    return { mode: 'live' };
  }
  try {
    const k = 'ft-demo-submissions';
    const list = JSON.parse(localStorage.getItem(k) || '[]');
    list.push({ table, payload, at: new Date().toISOString() });
    localStorage.setItem(k, JSON.stringify(list));
  } catch {
    /* storage unavailable: nothing to do in demo mode */
  }
  return { mode: 'demo' };
}
