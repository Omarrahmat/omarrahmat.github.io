import { ProviderCard } from '@/components/ProviderParts';
import { pinnedFor, PINNED_SLOTS } from '@/lib/providers';
import { areaEntries } from '@/lib/areas';
import { builtLogos } from '@/lib/built';

/**
 * Paying partners for a council's area, shown on that council's pay page (21 Nov 2026). The pay pages are where most
 * people arrive from Google, so this is where a paid placement is seen. Nothing is shown where nobody has paid, a
 * pilot partner is never shown here, and this is never used on a service's own profile.
 */
export default function FeaturedHere({ areas }: { areas: { slug: string; name: string }[] }) {
  const seen = new Set<string>();
  const cards = areas
    .flatMap((a) => pinnedFor(areaEntries(a.slug), a.name, ''))
    .filter((p) => !p.enquiriesTo && !seen.has(p.id) && Boolean(seen.add(p.id)))
    .slice(0, PINNED_SLOTS);
  if (cards.length === 0) return null;
  const logos = builtLogos();
  return (
    <section aria-labelledby="featured-here-h" style={{ marginBottom: 28 }}>
      <h2 id="featured-here-h" style={{ fontSize: 24, marginBottom: 6 }}>Featured services covering {areas[0].name}</h2>
      <p className="muted" style={{ marginBottom: 14, fontSize: 15 }}>Listings marked Featured are paid placements. Payment never changes how details are checked.</p>
      <div className="grid-3">{cards.map((p) => <ProviderCard key={p.id} provider={p} featured logo={logos[p.id]} />)}</div>
    </section>
  );
}
