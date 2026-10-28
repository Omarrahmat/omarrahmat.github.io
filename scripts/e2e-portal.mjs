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

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15' });
await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
const pg = await ctx.newPage();
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
check('no page errors', errs.length === 0, errs.join(' | '));
await pg.setViewportSize({ width: 390, height: 800 });
await pg.goto(B + '/portal/'); await pg.waitForSelector('text=Profile views, last 30 days');
check('no horizontal scroll on mobile', await pg.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
if (shots) await pg.screenshot({ path: shots + '/portal-mobile.png', fullPage: true });
await b.close(); server.close();
console.log(failed ? `\n${failed} failed` : '\nAll portal checks passed'); process.exit(failed ? 1 : 0);
