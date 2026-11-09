'use client';

// Owner dashboard ("mission control") at /hq/. Signs the owner in, loads every figure from the database
// function owner_hq once a minute, and shows it across six tabs. Styles: public/hq.css.
import { useCallback, useEffect, useState } from 'react';
import { configured, loadSession, signOut, rpc, sendCode, verifyCode, type Session } from '@/lib/supa';
import HQInbox from '@/components/HQInbox';
import { type Dash, type Team, type Content, type Row, normalise, fromLegacy, clock, Clock } from '@/components/hq/kit';
import { type Tab, Overview, Sales, GoogleView, Visitors, TeamView } from '@/components/hq/views';

const TABS: [Tab, string][] = [['overview', 'Overview'], ['sales', 'Sales'], ['google', 'Google'], ['visitors', 'Visitors'], ['team', 'Team'], ['inbox', 'Inbox']];
const NO_ACCESS = 'This account does not have access to the owner dashboard.';
const refused = (e: any) => /\((400|401|403|404)\)/.test(String(e?.message));
// Where the sign-in form remembers that a code was just sent, so leaving the page to read the email does not start it again.
const PENDING = 'ft-hq-code-sent';
const pending = {
  read(): string { try { const p = JSON.parse(localStorage.getItem(PENDING) || 'null'); return p && Date.now() - p.at < 15 * 60000 ? String(p.email) : ''; } catch { return ''; } },
  set(email: string) { try { localStorage.setItem(PENDING, JSON.stringify({ email, at: Date.now() })); } catch { /* storage unavailable */ } },
  clear() { try { localStorage.removeItem(PENDING); } catch { /* storage unavailable */ } },
};

function Gate({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [homeTip, setHomeTip] = useState(false);
  useEffect(() => {
    const sentTo = pending.read();
    if (sentTo) { setEmail(sentTo); setStep('code'); }
    // On an iPhone or iPad in Safari, a page opened from the Home Screen keeps its sign-in for good.
    const n = navigator as any;
    setHomeTip(/iPhone|iPad|iPod/.test(n.userAgent || '') && n.standalone === false);
  }, []);
  async function send(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const to = email.trim().toLowerCase();
    try { await sendCode(to); pending.set(to); setStep('code'); } catch (x: any) { setMsg(x.message); }
    setBusy(false);
  }
  async function check(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await verifyCode(email.trim().toLowerCase(), code.trim()); pending.clear(); onDone(); } catch (x: any) { setMsg(x.message); }
    setBusy(false);
  }
  return (
    <div className="hq-gate">
      <h1>Owner sign-in</h1>
      {step === 'email' ? (
        <form onSubmit={send}>
          <p>Enter the owner’s email address and we will send a sign-in code. There is no password, and this device stays signed in afterwards.</p>
          <div><label htmlFor="hq-email">Email</label><input id="hq-email" className="hq-input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {msg && <p role="alert">{msg}</p>}
          <button className="hq-btn hq-btn-solid hq-btn-big" disabled={busy}>{busy ? 'Sending' : 'Email me a code'}</button>
        </form>
      ) : (
        <form onSubmit={check}>
          <p>We sent a code to {email}. It can take a minute, and may land in junk.</p>
          <div><label htmlFor="hq-code">Code from the email</label><input id="hq-code" className="hq-input" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={10} value={code} onChange={(e) => setCode(e.target.value)} /></div>
          {msg && <p role="alert">{msg}</p>}
          <button className="hq-btn hq-btn-solid hq-btn-big" disabled={busy}>{busy ? 'Checking' : 'Sign in'}</button>
          <button type="button" className="hq-btn hq-btn-big" onClick={() => { pending.clear(); setStep('email'); setCode(''); setMsg(''); }}>Use a different email</button>
        </form>
      )}
      {homeTip && step === 'email' && <p className="hq-tip"><b>Before you sign in on this iPhone:</b> tap the Share button, choose “Add to Home Screen”, then open Mission control from the new icon and sign in there. It opens like an app and keeps you signed in.</p>}
    </div>
  );
}

export default function HQ({ names, content }: { names: Record<string, string>; content: Content }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [days, setDays] = useState(30);
  const [d, setD] = useState<Dash | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [err, setErr] = useState('');
  const [stale, setStale] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  const load = useCallback(async (n: number) => {
    let next: Dash | null = null;
    try { next = normalise(await rpc<Row>('owner_hq', { p_days: n })); }
    catch (e: any) {
      if (e.message === 'signed-out') { setSession(null); return; }
      // The newer data function could not be reached: fall back to the first one, which has fewer figures.
      try { next = fromLegacy(await rpc<Row>('owner_dashboard', { p_days: n })); }
      catch (e2: any) {
        if (e2.message === 'signed-out') { setSession(null); return; }
        setStale(true);
        setErr(refused(e2) ? NO_ACCESS : 'Could not load the figures. Trying again each minute.');
        return;
      }
    }
    setD(next); setErr(''); setStale(false);
    rpc<Team>('owner_team').then(setTeam).catch(() => {});
  }, []);

  useEffect(() => { setSession(loadSession()); setReady(true); }, []);
  useEffect(() => {
    if (!session) return;
    load(days);
    const t = setInterval(() => load(days), 60000);
    return () => clearInterval(t);
  }, [session, days, load]);

  const leave = () => { signOut(); setSession(null); setD(null); setTeam(null); setErr(''); };
  const go = (t: Tab) => { setTab(t); if (typeof window !== 'undefined') window.scrollTo({ top: 0 }); };

  let body: React.ReactNode;
  if (!configured) body = <p className="hq-notice" data-tone="alert">The dashboard is not connected to its database in this build.</p>;
  else if (!ready) body = <div className="hq-wait">Loading</div>;
  else if (!session) body = <Gate onDone={() => setSession(loadSession())} />;
  else if (err && !d) body = <div className="hq-gate"><p role="alert">{err}</p><form onSubmit={(e) => e.preventDefault()}><button className="hq-btn hq-btn-big" onClick={leave}>Sign out</button></form></div>;
  else if (!d) body = <div className="hq-wait">Loading the live figures</div>;
  else {
    const props = { d, team, content, names, go };
    body = (
      <>
        <nav className="hq-bar" aria-label="Dashboard sections">
          <div className="hq-tabs" role="tablist">
            {TABS.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className="hq-tab" onClick={() => setTab(k)}>{label}</button>)}
          </div>
          <div className="hq-controls">
            <div className="hq-range" role="group" aria-label="Period shown">
              {[7, 30, 90].map((n) => <button key={n} className="hq-seg" aria-pressed={n === days} onClick={() => setDays(n)}>{n} days</button>)}
            </div>
            <button className="hq-btn" onClick={leave}>Sign out</button>
          </div>
        </nav>
        {d.legacy && <p className="hq-notice" data-tone="alert" style={{ marginTop: 20 }}><b>Showing the basic figures only.</b> The full data feed could not be reached, so Google rankings and some detail are missing. It retries every minute.</p>}
        <div role="tabpanel" aria-label={TABS.find(([k]) => k === tab)?.[1]}>
          {tab === 'overview' && <Overview {...props} />}
          {tab === 'sales' && <Sales {...props} />}
          {tab === 'google' && <GoogleView {...props} />}
          {tab === 'visitors' && <Visitors {...props} />}
          {tab === 'team' && <TeamView {...props} />}
          {tab === 'inbox' && <div className="hq-section"><HQInbox /></div>}
        </div>
      </>
    );
  }

  return (
    <div className="hq-wrap">
      <header className="hq-top">
        <p className="hq-brand"><strong>Fostering Today</strong><span>Mission control</span></p>
        <p className="hq-status">
          {d && <span className="hq-live" data-stale={stale}>{stale ? 'Reconnecting' : `Live, updated ${clock(d.generated_at)}`}</span>}
          <Clock />
          <a href="/">View the site</a>
        </p>
      </header>
      {body}
    </div>
  );
}
