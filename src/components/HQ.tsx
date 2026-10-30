'use client';

import { useCallback, useEffect, useState } from 'react';
import { configured, loadSession, signOut, rpc, type Session } from '@/lib/supa';
import { Login } from '@/components/Portal';

type Row = Record<string, any>;
interface Dash {
  generated_at: string; days: number;
  money: { mrr: number; featured: number; premium: number };
  payments: { total: number; unmatched: number; failed: number };
  outreach: { queued: number; sent: number; replied: number; bounced: number; unsubscribed: number; completed: number; emailed: number; sent_today: number };
  pipeline: { claims: number; claims_approved: number; members: number; enquiries: number; contact_requests: number; newsletter_active: number; sales_touches: number };
  traffic: { entries: number; pageviews: number; by_source: Row[]; by_day: Row[]; top_landing: Row[]; top_search_landing: Row[] };
  profiles: { by_kind: Record<string, number>; top_viewed: Row[] };
  areas: Row[];
}

const TARGET = 50000;
const gbp = (n: number) => `£${n.toLocaleString('en-GB')}`;
const card: React.CSSProperties = { padding: 18, boxShadow: '4px 4px 0 var(--ink)' };
const big: React.CSSProperties = { fontFamily: 'var(--display)', fontSize: 38, fontWeight: 800, lineHeight: 1.1 };
const MEDIUM: Record<string, string> = { search: 'Search engine', email: 'Email', social: 'Social', referral: 'Other website', ai: 'AI assistant', none: 'Typed or bookmarked', campaign: 'Campaign' };

function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="form-card" style={card}>
      <p className="label">{label}</p>
      <p style={big}>{value}</p>
      {note && <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{note}</p>}
    </div>
  );
}

function Table({ head, rows }: { head: [string, string]; rows: [string, number][] }) {
  if (!rows.length) return <p className="muted">Nothing recorded yet.</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
      <thead><tr><th style={{ textAlign: 'left', padding: '6px 4px', borderBottom: '2px solid var(--ink)' }}>{head[0]}</th><th style={{ textAlign: 'right', padding: '6px 4px', borderBottom: '2px solid var(--ink)' }}>{head[1]}</th></tr></thead>
      <tbody>{rows.map(([a, n]) => <tr key={a}><td style={{ padding: '6px 4px', borderBottom: '1px solid #e2dccd', wordBreak: 'break-word' }}>{a}</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #e2dccd', textAlign: 'right', fontWeight: 700 }}>{n.toLocaleString('en-GB')}</td></tr>)}</tbody>
    </table>
  );
}

function Chart({ days }: { days: Row[] }) {
  const max = Math.max(1, ...days.map((d) => d.entries));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 140, borderBottom: '2px solid var(--ink)' }} role="img" aria-label="Visitors arriving each day">
        {days.map((d) => (
          <div key={d.day} title={`${d.day}: ${d.entries} arrivals, ${d.search} from search`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div style={{ height: `${((d.entries - d.search) / max) * 100}%`, background: 'var(--lilac, #c9b8ff)' }} />
            <div style={{ height: `${(d.search / max) * 100}%`, background: 'var(--forest, #1d4d3a)' }} />
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--forest, #1d4d3a)', marginRight: 4 }} />From search engines
        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--lilac, #c9b8ff)', margin: '0 4px 0 14px' }} />Everything else
        <span style={{ float: 'right' }}>{days[0]?.day} to {days[days.length - 1]?.day}</span>
      </p>
    </div>
  );
}

export default function HQ({ names }: { names: Record<string, string> }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [days, setDays] = useState(30);
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async (n: number) => {
    try { setD(await rpc<Dash>('owner_dashboard', { p_days: n })); setErr(''); }
    catch (e: any) {
      if (e.message === 'signed-out') { setSession(null); return; }
      setErr(String(e.message).includes('400') || String(e.message).includes('403') ? 'This account does not have access to the owner dashboard.' : 'Could not load the figures. They refresh automatically.');
    }
  }, []);

  useEffect(() => { const s = loadSession(); setSession(s); setReady(true); }, []);
  useEffect(() => {
    if (!session) return;
    load(days);
    const t = setInterval(() => load(days), 60000);
    return () => clearInterval(t);
  }, [session, days, load]);

  if (!configured) return <div className="notice">The dashboard is not connected to its database in this build.</div>;
  if (!ready) return <p className="muted">Loading…</p>;
  if (!session) return <Login onDone={() => setSession(loadSession())} />;
  if (err && !d) return <div><p role="alert" style={{ fontWeight: 700 }}>{err}</p><button className="btn btn-small" onClick={() => { signOut(); setSession(null); }}>Sign out</button></div>;
  if (!d) return <p className="muted">Loading the live figures…</p>;

  const pk = d.profiles.by_kind || {};
  const clicks = (pk.website_click || 0) + (pk.recruit_click || 0) + (pk.phone_click || 0);
  const fromSearch = d.traffic.by_source.filter((r) => r.medium === 'search').reduce((a, r) => a + Number(r.n), 0);
  const pct = Math.min(100, (d.money.mrr / TARGET) * 100);
  const updated = new Date(d.generated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <p className="muted" style={{ fontSize: 14 }}>Live from the database. Updated {updated}, refreshes every minute. Signed in as {session.user.email}.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[7, 30, 90].map((n) => <button key={n} className={`btn btn-small${n === days ? ' btn-dark' : ''}`} onClick={() => setDays(n)} aria-pressed={n === days}>{n} days</button>)}
          <button className="btn btn-small" onClick={() => { signOut(); setSession(null); setD(null); }}>Sign out</button>
        </div>
      </div>

      <section aria-labelledby="h-money">
        <h2 id="h-money" style={{ fontSize: 26, marginBottom: 12 }}>Money</h2>
        <div className="grid-3">
          <Tile label="Monthly recurring revenue" value={gbp(d.money.mrr)} note={`${pct.toFixed(1)}% of the £50,000 target`} />
          <Tile label="Paying partners" value={d.money.featured + d.money.premium} note={`${d.money.featured} Featured, ${d.money.premium} Premium`} />
          <Tile label="Payments seen" value={d.payments.total} note={`${d.payments.unmatched} unmatched, ${d.payments.failed} failed`} />
        </div>
        <div style={{ marginTop: 14, height: 14, border: '2px solid var(--ink)', borderRadius: 8, overflow: 'hidden' }} aria-label={`Progress to £50,000: ${pct.toFixed(1)} per cent`}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--yellow, #ffd54a)' }} />
        </div>
      </section>

      <section aria-labelledby="h-traffic">
        <h2 id="h-traffic" style={{ fontSize: 26, marginBottom: 12 }}>Visitors, last {d.days} days</h2>
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <Tile label="Arrivals" value={d.traffic.entries.toLocaleString('en-GB')} note="Visits that started on the site" />
          <Tile label="From search engines" value={fromSearch.toLocaleString('en-GB')} note="Google, Bing and others" />
          <Tile label="Page views" value={d.traffic.pageviews.toLocaleString('en-GB')} note="Every page load" />
        </div>
        <Chart days={d.traffic.by_day} />
        <div className="grid-3" style={{ marginTop: 18, alignItems: 'start' }}>
          <div><h3 style={{ fontSize: 18, marginBottom: 6 }}>Where visitors come from</h3><Table head={['Source', 'Arrivals']} rows={d.traffic.by_source.map((r) => [`${r.source} (${MEDIUM[r.medium] || r.medium})`, Number(r.n)])} /></div>
          <div><h3 style={{ fontSize: 18, marginBottom: 6 }}>Pages people land on</h3><Table head={['Page', 'Arrivals']} rows={d.traffic.top_landing.map((r) => [r.landing, Number(r.n)])} /></div>
          <div><h3 style={{ fontSize: 18, marginBottom: 6 }}>Pages found through search</h3><Table head={['Page', 'Arrivals']} rows={d.traffic.top_search_landing.map((r) => [r.landing, Number(r.n)])} /></div>
        </div>
      </section>

      <section aria-labelledby="h-sales">
        <h2 id="h-sales" style={{ fontSize: 26, marginBottom: 12 }}>Sales pipeline</h2>
        <div className="grid-3">
          <Tile label="Launch emails sent" value={d.outreach.emailed} note={`${d.outreach.sent_today} today, ${d.outreach.queued} still to email`} />
          <Tile label="Replies" value={d.outreach.replied} note={`${d.outreach.bounced} bounced, ${d.outreach.unsubscribed} unsubscribed`} />
          <Tile label="Profiles claimed" value={d.pipeline.claims} note={`${d.pipeline.claims_approved} approved, ${d.pipeline.members} portal users`} />
          <Tile label="Enquiries to partners" value={d.pipeline.enquiries} note={`Last ${d.days} days`} />
          <Tile label="Contact form messages" value={d.pipeline.contact_requests} note={`Last ${d.days} days`} />
          <Tile label="Sales nudges sent" value={d.pipeline.sales_touches} note={`Newsletter: ${d.pipeline.newsletter_active} active`} />
        </div>
      </section>

      <section aria-labelledby="h-prof">
        <h2 id="h-prof" style={{ fontSize: 26, marginBottom: 12 }}>Agency profiles, last {d.days} days</h2>
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <Tile label="Profile views" value={(pk.view || 0).toLocaleString('en-GB')} />
          <Tile label="Clicks to agencies" value={clicks.toLocaleString('en-GB')} note={`${pk.website_click || 0} website, ${pk.recruit_click || 0} recruitment page, ${pk.phone_click || 0} phone`} />
          <Tile label="Directory appearances" value={(pk.impression || 0).toLocaleString('en-GB')} note={`${pk.crawler || 0} search-engine robot visits`} />
        </div>
        <div className="grid-3" style={{ alignItems: 'start' }}>
          <div><h3 style={{ fontSize: 18, marginBottom: 6 }}>Most viewed profiles</h3><Table head={['Service', 'Views']} rows={d.profiles.top_viewed.map((r) => [names[r.provider_id] || r.provider_id, Number(r.n)])} /></div>
          <div><h3 style={{ fontSize: 18, marginBottom: 6 }}>Areas people search for</h3><Table head={['Area', 'Searches']} rows={d.areas.map((r) => [String(r.area).replace(/\b\w/g, (c: string) => c.toUpperCase()), Number(r.n)])} /></div>
        </div>
      </section>

      <p className="muted" style={{ fontSize: 13, maxWidth: 760 }}>
        Counts are page loads, not unique people, and include repeat visits. No cookies are used and nothing personal is stored: only the day, where the visit came from and the page. Search-engine robots, test tools and other automated traffic are not counted as visitors. Visits from email apps on a computer or phone often show as &ldquo;Typed or bookmarked&rdquo;, because those apps do not say where the click came from; our own emails are tagged so they show as Email.
      </p>
    </div>
  );
}
