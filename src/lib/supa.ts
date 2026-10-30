// Minimal Supabase client (REST + Auth + Storage) using fetch only, so the static builder needs no extra packages.
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SESSION_KEY = 'ft-portal-session';

export const configured = Boolean(URL_ && KEY);
export const publicLogoUrl = (path: string) => `${URL_}/storage/v1/object/public/provider-logos/${path}`;

export interface Session { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email: string } }

function baseHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { apikey: KEY };
  if (token) h.Authorization = `Bearer ${token}`;
  else if (KEY.startsWith('eyJ')) h.Authorization = `Bearer ${KEY}`;
  return h;
}

export function loadSession(): Session | null {
  try { const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); return s && s.access_token ? s : null; } catch { return null; }
}
function saveSession(s: Session | null) {
  try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ }
}
function toSession(j: any): Session {
  return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user?.id, email: j.user?.email } };
}

export async function sendCode(email: string): Promise<void> {
  const r = await fetch(`${URL_}/auth/v1/otp`, { method: 'POST', headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ email, create_user: true }) });
  if (!r.ok) throw new Error(r.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : 'We could not send the code. Please check the address and try again.');
}

export async function verifyCode(email: string, token: string): Promise<Session> {
  // New users receive a "signup" code and returning users an "email" (magic link) code; try both.
  for (const type of ['email', 'signup']) {
    const r = await fetch(`${URL_}/auth/v1/verify`, { method: 'POST', headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ type, email, token }) });
    if (r.ok) { const s = toSession(await r.json()); saveSession(s); return s; }
  }
  throw new Error('That code did not work. It may have expired: request a new one.');
}

export function signOut() { saveSession(null); }

let refreshing: Promise<Session | null> | null = null;
export async function freshSession(): Promise<Session | null> {
  const s = loadSession();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const r = await fetch(`${URL_}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
        if (!r.ok) { saveSession(null); return null; }
        const n = toSession(await r.json());
        saveSession(n);
        return n;
      } catch { return null; } finally { refreshing = null; }
    })();
  }
  return refreshing;
}

export async function api<T = any>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const s = await freshSession();
  if (!s) throw new Error('signed-out');
  const headers: Record<string, string> = { ...baseHeaders(s.access_token), 'Content-Type': 'application/json' };
  if (init.prefer) headers.Prefer = init.prefer;
  const r = await fetch(`${URL_}/rest/v1/${path}`, { method: init.method || 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  if (r.status === 401) { signOut(); throw new Error('signed-out'); }
  if (!r.ok) throw new Error(`Request failed (${r.status})`);
  const text = await r.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function rpc<T = any>(fn: string, body: unknown = {}): Promise<T> {
  return api<T>(`rpc/${fn}`, { method: 'POST', body });
}

export async function uploadLogo(path: string, file: File): Promise<void> {
  const s = await freshSession();
  if (!s) throw new Error('signed-out');
  const r = await fetch(`${URL_}/storage/v1/object/provider-logos/${path}`, { method: 'POST', headers: { ...baseHeaders(s.access_token), 'Content-Type': file.type, 'x-upsert': 'true' }, body: file });
  if (!r.ok) throw new Error('The logo could not be uploaded. Use a PNG, JPG or WebP under 1 MB.');
}

// Anonymous helpers for the public profile page.
export async function publicProfile(id: string): Promise<{ about: string | null; logo_path: string | null; phone: string | null; website: string | null; recruitment_url: string | null } | null> {
  if (!configured) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/provider_profiles?provider_id=eq.${encodeURIComponent(id)}&select=about,logo_path,phone,website,recruitment_url`, { headers: baseHeaders() });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows[0] || null;
  } catch { return null; }
}

const CRAWLER = /googlebot|bingbot|duckduckbot|applebot|yandexbot|baiduspider|slurp/i;

export function trackEvent(provider: string, kind: string) {
  if (!configured) return;
  try {
    const ua = navigator.userAgent;
    if ((navigator as any).webdriver || /headless/i.test(ua)) return; // test tools and scrapers are not counted at all
    if (CRAWLER.test(ua)) { if (kind !== 'view') return; kind = 'crawler'; } // search engines are counted separately
    else if (/bot|crawl|spider/i.test(ua)) return; // other automated visitors are not counted
    fetch(`${URL_}/rest/v1/rpc/track_event`, { method: 'POST', keepalive: true, headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ p_provider: provider, p_kind: kind }) }).catch(() => {});
  } catch { /* ignore */ }
}

/** Records that these profiles appeared in directory results (every time results are shown). */
export function trackImpressions(ids: string[]) {
  if (!configured) return;
  try {
    if ((navigator as any).webdriver || /bot|crawl|spider|headless/i.test(navigator.userAgent)) return;
    const fresh = ids.slice(0, 50);
    if (!fresh.length) return;
    fetch(`${URL_}/rest/v1/rpc/track_impressions`, { method: 'POST', keepalive: true, headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ p_providers: fresh }) }).catch(() => {});
  } catch { /* ignore */ }
}

/** Counts one search for a known area name (a place we list). Free text is never stored. */
export function trackSearch(area: string) {
  if (!configured) return;
  try {
    const ua = navigator.userAgent;
    if ((navigator as any).webdriver || /headless|bot|crawl|spider/i.test(ua)) return;
    fetch(`${URL_}/rest/v1/rpc/track_search`, { method: 'POST', keepalive: true, headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ p_area: area }) }).catch(() => {});
  } catch { /* ignore */ }
}

export async function unsubscribeEmail(email: string, provider?: string): Promise<boolean> {
  try {
    const r = await fetch(`${URL_}/rest/v1/rpc/${provider ? 'unsubscribe_provider' : 'unsubscribe_email'}`, { method: 'POST', headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(provider ? { p_provider: provider } : { p_email: email }) });
    return r.ok;
  } catch { return false; }
}

const SEARCH = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com|yahoo\.com|ecosia\.org|yandex\.[a-z]+|baidu\.com|search\.brave\.com|startpage\.com|qwant\.com|ask\.com|aol\.com)$/;
const SOCIAL = /(^|\.)(facebook\.com|fb\.com|instagram\.com|linkedin\.com|lnkd\.in|t\.co|twitter\.com|x\.com|tiktok\.com|reddit\.com|pinterest\.[a-z.]+|youtube\.com|threads\.net|nextdoor\.[a-z.]+|whatsapp\.com)$/;
const MAIL = /(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|outlook\.office365\.com|mail\.yahoo\.com|mail\.aol\.com|webmail\.[a-z.]+|mail\.proton\.me|icloud\.com)$/;
const AI = /(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/;

/** Where this page load came from, as {source, medium}. No cookies, nothing personal. */
export function visitSource(referrer: string, search: string, host: string): { source: string; medium: string; entry: boolean } {
  const q = new URLSearchParams(search);
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40);
  let ref = '';
  try { ref = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''; } catch { ref = ''; }
  const internal = !!ref && (ref === host.replace(/^www\./, '') || ref.endsWith('fosteringtoday.com'));
  const utm = clean(q.get('utm_source') || '');
  if (utm && !internal) return { source: utm, medium: clean(q.get('utm_medium') || 'campaign') || 'campaign', entry: true };
  if (internal) return { source: 'internal', medium: 'internal', entry: false };
  if (!ref) return { source: 'direct', medium: 'none', entry: true };
  if (AI.test(ref)) return { source: clean(ref.split('.').slice(-2, -1)[0] || ref), medium: 'ai', entry: true };
  if (MAIL.test(ref)) return { source: 'webmail', medium: 'email', entry: true };
  if (SEARCH.test(ref)) {
    const name = /google/.test(ref) ? 'google' : /bing/.test(ref) ? 'bing' : /duckduckgo/.test(ref) ? 'duckduckgo' : /yahoo/.test(ref) ? 'yahoo' : /ecosia/.test(ref) ? 'ecosia' : clean(ref.split('.')[0]);
    return { source: name, medium: 'search', entry: true };
  }
  if (SOCIAL.test(ref)) {
    const name = /facebook|fb\.com/.test(ref) ? 'facebook' : /linkedin|lnkd/.test(ref) ? 'linkedin' : /^t\.co$|twitter|^x\.com/.test(ref) ? 'x' : clean(ref.split('.').slice(-2, -1)[0] || ref);
    return { source: name, medium: 'social', entry: true };
  }
  return { source: clean(ref), medium: 'referral', entry: true };
}

/** Counts this page load by traffic source (every load; search-engine robots and test tools are not counted). */
export function trackVisit() {
  if (!configured) return;
  try {
    const ua = navigator.userAgent;
    if ((navigator as any).webdriver || /bot|crawl|spider|headless|preview|lighthouse/i.test(ua)) return;
    const v = visitSource(document.referrer, location.search, location.hostname);
    const landing = location.pathname.replace(/[^A-Za-z0-9/_.-]/g, '').slice(0, 160) || '/';
    fetch(`${URL_}/rest/v1/rpc/track_visit`, { method: 'POST', keepalive: true, headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ p_source: v.source, p_medium: v.medium, p_landing: landing, p_entry: v.entry }) }).catch(() => {});
  } catch { /* ignore */ }
}
