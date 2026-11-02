'use client';

import { useCallback, useEffect, useState } from 'react';
import { rpc } from '@/lib/supa';

type Msg = { message_id: string; thread_id: string; at: string; direction: 'in' | 'out'; from_addr: string | null; to_addrs: string | null; subject: string | null; preview: string | null; labels: string[] | null; body_text?: string | null };
interface Box { mirrored_at: string | null; counts: { all: number; in: number; out: number; outreach: number }; messages: Msg[] }

const BOXES: [string, string][] = [['all', 'All mail'], ['in', 'Received'], ['leads', 'Received, not spam'], ['out', 'Sent'], ['outreach', 'Launch emails']];
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const addr = (s: string | null) => (s || '').replace(/^.*<([^>]+)>.*$/, '$1');

export default function HQInbox() {
  const [box, setBox] = useState('all');
  const [q, setQ] = useState('');
  const [data, setData] = useState<Box | null>(null);
  const [open, setOpen] = useState<Msg | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { setData(await rpc<Box>('owner_mail', { p_box: box, p_q: q, p_limit: 200 })); setErr(''); }
    catch { setErr('Could not load the inbox. It refreshes automatically.'); }
  }, [box, q]);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  async function show(m: Msg) {
    setOpen(m);
    try { const full = await rpc<Msg>('owner_mail_message', { p_id: m.message_id }); if (full) setOpen(full); } catch { /* keep preview */ }
  }

  if (open) {
    const other = open.direction === 'in' ? addr(open.from_addr) : addr(open.to_addrs);
    return (
      <div style={{ maxWidth: 860 }}>
        <button className="btn btn-small" onClick={() => setOpen(null)}>Back to inbox</button>
        <div className="form-card" style={{ marginTop: 14, padding: 20, boxShadow: '4px 4px 0 var(--ink)' }}>
          <p className="label">{open.direction === 'in' ? 'Received' : 'Sent'} · {when(open.at)}</p>
          <h2 style={{ fontSize: 22, margin: '6px 0 10px' }}>{open.subject || '(no subject)'}</h2>
          <p style={{ fontSize: 14 }}><strong>From:</strong> {open.from_addr}</p>
          <p style={{ fontSize: 14, marginBottom: 10 }}><strong>To:</strong> {open.to_addrs}</p>
          {open.labels && open.labels.length > 0 && <p style={{ marginBottom: 12 }}>{open.labels.filter((l) => !['received', 'sent'].includes(l)).map((l) => <span key={l} className="tag" style={{ marginRight: 6 }}>{l}</span>)}</p>}
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.55, borderTop: '1px solid #e2dccd', paddingTop: 12, wordBreak: 'break-word' }}>{open.body_text || open.preview || '(no text)'}</div>
          <p style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {other && <a className="btn btn-dark btn-small" href={`mailto:${other}?subject=${encodeURIComponent('Re: ' + (open.subject || ''))}`}>Reply from my email app</a>}
            <a className="btn btn-small" href="https://console.agentmail.to" target="_blank" rel="noopener">Open in AgentMail</a>
          </p>
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Replying from your own app: choose hello@fosteringtoday.com as the sender (you have Send as permission). The desks see your reply in the thread and will not answer it twice.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {BOXES.map(([k, l]) => <button key={k} className={`btn btn-small${k === box ? ' btn-dark' : ''}`} aria-pressed={k === box} onClick={() => setBox(k)}>{l}{data && k !== 'leads' ? ` (${(data.counts as any)[k] ?? 0})` : ''}</button>)}
      </div>
      <input className="input" type="search" placeholder="Search subject, sender or text" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the inbox" style={{ maxWidth: 480, marginBottom: 10 }} />
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Everything sent and received at hello@fosteringtoday.com. Copied here from the mailbox every hour{data?.mirrored_at ? `; last copied ${when(data.mirrored_at)}` : ''}. Sign-in codes are not shown.
      </p>
      {err && <p role="alert">{err}</p>}
      {!data ? <p className="muted">Loading…</p> : data.messages.length === 0 ? <p className="muted">No messages yet. The first copy arrives within the hour.</p> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, border: '2px solid var(--ink)', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
          {data.messages.map((m) => (
            <li key={m.message_id} style={{ borderBottom: '1px solid #e2dccd' }}>
              <button onClick={() => show(m)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', padding: '10px 14px', boxSizing: 'border-box' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                  <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.direction === 'in' ? `From ${addr(m.from_addr)}` : `To ${addr(m.to_addrs)}`}</strong>
                  <span className="muted" style={{ flex: 'none' }}>{when(m.at)}</span>
                </span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600, margin: '2px 0' }}>{m.direction === 'in' ? '↘ ' : '↗ '}{m.subject || '(no subject)'}</span>
                <span className="muted" style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(m.preview || '').replace(/\s+/g, ' ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
