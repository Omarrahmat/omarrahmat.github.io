import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProviderCard } from '@/components/ProviderParts';
import { pinnedFor } from '@/lib/providers';
import { areas, areaEntries, slugify } from '@/lib/areas';
import { allowancesForArea } from '@/lib/allowances';
import areaGuides from '@/data/area-guides.json';

export const dynamicParams = false;
export function generateStaticParams() { return areas.map((a) => ({ area: a.slug })); }

const find = (slug: string) => areas.find((a) => a.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params;
  const a = find(area);
  if (!a) return {};
  return {
    title: `Fostering agencies in ${a.name}`,
    description: `Compare ${a.count} fostering agencies and local authority services covering ${a.name}. Each detail shows its source and the date it was checked.`,
    alternates: { canonical: `/fostering-agencies/${a.slug}/` },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const a = find(area);
  if (!a) notFound();
  const entries = areaEntries(a.slug);
  const pinned = pinnedFor(entries, a.name, '');
  const pinnedIds = new Set(pinned.map((p) => p.id));
  const rest = entries.filter((p) => !pinnedIds.has(p.id));
  const councils = entries.filter((p) => p.providerType === 'local_authority').length;
  const agencies = entries.filter((p) => p.providerType === 'independent_agency').length;
  const allowances = allowancesForArea(a.name);
  const guide = (areaGuides as { slug: string; updatedOn: string; paragraphs: string[]; sources: { title: string; url: string }[] }[]).find((g) => g.slug === a.slug);
  const near = areas.filter((x) => x.slug !== a.slug && entries.some((p) => p.areasServed.some((n) => slugify(n) === x.slug))).sort((x, y) => y.count - x.count).slice(0, 8);
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}><Link href="/fostering-agencies/">Fostering by area</Link></p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>Fostering agencies in {a.name}.</h1>
        <p className="lead" style={{ marginBottom: 12 }}>
          {entries.length} fostering services list {a.name} as an area they cover: {agencies} independent {agencies === 1 ? 'agency' : 'agencies'} and {councils} local authority {councils === 1 ? 'service' : 'services'}.
          Each detail shows where it came from and the date we looked.
        </p>
        <p className="muted" style={{ marginBottom: 28 }}>
          Listings marked Featured are paid placements. Payment never changes how details are checked. <Link href="/calculator/" style={{ fontWeight: 700 }}>See what foster carers can earn</Link>.
        </p>
        {pinned.length > 0 && (
          <div className="grid-3" style={{ marginBottom: 24 }}>
            {pinned.map((p) => <ProviderCard key={p.id} provider={p} featured />)}
          </div>
        )}
        <div className="grid-3">
          {rest.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
        {guide && (
          <section aria-labelledby="about-h" style={{ marginTop: 40, maxWidth: 820 }}>
            <h2 id="about-h" style={{ fontSize: 26, marginBottom: 10 }}>Fostering in {a.name}</h2>
            {guide.paragraphs.map((p, i) => <p key={i} style={{ marginBottom: 12 }}>{p}</p>)}
            <p className="muted" style={{ fontSize: 14 }}>Sources: {guide.sources.map((s, i) => <span key={s.url}>{i > 0 ? '; ' : ''}<a href={s.url} rel="noopener" target="_blank">{s.title}</a></span>)}.</p>
          </section>
        )}
        {allowances.length > 0 && (
          <p style={{ marginTop: 32 }}>What the council pays its own carers: {allowances.map((c, i) => <span key={c.slug}>{i > 0 ? ', ' : ''}<Link href={`/fostering-allowance/${c.slug}/`} style={{ fontWeight: 700 }}>{c.council} allowances {c.year}</Link></span>)}.</p>
        )}
        <p style={{ marginTop: 40 }}>Run a fostering service in {a.name}? <Link href="/claim/" style={{ fontWeight: 700 }}>Claim your free profile</Link> or see <Link href="/packages/" style={{ fontWeight: 700 }}>how to be listed first</Link>.</p>
        {near.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Nearby areas</h2>
            <ul className="index-list">{near.map((x) => <li key={x.slug}><Link href={`/fostering-agencies/${x.slug}/`}>Fostering agencies in {x.name}</Link></li>)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}
