'use client';

// The five data screens of the owner dashboard. Each takes the figures already loaded by HQ.tsx.
import {
  type Dash, type Team, type Content, type Row, type BarDay,
  TARGET, PRICE, n0, fmt, gbp, one, pct, plural, dayShort, dayTick, when, clock, ago, todayUK, capFor, pageOf,
  Readouts, Panel, Table, Pos, DayBars, Gauge, Horizon,
} from '@/components/hq/kit';

export type Tab = 'overview' | 'sales' | 'google' | 'visitors' | 'team' | 'inbox';
interface ViewProps { d: Dash; team: Team | null; content: Content; names: Record<string, string>; go: (t: Tab) => void }

const MEDIUM: Record<string, string> = { search: 'search engine', email: 'email', social: 'social', referral: 'other website', ai: 'AI assistant', none: 'typed or bookmarked', campaign: 'campaign' };
const PLAN: Record<string, string> = { featured: 'Featured', premium: 'Premium' };
const title = (s: string) => String(s).replace(/\b\w/g, (c) => c.toUpperCase());

function trafficDays(d: Dash): BarDay[] {
  const today = new Date().toISOString().slice(0, 10);
  const every = d.traffic.by_day.length > 45 ? 14 : d.traffic.by_day.length > 14 ? 5 : 1;
  return d.traffic.by_day.map((r: Row, i: number, all: Row[]) => {
    const search = n0(r.search), email = n0(r.email), other = Math.max(0, n0(r.entries) - search - email);
    return {
      key: r.day, today: r.day === today, tick: (all.length - 1 - i) % every === 0 ? dayShort(r.day).replace(' ', '\n') : '',
      title: `${dayShort(r.day)}: ${plural(n0(r.entries), 'arrival')}, ${fmt(email)} from our emails, ${fmt(search)} from search`,
      parts: [{ cls: 'c', n: search }, { cls: 'b', n: email }, { cls: 'a', n: other }],
    };
  });
}
const TRAFFIC_KEYS = [{ cls: 'c', text: 'From search engines' }, { cls: 'b', text: 'From our emails' }, { cls: 'a', text: 'Everything else' }];

function outreachDays(d: Dash, from: number): BarDay[] {
  const today = todayUK();
  return d.outreach_days.slice(from).map((r) => ({
    key: r.day, today: r.day === today, tick: dayTick(r.day),
    title: `${dayShort(r.day)}: ${fmt(r.sent)} sent, ${fmt(r.scheduled)} scheduled (limit ${capFor(r.day)} a day)`,
    parts: [{ cls: 'o', n: r.scheduled }, { cls: 'b', n: r.sent }],
    top: r.sent + r.scheduled > 0 ? String(r.sent + r.scheduled) : undefined, topCls: r.sent === 0 ? 'q' : undefined,
  }));
}
const OUTREACH_KEYS = [{ cls: 'b', text: 'Sent' }, { cls: 'o', text: 'Scheduled, waiting to go' }];

const kwRows = (rows: Row[]) => rows.map((r) => [r.query, <Pos p={r.position} prev={r.prev_position} />, fmt(r.impressions)]);
const KW_HEAD = [{ label: 'Keyword' }, { label: 'Position' }, { label: 'Shown', r: true }];
const NO_GOOGLE = 'No Search Console data has been loaded yet. Send Claude this week’s export and the rankings appear here.';

export function Overview({ d, team, content, go }: ViewProps) {
  const paying = d.money.featured + d.money.premium;
  const g = d.google;
  const busiest = Math.max(0, ...d.traffic.by_day.map((r: Row) => n0(r.entries)));
  const cap = capFor(todayUK());
  const near = g ? g.best_queries.filter((r) => n0(r.position) > 10).sort((a, b) => n0(b.impressions) - n0(a.impressions) || n0(a.position) - n0(b.position)).slice(0, 6) : [];
  const pagesLive = content.profiles + content.areaPages + content.allowancePages + content.guides + content.news;
  const flags = [
    d.payments.failed ? `${plural(d.payments.failed, 'payment')} failed` : '',
    d.payments.unmatched ? `${plural(d.payments.unmatched, 'payment')} not matched to an agency` : '',
    d.claims.waiting ? `${plural(d.claims.waiting, 'claim')} waiting for approval` : '',
  ].filter(Boolean);
  return (
    <>
      {flags.length > 0 && <p className="hq-notice" data-tone="alert" style={{ marginTop: 20 }}><b>Needs a look:</b> {flags.join('; ')}.</p>}
      <div className="hq-hero">
        <Gauge title="Monthly revenue" value={gbp(d.money.mrr)} unit={`of ${gbp(TARGET)}`} pct={d.money.mrr / TARGET}
          note={paying ? `${pct(d.money.mrr, TARGET)} of target from ${plural(paying, 'paying agency', 'paying agencies')}` : 'No paying agencies yet'} />
        <Horizon
          caption={<>The target of <b>{gbp(TARGET)} a month</b> is about {Math.round(TARGET / PRICE.featured)} Featured agencies, or {Math.round(TARGET / PRICE.premium)} Premium.</>}
          stages={[
            { name: 'Listed', value: fmt(content.profiles), on: content.profiles > 0, note: 'Fostering services in the directory' },
            { name: 'Emailed', value: fmt(d.outreach.emailed), on: d.outreach.emailed > 0, note: 'Services we have emailed at least once' },
            { name: 'Claimed', value: fmt(d.claims.profiles), on: d.claims.profiles > 0, note: 'Profiles claimed by their agency' },
            { name: 'Signed in', value: fmt(d.claims.signed_in), on: d.claims.signed_in > 0, note: 'Agencies that have used their portal' },
            { name: 'Subscribed', value: fmt(paying), on: paying > 0, note: 'Agencies paying each month' },
          ]} />
        <Gauge title="Visitors today" value={fmt(d.traffic.today)} unit="arrivals" pct={busiest ? d.traffic.today / busiest : 0}
          note={busiest ? `Busiest day in the last ${d.days}: ${fmt(busiest)}` : 'No visits recorded yet'} />
      </div>

      <Readouts items={[
        { label: 'Subscriptions', value: fmt(paying), note: `${fmt(d.money.featured)} Featured, ${fmt(d.money.premium)} Premium`, tone: paying ? undefined : 'quiet' },
        { label: 'Profiles claimed', value: fmt(d.claims.profiles), note: d.claims.waiting ? `${fmt(d.claims.waiting)} more waiting for approval` : d.legacy ? `${fmt(d.claims.signed_in)} signed in` : `${fmt(d.claims.signed_in)} signed in, ${plural(d.claims.logos, 'logo')} added`, tone: d.claims.profiles ? undefined : 'quiet' },
        { label: 'Emails sent today', value: <>{fmt(d.outreach.sent_today)}<small>of {cap}</small></>, note: d.legacy ? 'The schedule is not available right now' : d.outreach.scheduled ? `${fmt(d.outreach.scheduled)} more scheduled, next ${when(d.outreach.next_send)}` : 'Nothing scheduled. Approve the next batch in chat.' },
        { label: 'Replies', value: fmt(d.outreach.replied), note: `${fmt(d.outreach.bounced)} bounced, ${fmt(d.outreach.unsubscribed)} unsubscribed`, tone: d.outreach.replied ? undefined : 'quiet' },
        { label: 'Google position', value: g?.totals.position != null ? one(g.totals.position) : '–', note: g?.totals.position != null ? `Average. Page ${pageOf(g.totals.position)} of results, to ${dayShort(g.range_end)}` : 'Waiting for Search Console data', tone: g ? undefined : 'quiet' },
        { label: 'Keywords on page 1', value: g ? fmt(g.ladder.page1) : '–', note: g ? `${fmt(g.ladder.page2)} more on page 2, of ${fmt(g.keywords)} found` : 'Waiting for Search Console data', tone: g && g.ladder.page1 ? undefined : 'quiet' },
        { label: `Visitors, ${d.days} days`, value: fmt(d.traffic.entries), note: `${fmt(d.traffic.search)} from search, ${fmt(d.traffic.email)} from our emails` },
        { label: 'Pages live', value: fmt(pagesLive), note: `${fmt(content.guides)} guides, ${fmt(content.news)} news stories, ${fmt(content.areaWriteups)} area write-ups` },
      ]} />

      <div className="hq-section hq-cols">
        <div className="hq-stack">
          <Panel title="Outreach by day" meta={`${fmt(d.outreach.emailed)} of ${fmt(d.outreach.total)} services emailed`}>
            {d.outreach_days.length ? <DayBars days={outreachDays(d, 7)} keys={OUTREACH_KEYS} label="Outreach emails sent and scheduled each day" /> : <p className="hq-empty">The daily breakdown is not available right now.</p>}
          </Panel>
          <Panel title="Visitors by day" meta={`Last ${d.days} days`}>
            <DayBars days={trafficDays(d)} keys={TRAFFIC_KEYS} label="Visitors arriving each day, by where they came from" />
          </Panel>
          <Panel title="Newest claims" meta={`${plural(d.claims.profiles, 'profile')} claimed`}>
            <Table empty={d.claims.profiles ? 'The list is not available right now.' : 'No profiles claimed yet.'} head={[{ label: 'Agency' }, { label: 'Claimed' }, { label: 'Portal' }]}
              rows={d.claims.list.slice(0, 4).map((c) => [c.provider_name || c.provider_id, dayShort(c.created_at), <span className="hq-tag" data-on={c.signed_in}>{c.status !== 'approved' ? 'Waiting' : c.signed_in ? 'Signed in' : 'Not signed in'}</span>])} />
            <p className="hq-foot"><button className="hq-btn" onClick={() => go('sales')}>All sales figures</button></p>
          </Panel>
        </div>
        <div className="hq-stack">
          <Panel title="Closest to page one on Google" meta={g ? `Search Console, to ${dayShort(g.range_end)}` : undefined}>
            {g ? <Table head={KW_HEAD} rows={kwRows(near)} empty="No keywords on page 2 yet." /> : <p className="hq-empty">{NO_GOOGLE}</p>}
            <p className="hq-foot"><button className="hq-btn" onClick={() => go('google')}>All Google rankings</button></p>
          </Panel>
          <Panel title="Latest from the team" meta={team ? `${plural(team.open_handoffs, 'open hand-off')}` : undefined}>
            {!team ? <p className="hq-empty">Loading the team.</p> : team.recent.length === 0 ? <p className="hq-empty">No activity logged yet.</p> : (
              <ul className="hq-feed">{team.recent.slice(0, 4).map((r, i) => <li key={i}><strong>{r.desk}</strong><span className="t">{ago(r.at)}</span><p>{r.summary}</p></li>)}</ul>
            )}
            <p className="hq-foot"><button className="hq-btn" onClick={() => go('team')}>The whole team</button></p>
          </Panel>
        </div>
      </div>
    </>
  );
}

export function Sales({ d, names }: ViewProps) {
  const paying = d.money.featured + d.money.premium;
  const o = d.outreach;
  return (
    <>
      <div className="hq-section">
        <Readouts items={[
          { label: 'Monthly revenue', value: gbp(d.money.mrr), note: `${pct(d.money.mrr, TARGET)} of the ${gbp(TARGET)} target` },
          { label: 'Subscriptions', value: fmt(paying), note: `${fmt(d.money.featured)} Featured at £${PRICE.featured}, ${fmt(d.money.premium)} Premium at £${PRICE.premium}`, tone: paying ? undefined : 'quiet' },
          { label: 'Profiles claimed', value: fmt(d.claims.profiles), note: d.claims.waiting ? `${fmt(d.claims.waiting)} waiting for approval` : 'None waiting for approval', tone: d.claims.profiles ? undefined : 'quiet' },
          { label: 'Portal sign-ins', value: fmt(d.claims.signed_in), note: d.legacy ? 'Agencies that have used their portal' : `${plural(d.claims.logos, 'logo')} added, ${plural(d.claims.edited, 'profile')} edited`, tone: d.claims.signed_in ? undefined : 'quiet' },
        ]} />
      </div>

      <div className="hq-section hq-cols">
        <Panel title="Subscriptions" meta={`${fmt(d.payments.total)} payments seen, ${fmt(d.payments.failed)} failed, ${fmt(d.payments.unmatched)} unmatched`}>
          <Table empty="No paying agencies yet. A subscription shows here within the hour of the payment."
            head={[{ label: 'Agency' }, { label: 'Plan' }, { label: 'Since' }, { label: 'A month', r: true }]}
            rows={d.money.subs.map((s) => [names[s.provider_id] || s.provider_id, PLAN[s.tier] || s.tier, dayShort(s.started_on) || '–', gbp(PRICE[s.tier as 'featured' | 'premium'] || 0)])} />
        </Panel>
        <Panel title="Claimed profiles" meta={d.legacy ? undefined : `${plural(d.claims.total, 'request')} in all`}>
          <Table empty={d.legacy && d.claims.profiles ? 'The list is not available right now.' : 'No profiles claimed yet. Agencies claim by replying “claim” to our email or through the website form.'}
            head={[{ label: 'Agency' }, { label: 'Claimed' }, { label: 'Progress' }]}
            rows={d.claims.list.map((c) => [
              <>{c.provider_name || names[c.provider_id] || c.provider_id}<small>{[c.requester_name, c.requester_role].filter(Boolean).join(', ')}</small></>,
              dayShort(c.created_at),
              c.status !== 'approved' ? <span className="hq-tag">{c.status === 'awaiting_proof' ? 'Proof asked for' : 'Waiting'}</span> : (
                <><span className="hq-tag" data-on={c.signed_in}>{c.signed_in ? 'Signed in' : 'Not signed in'}</span> <span className="hq-tag" data-on={c.has_logo}>{c.has_logo ? 'Logo' : 'No logo'}</span>{c.tier ? <> <span className="hq-tag" data-on="true">{PLAN[c.tier] || c.tier}</span></> : null}</>
              ),
            ])} />
        </Panel>
      </div>

      <div className="hq-section">
        <h2>Outreach</h2>
        <p className="hq-lede">Every fostering service gets up to three emails: the launch email, then two short follow-ups. You approve each week’s batch; it then sends on schedule.</p>
        <Readouts cols={5} items={[
          { label: 'Services emailed', value: fmt(o.emailed), note: d.legacy ? `of ${fmt(o.total)} found` : `${fmt(o.emailed_agencies)} agencies, ${fmt(o.emailed_councils)} councils` },
          { label: 'Not yet emailed', value: fmt(o.queued), note: 'Addresses waiting for their first email' },
          { label: 'Scheduled', value: d.legacy ? '–' : fmt(o.scheduled), note: d.legacy ? 'Not available right now' : o.next_send ? `Next goes ${when(o.next_send)}` : 'Nothing waiting to send', tone: o.scheduled ? undefined : 'quiet' },
          { label: 'Replies', value: fmt(o.replied), note: `${pct(o.replied, o.emailed)} of services emailed`, tone: o.replied ? undefined : 'quiet' },
          { label: 'Bounced', value: fmt(o.bounced), note: d.legacy ? `${fmt(o.unsubscribed)} unsubscribed` : `${fmt(o.unsubscribed)} unsubscribed, ${fmt(o.skipped)} left out`, tone: o.bounced > 3 ? 'alert' : 'quiet' },
        ]} />
      </div>
      <div className="hq-section hq-cols">
        <Panel title="Sent and scheduled by day" meta={d.mail.outreach_sent ? `${fmt(d.mail.outreach_sent)} emails sent in all` : undefined}>
          {d.outreach_days.length ? <DayBars days={outreachDays(d, 0)} keys={OUTREACH_KEYS} label="Outreach emails sent and scheduled each day" /> : <p className="hq-empty">The daily breakdown is not available right now.</p>}
          <p className="hq-foot">The daily limit protects the domain’s reputation: {capFor(todayUK())} a day now{todayUK() < '2026-11-11' ? ', 60 from 11 November' : ''}. Weekdays only.</p>
        </Panel>
        <Panel title="Where each service is">
          <Table empty="Nothing in the queue."
            head={[{ label: 'Stage' }, { label: 'Services', r: true }]}
            rows={([
              ['Waiting for the first email', o.queued],
              ['Launch email sent', o.step1],
              ['One follow-up sent', o.step2],
              ['All three emails sent', o.step3],
              ['Replied or claimed', o.replied],
              ['Bounced, unsubscribed or left out', o.bounced + o.unsubscribed + o.skipped],
            ] as [string, number][]).filter(([, n]) => !d.legacy || n > 0).map(([label, n]) => [label, fmt(n)])} />
        </Panel>
      </div>

      <div className="hq-section">
        <h2>Website forms, last {d.days} days</h2>
        <Readouts items={[
          { label: 'Enquiries to agencies', value: fmt(d.forms.enquiries), note: 'Sent from paid partners’ profiles', tone: d.forms.enquiries ? undefined : 'quiet' },
          { label: 'Contact messages', value: fmt(d.forms.contact_requests), note: 'Through the contact form', tone: d.forms.contact_requests ? undefined : 'quiet' },
          { label: 'Corrections asked for', value: fmt(d.forms.corrections), note: 'Reports of a wrong detail', tone: d.forms.corrections ? undefined : 'quiet' },
          { label: 'Newsletter', value: fmt(d.forms.newsletter_active), note: 'Active subscribers', tone: d.forms.newsletter_active ? undefined : 'quiet' },
        ]} />
      </div>
    </>
  );
}

export function GoogleView({ d }: ViewProps) {
  const g = d.google;
  const searchLanding = <Table empty="No visits from search engines in this period." head={[{ label: 'Page' }, { label: 'Arrivals', r: true }]} rows={d.traffic.top_search_landing.map((r) => [r.landing, fmt(r.n)])} />;
  if (!g) {
    return (
      <div className="hq-section">
        <p className="hq-notice"><b>No Search Console data loaded yet.</b> In Search Console open Performance, choose 3 months, tap Export, then send the file to Claude. Rankings for every keyword appear here.</p>
        <div className="hq-section"><Panel title="Visits from search engines, counted on our site" meta={`${fmt(d.traffic.search)} in the last ${d.days} days`}>{searchLanding}</Panel></div>
      </div>
    );
  }
  const page1 = g.best_queries.filter((r) => n0(r.position) <= 10);
  const page2 = g.best_queries.filter((r) => n0(r.position) > 10).sort((a, b) => n0(b.impressions) - n0(a.impressions) || n0(a.position) - n0(b.position));
  const was = g.prev_ladder;
  const diff = (now: number, before?: number) => (was && before != null && now !== before ? ` (${now > before ? '+' : '−'}${Math.abs(now - before)} since ${dayShort(g.prev_snapshot)})` : '');
  const days: BarDay[] = g.daily.map((r: Row) => ({
    key: r.day, tick: dayTick(r.day), title: `${dayShort(r.day)}: shown ${fmt(r.impressions)} times, ${plural(n0(r.clicks), 'click')}${r.position != null ? `, average position ${one(r.position)}` : ''}`,
    parts: [{ cls: 'b', n: n0(r.impressions) }], top: n0(r.impressions) ? fmt(r.impressions) : undefined,
  }));
  return (
    <>
      <div className="hq-section">
        <p className="hq-lede">From your Search Console export of <b>{dayShort(g.snapshot)}</b>, covering {dayShort(g.range_start)} to {dayShort(g.range_end)}. Send Claude each Monday’s export to bring it up to date{g.prev_snapshot ? `; changes are measured against ${dayShort(g.prev_snapshot)}` : ''}.</p>
        <Readouts items={[
          { label: 'Average position', value: g.totals.position != null ? one(g.totals.position) : '–', note: g.totals.position != null ? `Page ${pageOf(g.totals.position)} of Google. Page 1 is positions 1 to 10.` : undefined },
          { label: 'Times shown', value: fmt(g.totals.impressions), note: 'Each time one of our pages appeared in results' },
          { label: 'Clicks', value: fmt(g.totals.clicks), note: g.totals.ctr != null ? `${g.totals.ctr}% of the times shown` : undefined, tone: g.totals.clicks ? undefined : 'quiet' },
          { label: 'Keywords', value: fmt(g.keywords), note: `Different searches we appeared for, across ${fmt(g.pages)} pages` },
        ]} />
      </div>

      <div className="hq-section">
        <h2>Where our keywords sit</h2>
        <dl className="hq-ladder">
          <div data-rung="1"><dt>Page 1</dt><dd>{fmt(g.ladder.page1)}<small>Positions 1 to 10{diff(g.ladder.page1, was?.page1)}</small></dd></div>
          <div data-rung="2"><dt>Page 2</dt><dd>{fmt(g.ladder.page2)}<small>Positions 11 to 20{diff(g.ladder.page2, was?.page2)}</small></dd></div>
          <div data-rung="3"><dt>Page 3</dt><dd>{fmt(g.ladder.page3)}<small>Positions 21 to 30{diff(g.ladder.page3, was?.page3)}</small></dd></div>
          <div data-rung="4"><dt>Page 4 and beyond</dt><dd>{fmt(g.ladder.deeper)}<small>Where few people look</small></dd></div>
        </dl>
      </div>

      <div className="hq-section hq-cols">
        <Panel title="Closest to page one" meta="On page 2 now, most shown first">
          <Table head={KW_HEAD} rows={kwRows(page2.slice(0, 15))} empty="No keywords on page 2 yet." />
        </Panel>
        <Panel title="On page one now" meta={plural(g.ladder.page1, 'keyword')}>
          <Table head={KW_HEAD} rows={kwRows(page1.slice(0, 15))} empty="No keywords on page 1 yet. New sites usually reach it for small local searches first." />
          <p className="hq-foot">A position from only one or two appearances can move a lot from week to week.</p>
        </Panel>
      </div>

      <div className="hq-section hq-cols">
        <Panel title="Keywords shown most" meta="What people searched when they saw us">
          <Table head={KW_HEAD} rows={kwRows(g.top_queries.slice(0, 15))} empty="No keywords yet." />
        </Panel>
        <Panel title="Pages Google shows most">
          <Table head={[{ label: 'Page' }, { label: 'Position' }, { label: 'Shown', r: true }]} empty="No pages yet."
            rows={g.top_pages.slice(0, 15).map((r) => [r.page, <Pos p={r.position} prev={r.prev_position} />, fmt(r.impressions)])} />
        </Panel>
      </div>

      <div className="hq-section hq-cols">
        <Panel title="Shown on Google by day" meta={`${dayShort(g.range_start)} to ${dayShort(g.range_end)}`}>
          <DayBars days={days} keys={[{ cls: 'b', text: 'Times our pages appeared in results' }]} label="Times our pages appeared in Google results each day" />
        </Panel>
        <Panel title="By type of page">
          <Table head={[{ label: 'Type' }, { label: 'Pages', r: true }, { label: 'Shown', r: true }, { label: 'Clicks', r: true }, { label: 'Position', r: true }]} empty="No pages yet."
            rows={g.page_types.map((r) => [r.kind, fmt(r.pages), fmt(r.impressions), fmt(r.clicks), one(r.position)])} />
        </Panel>
      </div>

      <div className="hq-section hq-cols">
        <Panel title="Visits from search engines, counted on our site" meta={`${fmt(d.traffic.search)} in the last ${d.days} days`}>{searchLanding}</Panel>
        <Panel title="Who is searching">
          <Table head={[{ label: 'Country or device' }, { label: 'Shown', r: true }, { label: 'Clicks', r: true }]} empty="No breakdown in this export."
            rows={[...g.countries.slice(0, 4), ...g.devices].map((r) => [r.name, fmt(r.impressions), fmt(r.clicks)])} />
        </Panel>
      </div>
      <p className="hq-foot">Position is where a page of ours appears in Google’s results, averaged over every time it was shown: 1 is the top, and each results page holds about ten. Google hides some rare searches, so the keyword list adds up to less than the total.</p>
    </>
  );
}

export function Visitors({ d, content, names }: ViewProps) {
  const pk = d.profiles.by_kind || {};
  const clicks = n0(pk.website_click) + n0(pk.recruit_click) + n0(pk.phone_click);
  const change = d.traffic.prev_entries ? Math.round(((d.traffic.entries - d.traffic.prev_entries) / d.traffic.prev_entries) * 100) : null;
  return (
    <>
      <div className="hq-section">
        <Readouts items={[
          { label: `Arrivals, ${d.days} days`, value: fmt(d.traffic.entries), note: change == null ? 'Visits that started on the site' : `${change >= 0 ? 'Up' : 'Down'} ${Math.abs(change)}% on the ${d.days} days before` },
          { label: 'From search engines', value: fmt(d.traffic.search), note: 'Google, Bing and others', tone: d.traffic.search ? undefined : 'quiet' },
          { label: 'From our emails', value: fmt(d.traffic.email), note: 'Agencies clicking the outreach emails' },
          { label: 'Page views', value: fmt(d.traffic.pageviews), note: 'Every page load' },
        ]} />
      </div>
      <div className="hq-section">
        <Panel title="Visitors by day" meta={`Today so far: ${fmt(d.traffic.today)}`}>
          <DayBars days={trafficDays(d)} keys={TRAFFIC_KEYS} label="Visitors arriving each day, by where they came from" />
        </Panel>
      </div>
      <div className="hq-section hq-cols" data-cols="3">
        <Panel title="Where visitors come from">
          <Table head={[{ label: 'Source' }, { label: 'Arrivals', r: true }]} empty="Nothing recorded yet." rows={d.traffic.by_source.map((r) => [<>{r.source}<small>{MEDIUM[r.medium] || r.medium}</small></>, fmt(r.n)])} />
        </Panel>
        <Panel title="Pages people land on">
          <Table head={[{ label: 'Page' }, { label: 'Arrivals', r: true }]} empty="Nothing recorded yet." rows={d.traffic.top_landing.map((r) => [r.landing, fmt(r.n)])} />
        </Panel>
        <Panel title="Pages found through search">
          <Table head={[{ label: 'Page' }, { label: 'Arrivals', r: true }]} empty="No visits from search engines in this period." rows={d.traffic.top_search_landing.map((r) => [r.landing, fmt(r.n)])} />
        </Panel>
      </div>

      <div className="hq-section">
        <h2>Agency profiles, last {d.days} days</h2>
        <Readouts cols={3} items={[
          { label: 'Profile views', value: fmt(pk.view), note: 'Times an agency’s page was opened' },
          { label: 'Clicks through to agencies', value: fmt(clicks), note: `${fmt(pk.website_click)} website, ${fmt(pk.recruit_click)} recruitment page, ${fmt(pk.phone_click)} phone`, tone: clicks ? undefined : 'quiet' },
          { label: 'Appearances in the directory', value: fmt(pk.impression), note: `${fmt(pk.crawler)} visits from search-engine robots` },
        ]} />
      </div>
      <div className="hq-section hq-cols">
        <Panel title="Most viewed profiles">
          <Table head={[{ label: 'Service' }, { label: 'Views', r: true }]} empty="Nothing recorded yet." rows={d.profiles.top_viewed.map((r) => [names[r.provider_id] || r.provider_id, fmt(r.n)])} />
        </Panel>
        <Panel title="Areas people search for">
          <Table head={[{ label: 'Area' }, { label: 'Searches', r: true }]} empty="No area searches in this period." rows={d.areas.map((r) => [title(r.area), fmt(r.n)])} />
        </Panel>
      </div>

      <div className="hq-section">
        <h2>What is on the site</h2>
        <Readouts cols={5} items={[
          { label: 'Agency profiles', value: fmt(content.profiles), note: 'One for every fostering service' },
          { label: 'Area pages', value: fmt(content.areaPages), note: `${fmt(content.areaWriteups)} with a local write-up` },
          { label: 'Council pay pages', value: fmt(content.allowancePages), note: 'Councils that publish their rates' },
          { label: 'Guides', value: fmt(content.guides), note: 'Answers to carers’ questions' },
          { label: 'News stories', value: fmt(content.news), note: 'Sourced and dated' },
        ]} />
      </div>
      <p className="hq-foot">Counts are page loads, not unique people, and include repeat visits. No cookies are used and nothing personal is stored. Robots and test tools are not counted. Clicks from email apps often show as “typed or bookmarked” because those apps do not say where the click came from; our own emails are tagged, so they show as email.</p>
    </>
  );
}

const MAIL_DESK = 'Mail copy desk';
// Schedules as set on the scheduled tasks (UK time). `aka` lists other names a desk may have logged under.
interface Desk { name: string; when: string; job: string; aka?: string[] }
const ROSTER: { group: string; desks: Desk[] }[] = [
  { group: 'Leadership', desks: [
    { name: 'Chief of Staff', when: 'Weekdays 08:15, 12:45 and 17:45. Weekends 08:15', job: 'Runs the team, sets priorities, acts on what you say in chat, sends your evening brief' },
  ] },
  { group: 'Sales', desks: [
    { name: 'Outreach desk', when: 'Weekdays, hourly 09:12 to 17:12', job: 'Watches the emails you approved: records each send, cancels any that should not go' },
    { name: 'Inbox desk', when: 'Every day, hourly 07:36 to 18:36', job: 'Answers hello@ and the website forms, approves claims, adds logos sent by email' },
    { name: 'Closer desk', when: 'Weekdays, hourly 09:50 to 17:50', job: 'Follows warm leads through to a subscription' },
    { name: 'Sales desk', when: 'Weekdays 11:17', job: 'Nudges agencies that claimed a profile but have not upgraded' },
    { name: 'Lead research desk', when: 'Weekdays 09:47 and 14:47', job: 'Finds published addresses for agencies we cannot email yet' },
  ] },
  { group: 'Money', desks: [
    { name: 'Payments desk', when: 'Every day, hourly 08:03 to 21:03', job: 'Switches plans on and off from Stripe and updates the pinned listings' },
  ] },
  { group: 'Google and content', desks: [
    { name: 'Carer questions desk', when: 'Weekdays 09:47 and 13:47', job: 'One in-depth guide a run, each answering a question carers search for', aka: ['Allowances desk', 'Council allowances desk'] },
    { name: 'Guides desk', when: 'Mondays and Thursdays 14:41', job: 'Longer guides from its own list of topics' },
    { name: 'Area pages desk', when: 'Weekdays 10:52 and 15:52', job: 'Local write-ups for the “fostering agencies in” pages Google already shows' },
    { name: 'News desk', when: 'Weekdays 10:23', job: 'One sourced fostering story when there is real news' },
    { name: 'PR and links desk', when: 'Wednesdays 11:33', job: 'Pitches our data stories to press and charities for links', aka: ['PR desk'] },
  ] },
  { group: 'Reporting', desks: [
    { name: 'Weekly report', when: 'Mondays 08:07', job: 'Your weekly numbers by email', aka: ['Weekly report desk'] },
    { name: 'Partner reports', when: '1st of the month 09:37', job: 'Sends each paying agency its own figures', aka: ['Partner monthly report', 'Partner report'] },
    { name: 'Search Console reminder', when: 'Mondays 08:52', job: 'Asks you for the week’s Google export' },
    { name: MAIL_DESK, when: 'Every day, hourly at 6 minutes past', job: 'Copies every email sent and received into the Inbox tab', aka: ['Mail copy'] },
  ] },
];

const deskKey = (s: string) => s.toLowerCase().replace(/\b(fostering today|the|desk)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

export function TeamView({ d, team }: ViewProps) {
  if (!team) return <div className="hq-wait">Loading the team</div>;
  const pr = team.board.priorities;
  const fresh = (iso?: string) => Boolean(iso) && Date.now() - new Date(iso as string).getTime() < 26 * 3600000;
  const count = ROSTER.reduce((a, g) => a + g.desks.length, 0);
  // The newest log line for a desk, whatever spelling it logged under. The mail copy desk does not write to the
  // log, so its sign of life is the time the mailbox was last copied.
  const lastFor = (k: Desk) => {
    const want = [k.name, ...(k.aka || [])].map(deskKey);
    let best: { at: string; summary: string } | undefined;
    for (const [desk, l] of Object.entries(team.last)) if (want.includes(deskKey(desk)) && (!best || new Date(l.at) > new Date(best.at))) best = l;
    if (!best && k.name === MAIL_DESK && d.mail.mirrored_at) best = { at: d.mail.mirrored_at, summary: 'Mailbox copied to the Inbox tab.' };
    return best;
  };
  return (
    <>
      <div className="hq-section">
        <Readouts cols={3} items={[
          { label: 'Desks', value: fmt(count), note: 'On scheduled shifts, run by the Chief of Staff' },
          { label: 'Active in the last day', value: fmt(ROSTER.reduce((a, g) => a + g.desks.filter((k) => fresh(lastFor(k)?.at)).length, 0)), note: 'Desks that logged work in the last 26 hours' },
          { label: 'Open hand-offs', value: fmt(team.open_handoffs), note: 'Jobs one desk has passed to another', tone: team.open_handoffs ? undefined : 'quiet' },
        ]} />
      </div>
      {pr && (
        <div className="hq-section">
          <Panel title="This week’s priorities" meta={`Set by ${pr.updated_by}, ${ago(pr.updated_at)}`}><p className="hq-pre">{pr.body}</p></Panel>
        </div>
      )}
      <div className="hq-section">
        <h2>The desks</h2>
        <p className="hq-lede">A lit dot means the desk logged work in the last day. Some desks only log when there is something to do.</p>
        {ROSTER.map((g) => (
          <div key={g.group}>
            <p className="hq-group">{g.group}</p>
            <div className="hq-desks">
              {g.desks.map((k) => {
                const l = lastFor(k);
                return (
                  <article className="hq-desk" key={k.name} data-fresh={fresh(l?.at)}>
                    <h4>{k.name}</h4>
                    <p className="when">{k.when}</p>
                    <p className="job">{k.job}</p>
                    <p className="last">{l ? <><b>{ago(l.at)}:</b> {l.summary}</> : 'Nothing logged yet'}</p>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="hq-section">
        <Panel title="Latest activity" meta={d.mail.mirrored_at ? `Inbox copied ${clock(d.mail.mirrored_at)}` : undefined}>
          {team.recent.length === 0 ? <p className="hq-empty">The desks log here from their next run.</p> : (
            <ul className="hq-feed">
              {team.recent.map((r, i) => (
                <li key={i}>
                  <strong>{r.desk}</strong><span className="t">{ago(r.at)}</span>
                  <p>{r.summary}</p>
                  {r.handoff_to && <p className="ho">Passed to {r.handoff_to}: {r.handoff} {r.done_at ? '(done)' : '(open)'}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
