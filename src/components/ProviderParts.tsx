import Link from 'next/link';
import type { Provider, DirectoryEntry, ProviderSource } from '@/types';
import { initials, tileStyle, TYPE_LABEL, SOURCE_LABEL, fieldSource, FOSTERING_LABEL } from '@/lib/providers';

export function ProviderTile({ provider, large = false }: { provider: Pick<Provider, 'id' | 'name'>; large?: boolean }) {
  const s = tileStyle(provider.id);
  return (
    <span
      className={`tile${large ? ' tile-lg' : ''}`}
      style={{ background: s.bg, color: s.fg }}
      aria-hidden="true"
    >
      {initials(provider.name)}
    </span>
  );
}

export function KindChip({ kind }: { kind?: ProviderSource['kind'] }) {
  if (!kind) return null;
  const cls = kind === 'regulator' ? 'chip-regulator' : kind === 'provider-website' ? 'chip-provider' : 'chip-other';
  return <span className={`chip ${cls}`}>{SOURCE_LABEL[kind]}</span>;
}

export function SourceChip({ provider, field }: { provider: Provider; field: string }) {
  return <KindChip kind={fieldSource(provider, field)?.kind} />;
}

const BAND: Record<Provider['providerType'], string> = {
  local_authority: 'var(--mint)',
  independent_agency: 'var(--lilac-soft)',
  other: '#efe6d2',
};

export function ProviderCard({ provider, featured = false }: { provider: DirectoryEntry; featured?: boolean }) {
  const where = [provider.town, provider.nation].filter(Boolean).join(', ');
  return (
    <article className={`provider-card${featured ? ' provider-card-featured' : ''}`}>
      <div className="band" style={{ background: BAND[provider.providerType] }}>
        {TYPE_LABEL[provider.providerType]}
        {featured && <span className="tag tag-featured" title="This provider pays for placement in this area. Payment never changes how details are checked.">Featured · paid placement</span>}
      </div>
      <div className="body">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <ProviderTile provider={provider} />
          <div>
            <h3><Link href={`/agency/${provider.id}/`}>{provider.name}</Link></h3>
            <p className="muted" style={{ fontSize: 14 }}>{where}</p>
          </div>
        </div>
        <dl style={{ margin: 0, fontSize: 15, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {provider.areasServed.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <dt className="visually-hidden">Areas served</dt>
              <dd style={{ margin: 0 }}>{provider.areasServed.slice(0, 3).join(', ')}{provider.areasServed.length > 3 ? ` and ${provider.areasServed.length - 3} more` : ''}</dd>
              <KindChip kind={provider.kinds.areasServed} />
            </div>
          )}
          {provider.fosteringTypes.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <dt className="visually-hidden">Types of fostering</dt>
              <dd style={{ margin: 0 }}>{provider.fosteringTypes.map((t) => FOSTERING_LABEL[t]).join(', ')}</dd>
              <KindChip kind={provider.kinds.fosteringTypes} />
            </div>
          )}
        </dl>
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 6, flexWrap: 'wrap' }}>
          <Link href={`/agency/${provider.id}/`} className="btn btn-dark btn-small">View profile</Link>
          {provider.tier !== 'free' && <Link href={`/agency/${provider.id}/#enquire`} className="btn btn-yellow btn-small">Enquire</Link>}
          {(provider.recruitmentUrl ?? provider.website) && (
            <a href={(provider.recruitmentUrl ?? provider.website)!} className="btn btn-small" rel={featured ? 'noopener sponsored' : 'noopener'} target="_blank">
              {provider.recruitmentUrl ? 'Recruitment page' : 'Visit website'}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )}
        </div>
        <Link href={`/agency/${provider.id}/#report`} style={{ fontSize: 13 }} className="muted">Report an inaccuracy</Link>
      </div>
    </article>
  );
}
