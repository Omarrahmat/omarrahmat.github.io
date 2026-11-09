'use client';

// Building blocks for the owner dashboard (mission control). Styles live in public/hq.css.
import { useEffect, useRef, useState } from 'react';

export type Row = Record<string, any>;

export interface Google {
  snapshot: string; prev_snapshot: string | null; range_start: string; range_end: string; loaded_at: string;
  totals: { clicks: number; impressions: number; ctr: number | null; position: number | null };
  daily: Row[]; keywords: number; pages: number;
  ladder: { page1: number; page2: number; page3: number; deeper: number };
  prev_ladder: { page1: number; page2: number; page3: number; deeper: number } | null;
  top_queries: Row[]; best_queries: Row[]; top_pages: Row[]; page_types: Row[]; countries: Row[]; devices: Row[];
}

export interface Dash {
  generated_at: string; days: number; legacy: boolean;
  money: { mrr: number; featured: number; premium: number; subs: Row[] };
  payments: { total: number; unmatched: number; failed: number; recent: Row[] };
  claims: { total: number; approved: number; waiting: number; profiles: number; members: number; signed_in: number; logos: number; edited: number; list: Row[] };
  outreach: {
    total: number; queued: number; in_sequence: number; completed: number; replied: number; bounced: number; unsubscribed: number; skipped: number;
    emailed: number; emailed_agencies: number; emailed_councils: number; step1: number; step2: number; step3: number;
    sent_today: number; scheduled: number; next_send: string | null;
  };
  outreach_days: { day: string; sent: number; scheduled: number }[];
  mail: { outreach_sent: number; received: number; sent: number; mirrored_at: string | null; latest_in: Row[] };
  forms: { enquiries: number; enquiries_total: number; contact_requests: number; corrections: number; newsletter_active: number; sales_touches: number };
  traffic: { entries: number; prev_entries: number; today: number; pageviews: number; search: number; email: number; by_source: Row[]; by_day: Row[]; top_landing: Row[]; top_search_landing: Row[] };
  profiles: { by_kind: Record<string, number>; top_viewed: Row[] };
  areas: Row[];
  google: Google | null;
}

export interface Team { board: Record<string, { body: string; updated_at: string; updated_by: string }>; last: Record<string, { at: string; summary: string }>; recent: Row[]; open_handoffs: number }
export interface Content { profiles: number; areaPages: number; areaWriteups: number; allowancePages: number; guides: number; news: number }

/** Monthly revenue target, in pounds. */
export const TARGET = 10000;
export const PRICE = { featured: 199, premium: 799 } as const;
/** The site went live on 27 October 2026. */
export const LAUNCH = Date.UTC(2026, 9, 27);

export const n0 = (v: unknown) => Number(v) || 0;
export const fmt = (v: unknown) => n0(v).toLocaleString('en-GB');
export const gbp = (v: unknown) => `£${fmt(v)}`;
export const one = (v: unknown) => (Math.round(n0(v) * 10) / 10).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const plural = (n: number, word: string, many = `${word}s`) => `${fmt(n)} ${n === 1 ? word : many}`;
const noon = (iso: string) => new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
export const dayShort = (iso?: string | null) => (iso ? noon(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
/** Two-line chart tick: weekday over day of the month. */
export const dayTick = (iso: string) => `${noon(iso).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }).slice(0, 2)}\n${noon(iso).getUTCDate()}`;
export const pct = (part: number, whole: number) => { const v = whole ? (part / whole) * 100 : 0; return `${v === 0 ? '0' : v < 10 ? v.toFixed(1) : Math.round(v)}%`; };
export const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }) : '');
export const clock = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }) : '');
export const todayUK = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
export const ago = (iso?: string | null) => {
  if (!iso) return '';
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${plural(Math.round(m / 1440), 'day')} ago`;
};
/** Daily limit on outreach emails, by UK date (claude/outreach-desk-playbook.md, section 4). */
export const capFor = (day: string) => (day < '2026-11-04' ? 20 : day < '2026-11-11' ? 40 : 60);
export const pageOf = (position: unknown) => Math.max(1, Math.ceil(n0(position) / 10));
export const addr = (s?: string | null) => (s || '').replace(/^.*<([^>]+)>.*$/, '$1');

const ZERO_G = { page1: 0, page2: 0, page3: 0, deeper: 0 };

/** Fill every field so the views never meet a missing value. `raw` is what owner_hq returned. */
export function normalise(raw: Row): Dash {
  const o = raw.outreach || {}, c = raw.claims || {}, t = raw.traffic || {}, m = raw.money || {}, p = raw.payments || {}, f = raw.forms || {}, ml = raw.mail || {}, g = raw.google;
  const dash: Dash = {
    generated_at: raw.generated_at || new Date().toISOString(), days: n0(raw.days) || 30, legacy: false,
    money: { mrr: n0(m.mrr), featured: n0(m.featured), premium: n0(m.premium), subs: m.subs || [] },
    payments: { total: n0(p.total), unmatched: n0(p.unmatched), failed: n0(p.failed), recent: p.recent || [] },
    claims: { total: n0(c.total), approved: n0(c.approved), waiting: n0(c.waiting), profiles: n0(c.profiles), members: n0(c.members), signed_in: n0(c.signed_in), logos: n0(c.logos), edited: n0(c.edited), list: c.list || [] },
    outreach: {
      total: n0(o.total), queued: n0(o.queued), in_sequence: n0(o.in_sequence), completed: n0(o.completed), replied: n0(o.replied), bounced: n0(o.bounced), unsubscribed: n0(o.unsubscribed), skipped: n0(o.skipped),
      emailed: n0(o.emailed), emailed_agencies: n0(o.emailed_agencies), emailed_councils: n0(o.emailed_councils), step1: n0(o.step1), step2: n0(o.step2), step3: n0(o.step3),
      sent_today: n0(o.sent_today), scheduled: n0(o.scheduled), next_send: o.next_send || null,
    },
    outreach_days: (raw.outreach_days || []).map((d: Row) => ({ day: String(d.day), sent: n0(d.sent), scheduled: n0(d.scheduled) })),
    mail: { outreach_sent: n0(ml.outreach_sent), received: n0(ml.received), sent: n0(ml.sent), mirrored_at: ml.mirrored_at || null, latest_in: ml.latest_in || [] },
    forms: { enquiries: n0(f.enquiries), enquiries_total: n0(f.enquiries_total), contact_requests: n0(f.contact_requests), corrections: n0(f.corrections), newsletter_active: n0(f.newsletter_active), sales_touches: n0(f.sales_touches) },
    traffic: {
      entries: n0(t.entries), prev_entries: n0(t.prev_entries), today: n0(t.today), pageviews: n0(t.pageviews), search: n0(t.search), email: n0(t.email),
      by_source: t.by_source || [], by_day: t.by_day || [], top_landing: t.top_landing || [], top_search_landing: t.top_search_landing || [],
    },
    profiles: { by_kind: raw.profiles?.by_kind || {}, top_viewed: raw.profiles?.top_viewed || [] },
    areas: raw.areas || [],
    google: g ? {
      snapshot: g.snapshot, prev_snapshot: g.prev_snapshot || null, range_start: g.range_start, range_end: g.range_end, loaded_at: g.loaded_at,
      totals: { clicks: n0(g.totals?.clicks), impressions: n0(g.totals?.impressions), ctr: g.totals?.ctr ?? null, position: g.totals?.position ?? null },
      daily: g.daily || [], keywords: n0(g.keywords), pages: n0(g.pages), ladder: { ...ZERO_G, ...(g.ladder || {}) }, prev_ladder: g.prev_ladder || null,
      top_queries: g.top_queries || [], best_queries: g.best_queries || [], top_pages: g.top_pages || [], page_types: g.page_types || [], countries: g.countries || [], devices: g.devices || [],
    } : null,
  };
  // Today's sends are recorded in two places that update at different times: the queue (when the outreach desk
  // logs a send) and the hourly copy of the mailbox. Both count real sends, so the larger is the more up to date.
  const now = dash.outreach_days.find((r) => r.day === todayUK());
  if (now) { const sent = Math.max(now.sent, dash.outreach.sent_today); now.sent = sent; dash.outreach.sent_today = sent; }
  return dash;
}

/** The first version of the data function (owner_dashboard) has fewer figures. Used only if owner_hq cannot be reached. */
export function fromLegacy(old: Row): Dash {
  const o = old.outreach || {}, pl = old.pipeline || {}, t = old.traffic || {};
  const bySrc = (medium: string) => (t.by_source || []).filter((r: Row) => r.medium === medium).reduce((a: number, r: Row) => a + n0(r.n), 0);
  const days = (t.by_day || []).map((d: Row) => ({ ...d, email: 0 }));
  const d = normalise({
    generated_at: old.generated_at, days: old.days, money: old.money, payments: old.payments,
    claims: { total: pl.claims, approved: pl.claims_approved, waiting: Math.max(0, n0(pl.claims) - n0(pl.claims_approved)), profiles: pl.claims_approved, members: pl.members, signed_in: pl.members },
    outreach: { total: n0(o.queued) + n0(o.emailed), queued: o.queued, in_sequence: o.sent, completed: o.completed, replied: o.replied, bounced: o.bounced, unsubscribed: o.unsubscribed, emailed: o.emailed, sent_today: o.sent_today },
    forms: { enquiries: pl.enquiries, contact_requests: pl.contact_requests, newsletter_active: pl.newsletter_active, sales_touches: pl.sales_touches },
    traffic: { ...t, by_day: days, search: bySrc('search'), email: bySrc('email'), today: n0(days[days.length - 1]?.entries) },
    profiles: old.profiles, areas: old.areas, google: null,
  });
  d.legacy = true;
  return d;
}

export interface ReadoutItem { label: string; value: React.ReactNode; note?: React.ReactNode; tone?: 'quiet' | 'alert' }

export function Readouts({ items, cols = 4 }: { items: ReadoutItem[]; cols?: 3 | 4 | 5 }) {
  return (
    <dl className="hq-readouts" data-cols={cols}>
      {items.map((it) => (
        <div className="hq-cell" key={it.label} data-tone={it.tone}>
          <dt>{it.label}</dt>
          <dd className="hq-val">{it.value}</dd>
          {it.note != null && <dd className="hq-note">{it.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function Panel({ title, meta, children }: { title: string; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="hq-panel">
      <header><h3>{title}</h3>{meta != null && <span>{meta}</span>}</header>
      {children}
    </section>
  );
}

export function Table({ head, rows, empty }: { head: { label: string; r?: boolean }[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="hq-empty">{empty}</p>;
  return (
    <table className="hq-table">
      <thead><tr>{head.map((h) => <th key={h.label} scope="col" className={h.r ? 'r' : undefined}>{h.label}</th>)}</tr></thead>
      <tbody>{rows.map((cells, i) => <tr key={i}>{cells.map((c, j) => <td key={j} className={head[j]?.r ? 'r' : undefined}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

/** A Google position with the results page it falls on, and the change since the previous export when there is one. */
export function Pos({ p, prev }: { p: unknown; prev?: unknown }) {
  const delta = prev != null ? n0(prev) - n0(p) : 0;
  return (
    <span className="hq-posline">
      <span className="hq-pos" data-page={pageOf(p)}>{one(p)}</span><small>page {pageOf(p)}</small>
      {Math.abs(delta) >= 0.1 && <span className="hq-delta" data-dir={delta > 0 ? 'up' : 'down'}>{delta > 0 ? '▲' : '▼'} {one(Math.abs(delta))}</span>}
    </span>
  );
}

export interface BarDay { key: string; tick: string; today?: boolean; title: string; parts: { cls: 'a' | 'b' | 'c' | 'o'; n: number }[]; top?: string; topCls?: string }

export function DayBars({ days, label, keys }: { days: BarDay[]; label: string; keys: { cls: string; text: string }[] }) {
  const max = Math.max(1, ...days.map((d) => d.parts.reduce((a, p) => a + p.n, 0)));
  return (
    <div>
      <div className="hq-bars" role="img" aria-label={label}>
        {days.map((d) => {
          const total = d.parts.reduce((a, p) => a + p.n, 0);
          return (
            <div key={d.key} title={d.title}>
              {d.top && <em className={d.topCls} style={{ bottom: `calc(${(total / max) * 100}% + 5px)` }}>{d.top}</em>}
              {d.parts.map((p) => (p.n > 0 ? <u key={p.cls} className={p.cls} style={{ height: `${(p.n / max) * 100}%` }} /> : null))}
            </div>
          );
        })}
      </div>
      <div className="hq-axis" aria-hidden="true">{days.map((d) => <span key={d.key} data-today={d.today || undefined}>{d.tick}</span>)}</div>
      <p className="hq-key">{keys.map((k) => <span key={k.cls}><i className={k.cls} />{k.text}</span>)}</p>
    </div>
  );
}

/** A 270-degree dial, as on a launch webcast: the reading in the middle, the arc filling towards the target. */
export function Gauge({ title, value, unit, note, pct }: { title: string; value: string; unit: string; note: string; pct: number }) {
  const R = 86, C = 100;
  const pt = (deg: number, r: number) => { const a = (deg * Math.PI) / 180; return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`; };
  const arc = `M ${pt(135, R)} A ${R} ${R} 0 1 1 ${pt(405, R)}`;
  const p = Math.max(0, Math.min(1, pct || 0));
  return (
    <div className="hq-gauge">
      <div className="hq-dial">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <path className="hq-dial-track" d={arc} />
          {Array.from({ length: 11 }, (_, i) => <path key={i} className="hq-dial-tick" d={`M ${pt(135 + i * 27, 92)} L ${pt(135 + i * 27, i % 5 === 0 ? 99 : 96)}`} />)}
          <path className="hq-dial-value" d={`M ${pt(135, 79)} L ${pt(135, 93)}`} />
          <path className="hq-dial-value" d={arc} pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 - p * 100} />
        </svg>
        <div className="hq-dial-read"><b>{value}</b><small>{unit}</small></div>
      </div>
      <h2>{title}</h2>
      <p>{note}</p>
    </div>
  );
}

export interface Stage { name: string; value: string; on: boolean; note: string }

/**
 * The path from a free listing to a paying agency, drawn as a horizon. Lit points are stages at least one
 * agency has reached; the ringed one is the furthest reached. On narrow screens the same stages show as a list.
 */
export function Horizon({ stages, caption }: { stages: Stage[]; caption: React.ReactNode }) {
  const sky = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(760);
  useEffect(() => {
    const el = sky.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const fit = () => { if (el.clientWidth > 0) setW(el.clientWidth); };
    const ro = new ResizeObserver(fit);
    ro.observe(el); fit();
    return () => ro.disconnect();
  }, []);
  const H = 290, BASE = 196, RISE = 240;
  const at = (i: number) => 0.06 + (0.88 * i) / Math.max(1, stages.length - 1);
  const y = (t: number) => BASE - RISE * t * (1 - t);
  const edge = stages.reduce((acc, s, i) => (s.on ? i : acc), -1);
  const curve = `M0 ${BASE} Q${w / 2} ${BASE - RISE / 2} ${w} ${BASE}`;
  return (
    <div className="hq-pipe">
      <div className="hq-sky" ref={sky} aria-hidden="true">
        <svg viewBox={`0 0 ${w} ${H}`} style={{ ['--reach' as any]: edge < 0 ? 0 : at(edge) }}>
          <defs>
            <linearGradient id="hq-fade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#38a4ff" stopOpacity="0" /><stop offset="0.1" stopColor="#38a4ff" stopOpacity="1" />
              <stop offset="0.9" stopColor="#38a4ff" stopOpacity="1" /><stop offset="1" stopColor="#38a4ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hq-ground" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#0f5bff" stopOpacity="0.34" /><stop offset="0.7" stopColor="#0f5bff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hq-sides" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.2" stopColor="#fff" stopOpacity="1" />
              <stop offset="0.8" stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="hq-mask"><rect width={w} height={H} fill="url(#hq-sides)" /></mask>
          </defs>
          <path d={`${curve} L${w} ${H} L0 ${H} Z`} fill="url(#hq-ground)" mask="url(#hq-mask)" />
          <path className="hq-arc-far" d={curve} />
          <path className="hq-arc-near" d={curve} pathLength={1} />
        </svg>
        {stages.map((s, i) => (
          <div className="hq-node" key={s.name} data-on={s.on} data-edge={i === edge} style={{ left: `${at(i) * 100}%`, top: y(at(i)), ['--i' as any]: i }}>
            <b>{s.value}</b><i /><span>{s.name}</span>
          </div>
        ))}
        <p className="hq-sky-note">{caption}</p>
      </div>
      <ol className="hq-steps">
        {stages.map((s) => (
          <li key={s.name} data-on={s.on}><i /><b>{s.value}</b><div><strong>{s.name}</strong><em>{s.note}</em></div></li>
        ))}
      </ol>
    </div>
  );
}

/** UK time, ticking. Renders nothing until the page is live in the browser, so the built page and the browser agree. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  if (!now) return null;
  const up = Math.max(0, now.getTime() - LAUNCH);
  return (
    <>
      <span><b>{now.toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })}</b> UK</span>
      <span title="Time since the site went live on 27 October 2026">T+ <b>{Math.floor(up / 86400000)}</b> days <b>{Math.floor((up % 86400000) / 3600000)}</b> h</span>
    </>
  );
}
