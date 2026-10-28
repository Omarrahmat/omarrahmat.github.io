'use client';
import { useEffect, useState } from 'react';
import { unsubscribeEmail } from '@/lib/supa';

export default function Unsubscribe() {
  const [email, setEmail] = useState('');
  const [prov, setProv] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  useEffect(() => { try { const q = new URLSearchParams(location.search); setEmail(q.get('e') || ''); setProv(q.get('p') || ''); } catch {} }, []);
  const valid = Boolean(prov) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  async function go() {
    setState('busy');
    setState((await unsubscribeEmail(email, prov || undefined)) ? 'done' : 'error');
  }
  if (state === 'done') return <p className="lead">Done. {prov ? 'Your organisation' : <strong>{email}</strong>} will get no more emails from Fostering Today. Sorry to see you go.</p>;
  return (
    <div>
      {valid ? <p className="lead">Stop all emails from Fostering Today{prov ? ' to your organisation' : <> to <strong>{email}</strong></>}.</p> : (
        <>
          <p className="lead">Enter the email address you want removed.</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="you@example.com" aria-label="Email address" style={{ width: '100%', maxWidth: 420, padding: 14, fontSize: 18, margin: '8px 0 16px', border: '2px solid var(--ink, #222)', borderRadius: 10 }} />
        </>
      )}
      <div><button type="button" className="btn btn-primary" disabled={!valid || state === 'busy'} onClick={go} style={{ fontSize: 20, padding: '16px 28px' }}>{state === 'busy' ? 'Unsubscribing…' : 'Unsubscribe me'}</button></div>
      {state === 'error' && <p style={{ marginTop: 16, color: '#9b1c1c' }}>That did not go through. Please reply to any of our emails with the word “unsubscribe” and we will remove you by hand.</p>}
    </div>
  );
}
