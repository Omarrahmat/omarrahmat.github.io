// Makes pictures of the agency portal as one member sees it after signing in, without using the network and without
// signing in as them. For when Omar asks what an agency sees (the workspace cannot open the website).
//
// What the pictures are made from:
//   - the portal page, its script and styles: the published files ("main" branch; see scripts/profile-picture.mjs)
//   - what the portal would load for that member, read with the database connector and saved as JSON:
//       { "email": "<member's address>", "provider_id": "<their profile>",
//         "events": [{day, kind, n}]      profile_events for the profile, last 60 days
//         "enquiries": [...], "subscriptions": [{tier, active_until}], "agency_settings": [{placement_areas, enquiry_email}] }
//   - the profile row and the logo copy, exactly as for scripts/profile-picture.mjs, and the same fonts
// The page is given a made-up sign-in that only exists inside this run. Nothing is sent anywhere.
//
// usage: node scripts/portal-picture.mjs <site dir> <fonts dir> <logo file> <profile json> <portal json> <out dir>
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const [site, gf, logoFile, profileFile, portalFile, outDir] = process.argv.slice(2);
const profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
const portal = JSON.parse(fs.readFileSync(portalFile, 'utf8'));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const fontFiles = {
  'Bricolage.ttf': path.join(gf, 'ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf'),
  'DMSans.ttf': path.join(gf, 'ofl/dmsans/DMSans[opsz,wght].ttf'),
  'DMSans-Italic.ttf': path.join(gf, 'ofl/dmsans/DMSans-Italic[opsz,wght].ttf'),
};
const fontCss = `
@font-face { font-family: 'Bricolage Grotesque'; font-style: normal; font-weight: 200 800; font-stretch: 75% 100%; src: url(https://fonts.gstatic.com/local/Bricolage.ttf) format('truetype'); }
@font-face { font-family: 'DM Sans'; font-style: normal; font-weight: 100 1000; src: url(https://fonts.gstatic.com/local/DMSans.ttf) format('truetype'); }
@font-face { font-family: 'DM Sans'; font-style: italic; font-weight: 100 1000; src: url(https://fonts.gstatic.com/local/DMSans-Italic.ttf) format('truetype'); }`;
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const seen = [];
const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(body) });

async function handle(route) {
  const req = route.request();
  const u = new URL(req.url());
  const note = (what) => seen.push(`${req.method()} ${u.hostname}${u.pathname} -> ${what}`);
  if (u.hostname === 'fosteringtoday.com') {
    let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(site, p);
    if (!f.startsWith(site) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { note('404'); return route.fulfill({ status: 404, body: 'not found' }); }
    return route.fulfill({ status: 200, contentType: types[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  }
  if (u.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', headers: cors, body: fontCss });
  if (u.hostname === 'fonts.gstatic.com') {
    const f = fontFiles[path.basename(u.pathname)];
    return f ? route.fulfill({ status: 200, contentType: 'font/ttf', headers: cors, body: fs.readFileSync(f) }) : route.abort();
  }
  if (u.hostname.endsWith('.supabase.co')) {
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (req.method() !== 'GET' && !u.pathname.startsWith('/rest/v1/rpc/')) { note('A WRITE, NOT ANSWERED'); return route.abort(); }
    const table = u.pathname.replace('/rest/v1/', '');
    if (table === 'rpc/link_my_claims') { note('their profile'); return json(route, [{ provider_id: portal.provider_id }]); }
    if (table === 'rpc/claimed_providers') { note('claimed'); return json(route, [portal.provider_id]); }
    if (table === 'profile_events') { note(`${portal.events.length} rows of figures`); return json(route, portal.events); }
    if (table === 'enquiries') { note(`${portal.enquiries.length} enquiries`); return json(route, portal.enquiries); }
    if (table === 'subscriptions') { note(`${portal.subscriptions.length} plan rows`); return json(route, portal.subscriptions); }
    if (table === 'agency_settings') { note(`${portal.agency_settings.length} settings rows`); return json(route, portal.agency_settings); }
    if (table === 'provider_profiles') { note('the profile row'); return json(route, [profile]); }
    if (u.pathname === `/storage/v1/object/public/provider-logos/${profile.logo_path}`) { note('the logo'); return route.fulfill({ status: 200, contentType: 'image/png', headers: cors, body: fs.readFileSync(logoFile) }); }
    note('NOT ANSWERED'); return route.abort();
  }
  if (u.hostname !== 'plausible.io') note('blocked');
  return route.abort();
}

const tabs = [['Overview', 'overview'], ['Area demand', 'area-demand'], ['Edit profile', 'edit-profile'], ['Enquiries', 'enquiries'], ['Plan and settings', 'plan-and-settings']];
const b = await chromium.launch();
const facts = {};
for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['computer', { width: 1280, height: 900 }]]) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, locale: 'en-GB', timezoneId: 'Europe/London' });
  await ctx.route('**/*', handle);
  // A sign-in that exists only in this run, so the portal opens as the member's own view.
  await ctx.addInitScript((email) => {
    localStorage.setItem('ft-portal-session', JSON.stringify({ access_token: 'picture-only', refresh_token: 'picture-only', expires_at: Math.floor(Date.now() / 1000) + 3000, user: { id: '00000000-0000-4000-8000-000000000000', email } }));
  }, portal.email);
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('https://fosteringtoday.com/portal/', { waitUntil: 'load' });
  await pg.waitForSelector('role=tab[name="Overview"]');
  await pg.evaluate(() => document.fonts.ready);
  facts[name] = { errors: errs, tabs: {} };
  let i = 1;
  for (const [label, slug] of tabs) {
    await pg.click(`role=tab[name="${label}"]`);
    await pg.waitForTimeout(900);
    await pg.waitForFunction(() => !document.querySelector('main')?.innerText.includes('Loading…'));
    if (label === 'Edit profile') await pg.waitForFunction(() => { const im = document.querySelector('img.logo-img'); return im && im.complete && im.naturalWidth > 0; });
    facts[name].tabs[label] = await pg.evaluate(() => document.querySelector('main').innerText.replace(/\s+/g, ' ').slice(0, 900));
    // From the top of the page to the end of the portal itself (the site footer is left off).
    const end = await pg.evaluate(() => Math.ceil(document.querySelector('main').getBoundingClientRect().bottom + window.scrollY));
    await pg.screenshot({ path: path.join(outDir, `${name}-${i}-${slug}.png`), fullPage: true, clip: { x: 0, y: 0, width: viewport.width, height: end } });
    i++;
  }
  facts[name].overflow = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(facts, null, 1));
console.log('requests answered or blocked:\n' + [...new Set(seen)].join('\n'));
