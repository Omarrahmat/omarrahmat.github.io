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

// Councils that do not publish a usable current scale (data/allowances/_not-published.txt, one line each:
// "<provider id>, <date checked>, <our private note>"). Each gets a page saying so neutrally, with the national
// minimum, typical council figures and a link to the council's own fostering service (12 Nov 2026). The private note
// is never published. Northern Ireland trusts are left out (they pay the regional scale). A council that later
// publishes a scale gets the normal page instead, because published slugs win.
{
  const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const placeOf = (s) => s.replace(/^(London Borough of|Royal Borough of|City of)\s+/i, '').replace(/\s+Borough$/i, '').replace(/\s*\(.*\)$/, '').trim();
  let providers = [];
  try { providers = JSON.parse(readFileSync(join(root, 'src/data/providers.json'), 'utf8')); } catch { /* none */ }
  const byId = new Map(providers.map((p) => [p.id, p]));
  const published = new Set(accepted.map((a) => a.slug));
  const latest = new Map();
  let lines = [];
  try { lines = readFileSync(join(dir, '_not-published.txt'), 'utf8').split('\n'); } catch { /* none */ }
  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [id, date] = line.split(',').map((x) => x.trim());
    if (!id || !DATE.test(date || '')) continue;
    if (!latest.has(id) || latest.get(id) < date) latest.set(id, date);
  }
  const noScale = [];
  const seenSlugs = new Set();
  for (const [id, checked] of latest) {
    const p = byId.get(id);
    if (!p || p.providerType !== 'local_authority' || !['England', 'Scotland', 'Wales'].includes(p.nation)) continue;
    if (/nottingham|notts/i.test(id + ' ' + p.name)) continue; // Omar: no Nottingham or Notts
    const formal = (p.areasServed[0] || '').split('/')[0].trim();
    const place = placeOf(formal);
    const slug = slugify(place);
    if (!place || !slug || published.has(slug) || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);
    noScale.push({
      slug, place, formal, providerId: p.id, providerName: p.name, nation: p.nation, checked,
      website: p.recruitmentUrl || p.website || null, phone: p.phone || null,
      areaNames: [...new Set([place, ...p.areasServed.map((a) => placeOf(a))])],
    });
  }
  noScale.sort((a, b) => a.place.localeCompare(b.place));
  writeFileSync(join(root, 'src/data/council-noscale.json'), JSON.stringify(noScale, null, 2) + '\n');
  console.log(`Councils without a published scale: ${noScale.length} pages.`);
}
