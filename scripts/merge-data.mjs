// Merges raw research files (data/raw/*.json) into src/data/providers.json.
// Invalid records are rejected and listed in data/merge-report.json.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRecord } from './lib/validate.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = join(root, 'data', 'raw');
const outFile = join(root, 'src', 'data', 'providers.json');

const accepted = [];
const rejected = [];
const warnings = [];
const seenIds = new Set();
const seenSites = new Map();
const seenRefs = new Map();
// data/exclude.json: records kept out of the site pending verification: { "<id>": "<reason>" }
let excluded = new Map();
try { excluded = new Map(Object.entries(JSON.parse(readFileSync(join(root, 'data/exclude.json'), 'utf8')))); } catch { /* optional */ }

let files = [];
try { files = readdirSync(rawDir).filter((f) => f.endsWith('.json')).sort(); } catch { /* none yet */ }

// data/patches/*.json: follow-up research that adds fields to existing records (matched by id).
// A patch may set website, recruitmentUrl, phone, publicEnquiryEmail, regulatorReference, regulatorName,
// address parts, areasServed and fosteringTypes (merged), and must bring its own sources.
const patches = new Map();
const patchDir = join(root, 'data/patches');
let patchFiles = [];
try { patchFiles = readdirSync(patchDir).filter((f) => f.endsWith('.json') && !f.startsWith('todo-')).sort(); } catch { /* none */ }
for (const file of patchFiles) {
  let list;
  try { list = JSON.parse(readFileSync(join(patchDir, file), 'utf8')); } catch (e) {
    rejected.push({ file, id: null, errors: [`patch file is not valid JSON: ${e.message}`] });
    continue;
  }
  if (!Array.isArray(list)) continue;
  for (const p of list) {
    if (!p || typeof p.id !== 'string') continue;
    const prev = patches.get(p.id) || [];
    prev.push({ ...p, _file: file });
    patches.set(p.id, prev);
  }
}
const patchedIds = new Set();

// data/placements.json: paid placements by provider id (see docs). Expired ones are ignored.
let placements = {};
try { placements = JSON.parse(readFileSync(join(root, 'data/placements.json'), 'utf8')); } catch { /* optional */ }
const today = new Date().toISOString().slice(0, 10);
function placementFor(id) {
  const p = placements[id];
  if (!p || typeof p !== 'object' || !['featured', 'premium'].includes(p.tier)) return { tier: 'free', placementAreas: [] };
  if (typeof p.until === 'string' && p.until < today) return { tier: 'free', placementAreas: [] };
  return { tier: p.tier, placementAreas: Array.isArray(p.areas) ? p.areas.filter((a) => typeof a === 'string') : [] };
}

function applyPatches(raw) {
  const list = patches.get(raw?.id);
  if (!list) return raw;
  const out = JSON.parse(JSON.stringify(raw));
  for (const p of list) {
    if (!Array.isArray(p.sources) || p.sources.length === 0) {
      rejected.push({ file: p._file, id: p.id, errors: ['patch ignored: no sources'] });
      continue;
    }
    for (const k of ['website', 'recruitmentUrl', 'phone', 'publicEnquiryEmail', 'regulatorReference', 'regulatorName']) {
      if (p[k] != null && p[k] !== '') out[k] = p[k];
    }
    if (p.address && typeof p.address === 'object') {
      out.address = out.address || {};
      for (const k of ['line1', 'town', 'postcode']) if (p.address[k]) out.address[k] = p.address[k];
    }
    for (const k of ['areasServed', 'fosteringTypes']) {
      if (Array.isArray(p[k]) && p[k].length) out[k] = [...new Set([...(out[k] || []), ...p[k]])];
    }
    out.sources = [...(out.sources || []), ...p.sources];
    if (p.notes) out.notes = [out.notes, p.notes].filter(Boolean).join(' ');
    patchedIds.add(p.id);
  }
  return out;
}

for (const file of files) {
  let list;
  try { list = JSON.parse(readFileSync(join(rawDir, file), 'utf8')); } catch (e) {
    rejected.push({ file, id: null, errors: [`file is not valid JSON: ${e.message}`] });
    continue;
  }
  if (!Array.isArray(list)) { rejected.push({ file, id: null, errors: ['file must contain a JSON array'] }); continue; }

  for (const rawIn of list) {
    const raw = applyPatches(rawIn);
    const res = validateRecord(raw);
    if (!res.ok) { rejected.push({ file, id: raw?.id ?? null, errors: res.errors }); continue; }
    const rec = { ...res.record, ...placementFor(res.record.id) };
    if (seenIds.has(rec.id)) { rejected.push({ file, id: rec.id, errors: ['duplicate id'] }); continue; }
    if (excluded.has(rec.id)) { rejected.push({ file, id: rec.id, errors: [`excluded: ${excluded.get(rec.id)}`] }); continue; }
    // The same registration (regulator reference) is one record; otherwise the same site and name is.
    const ref = rec.regulatorReference ? `${rec.regulatorName}|${rec.regulatorReference}`.toLowerCase() : null;
    if (ref && seenRefs.has(ref)) { rejected.push({ file, id: rec.id, errors: [`duplicate of ${seenRefs.get(ref)} (same registration)`] }); continue; }
    const siteKey = (rec.website ? new URL(rec.website).hostname.replace(/^www\./, '') : 'nosite') + '|' + rec.name.toLowerCase();
    if (!ref && seenSites.has(siteKey)) { rejected.push({ file, id: rec.id, errors: [`duplicate of ${seenSites.get(siteKey)}`] }); continue; }
    seenIds.add(rec.id);
    if (ref) seenRefs.set(ref, rec.id);
    seenSites.set(siteKey, rec.id);
    accepted.push(rec);
    for (const w of res.warnings) warnings.push({ file, id: rec.id, warning: w });
  }
}

const order = { England: 0, Scotland: 1, Wales: 2, 'Northern Ireland': 3 };
accepted.sort((a, b) => order[a.nation] - order[b.nation] || a.name.localeCompare(b.name));

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(accepted, null, 2) + '\n');
writeFileSync(join(root, 'data', 'merge-report.json'), JSON.stringify({ accepted: accepted.length, rejected, warnings }, null, 2) + '\n');

const unmatched = [...patches.keys()].filter((id) => !patchedIds.has(id));
for (const id of unmatched) rejected.push({ file: 'patches', id, errors: ['patch has no matching record'] });
console.log(`Accepted ${accepted.length} records, rejected ${rejected.length}, ${warnings.length} field warnings, ${patchedIds.size} records patched.`);
if (rejected.length) console.log('See data/merge-report.json for rejected records.');
