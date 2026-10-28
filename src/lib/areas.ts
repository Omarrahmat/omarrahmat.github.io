import { directoryEntries, FOSTERING_LABEL } from '@/lib/providers';

export const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const byArea = new Map<string, { name: string; ids: string[] }>();
for (const p of directoryEntries) {
  for (const a of p.areasServed) {
    const k = slugify(a);
    if (!k) continue;
    const e = byArea.get(k) ?? { name: a, ids: [] };
    e.ids.push(p.id);
    byArea.set(k, e);
  }
}

/** Areas with at least two services; thinner pages are not worth publishing. */
export const areas = [...byArea.entries()]
  .filter(([, v]) => v.ids.length >= 2)
  .map(([slug, v]) => ({ slug, name: v.name, count: v.ids.length }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function areaEntries(slug: string) {
  const e = byArea.get(slug);
  if (!e) return [];
  const set = new Set(e.ids);
  return directoryEntries.filter((p) => set.has(p.id));
}

export { FOSTERING_LABEL };
