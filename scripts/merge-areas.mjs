// Compiles data/areas/<slug>.json (local write-ups for the "Fostering agencies in <area>" pages, written by the
// area pages desk) into src/data/area-guides.json. A record needs a slug, 2-5 paragraphs (150+ words in total, in
// our own words) and at least one https source. Rejected files are listed in data/areas-report.json.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'data/areas');
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const https = (u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
const accepted = [], rejected = [];
let files = [];
try { files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort(); } catch { /* none */ }
for (const file of files) {
  let g;
  try { g = JSON.parse(readFileSync(join(dir, file), 'utf8')); } catch (e) { rejected.push({ file, errors: [e.message] }); continue; }
  const errors = [];
  if (typeof g.slug !== 'string' || !SLUG.test(g.slug)) errors.push('slug');
  const paras = Array.isArray(g.paragraphs) ? g.paragraphs.filter((p) => typeof p === 'string' && p.trim()) : [];
  if (paras.length < 2 || paras.length > 5) errors.push('2 to 5 paragraphs');
  const words = paras.join(' ').split(/\s+/).length;
  if (words < 150) errors.push(`only ${words} words`);
  if (!DATE.test(String(g.updatedOn))) errors.push('updatedOn');
  const sources = Array.isArray(g.sources) ? g.sources.filter((s) => s && https(s.url) && typeof s.title === 'string') : [];
  if (sources.length < 1) errors.push('at least one https source');
  if (errors.length) { rejected.push({ file, slug: g.slug ?? null, errors }); continue; }
  accepted.push({ slug: g.slug, updatedOn: g.updatedOn, paragraphs: paras.map((p) => p.trim()), sources: sources.map((s) => ({ title: s.title.trim(), url: s.url })) });
}
writeFileSync(join(root, 'src/data/area-guides.json'), JSON.stringify(accepted, null, 2) + '\n');
writeFileSync(join(root, 'data/areas-report.json'), JSON.stringify({ accepted: accepted.length, rejected }, null, 2) + '\n');
console.log(`Accepted ${accepted.length} area write-ups, rejected ${rejected.length}.`);
