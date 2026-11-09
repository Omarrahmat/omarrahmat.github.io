'use client';

// Inbox tab of the owner dashboard: every email sent and received at hello@, copied from the mailbox each hour.
import { useCallback, useEffect, useState } from 'react';
import { rpc } from '@/lib/supa';
import { addr } from '@/components/hq/kit';

type Msg = { message_id: string; thread_id: string; at: string; direction: 'in' | 'out'; from_addr: string | null; to_addrs: string | null; subject: string | null; preview: string | null; labels: string[] | null; body_text?: string | null };
interface Box { mirrored_at: string | null; counts: { all: number; in: number; out: number; outreach: number }; messages: Msg[] }

const BOXES: [string, string][] = [['all', 'All mail'], ['in', 'Received'], ['leads', 'Received, not spam'], ['out', 'Sent'], ['outreach', 'Outreach emails']];
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function HQInbox() {
  const [box, setBox] = useState('all');
  const [q, setQ] = useState('');
  const [data, setData] = useState<Box | null>(null);
  const [open, setOpen] = useState<Msg | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { setData(await rpc<Box>('owner_mail', { p_box: box, p_q: q, p_limit: 200 })); setErr(''); }
    catch { setErr('Could not load the inbox. Trying again each minute.'); }
  }, [box, q]);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  async function show(m: Msg) {
    setOpen(m);
    try { const full = await rpc<Msg>('owner_mail_message', { p_id: m.message_id }); if (full) setOpen(full); } catch { /* keep the preview */ }
  }

  if (open) {
    const other = open.direction === 'in' ? addr(open.from_addr) : addr(open.to_addrs);
    const labels = (open.labels || []).filter((l) => !['received', 'sent'].includes(l));
    return (
      <div className="hq-letter">
        <button className="hq-btn" onClick={() => setOpen(null)}>Back to inbox</button>
        <section className="hq-panel" style={{ marginTop: 16 }}>
          <p className="meta">{open.direction === 'in' ? 'Received' : 'Sent'} {when(open.at)}</p>
          <h2>{open.subject || '(no subject)'}</h2>
          <p className="meta"><b>From</b> {open.from_addr}</p>
          <p className="meta"><b>To</b> {open.to_addrs}</p>
          {labels.length > 0 && <p style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{labels.map((l) => <span key={l} className="hq-tag">{l}</span>)}</p>}
          <div className="body">{open.body_text || open.preview || '(no text)'}</div>
          <p className="acts">
            {other && <a className="hq-btn hq-btn-solid" href={`mailto:${other}?subject=${encodeURIComponent('Re: ' + (open.subject || ''))}`}>Reply from my email app</a>}
            <a className="hq-btn" href="https://console.agentmail.to" target="_blank" rel="noopener">Open in AgentMail</a>
          </p>
          <p className="hq-foot">Replying from your own app: choose hello@fosteringtoday.com as the sender. The desks see your reply in the thread and will not answer it twice.</p>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="hq-filters">
        {BOXES.map(([k, l]) => <button key={k} className="hq-btn" aria-pressed={k === box} onClick={() => setBox(k)}>{l}{data && k !== 'leads' ? ` ${(data.counts as any)[k] ?? 0}` : ''}</button>)}
      </div>
      <input className="hq-input" type="search" placeholder="Search subject, sender or text" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the inbox" />
      <p className="hq-foot" style={{ margin: '12px 0 14px' }}>
        Everything sent and received at hello@fosteringtoday.com, copied here every hour{data?.mirrored_at ? `; last copied ${when(data.mirrored_at)}` : ''}. Sign-in codes are not shown.
      </p>
      {err && <p role="alert" className="hq-notice" data-tone="alert">{err}</p>}
      {!data ? <div className="hq-wait">Loading the inbox</div> : data.messages.length === 0 ? <p className="hq-empty">No messages here yet.</p> : (
        <ul className="hq-mail">
          {data.messages.map((m) => (
            <li key={m.message_id} data-dir={m.direction}>
              <button onClick={() => show(m)}>
                <span className="top"><span className="who">{m.direction === 'in' ? addr(m.from_addr) : addr(m.to_addrs)}</span><span className="at">{when(m.at)}</span></span>
                <span className="sub"><span className="dir">{m.direction === 'in' ? 'In' : 'Out'}</span>{m.subject || '(no subject)'}</span>
                <span className="pre">{(m.preview || '').replace(/\s+/g, ' ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
