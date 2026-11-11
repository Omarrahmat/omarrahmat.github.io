// Makes a picture of one published profile page, as a visitor's browser shows it, without using the network.
// For when Omar asks to see a profile and the workspace cannot open websites (it cannot open fosteringtoday.com,
// the database's web address or the mailbox's file store; do not try to get round that).
//
// What the picture is made from:
//   - the page, its script and styles: the published files, i.e. the "main" branch of the site's repository
//       git fetch origin main && mkdir -p <site dir> && git archive origin/main | tar -x -C <site dir>
//   - the agency's own details: the row the public reads, saved as JSON with the keys about, logo_path, phone,
//     website, recruitment_url (read it with the database connector as the "anon" role; check md5(about))
//   - the logo: a copy of the stored logo, fetched as text through the database (supabase/functions/ft-logo-copy)
//   - the two typefaces: Google's own font repository
//       git clone --filter=blob:none --sparse https://github.com/google/fonts <fonts dir>
//       cd <fonts dir> && git sparse-checkout set ofl/bricolagegrotesque ofl/dmsans
// Nothing is sent anywhere: every request the page makes is answered here or dropped, and visits are not counted.
// Say plainly, when sending the picture, that it was drawn from the published files and live details.
//
// usage: node scripts/profile-picture.mjs <site dir> <fonts dir> <logo file> <profile json> <out dir> <provider id>
//        PHONE_HEIGHT / DESKTOP_HEIGHT add that many pixels below the agency's own section (default 0)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const [site, gf, logoFile, profileFile, outDir, pid] = process.argv.slice(2);
const profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
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
    if (u.pathname === '/rest/v1/provider_profiles') { note('the profile row'); return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify([profile]) }); }
    if (u.pathname === '/rest/v1/rpc/claimed_providers') { note('claimed'); return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify([pid]) }); }
    if (u.pathname === `/storage/v1/object/public/provider-logos/${profile.logo_path}`) { note('the logo'); return route.fulfill({ status: 200, contentType: 'image/png', headers: cors, body: fs.readFileSync(logoFile) }); }
    note('NOT ANSWERED'); return route.abort();
  }
  if (u.hostname !== 'plausible.io') note('blocked');
  return route.abort();
}

const b = await chromium.launch();
const url = `https://fosteringtoday.com/agency/${pid}/`;
const facts = {};
for (const [name, viewport, clipHeight] of [['phone', { width: 390, height: 844 }, Number(process.env.PHONE_HEIGHT || 0)], ['desktop', { width: 1280, height: 1000 }, Number(process.env.DESKTOP_HEIGHT || 0)]]) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, locale: 'en-GB', timezoneId: 'Europe/London' });
  await ctx.route('**/*', handle);
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForSelector('.claimed-sign');
  await pg.waitForSelector('img.logo-img');
  await pg.waitForFunction(() => { const i = document.querySelector('img.logo-img'); return i && i.complete && i.naturalWidth > 0; });
  await pg.waitForSelector('#about-h');
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(700);
  facts[name] = await pg.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent,
    sign: document.querySelector('.claimed-sign')?.innerText.replace(/\s+/g, ' '),
    notClaimedNotice: document.querySelectorAll('[data-unclaimed]').length,
    saysNotClaimed: document.body.innerText.includes('has not been claimed'),
    logo: (() => { const i = document.querySelector('img.logo-img'); const r = i.getBoundingClientRect(); return { natural: `${i.naturalWidth}x${i.naturalHeight}`, shown: `${Math.round(r.width)}x${Math.round(r.height)}`, alt: i.alt }; })(),
    initialsTileShown: [...document.querySelectorAll('[data-logo-hide]')].some((e) => e.style.display !== 'none'),
    from: document.querySelector('#about-h')?.parentElement?.innerText.replace(/\s+/g, ' ').slice(0, 520),
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.style}`),
    headingFont: getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0],
    pageHeight: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    errors: 0,
  }));
  facts[name].errors = errs;
  await pg.screenshot({ path: path.join(outDir, `${name}-full.png`), fullPage: true });
  // The picture to send: from the top of the page to just past the agency's own section (plus `clipHeight` more).
  const fromBottom = await pg.evaluate(() => Math.ceil(document.querySelector('#about-h').parentElement.getBoundingClientRect().bottom + window.scrollY));
  await pg.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true, clip: { x: 0, y: 0, width: viewport.width, height: fromBottom + clipHeight } });
  facts[name].pictureHeight = fromBottom + clipHeight;
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(facts, null, 1));
console.log('requests answered or blocked:\n' + [...new Set(seen)].join('\n'));
