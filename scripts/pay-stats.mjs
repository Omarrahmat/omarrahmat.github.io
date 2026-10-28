// Works out typical published weekly totals from data/pay-examples*.json and writes src/data/pay-examples.json
// (the cleaned table) and src/data/pay-stats.json (the medians the calculator and guide quote).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rows = [...JSON.parse(readFileSync(join(root, 'data/pay-examples.json'), 'utf8')), ...JSON.parse(readFileSync(join(root, 'data/pay-examples-2.json'), 'utf8'))];
const CHECKED = '2026-10-27';

// Keep rows with a weekly figure. Exclude stale pages (before 2024), allowance-only national scales and
// illustrative worked examples, which are not a service's published rate.
const stale = (r) => r.pageDate && r.pageDate < '2024-01-01';
const allowanceOnly = (r) => /allowance only|NMA only/i.test(r.basis || '') || /^HSC Northern Ireland|^Foster Wales \(national/.test(r.name);
const example = (r) => /example/i.test(r.name) || /worked example|one example|illustrative/i.test((r.basis || '') + ' ' + (r.notes || ''));
const usable = rows.filter((r) => (r.weekly_from || r.weekly_to) && !stale(r) && !allowanceOnly(r));
const forStats = usable.filter((r) => !example(r));

const median = (xs) => { const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b); if (!s.length) return null; const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const stat = (list) => ({ n: list.length, from: Math.round(median(list.map((r) => r.weekly_from))), to: Math.round(median(list.map((r) => r.weekly_to))), min: Math.min(...list.map((r) => r.weekly_from ?? r.weekly_to)), max: Math.max(...list.map((r) => r.weekly_to ?? r.weekly_from)) });

const agencies = forStats.filter((r) => r.type === 'agency');
const councils = forStats.filter((r) => r.type === 'council');
const stats = {
  checked: CHECKED,
  agency: stat(agencies),
  council: stat(councils),
  agencyEngland: stat(agencies.filter((r) => r.nation === 'England')),
  councilEngland: stat(councils.filter((r) => r.nation === 'England')),
  note: 'Medians of the "from" and "to" weekly figures each service publishes on its own website for one child, as checked on the date shown. Most services describe these as the carer fee and the child allowance combined; a few do not say.',
};
writeFileSync(join(root, 'src/data/pay-stats.json'), JSON.stringify(stats, null, 2) + '\n');

const table = usable.map((r) => ({ name: r.name, type: r.type, nation: r.nation, url: r.url, from: r.weekly_from ?? null, to: r.weekly_to ?? null, basis: r.basis || '', dependsOn: r.depends_on || '', pageDate: r.pageDate || null, example: example(r) }))
  .sort((a, b) => a.type.localeCompare(b.type) || a.nation.localeCompare(b.nation) || a.name.localeCompare(b.name));
writeFileSync(join(root, 'src/data/pay-examples.json'), JSON.stringify(table, null, 2) + '\n');
console.log(JSON.stringify(stats, null, 1));
