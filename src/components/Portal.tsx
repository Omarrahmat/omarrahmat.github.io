'use client';

import payments from '@/data/payments.json';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { configured, loadSession, sendCode, verifyCode, signOut, api, rpc, uploadLogo, publicLogoUrl, type Session } from '@/lib/supa';

interface Prov { areasServed?: string[]; id: string; name: string; phone: string | null; website: string | null; recruitmentUrl: string | null }
interface Profile { about: string | null; logo_path: string | null; phone: string | null; website: string | null; recruitment_url: string | null }
interface Enquiry { id: string; name: string; email: string; phone: string; postcode: string; best_time: string | null; message: string | null; status: string; created_at: string }
interface EventRow { day: string; kind: string; n: number }

const day = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Portal({ providers }: { providers: Prov[] }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<{ provider_id: string }[] | null>(null);
  const [err, setErr] = useState('');

  const boot = useCallback(async () => {
    const s = loadSession();
    setSession(s);
    setReady(true);
    if (!s) return;
    try { setMembers(await rpc('link_my_claims')); } catch (e: any) { if (e.message === 'signed-out') { setSession(null); } else setErr('We could not load your account. Please refresh and try again.'); }
  }, []);
  useEffect(() => { boot(); }, [boot]);

  if (!configured) return <div className="notice notice-warn">The portal is not connected to its database in this build.</div>;
  if (!ready) return <p className="muted">Loading…</p>;
  if (!session) return <Login onDone={boot} />;
  if (err) return <p role="alert" style={{ color: 'var(--coral-text)', fontWeight: 700 }}>{err}</p>;
  if (!members) return <p className="muted">Loading your account…</p>;
  return <Shell session={session} members={members.map((m) => m.provider_id)} providers={providers} onOut={() => { signOut(); setSession(null); setMembers(null); }} />;
}

export function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await sendCode(email.trim().toLowerCase()); setStep('code'); } catch (x: any) { setMsg(x.message); }
    setBusy(false);
  }
  async function submitCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await verifyCode(email.trim().toLowerCase(), code.trim()); onDone(); } catch (x: any) { setMsg(x.message); }
    setBusy(false);
  }
  return (
    <div className="form-card" style={{ maxWidth: 520 }}>
      {step === 'email' ? (
        <form onSubmit={submitEmail} className="form-stack">
          <h2 style={{ fontSize: 28 }}>Sign in</h2>
          <p className="muted">Use the work email you gave when you claimed your profile. We will email you a sign-in code. There is no password to remember.</p>
          <div className="field"><label htmlFor="pe">Work email</label><input id="pe" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {msg && <p role="alert" style={{ color: 'var(--coral-text)', fontWeight: 700 }}>{msg}</p>}
          <button className="btn btn-dark" disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="form-stack">
          <h2 style={{ fontSize: 28 }}>Enter your code</h2>
          <p className="muted">We sent a code to {email}. It can take a minute, and may land in junk.</p>
          <div className="field"><label htmlFor="pc">Code from your email</label><input id="pc" className="input" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={10} value={code} onChange={(e) => setCode(e.target.value)} /></div>
          {msg && <p role="alert" style={{ color: 'var(--coral-text)', fontWeight: 700 }}>{msg}</p>}
          <button className="btn btn-dark" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
          <button type="button" className="btn btn-small" onClick={() => { setStep('email'); setCode(''); setMsg(''); }}>Use a different email</button>
        </form>
      )}
    </div>
  );
}

function Shell({ session, members, providers, onOut }: { session: Session; members: string[]; providers: Prov[]; onOut: () => void }) {
  const [pid, setPid] = useState(members[0] || '');
  const [tab, setTab] = useState<'overview' | 'demand' | 'profile' | 'enquiries' | 'settings'>('overview');
  const prov = useMemo(() => providers.find((p) => p.id === pid), [providers, pid]);

  if (!members.length) {
    return (
      <div className="notice" style={{ maxWidth: 640 }}>
        <h2 style={{ fontSize: 26, marginBottom: 8 }}>No profile linked to {session.user.email} yet</h2>
        <p>Portal access starts once we have checked your claim. If you have not claimed your profile, <a href="/claim/">do that first</a> using this same email address. If you have, we usually approve claims within one working day; email <a href="mailto:hello@fosteringtoday.com">hello@fosteringtoday.com</a> if it has been longer.</p>
        <p style={{ marginTop: 14 }}><button className="btn btn-small" onClick={onOut}>Sign out</button></p>
      </div>
    );
  }
  const tabs: [typeof tab, string][] = [['overview', 'Overview'], ['demand', 'Area demand'], ['profile', 'Edit profile'], ['enquiries', 'Enquiries'], ['settings', 'Plan and settings']];
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          {members.length > 1 ? (
            <select className="select" aria-label="Profile" value={pid} onChange={(e) => setPid(e.target.value)}>{members.map((m) => <option key={m} value={m}>{providers.find((p) => p.id === m)?.name || m}</option>)}</select>
          ) : <h2 style={{ fontSize: 30 }}>{prov?.name || pid}</h2>}
          <p className="muted" style={{ fontSize: 14 }}>Signed in as {session.user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a className="btn btn-small" href={`/agency/${pid}/`}>View public profile</a>
          <button className="btn btn-small" onClick={onOut}>Sign out</button>
        </div>
      </div>
      <div role="tablist" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`btn btn-small ${tab === k ? 'btn-dark' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'overview' && <Overview pid={pid} />}
      {tab === 'demand' && <Demand pid={pid} areas={prov?.areasServed || []} />}
      {tab === 'profile' && <EditProfile key={pid} pid={pid} prov={prov} />}
      {tab === 'enquiries' && <Enquiries pid={pid} />}
      {tab === 'settings' && <Settings key={pid} pid={pid} email={session.user.email} areas={prov?.areasServed || []} />}
    </div>
  );
}

const KINDS: [string, string][] = [['impression', 'Appearances in directory results'], ['view', 'Profile views'], ['website_click', 'Website clicks'], ['recruit_click', 'Recruitment page clicks'], ['phone_click', 'Phone clicks'], ['crawler', 'Search engine visits']];

function Overview({ pid }: { pid: string }) {
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [enq, setEnq] = useState<number | null>(null);
  const [tier, setTier] = useState('free');
  useEffect(() => {
    const from = day(new Date(Date.now() - 60 * 86400000));
    api<EventRow[]>(`profile_events?provider_id=eq.${pid}&day=gte.${from}&select=day,kind,n`).then(setRows).catch(() => setRows([]));
    api<Enquiry[]>(`enquiries?provider_id=eq.${pid}&select=id&created_at=gte.${new Date(Date.now() - 30 * 86400000).toISOString()}`).then((r) => setEnq(r.length)).catch(() => setEnq(0));
    api<{ tier: string }[]>(`subscriptions?provider_id=eq.${pid}&select=tier`).then((r) => setTier(r[0]?.tier || 'free')).catch(() => {});
  }, [pid]);
  if (!rows) return <p className="muted">Loading…</p>;
  const cut30 = day(new Date(Date.now() - 30 * 86400000));
  const sum = (kind: string, cur: boolean) => rows.filter((r) => r.kind === kind && (cur ? r.day >= cut30 : r.day < cut30)).reduce((a, r) => a + r.n, 0);
  const days: { d: string; n: number }[] = [];
  for (let i = 29; i >= 0; i--) { const d = day(new Date(Date.now() - i * 86400000)); days.push({ d, n: rows.filter((r) => r.kind === 'view' && r.day === d).reduce((a, r) => a + r.n, 0) }); }
  const max = Math.max(1, ...days.map((x) => x.n));
  return (
    <div>
      <p className="muted" style={{ marginBottom: 16 }}>Plan: <strong style={{ textTransform: 'capitalize' }}>{tier}</strong>. Last 30 days, compared with the 30 before.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        {KINDS.map(([k, l]) => { const c = sum(k, true), p = sum(k, false); return (
          <div className="form-card" key={k} style={{ padding: 20, boxShadow: '4px 4px 0 var(--ink)' }}>
            <p className="label">{l}</p><p style={{ fontFamily: 'var(--display)', fontSize: 44, fontWeight: 800 }}>{c}</p>
            <p className="muted" style={{ fontSize: 14 }}>{p ? `${c >= p ? '+' : ''}${c - p} vs previous 30 days` : 'No earlier data yet'}</p>
          </div>); })}
        <div className="form-card" style={{ padding: 20, boxShadow: '4px 4px 0 var(--ink)' }}>
          <p className="label">Enquiries</p><p style={{ fontFamily: 'var(--display)', fontSize: 44, fontWeight: 800 }}>{enq ?? '…'}</p>
          <p className="muted" style={{ fontSize: 14 }}>{tier === 'free' ? 'The enquiry form is part of paid plans' : 'Received in the last 30 days'}</p>
        </div>
      </div>
      <h3 style={{ fontSize: 22, marginBottom: 8 }}>Profile views, last 30 days</h3>
      <svg viewBox="0 0 600 140" role="img" aria-label="Bar chart of daily profile views for the last 30 days" style={{ width: '100%', maxWidth: 760 }}>
        {days.map((x, i) => <rect key={x.d} x={i * 20 + 2} y={120 - (x.n / max) * 110} width={16} height={Math.max(2, (x.n / max) * 110)} rx={3} fill="#0F3D33"><title>{`${x.d}: ${x.n}`}</title></rect>)}
        <line x1="0" x2="600" y1="122" y2="122" stroke="#14130f" strokeWidth="2" />
      </svg>
      <p className="muted" style={{ fontSize: 14, marginTop: 10, maxWidth: 700 }}>Every page load and click counts, including repeat visits by the same person, so these are totals, not unique people. Search-engine crawler visits are shown separately as &ldquo;Search engine visits&rdquo; and are not people; other automated traffic is not counted. Numbers start from the day the portal launched.</p>
    </div>
  );
}

function EditProfile({ pid, prov }: { pid: string; prov?: Prov }) {
  const [p, setP] = useState<Profile | null>(null);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  useEffect(() => { api<Profile[]>(`provider_profiles?provider_id=eq.${pid}&select=about,logo_path,phone,website,recruitment_url`).then((r) => setP(r[0] || { about: '', logo_path: null, phone: '', website: '', recruitment_url: '' })).catch(() => setP({ about: '', logo_path: null, phone: '', website: '', recruitment_url: '' })); }, [pid]);
  if (!p) return <p className="muted">Loading…</p>;
  const set = (k: keyof Profile, v: string | null) => setP({ ...p, [k]: v });
  const url = (s: string | null) => !s || /^https?:\/\/\S+$/.test(s);

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type) || f.size > 1048576) { setMsg('Use a PNG, JPG or WebP image under 1 MB.'); setState('error'); return; }
    setState('saving'); setMsg('');
    try {
      const path = `${pid}/logo-${Date.now()}.${f.type.split('/')[1].replace('jpeg', 'jpg')}`;
      await uploadLogo(path, f);
      set('logo_path', path);
      await api('provider_profiles?on_conflict=provider_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { provider_id: pid, logo_path: path } });
      setState('saved'); setMsg('Logo saved. It appears on your public profile straight away.');
    } catch (x: any) { setState('error'); setMsg(x.message); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!url(p!.website) || !url(p!.recruitment_url)) { setState('error'); setMsg('Web addresses must start with https:// or http://'); return; }
    setState('saving'); setMsg('');
    try {
      await api('provider_profiles?on_conflict=provider_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { provider_id: pid, about: p!.about?.trim() || null, phone: p!.phone?.trim() || null, website: p!.website?.trim() || null, recruitment_url: p!.recruitment_url?.trim() || null } });
      setState('saved'); setMsg('Saved. Changes show on your public profile straight away; search engines pick them up over the following days.');
    } catch (x: any) { setState('error'); setMsg(x.message); }
  }
  return (
    <form onSubmit={save} className="form-card form-stack" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {p.logo_path ? <img src={publicLogoUrl(p.logo_path)} alt="Your logo" width={96} height={96} className="logo-img" /> : <span className="tile tile-lg" aria-hidden="true">{(prov?.name || '?').slice(0, 2).toUpperCase()}</span>}
        <div className="field"><label htmlFor="lg">Logo (PNG, JPG or WebP, up to 1 MB, square works best)</label><input id="lg" type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogo} /></div>
      </div>
      <div className="field"><label htmlFor="ab">About your service ({(p.about || '').length}/2000)</label><textarea id="ab" className="textarea" style={{ minHeight: 200 }} maxLength={2000} value={p.about || ''} onChange={(e) => set('about', e.target.value)} placeholder="Who you are, the children and carers you work with, the support you offer. Plain, factual language. Do not quote pay rates you cannot stand behind." /></div>
      <div className="field"><label htmlFor="ph">Phone for carers</label><input id="ph" className="input" type="tel" maxLength={40} value={p.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder={prov?.phone || ''} /></div>
      <div className="field"><label htmlFor="wb">Website</label><input id="wb" className="input" maxLength={300} value={p.website || ''} onChange={(e) => set('website', e.target.value)} placeholder={prov?.website || 'https://'} /></div>
      <div className="field"><label htmlFor="rc">Recruitment page (where carers should apply)</label><input id="rc" className="input" maxLength={300} value={p.recruitment_url || ''} onChange={(e) => set('recruitment_url', e.target.value)} placeholder={prov?.recruitmentUrl || 'https://'} /></div>
      <p className="muted" style={{ fontSize: 14 }}>What you enter here is labelled as written by you. Anything misleading, such as pay or outcome claims we cannot support, may be removed. Every edit is logged.</p>
      {msg && <p role={state === 'error' ? 'alert' : 'status'} style={{ fontWeight: 700, color: state === 'error' ? 'var(--coral-text)' : 'var(--forest)' }}>{msg}</p>}
      <button className="btn btn-dark" disabled={state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}

function Enquiries({ pid }: { pid: string }) {
  const [list, setList] = useState<Enquiry[] | null>(null);
  const load = useCallback(() => { api<Enquiry[]>(`enquiries?provider_id=eq.${pid}&select=id,name,email,phone,postcode,best_time,message,status,created_at&order=created_at.desc&limit=200`).then(setList).catch(() => setList([])); }, [pid]);
  useEffect(load, [load]);
  async function mark(id: string, status: string) {
    await api(`enquiries?id=eq.${id}`, { method: 'PATCH', prefer: 'return=minimal', body: { status, handled_at: new Date().toISOString() } });
    load();
  }
  if (!list) return <p className="muted">Loading…</p>;
  if (!list.length) return <div className="notice" style={{ maxWidth: 640 }}>No enquiries yet. When someone uses the enquiry form on your profile, it appears here with their details and preferred call time.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 820 }}>
      {list.map((q) => (
        <article key={q.id} className="form-card" style={{ padding: 20, boxShadow: '4px 4px 0 var(--ink)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 22 }}>{q.name}</h3><span className="tag">{q.status === 'new' ? 'New' : q.status}</span>
          </div>
          <p className="muted" style={{ fontSize: 14 }}>{fmt(q.created_at)} · {q.postcode} · best time: {q.best_time || 'any'}</p>
          <p style={{ marginTop: 8 }}><a href={`tel:${q.phone}`}>{q.phone}</a> · <a href={`mailto:${q.email}`}>{q.email}</a></p>
          {q.message && <p style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{q.message}</p>}
          <p style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-small" onClick={() => mark(q.id, 'contacted')}>Mark as contacted</button>
            <button className="btn btn-small" onClick={() => mark(q.id, 'closed')}>Close</button>
          </p>
        </article>
      ))}
      <p className="muted" style={{ fontSize: 14 }}>These are personal details shared so you can contact this person about fostering. Please use them only for that.</p>
    </div>
  );
}

function payLink(base: string, pid: string, email: string) {
  const u = new URL(base);
  u.searchParams.set('client_reference_id', pid);
  if (email) u.searchParams.set('prefilled_email', email);
  return u.toString();
}

function Plan({ pid, email, areas }: { pid: string; email: string; areas: string[] }) {
  const [tier, setTier] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api<{ tier: string; active_until: string | null }[]>(`subscriptions?provider_id=eq.${pid}&select=tier,active_until`).then((r) => setTier(r[0]?.tier || 'free')).catch(() => setTier('free'));
    api<{ placement_areas: string[] | null }[]>(`agency_settings?provider_id=eq.${pid}&select=placement_areas`).then((r) => setChosen(r[0]?.placement_areas || [])).catch(() => {});
  }, [pid]);
  if (!tier) return <p className="muted">Loading…</p>;
  const pay = payments as { featured?: string; premium?: string };
  const toggle = (a: string) => setChosen((c) => (c.includes(a) ? c.filter((x) => x !== a) : c.length >= 5 ? c : [...c, a]));
  async function saveAreas() {
    setMsg('');
    try { await api('agency_settings?on_conflict=provider_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { provider_id: pid, placement_areas: chosen, updated_at: new Date().toISOString() } }); setMsg('Saved. Your pinned areas update on the site within a day.'); }
    catch { setMsg('That did not save. Please try again.'); }
  }
  return (
    <div className="form-card form-stack">
      <h2 style={{ fontSize: 24 }}>Your plan: <span style={{ textTransform: 'capitalize' }}>{tier}</span></h2>
      {tier === 'free' && (
        <>
          <p>Be found first. Featured pins your profile at the top of the local page and search results in up to five areas you choose, with an enquiry form and full statistics. Premium pins you in every area you cover and adds the Area demand report.</p>
          <p style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {pay.featured && <a className="btn btn-yellow" href={payLink(pay.featured, pid, email)}>Upgrade to Featured, £199 a month</a>}
            {pay.premium && <a className="btn" href={payLink(pay.premium, pid, email)}>Upgrade to Premium, £799 a month</a>}
          </p>
          <p className="muted" style={{ fontSize: 14 }}>Monthly rolling, cancel any time. Your plan switches on automatically once payment goes through, usually within the hour.</p>
        </>
      )}
      {tier === 'featured' && (
        <>
          <fieldset className="calc-child" style={{ gap: 6 }}>
            <legend>Choose up to five areas to be pinned in ({chosen.length} of 5)</legend>
            {areas.length === 0 && <p className="muted">We have no areas on record for your profile. Email us the areas you recruit in.</p>}
            {areas.map((a) => (
              <label key={a} className="radio"><input type="checkbox" checked={chosen.includes(a)} disabled={!chosen.includes(a) && chosen.length >= 5} onChange={() => toggle(a)} /> {a}</label>
            ))}
          </fieldset>
          {msg && <p role="status" style={{ fontWeight: 700 }}>{msg}</p>}
          <button type="button" className="btn btn-dark" onClick={saveAreas}>Save areas</button>
          {pay.premium && <p className="muted" style={{ fontSize: 14 }}>Want every area? <a href={payLink(pay.premium, pid, email)} style={{ fontWeight: 700 }}>Move to Premium</a> (we cancel Featured for you so you are never charged twice).</p>}
        </>
      )}
      {tier === 'premium' && <p>You are pinned first on the local page for every area you cover, and you have the Area demand report.</p>}
    </div>
  );
}

function Settings({ pid, email: me, areas }: { pid: string; email: string; areas: string[] }) {
  const [email, setEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { api<{ enquiry_email: string }[]>(`agency_settings?provider_id=eq.${pid}&select=enquiry_email`).then((r) => setEmail(r[0]?.enquiry_email || '')).catch(() => setEmail('')); }, [pid]);
  if (email === null) return <p className="muted">Loading…</p>;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    try { await api('agency_settings?on_conflict=provider_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { provider_id: pid, enquiry_email: email!.trim() || null, updated_at: new Date().toISOString() } }); setMsg('Saved.'); }
    catch { setMsg('That address was not accepted. Please check it.'); }
  }
  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Plan pid={pid} email={me} areas={areas} />
      <form onSubmit={save} className="form-card form-stack">
        <div className="field"><label htmlFor="ee">Email for enquiry alerts</label><input id="ee" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recruitment@youragency.co.uk" /></div>
        <p className="muted" style={{ fontSize: 14 }}>We send new enquiries to this address as well as showing them here.</p>
        {msg && <p role="status" style={{ fontWeight: 700 }}>{msg}</p>}
        <button className="btn btn-dark">Save</button>
      </form>
      <div className="notice"><strong>Billing and cancelling.</strong> To update a card, get an invoice or cancel, email <a href="mailto:hello@fosteringtoday.com">hello@fosteringtoday.com</a> and we will sort it the same day. There is no contract.</div>
    </div>
  );
}

const normArea = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function Demand({ pid, areas }: { pid: string; areas: string[] }) {
  const [tier, setTier] = useState<string | null>(null);
  const [rows, setRows] = useState<{ day: string; area: string; n: number }[] | null>(null);
  useEffect(() => {
    api<{ tier: string; active_until: string | null }[]>(`subscriptions?provider_id=eq.${pid}&select=tier,active_until`).then((r) => setTier(r[0]?.tier || 'free')).catch(() => setTier('free'));
  }, [pid]);
  useEffect(() => {
    if (tier !== 'premium') return;
    const from = day(new Date(Date.now() - 60 * 86400000));
    api<{ day: string; area: string; n: number }[]>(`area_searches?day=gte.${from}&select=day,area,n&limit=10000`).then(setRows).catch(() => setRows([]));
  }, [tier, pid]);
  if (!tier) return <p className="muted">Loading…</p>;
  if (tier !== 'premium') {
    return (
      <div className="notice" style={{ maxWidth: 680 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Area demand report: Premium</h2>
        <p>Premium partners see how many people search our directory for each area they cover, how that changes month on month, and which areas across the UK are busiest. It shows where prospective carers are looking.</p>
        <p style={{ marginTop: 12 }}><a className="btn btn-small btn-yellow" href="/packages/">See Premium</a></p>
      </div>
    );
  }
  if (!rows) return <p className="muted">Loading…</p>;
  const cut = day(new Date(Date.now() - 30 * 86400000));
  const total = (a: string, cur: boolean) => rows.filter((r) => r.area === a && (cur ? r.day >= cut : r.day < cut)).reduce((x, r) => x + r.n, 0);
  const mine = Array.from(new Set(areas.map(normArea).filter(Boolean))).map((a) => ({ a, cur: total(a, true), prev: total(a, false) })).sort((x, y) => y.cur - x.cur || x.a.localeCompare(y.a));
  const all = new Map<string, number>();
  rows.filter((r) => r.day >= cut).forEach((r) => all.set(r.area, (all.get(r.area) || 0) + r.n));
  const top = Array.from(all.entries()).sort((x, y) => y[1] - x[1]).slice(0, 10);
  const cap = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 style={{ fontSize: 26, marginBottom: 6 }}>Searches in your areas, last 30 days</h2>
        <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>Counts of searches for each place on Fostering Today, compared with the 30 days before.</p>
        {mine.length === 0 ? <p>We have no areas on record for your profile yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th scope="col" style={{ textAlign: 'left' }} className="label">Area</th><th scope="col" style={{ textAlign: 'right' }} className="label">Searches</th><th scope="col" style={{ textAlign: 'right' }} className="label">Previous 30 days</th></tr></thead>
            <tbody>{mine.map((m) => <tr key={m.a} style={{ borderTop: '1px solid var(--line)' }}><td style={{ padding: '8px 0' }}>{cap(m.a)}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{m.cur}</td><td style={{ textAlign: 'right' }} className="muted">{m.prev}</td></tr>)}</tbody>
          </table>
        )}
      </div>
      <div>
        <h2 style={{ fontSize: 26, marginBottom: 6 }}>Busiest areas across the UK</h2>
        {top.length === 0 ? <p className="muted">Not enough searches yet.</p> : (
          <ol style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>{top.map(([a, n]) => <li key={a}>{cap(a)}: <strong>{n}</strong></li>)}</ol>
        )}
      </div>
      <p className="muted" style={{ fontSize: 14 }}>These are searches made in our directory, not total demand for fostering. We count a search only when it names a place we list, and we never store what people type or who they are. Tracking started on 28 October 2026, so figures build up from then. The first full month is the first one worth comparing.</p>
    </div>
  );
}
