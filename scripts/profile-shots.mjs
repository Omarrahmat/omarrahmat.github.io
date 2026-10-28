// Renders a clean screenshot of every provider profile (for the launch emails) into public/previews/<id>.jpg.
// Run after `npm run build`. Needs playwright (a global install is fine: NODE_PATH=$(npm root -g)).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'out');
const dest = path.join(root, 'public', 'previews');
fs.mkdirSync(dest, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(out, p);
  if (!f.startsWith(out) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const B = `http://127.0.0.1:${server.address().port}`;
const providers = JSON.parse(fs.readFileSync(path.join(root, 'src/data/providers.json'), 'utf8'));
const ids = process.env.IDS_FILE ? new Set(JSON.parse(fs.readFileSync(process.env.IDS_FILE, 'utf8'))) : null;
const only = process.argv[2] ? providers.filter((p) => p.id === process.argv[2]) : ids ? providers.filter((p) => ids.has(p.id)) : providers;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 2 });
// Block web fonts and the marquee animation so every shot is identical and fast.
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();
let n = 0;
for (const p of only) {
  const file = path.join(dest, `${p.id}.jpg`);
  if (fs.existsSync(file) && !process.argv[2] && !ids) { n++; continue; }
  await page.goto(`${B}/agency/${p.id}/`, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '.marquee,.skip-link,body>header,header.site-header,.breadcrumbs,nav[aria-label="Breadcrumb"]{display:none !important} main{padding-top:0 !important} .section-tight{padding-top:18px !important}' });
  await page.screenshot({ path: file, type: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: 900, height: 600 } });
  n++;
  if (n % 50 === 0) console.log(`${n}/${only.length}`);
}
await browser.close();
server.close();
console.log(`Done: ${n} previews in public/previews/`);
