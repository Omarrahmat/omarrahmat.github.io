// Compiles data/news/*.json (researched, sourced stories) into src/data/articles.json.
// Stories without sources, or with a missing field, are rejected and listed in data/news-report.json.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'data/news');
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TOPICS = ['policy', 'regulation', 'pay-and-allowances', 'recruitment', 'councils', 'agencies', 'campaigns', 'research', 'wales', 'scotland', 'northern-ireland', 'england'];
const https = (u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };

let excluded = {};
try { excluded = JSON.parse(readFileSync(join(root, 'data/news-exclude.json'), 'utf8')); } catch { /* optional */ }

const accepted = [];
const rejected = [];
const seen = new Set();
let files = [];
try { files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort(); } catch { /* none */ }
for (const file of files) {
  let list;
  try { list = JSON.parse(readFileSync(join(dir, file), 'utf8')); } catch (e) { rejected.push({ file, slug: null, errors: [e.message] }); continue; }
  if (!Array.isArray(list)) continue;
  for (const a of list) {
    const errors = [];
    if (typeof a.slug !== 'string' || !SLUG.test(a.slug)) errors.push('slug');
    if (typeof a.title !== 'string' || a.title.length < 10 || a.title.length > 120) errors.push('title');
    if (typeof a.standfirst !== 'string' || a.standfirst.length < 20) errors.push('standfirst');
    if (!DATE.test(String(a.publishedOn))) errors.push('publishedOn');
    const body = Array.isArray(a.body) ? a.body.filter((p) => typeof p === 'string' && p.trim()) : [];
    const words = body.join(' ').split(/\s+/).length;
    if (body.length < 3 || words < 120) errors.push('body too short');
    const sources = Array.isArray(a.sources) ? a.sources.filter((s) => s && https(s.url) && typeof s.title === 'string') : [];
    if (sources.length === 0) errors.push('no valid source');
    if (excluded[a.slug]) errors.push(`excluded: ${excluded[a.slug]}`);
    if (seen.has(a.slug)) errors.push('duplicate slug');
    if (errors.length) { rejected.push({ file, slug: a.slug ?? null, errors }); continue; }
    seen.add(a.slug);
    accepted.push({
      slug: a.slug,
      title: a.title.trim(),
      standfirst: a.standfirst.trim(),
      publishedOn: a.publishedOn,
      eventDate: DATE.test(String(a.eventDate)) ? a.eventDate : null,
      topics: (Array.isArray(a.topics) ? a.topics : []).filter((t) => TOPICS.includes(t)),
      body: body.map((p) => p.trim()),
      sources: sources.map((s) => ({ title: s.title.trim(), url: s.url, publisher: typeof s.publisher === 'string' ? s.publisher : '', date: DATE.test(String(s.date)) ? s.date : null })),
    });
  }
}
// Newest published first; within a publishing day, the most recent development first; previews of future events last that day.
const ev = (a) => (a.eventDate && a.eventDate <= a.publishedOn ? a.eventDate : '0000-00-00');
accepted.sort((a, b) => b.publishedOn.localeCompare(a.publishedOn) || ev(b).localeCompare(ev(a)) || a.slug.localeCompare(b.slug));
writeFileSync(join(root, 'src/data/articles.json'), JSON.stringify(accepted, null, 2) + '\n');
writeFileSync(join(root, 'data/news-report.json'), JSON.stringify({ accepted: accepted.length, rejected }, null, 2) + '\n');
console.log(`Accepted ${accepted.length} stories, rejected ${rejected.length}.`);
