// Portal browser test with the Supabase API mocked. Run after a build with NEXT_PUBLIC_SUPABASE_* set.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }
const out = path.resolve(import.meta.dirname, '../out');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(out, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const B = `http://127.0.0.1:${server.address().port}`;
const shots = process.env.SHOTS || '';
let failed = 0;
const check = (n, ok, d = '') => { console.log(`${ok ? 'ok' : 'FAIL'} - ${n}${d ? ': ' + d : ''}`); if (!ok) failed++; };
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
const PID = 'abacus-fostering';
const calls = [];
const settingsPosts = [];
const visits = [];
let ownerOk = false;
let hqDown = false; // the full data feed (owner_hq) fails, so the dashboard must fall back to the basic one
let noGoogle = false; // no Search Console export loaded yet
const ukDay = (offset = 0) => new Date(Date.now() + offset * 86400000).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
const utcDay = (offset = 0) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const kw = (query, position, impressions, clicks = 0) => ({ query, position, impressions, clicks, prev_position: null });
const hqFeed = () => ({
  generated_at: new Date().toISOString(), days: 30,
  money: { mrr: 998, featured: 1, premium: 1, subs: [
    { provider_id: 'abacus-fostering', tier: 'featured', started_on: utcDay(-3), active_until: null, source: 'stripe' },
    { provider_id: 'zz-premium-agency', tier: 'premium', started_on: utcDay(-1), active_until: null, source: 'stripe' }] },
  payments: { total: 2, unmatched: 0, failed: 0, recent: [] },
  claims: { total: 3, approved: 2, waiting: 1, profiles: 2, members: 1, signed_in: 1, logos: 1, edited: 1, list: [
    { provider_id: 'abacus-fostering', provider_name: 'Abacus Fostering', requester_name: 'Jo Smith', requester_role: 'Registered Manager', status: 'approved', created_at: new Date().toISOString(), signed_in: true, has_logo: true, tier: 'featured' },
    { provider_id: 'second-agency', provider_name: 'Second Agency', requester_name: 'Sam Lee', requester_role: 'Director', status: 'approved', created_at: new Date().toISOString(), signed_in: false, has_logo: false, tier: null },
    { provider_id: 'third-agency', provider_name: 'Third Agency', requester_name: 'Pat Doe', requester_role: 'Owner', status: 'pending', created_at: new Date().toISOString(), signed_in: false, has_logo: false, tier: null }] },
  outreach: { total: 240, queued: 150, in_sequence: 85, completed: 0, replied: 2, bounced: 1, unsubscribed: 0, skipped: 2, emailed: 88, emailed_agencies: 60, emailed_councils: 28,
    step1: 50, step2: 35, step3: 0, sent_today: 12, scheduled: 84, next_send: new Date(Date.now() + 3600000).toISOString() },
  outreach_days: Array.from({ length: 20 }, (_, i) => ({ day: ukDay(i - 13), sent: i < 13 ? 10 : i === 13 ? 17 : 0, scheduled: i >= 13 ? 14 : 0 })),
  mail: { outreach_sent: 147, received: 9, sent: 160, mirrored_at: new Date().toISOString(), latest_in: [] },
  forms: { enquiries: 4, enquiries_total: 4, contact_requests: 1, corrections: 0, newsletter_active: 5, sales_touches: 1 },
  traffic: { entries: 120, prev_entries: 60, today: 9, pageviews: 400, search: 50, email: 30,
    by_source: [{ source: 'google', medium: 'search', n: 50 }, { source: 'outreach', medium: 'email', n: 30 }, { source: 'direct', medium: 'none', n: 40 }],
    by_day: Array.from({ length: 30 }, (_, i) => ({ day: utcDay(i - 29), entries: i, search: Math.floor(i / 2), email: Math.floor(i / 4), pageviews: i * 3 })),
    top_landing: [{ landing: '/fostering-allowance/kent/', n: 20 }], top_search_landing: [{ landing: '/fostering-allowance/kent/', n: 15 }] },
  profiles: { by_kind: { view: 90, impression: 200, crawler: 30, website_click: 4 }, top_viewed: [{ provider_id: 'abacus-fostering', n: 9 }] },
  areas: [{ area: 'croydon', n: 7 }],
  google: noGoogle ? null : { snapshot: utcDay(-2), prev_snapshot: null, range_start: utcDay(-10), range_end: utcDay(-4), loaded_at: new Date().toISOString(),
    totals: { clicks: 3, impressions: 1628, ctr: 0.18, position: 55.3 },
    daily: Array.from({ length: 7 }, (_, i) => ({ day: utcDay(i - 10), clicks: i === 6 ? 3 : 0, impressions: 100 + i * 40, position: 60 - i })),
    keywords: 584, pages: 480, ladder: { page1: 8, page2: 25, page3: 16, deeper: 535 }, prev_ladder: null,
    top_queries: [kw('foster care wales', 76.9, 22), kw('fostering agencies kent', 12.4, 7)],
    best_queries: [kw('abacus fostering reviews', 6, 3, 1), kw('fostering agencies kent', 12.4, 7), kw('fostering in bexhill', 15.5, 4)],
    top_pages: [{ page: '/fostering-agencies/kent/', clicks: 1, impressions: 40, position: 56.3, prev_position: null }],
    page_types: [{ kind: 'Area pages', pages: 148, clicks: 1, impressions: 970, position: 58.4 }],
    countries: [{ name: 'United Kingdom', clicks: 3, impressions: 1465, position: 54 }], devices: [{ name: 'Mobile', clicks: 1, impressions: 565, position: 50 }] },
});

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15' });
await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
const pg = await ctx.newPage();
// Block every request that is not to the built site under test (fonts, analytics), so an outside host
// cannot stall page.goto and fail the build. The Supabase mock below is registered after this, so it wins.
await pg.route((u) => u.origin !== B, (route) => route.abort('blockedbyclient'));
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
let events = []; const today = new Date().toISOString().slice(0, 10);
for (let i = 0; i < 10; i++) events.push({ day: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), kind: 'view', n: 3 + i });
events.push({ day: today, kind: 'website_click', n: 2 });
let enq = [{ id: 'e1', name: 'Sam Carer', email: 'sam@example.org', phone: '07000 000000', postcode: 'CR0 1AA', best_time: 'Evening', message: 'Interested in short-term fostering.', status: 'new', created_at: new Date().toISOString() }];
let profile = null; let tier = 'featured';
await pg.route(/supabase\.co/, async (route) => {
  const u = new URL(route.request().url()); const m = route.request().method(); calls.push(`${m} ${u.pathname}${u.search}`);
  if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  if (u.pathname === '/auth/v1/otp') return json(route, {});
  if (u.pathname === '/auth/v1/verify') { const b = JSON.parse(route.request().postData()); return b.token === '123456' ? json(route, { access_token: 'tok', refresh_token: 'r', expires_in: 3600, user: { id: 'u1', email: b.email } }) : json(route, { msg: 'bad' }, 403); }
  if (u.pathname.endsWith('/rpc/link_my_claims')) return json(route, [{ provider_id: PID }]);
  if (u.pathname.endsWith('/rpc/track_event')) return json(route, null, 204);
  if (u.pathname.endsWith('/rpc/track_visit')) { visits.push(JSON.parse(route.request().postData())); return json(route, null, 204); }
  if (u.pathname.endsWith('/rpc/owner_mail')) return json(route, { mirrored_at: new Date().toISOString(), counts: { all: 2, in: 1, out: 1, outreach: 1 }, messages: [
    { message_id: 'm1', thread_id: 't1', at: new Date().toISOString(), direction: 'in', from_addr: 'Jo <jo@agency.example>', to_addrs: 'hello@fosteringtoday.com', subject: 'Featured for Kent?', preview: 'How much is Featured for Kent?', labels: ['received'] },
    { message_id: 'm2', thread_id: 't2', at: new Date().toISOString(), direction: 'out', from_addr: 'hello@fosteringtoday.com', to_addrs: 'info@abacus.example', subject: 'Abacus Fostering: your profile is live', preview: 'Hello Abacus', labels: ['sent', 'outreach'] }] });
  if (u.pathname.endsWith('/rpc/owner_mail_message')) return json(route, { message_id: 'm1', at: new Date().toISOString(), direction: 'in', from_addr: 'Jo <jo@agency.example>', to_addrs: 'hello@fosteringtoday.com', subject: 'Featured for Kent?', body_text: 'How much is Featured for Kent? We recruit in Medway too.', labels: ['received'] });
  if (u.pathname.endsWith('/rpc/owner_team')) return ownerOk ? json(route, { board: { priorities: { body: '1. First paying partner.', updated_at: new Date().toISOString(), updated_by: 'Chief of Staff' } }, last: { 'Outreach desk': { at: new Date().toISOString(), summary: 'Sent 3 launch emails' } }, recent: [{ at: new Date().toISOString(), desk: 'Outreach desk', summary: 'Sent 3 launch emails', handoff_to: null, handoff: null, done_at: null }], open_handoffs: 0 }) : json(route, { message: 'not allowed' }, 400);
  if (u.pathname.endsWith('/rpc/owner_hq')) {
    if (!ownerOk) return json(route, { message: 'not allowed' }, 400);
    return hqDown ? json(route, { message: 'function failed' }, 500) : json(route, hqFeed());
  }
  if (u.pathname.endsWith('/rpc/owner_dashboard')) {
    if (!ownerOk) return json(route, { message: 'not allowed' }, 400);
    return json(route, { generated_at: new Date().toISOString(), days: 30, money: { mrr: 998, featured: 1, premium: 1 }, payments: { total: 2, unmatched: 0, failed: 0 },
      outreach: { queued: 150, sent: 30, replied: 2, bounced: 1, unsubscribed: 0, completed: 0, emailed: 33, sent_today: 12 },
      pipeline: { claims: 3, claims_approved: 2, members: 2, enquiries: 4, contact_requests: 1, newsletter_active: 5, sales_touches: 1 },
      traffic: { entries: 120, pageviews: 400, by_source: [{ source: 'google', medium: 'search', n: 50 }, { source: 'outreach', medium: 'email', n: 30 }, { source: 'direct', medium: 'none', n: 40 }],
        by_day: Array.from({ length: 30 }, (_, i) => ({ day: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10), entries: i, search: Math.floor(i / 2), pageviews: i * 3 })),
        top_landing: [{ landing: '/fostering-allowance/kent/', n: 20 }], top_search_landing: [{ landing: '/fostering-allowance/kent/', n: 15 }] },
      profiles: { by_kind: { view: 90, impression: 200, crawler: 30, website_click: 4 }, top_viewed: [{ provider_id: 'abacus-fostering', n: 9 }] }, areas: [{ area: 'croydon', n: 7 }] });
  }
  if (u.pathname.endsWith('/profile_events')) return json(route, events);
  if (u.pathname.endsWith('/subscriptions')) return json(route, [{ tier, active_until: null }]);
  if (u.pathname.endsWith('/enquiries')) { if (m === 'PATCH') { enq[0].status = 'contacted'; return json(route, null, 204); } return json(route, enq); }
  if (u.pathname.endsWith('/provider_profiles')) { if (m === 'POST') { profile = { ...(profile || {}), ...JSON.parse(route.request().postData()) }; return json(route, null, 201); } return json(route, profile ? [profile] : []); }
  if (u.pathname.endsWith('/area_searches')) return json(route, [{ day: today, area: 'croydon', n: 7 }, { day: today, area: 'leeds', n: 3 }]);
  if (u.pathname.endsWith('/agency_settings')) { if (m === 'POST') { settingsPosts.push(JSON.parse(route.request().postData())); return json(route, null, 201); } return json(route, []); }
  if (u.pathname.includes('/storage/v1/object/provider-logos')) return json(route, { Key: 'x' });
  return json(route, []);
});
await pg.goto(B + '/portal/');
check('portal shows sign-in', (await pg.locator('text=Email me a code').count()) === 1);
check('portal is noindex', (await pg.locator('meta[name=robots]').getAttribute('content')) === 'noindex');
await pg.fill('#pe', 'Team@Abacus.example');
await pg.click('text=Email me a code');
await pg.waitForSelector('#pc');
check('otp requested for lower-cased email', calls.some((c) => c.includes('/auth/v1/otp')));
await pg.fill('#pc', '000000'); await pg.click('button:has-text("Sign in")');
await pg.waitForSelector('[role=alert]');
check('wrong code shows error', (await pg.locator('[role=alert]').innerText()).includes('did not work'));
await pg.fill('#pc', '123456'); await pg.click('button:has-text("Sign in")');
await pg.waitForSelector('text=Profile views, last 30 days');
check('dashboard loads', (await pg.locator('h2', { hasText: 'Abacus' }).count()) >= 1);
check('stats total views', (await pg.locator('text=Profile views').first().count()) === 1);
if (shots) await pg.screenshot({ path: shots + '/portal-overview.png', fullPage: true });
await pg.click('role=tab[name="Enquiries"]');
await pg.waitForSelector('text=Sam Carer');
await pg.click('text=Mark as contacted');
await pg.waitForSelector('.tag:has-text("contacted")');
check('enquiry can be marked contacted', true);
await pg.click('role=tab[name="Edit profile"]');
await pg.fill('#ab', 'We are a friendly agency in Croydon.');
await pg.fill('#wb', 'not a url');
await pg.click('text=Save changes');
await pg.waitForSelector('[role=alert]');
check('bad URL rejected before saving', !profile);
await pg.fill('#wb', 'https://abacus.example');
await pg.click('text=Save changes');
await pg.waitForSelector('[role=status]');
check('profile saved', profile?.about?.startsWith('We are') && profile.website === 'https://abacus.example');
if (shots) await pg.screenshot({ path: shots + '/portal-edit.png', fullPage: true });
await pg.setInputFiles('#lg', { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
await pg.waitForFunction(() => document.querySelector('img.logo-img'));
check('logo upload stores path', /^abacus-fostering\/logo-\d+\.png$/.test(profile?.logo_path || ''));
// plan tab: featured partner picks pinned areas
await pg.click('role=tab[name="Plan and settings"]');
await pg.waitForSelector('text=Choose up to five areas');
const boxes = pg.locator('fieldset input[type=checkbox]');
check('featured sees area picker', (await boxes.count()) >= 5);
for (let i = 0; i < 6; i++) { const bx = boxes.nth(i); if (await bx.isEnabled()) await bx.check(); }
check('area picker caps at five', (await pg.locator('fieldset input[type=checkbox]:checked').count()) === 5);
await pg.click('text=Save areas'); await pg.waitForSelector('text=Your pinned areas update');
check('chosen areas saved', settingsPosts.some((b) => Array.isArray(b.placement_areas) && b.placement_areas.length === 5));
check('premium upgrade link carries profile id', ((await pg.locator('a:has-text("Move to Premium")').getAttribute('href')) || '').includes('client_reference_id=abacus-fostering'));
tier = 'free';
await pg.click('role=tab[name="Overview"]'); await pg.click('role=tab[name="Plan and settings"]');
await pg.waitForSelector('text=Upgrade to Featured');
const fl = (await pg.locator('a:has-text("Upgrade to Featured")').getAttribute('href')) || '';
check('free sees upgrade links with id and email', fl.startsWith('https://buy.stripe.com/') && fl.includes('client_reference_id=abacus-fostering') && fl.includes('prefilled_email=team%40abacus.example'));
if (shots) await pg.screenshot({ path: shots + '/portal-plan.png', fullPage: true });
tier = 'featured';
await pg.click('role=tab[name="Overview"]');
await pg.click('role=tab[name="Area demand"]');
await pg.waitForSelector('text=Area demand report: Premium');
check('non-premium sees upgrade note, no data', (await pg.locator('text=Busiest areas across the UK').count()) === 0);
tier = 'premium';
await pg.click('role=tab[name="Overview"]'); await pg.click('role=tab[name="Area demand"]');
await pg.waitForSelector('text=Busiest areas across the UK');
check('premium sees area demand', (await pg.locator('text=Croydon').count()) >= 1);
// directory search is counted by place name only
const before = calls.filter((c) => c.includes('rpc/track_search')).length;
await pg.goto(B + '/find-an-agency/?q=croydon'); await pg.waitForTimeout(2600);
check('search for a known place is counted', calls.filter((c) => c.includes('rpc/track_search')).length > before);
const b2 = calls.filter((c) => c.includes('rpc/track_search')).length;
await pg.goto(B + '/find-an-agency/?q=zzzz+qqqq'); await pg.waitForTimeout(2600);
check('free-text search is not counted', calls.filter((c) => c.includes('rpc/track_search')).length === b2);
// public profile overlay + tracking
await pg.goto(B + `/agency/${PID}/`);
await pg.waitForSelector('text=From Abacus');
check('public profile shows agency text', (await pg.locator('text=friendly agency in Croydon').count()) === 1);
check('public profile shows agency logo', (await pg.locator('img.logo-img').count()) === 1);
check('view event recorded', calls.some((c) => c.includes('rpc/track_event')));
check('page visits are counted with their source', visits.length > 0 && visits.every((v) => v.p_source && v.p_landing && v.p_landing.startsWith('/')));
// owner dashboard
await pg.goto(B + '/hq/?utm_source=outreach&utm_medium=email');
await pg.waitForSelector('[role=alert]');
check('non-owner is refused the owner dashboard', (await pg.locator('text=does not have access').count()) === 1);
check('utm-tagged arrival recorded as email', visits.some((v) => v.p_source === 'outreach' && v.p_medium === 'email' && v.p_entry === true));
ownerOk = true;
await pg.reload(); await pg.waitForSelector('.hq-readouts');
const hqText = () => pg.locator('.hq').innerText();
const cell = async (label) => ((await pg.locator('.hq-cell', { hasText: label }).first().innerText()) || '').replace(/\s+/g, ' ');
check('owner dashboard hides the public header and footer', !(await pg.locator('.site-header').isVisible()) && !(await pg.locator('.site-footer').isVisible()));
check('owner dashboard shows revenue against the target', (await pg.locator('.hq-gauge', { hasText: 'Monthly revenue' }).innerText()).includes('£998') && (await hqText()).includes('£10,000'));
check('owner dashboard shows the pipeline from listed to subscribed', (await pg.locator('.hq-steps li').count()) === 5 && /Claimed/i.test(await pg.locator('.hq-steps').innerText()));
check('owner dashboard counts subscriptions and claimed profiles', /Subscriptions 2 1 Featured, 1 Premium/i.test(await cell('Subscriptions')) && /Profiles claimed 2 1 more waiting/i.test(await cell('Profiles claimed')));
check('emails sent today uses the newer of the two records', /Emails sent today 17 ?of/i.test(await cell('Emails sent today')));
check('owner dashboard shows Google position and page-one keywords', /55\.3/.test(await cell('Google position')) && /Keywords on page 1 8 25 more on page 2, of 584/i.test(await cell('Keywords on page 1')));
check('overview lists the newest claims', (await pg.locator('td', { hasText: 'Abacus Fostering' }).count()) >= 1);
await pg.waitForSelector('text=Sent 3 launch emails');
await pg.click('role=tab[name="Sales"]'); await pg.waitForSelector('text=Where each service is');
const sales = await hqText();
check('sales tab lists subscriptions, claims and outreach stages', /Abacus Fostering\s+Featured/.test(sales) && sales.includes('£799') && /Jo Smith, Registered Manager/.test(sales) && /Signed in/i.test(sales) && /Waiting for the first email\s+150/.test(sales) && /Services emailed/i.test(sales));
await pg.click('role=tab[name="Google"]'); await pg.waitForSelector('text=Where our keywords sit');
const goog = await hqText();
check('google tab shows keyword rankings by page', /fostering agencies kent\s+12\.4\s*page 2/i.test(goog) && /abacus fostering reviews\s+6\.0\s*page 1/i.test(goog) && /Page 4 and beyond\s+535/i.test(goog) && goog.includes('1,628'));
await pg.click('role=tab[name="Visitors"]'); await pg.waitForSelector('text=Where visitors come from');
const vis = await hqText();
check('visitors tab shows sources and landing pages', /google\s+search engine\s+50/i.test(vis) && vis.includes('/fostering-allowance/kent/') && /Croydon\s+7/.test(vis));
await pg.click('role=tab[name="Team"]'); await pg.waitForSelector('text=The desks');
const teamText = await hqText();
check('team tab shows the desks, priorities and latest work', /Chief of Staff/i.test(teamText) && teamText.includes('First paying partner') && teamText.includes('Sent 3 launch emails') && (await pg.locator('.hq-desk').count()) >= 15 && (await pg.locator('.hq-desk[data-fresh=true]', { hasText: 'Outreach desk' }).count()) === 1);
await pg.click('role=tab[name="Inbox"]');
await pg.waitForSelector('text=Featured for Kent?');
await pg.click('text=Featured for Kent?');
await pg.waitForSelector('text=We recruit in Medway too.');
check('owner inbox lists and opens emails', (await pg.locator('a:has-text("Reply from my email app")').getAttribute('href')).startsWith('mailto:jo@agency.example'));
if (shots) await pg.screenshot({ path: shots + '/hq-inbox.png', fullPage: true });
await pg.click('text=Back to inbox'); await pg.click('role=tab[name="Overview"]');
check('owner dashboard is noindex', (await pg.locator('meta[name=robots]').getAttribute('content')) === 'noindex');
if (shots) await pg.screenshot({ path: shots + '/hq.png', fullPage: true });
// no Search Console export loaded: the Google tab says so instead of showing empty tables
noGoogle = true; await pg.reload(); await pg.waitForSelector('.hq-readouts');
await pg.click('role=tab[name="Google"]');
check('google tab explains when no export is loaded', (await pg.locator('text=No Search Console data loaded yet').count()) === 1);
noGoogle = false;
// the full data feed is down: the dashboard falls back to the basic figures and says so
hqDown = true; await pg.reload(); await pg.waitForSelector('.hq-readouts');
check('dashboard falls back to the basic figures when the full feed fails', (await pg.locator('text=Showing the basic figures only').count()) === 1 && (await pg.locator('.hq-gauge', { hasText: 'Monthly revenue' }).innerText()).includes('£998'));
hqDown = false;
check('no page errors', errs.length === 0, errs.join(' | '));
await pg.setViewportSize({ width: 390, height: 800 });
await pg.goto(B + '/portal/'); await pg.waitForSelector('text=Profile views, last 30 days');
check('no horizontal scroll on mobile', await pg.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await pg.goto(B + '/hq/'); await pg.waitForSelector('.hq-readouts');
const wide = [];
for (const t of ['Overview', 'Sales', 'Google', 'Visitors', 'Team', 'Inbox']) {
  await pg.click(`role=tab[name="${t}"]`); await pg.waitForTimeout(150);
  if (!(await pg.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))) wide.push(t);
}
check('owner dashboard fits a phone on every tab', wide.length === 0, wide.join(', '));
await pg.click('role=tab[name="Overview"]');
if (shots) await pg.screenshot({ path: shots + '/hq-mobile.png', fullPage: true });
if (shots) await pg.screenshot({ path: shots + '/portal-mobile.png', fullPage: true });
await b.close(); server.close();
console.log(failed ? `\n${failed} failed` : '\nAll portal checks passed'); process.exit(failed ? 1 : 0);
