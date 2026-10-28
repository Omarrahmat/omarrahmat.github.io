// Compiles data/allowances/*.json (one council per file, researched by the allowances desk) into
// src/data/council-allowances.json. A record needs a slug, council, nation, year, retrievedOn, an https sourceUrl,
// at least one weekly allowance figure and a summary. Anything else is rejected and listed in data/allowances-report.json.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'data/allowances');
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR = /^\d{4}-\d{2}$/;
const NATIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'];
const https = (u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
const money = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 20 && n <= 2000;
const rows = (list, max) => (Array.isArray(list) ? list : [])
  .filter((r) => r && typeof r.label === 'string' && r.label.trim() && money(r.weekly))
  .slice(0, max)
  .map((r) => ({ label: r.label.trim(), weekly: Math.round(r.weekly * 100) / 100, note: typeof r.note === 'string' && r.note.trim() ? r.note.trim() : null }));

const accepted = [], rejected = [], seen = new Set();
let files = [];
try { files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort(); } catch { /* none */ }
for (const file of files) {
  let g;
  try { g = JSON.parse(readFileSync(join(dir, file), 'utf8')); } catch (e) { rejected.push({ file, errors: [e.message] }); continue; }
  const errors = [];
  if (typeof g.slug !== 'string' || !SLUG.test(g.slug)) errors.push('slug');
  if (typeof g.council !== 'string' || g.council.length < 4) errors.push('council');
  if (!NATIONS.includes(g.nation)) errors.push('nation');
  if (!YEAR.test(String(g.year))) errors.push('year (use 2026-27)');
  if (!DATE.test(String(g.retrievedOn))) errors.push('retrievedOn');
  if (!https(g.sourceUrl)) errors.push('sourceUrl must be https');
  if (typeof g.sourceTitle !== 'string' || !g.sourceTitle.trim()) errors.push('sourceTitle');
  const allowances = rows(g.allowances, 12);
  if (allowances.length === 0) errors.push('allowances: at least one {label, weekly} row with a weekly figure between 20 and 2000');
  const fees = rows(g.fees, 12);
  if (typeof g.summary !== 'string' || g.summary.trim().length < 60) errors.push('summary (60+ characters, your own words)');
  if (/\b(click here|lorem)\b/i.test(g.summary || '')) errors.push('summary wording');
  if (seen.has(g.slug)) errors.push('duplicate slug');
  if (errors.length) { rejected.push({ file, slug: g.slug ?? null, errors }); continue; }
  seen.add(g.slug);
  accepted.push({
    slug: g.slug,
    council: g.council.trim(),
    nation: g.nation,
    year: g.year,
    retrievedOn: g.retrievedOn,
    sourceUrl: g.sourceUrl,
    sourceTitle: g.sourceTitle.trim(),
    allowances,
    fees,
    feesNote: typeof g.feesNote === 'string' && g.feesNote.trim() ? g.feesNote.trim() : null,
    extras: (Array.isArray(g.extras) ? g.extras : []).filter((x) => typeof x === 'string' && x.trim()).slice(0, 8).map((x) => x.trim()),
    summary: g.summary.trim(),
    areaNames: (Array.isArray(g.areaNames) ? g.areaNames : []).filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()),
  });
}
accepted.sort((a, b) => a.council.localeCompare(b.council));
writeFileSync(join(root, 'src/data/council-allowances.json'), JSON.stringify(accepted, null, 2) + '\n');
writeFileSync(join(root, 'data/allowances-report.json'), JSON.stringify({ accepted: accepted.length, rejected }, null, 2) + '\n');
console.log(`Accepted ${accepted.length} council allowance records, rejected ${rejected.length}.`);
