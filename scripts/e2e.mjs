// Browser smoke test of the built site in out/. Needs playwright (global install is fine: NODE_PATH=$(npm root -g)).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const out = path.resolve(import.meta.dirname, '../out');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(out, p);
  if (!f.startsWith(out) || !fs.existsSync(f)) { res.writeHead(404); return res.end(fs.readFileSync(path.join(out, '404.html'))); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const B = `http://127.0.0.1:${server.address().port}`;
const providers = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../src/data/providers.json'), 'utf8'));
const sample = providers[0];

let failed = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok' : 'FAIL'} - ${name}${detail ? ': ' + detail : ''}`); if (!ok) failed++; };

const b = await chromium.launch();
for (const viewport of [{ width: 1360, height: 900 }, { width: 390, height: 800 }]) {
  const pg = await b.newPage({ viewport });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) errs.push(m.text()); });
  const tag = `${viewport.width}px`;

  await pg.goto(B + '/');
  check(`home renders (${tag})`, (await pg.locator('h1').count()) === 1);
  check(`no horizontal scroll (${tag})`, await pg.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

  await pg.goto(B + '/find-an-agency/');
  await pg.waitForTimeout(300);
  const firstPage = Math.min(24, providers.length);
  check(`directory shows first page (${tag})`, (await pg.locator('article').count()) === firstPage, `${await pg.locator('article').count()} of ${firstPage}`);
  check(`result count says ${providers.length} (${tag})`, (await pg.locator('.result-count').innerText()).startsWith(String(providers.length)));
  check(`A-Z index links every provider (${tag})`, (await pg.locator('.index-list a').count()) === providers.length);
  if (providers.length > 24) {
    await pg.click('text=Show more');
    await pg.waitForTimeout(200);
    check(`show more adds a page (${tag})`, (await pg.locator('article').count()) === Math.min(48, providers.length));
  }
  const town = sample.address.town || sample.name.split(' ')[0];
  await pg.goto(B + '/find-an-agency/?q=' + encodeURIComponent(town));
  await pg.waitForTimeout(300);
  const n = await pg.locator('article').count();
  check(`search for "${town}" narrows results (${tag})`, n >= 1 && n < providers.length, `${n}`);
  await pg.fill('#d-q', 'zzzz-no-such-place');
  await pg.waitForTimeout(200);
  check(`empty search state (${tag})`, (await pg.locator('article').count()) === 0);

  await pg.goto(B + `/agency/${sample.id}/`);
  check(`profile renders (${tag})`, (await pg.locator('h1').innerText()).includes(sample.name.slice(0, 10)));
  const ld = await pg.locator('script[type="application/ld+json"]').allTextContents();
  check(`profile has site and provider JSON-LD (${tag})`, ld.length === 2 && ld.some((x) => x.includes('"WebSite"')) && ld.some((x) => x.includes(sample.name.slice(0, 8))), `${ld.length} blocks`);
  // When Supabase is configured the form posts there; answer the request here so the test needs no network,
  // and check the exact payload (consent and the default status the insert policy requires).
  const live = /supabase\.co\/rest\/v1\//;
  let posted = null;
  await pg.route(live, async (route) => {
    const req = route.request();
    posted = { table: req.url().split('/rest/v1/')[1], apikey: req.headers()['apikey'], body: JSON.parse(req.postData() || '{}') };
    await route.fulfill({ status: 201, body: '' });
  });
  await pg.fill('textarea >> nth=0', 'Test correction');
  await pg.check('input[name=consent]');
  await pg.click('button[type=submit]');
  await pg.waitForTimeout(400);
  const bodyText = await pg.locator('body').innerText();
  if (posted) {
    check(`correction form posts to Supabase (${tag})`, posted.table === 'correction_requests' && !!posted.apikey && posted.body.consent_given === true && posted.body.provider_id === sample.id && posted.body.what_is_wrong === 'Test correction', JSON.stringify(posted));
    check(`correction form shows success, not demo notice (${tag})`, bodyText.includes('Thank') && !bodyText.includes('Demo mode'));
  } else {
    check(`correction form submits in demo mode (${tag})`, bodyText.includes('Demo mode'));
  }
  await pg.unroute(live);

  await pg.goto(B + `/claim/?provider=${sample.id}`);
  await pg.waitForTimeout(300);
  check(`claim form pre-fills provider (${tag})`, (await pg.inputValue('input[list]')) === sample.name);

  await pg.goto(B + '/contact/?plan=featured');
  await pg.waitForTimeout(300);
  check(`contact form pre-selects plan (${tag})`, (await pg.inputValue('select')) === 'Featured Agency');

  const articles = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../src/data/articles.json'), 'utf8'));
  if (articles.length) {
    await pg.goto(B + '/news/');
    check(`news index lists stories (${tag})`, (await pg.locator('.story-card').count()) === articles.length);
    await pg.goto(B + `/news/${articles[0].slug}/`);
    check(`article renders with sources (${tag})`, (await pg.locator('h1').count()) === 1 && (await pg.locator('.story-sources a').count()) >= 1);
    check(`banner shows headlines (${tag})`, (await pg.locator('.marquee a').count()) >= 2);
  }
  for (const p of ['/packages/', '/guides/', '/payments/', '/news/', '/legal/privacy/']) {
    await pg.goto(B + p);
    check(`${p} renders (${tag})`, (await pg.locator('h1').count()) === 1);
  }
  check(`no page errors (${tag})`, errs.length === 0, errs.join(' | ').slice(0, 300));
  const r = await pg.goto(B + '/no-such-page/');
  check(`404 page (${tag})`, r.status() === 404 && (await pg.locator('h1').innerText()).includes('not found'));
  await pg.close();
}
await b.close();
server.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
