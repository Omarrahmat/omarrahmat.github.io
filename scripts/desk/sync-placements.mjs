// Writes data/placements.json from the live subscriptions. Input: a JSON file with an array of rows
// { provider_id, tier, active_until, placement_areas } (the desk gets them with one SQL query, see DESKS.md).
// Premium: pinned in every area the provider serves. Featured: the areas they chose in the portal (max 5, only
// areas they actually serve); until they choose, their first five served areas.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const providers = JSON.parse(fs.readFileSync(path.join(root, 'src/data/providers.json'), 'utf8'));
const byId = new Map(providers.map((p) => [p.id, p]));
const today = new Date().toISOString().slice(0, 10);
const out = { _comment: 'Written by scripts/desk/sync-placements.mjs from Supabase subscriptions. Do not edit by hand.' };
const report = [];
for (const r of rows) {
  if (!['featured', 'premium'].includes(r.tier)) continue;
  if (r.active_until && r.active_until < today) { report.push(`${r.provider_id}: expired ${r.active_until}`); continue; }
  const p = byId.get(r.provider_id);
  if (!p) { report.push(`${r.provider_id}: not in directory`); continue; }
  const served = [...new Set([...(p.areasServed || []), p.address?.town].filter(Boolean))];
  let areas;
  if (r.tier === 'premium') areas = [...served, p.nation];
  else {
    const chosen = (r.placement_areas || []).filter((a) => served.includes(a)).slice(0, 5);
    areas = chosen.length ? chosen : served.slice(0, 5);
  }
  out[r.provider_id] = { tier: r.tier, areas, ...(r.active_until ? { until: r.active_until } : {}) };
  report.push(`${r.provider_id}: ${r.tier} in ${areas.length} areas`);
}
fs.writeFileSync(path.join(root, 'data/placements.json'), JSON.stringify(out, null, 2) + '\n');
console.log(report.length ? report.join('\n') : 'No paid placements.');
