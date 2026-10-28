// Compiles data/guides/*.json into src/data/guides.json. A guide needs a slug, title, standfirst, 3+ sections,
// 3+ https sources and at least 1,000 words; anything else is rejected and listed in data/guides-report.json.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'data/guides');
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const https = (u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
let excluded = {};
try { excluded = JSON.parse(readFileSync(join(root, 'data/guides-exclude.json'), 'utf8')); } catch { /* optional */ }

const accepted = [], rejected = [];
let files = [];
try { files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort(); } catch { /* none */ }
for (const file of files) {
  let g;
  try { g = JSON.parse(readFileSync(join(dir, file), 'utf8')); } catch (e) { rejected.push({ file, errors: [e.message] }); continue; }
  const errors = [];
  if (typeof g.slug !== 'string' || !SLUG.test(g.slug)) errors.push('slug');
  if (typeof g.title !== 'string' || g.title.length < 10) errors.push('title');
  if (typeof g.standfirst !== 'string' || g.standfirst.length < 20) errors.push('standfirst');
  if (!DATE.test(String(g.updatedOn))) errors.push('updatedOn');
  const sections = Array.isArray(g.sections) ? g.sections.filter((s) => s && typeof s.heading === 'string' && Array.isArray(s.paragraphs)) : [];
  if (sections.length < 3) errors.push('sections');
  const words = sections.flatMap((s) => [...s.paragraphs, ...(s.bullets || [])]).join(' ').split(/\s+/).length;
  if (words < 1000) errors.push(`only ${words} words`);
  const sources = Array.isArray(g.sources) ? g.sources.filter((s) => s && https(s.url) && typeof s.title === 'string') : [];
  if (sources.length < 3) errors.push('fewer than 3 valid sources');
  if (excluded[g.slug]) errors.push(`excluded: ${excluded[g.slug]}`);
  if (errors.length) { rejected.push({ file, slug: g.slug ?? null, errors }); continue; }
  const nations = {};
  for (const n of ['England', 'Scotland', 'Wales', 'Northern Ireland']) if (g.nations && typeof g.nations[n] === 'string' && g.nations[n].trim()) nations[n] = g.nations[n].trim();
  accepted.push({
    slug: g.slug, title: g.title.trim(), standfirst: g.standfirst.trim(), updatedOn: g.updatedOn,
    readingMinutes: Number.isInteger(g.readingMinutes) ? g.readingMinutes : Math.max(3, Math.round(words / 220)),
    sections: sections.map((s) => ({ heading: s.heading.trim(), paragraphs: s.paragraphs.filter((p) => typeof p === 'string' && p.trim()).map((p) => p.trim()), bullets: (s.bullets || []).filter((b) => typeof b === 'string' && b.trim()).map((b) => b.trim()) })),
    nations,
    faq: (Array.isArray(g.faq) ? g.faq : []).filter((q) => q && typeof q.question === 'string' && typeof q.answer === 'string').map((q) => ({ question: q.question.trim(), answer: q.answer.trim() })),
    sources: sources.map((s) => ({ title: s.title.trim(), url: s.url, publisher: typeof s.publisher === 'string' ? s.publisher : '', date: DATE.test(String(s.date)) ? s.date : null })),
  });
}
const ORDER = ['how-to-become-a-foster-carer', 'who-can-foster-eligibility-and-requirements', 'fostering-assessment-and-approval-explained', 'types-of-fostering-explained', 'council-or-independent-agency-how-to-choose', 'foster-carer-pay-and-allowances'];
accepted.sort((a, b) => (ORDER.indexOf(a.slug) + 1 || 99) - (ORDER.indexOf(b.slug) + 1 || 99));
writeFileSync(join(root, 'src/data/guides.json'), JSON.stringify(accepted, null, 2) + '\n');
writeFileSync(join(root, 'data/guides-report.json'), JSON.stringify({ accepted: accepted.length, rejected }, null, 2) + '\n');
console.log(`Accepted ${accepted.length} guides, rejected ${rejected.length}.`);
