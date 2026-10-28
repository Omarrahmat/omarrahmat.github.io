import data from '@/data/providers.json';
import type { Provider, ProviderType, Nation, ProviderSource, DirectoryEntry, Tier } from '@/types';

export const providers = data as unknown as Provider[];

export const NATIONS: Nation[] = ['England', 'Scotland', 'Wales', 'Northern Ireland'];

export const TYPE_LABEL: Record<ProviderType, string> = {
  local_authority: 'Local authority fostering service',
  independent_agency: 'Independent fostering agency',
  other: 'Fostering organisation',
};

export const FOSTERING_LABEL: Record<string, string> = {
  'short-term': 'Short-term',
  'long-term': 'Long-term',
  emergency: 'Emergency',
  respite: 'Respite',
  'parent-and-child': 'Parent and child',
  'sibling-groups': 'Sibling groups',
  teenagers: 'Teenagers',
  therapeutic: 'Therapeutic',
  other: 'Other',
};

export function getProvider(id: string): Provider | undefined {
  return providers.find((p) => p.id === id);
}

export function countByNation(): { nation: Nation; count: number }[] {
  return NATIONS.map((nation) => ({ nation, count: providers.filter((p) => p.nation === nation).length }));
}

const STOP = new Set(['council', 'county', 'borough', 'city', 'of', 'the', 'and', 'fostering', 'foster', 'service', 'services', 'limited', 'ltd', 'agency', 'for', 'ni', '&', 'trust', 'hsc']);

/** Up to two initials from the significant words of a name. */
export function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9&' ]/g, ' ').split(/\s+/).filter(Boolean);
  const sig = words.filter((w) => !STOP.has(w.toLowerCase()));
  const pick = (sig.length ? sig : words).slice(0, 2);
  const out = pick.map((w) => w[0].toUpperCase()).join('');
  return out || name.slice(0, 2).toUpperCase();
}

export const TILE_STYLES = [
  { bg: 'var(--yellow)', fg: 'var(--ink)' },
  { bg: 'var(--coral)', fg: 'var(--ink)' },
  { bg: 'var(--lilac)', fg: 'var(--ink)' },
  { bg: 'var(--mint)', fg: 'var(--ink)' },
  { bg: 'var(--forest)', fg: 'var(--cream)' },
];

export function tileStyle(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TILE_STYLES[h % TILE_STYLES.length];
}

export const SOURCE_LABEL: Record<ProviderSource['kind'], string> = {
  regulator: 'Regulator register',
  'provider-website': 'Provider website',
  other: 'Other public source',
};

/** Which kind of source supports a given field, if any. */
export function fieldSource(p: Provider, field: string): ProviderSource | undefined {
  const matches = p.sources.filter((s) => s.supports.includes(field));
  return matches.find((s) => s.kind === 'regulator') ?? matches[0];
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function formatPhone(p: string): string {
  const d = p.replace(/\D/g, '');
  if (/^(020|023|024|028|029)\d{8}$/.test(d)) return d.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1 $2 $3');
  if (/^(0113|0114|0115|0116|0117|0118|0121|0131|0141|0151|0161|0191)\d{7}$/.test(d)) return d.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
  if (/^0[38]\d{9}$/.test(d)) return d.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
  if (/^0[38]\d{8}$/.test(d)) return d.replace(/^(\d{4})(\d{6})$/, '$1 $2');
  if (/^01\d{9}$/.test(d)) return d.replace(/^(\d{5})(\d{6})$/, '$1 $2');
  if (/^01\d{8}$/.test(d)) return d.replace(/^(\d{5})(\d{5})$/, '$1 $2');
  return p;
}

export function toDirectoryEntry(p: Provider): DirectoryEntry {
  const kinds: DirectoryEntry['kinds'] = {};
  const a = fieldSource(p, 'areasServed');
  const f = fieldSource(p, 'fosteringTypes');
  if (a) kinds.areasServed = a.kind;
  if (f) kinds.fosteringTypes = f.kind;
  return {
    id: p.id,
    name: p.name,
    providerType: p.providerType,
    nation: p.nation,
    town: p.address.town,
    postcode: p.address.postcode,
    areasServed: p.areasServed,
    fosteringTypes: p.fosteringTypes,
    website: p.website,
    recruitmentUrl: p.recruitmentUrl,
    kinds,
    tier: p.tier ?? 'free',
    placementAreas: p.placementAreas ?? [],
  };
}

export const directoryEntries: DirectoryEntry[] = providers.map(toDirectoryEntry);

/**
 * Paid placement rule. A featured or premium listing is pinned to the top of a result set only when the
 * visitor's search touches one of its paid areas (a town, council area or nation it has paid for), so nobody
 * sees a paid listing outside the area it serves. At most three pinned slots per result set; when more
 * listings qualify, the slots rotate daily so each gets a fair share. Pinned cards are labelled "Featured".
 */
export const PINNED_SLOTS = 3;

export function pinnedFor<T extends { id: string; tier: Tier; placementAreas: string[]; nation: Nation }>(
  entries: T[],
  query: string,
  nation: string,
  day = Math.floor(Date.now() / 86400000),
): T[] {
  const q = query.trim().toLowerCase();
  if (!q && !nation) return [];
  const eligible = entries.filter((e) => {
    if (e.tier === 'free') return false;
    const areas = e.placementAreas.map((a) => a.toLowerCase());
    if (nation && e.nation !== nation) return false;
    if (q) return areas.some((a) => a.includes(q) || q.includes(a));
    // Nation filter only: premium listings paid for the whole nation qualify.
    return e.tier === 'premium' && areas.some((a) => a === e.nation.toLowerCase());
  });
  if (eligible.length <= PINNED_SLOTS) return eligible;
  const start = day % eligible.length;
  return [...eligible.slice(start), ...eligible.slice(0, start)].slice(0, PINNED_SLOTS);
}
