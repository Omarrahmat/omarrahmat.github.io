import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SimpleForm from '@/components/SimpleForm';
import { ProviderTile, SourceChip } from '@/components/ProviderParts';
import { BadgeBlock } from '@/components/Badge';
import EnquiryForm from '@/components/EnquiryForm';
import ProfileLive, { LogoTile } from '@/components/ProfileLive';
import { providers, getProvider, TYPE_LABEL, FOSTERING_LABEL, formatDate, formatPhone, SOURCE_LABEL } from '@/lib/providers';

export const dynamicParams = false;

export function generateStaticParams() {
  return providers.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = getProvider(id);
  if (!p) return {};
  return {
    title: `${p.name}: fostering in ${p.nation}`,
    description: `${TYPE_LABEL[p.providerType]} in ${p.nation}. See contact details, areas served and where each detail came from.`,
    alternates: { canonical: `/agency/${p.id}/` },
  };
}

export default async function AgencyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProvider(id);
  if (!p) notFound();

  const addressLine = [p.address.line1, p.address.town, p.address.postcode].filter(Boolean).join(', ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: p.name,
    ...(p.website ? { url: p.website } : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(addressLine
      ? { address: { '@type': 'PostalAddress', streetAddress: p.address.line1 ?? undefined, addressLocality: p.address.town ?? undefined, postalCode: p.address.postcode ?? undefined, addressCountry: 'GB' } }
      : {}),
  };

  return (
    <div className="section-tight">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <nav className="breadcrumb muted" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/find-an-agency/">Find an agency</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{p.name}</span>
        </nav>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', margin: '28px 0 12px' }}>
          <span data-logo-hide style={{ display: 'contents' }}><ProviderTile provider={p} large /></span>
          <LogoTile providerId={p.id} name={p.name} />
          <div style={{ flex: '1 1 400px' }}>
            <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tag">{TYPE_LABEL[p.providerType]}</span>
              <span className="tag">{p.nation}</span>
            </p>
            <h1 className="display-m" style={{ marginTop: 12 }}>{p.name}</h1>
          </div>
        </div>

        <div className="notice" style={{ margin: '20px 0 32px', maxWidth: 820 }}>
          <strong>This profile was built from public sources.</strong> It has not been claimed by the provider yet.
          Each detail below is labelled with where it came from. If you work here, you can{' '}
          <Link href={`/claim/?provider=${p.id}`} style={{ fontWeight: 700 }}>claim this profile for free</Link>{' '}
          to add your logo and keep it up to date.
        </div>

        <ProfileLive providerId={p.id} name={p.name} />

        <dl className="facts">
          <dt>Areas served</dt>
          <dd>
            <span>{p.areasServed.length ? p.areasServed.join(', ') : 'Not stated in our sources'}</span>
            <SourceChip provider={p} field="areasServed" />
          </dd>
          <dt>Types of fostering</dt>
          <dd>
            <span>{p.fosteringTypes.length ? p.fosteringTypes.map((t) => FOSTERING_LABEL[t]).join(', ') : 'Not stated in our sources'}</span>
            <SourceChip provider={p} field="fosteringTypes" />
          </dd>
          <dt>Address</dt>
          <dd>
            <span>{addressLine || 'Not published for the fostering service'}</span>
            <SourceChip provider={p} field="address" />
          </dd>
          <dt>Phone</dt>
          <dd>
            <span>{p.phone ? <a href={`tel:${p.phone}`} data-track="phone_click">{formatPhone(p.phone)}</a> : 'Not stated in our sources'}</span>
            <SourceChip provider={p} field="phone" />
          </dd>
          <dt>Website</dt>
          <dd>
            <span>{p.website ? <a href={p.website} rel="noopener" target="_blank" data-track="website_click">{new URL(p.website).hostname.replace(/^www\./, '')}<span className="visually-hidden"> (opens in a new tab)</span></a> : 'No website found in our sources'}</span>
            <SourceChip provider={p} field="website" />
          </dd>
          {p.recruitmentUrl && (
            <>
              <dt>Become a foster carer</dt>
              <dd><span><a href={p.recruitmentUrl} rel="noopener" target="_blank" data-track="recruit_click">Recruitment page<span className="visually-hidden"> (opens in a new tab)</span></a></span></dd>
            </>
          )}
          {p.regulatorName && (
            <>
              <dt>Regulator</dt>
              <dd><span>{p.regulatorName}{p.regulatorReference ? `, ref ${p.regulatorReference}` : ''}</span></dd>
            </>
          )}
        </dl>

        {p.tier !== 'free' && (
          <section id="enquire" style={{ marginTop: 48, maxWidth: 720 }} aria-labelledby="enq-h">
            <h2 id="enq-h" style={{ fontSize: 32, marginBottom: 8 }}>Ask {p.name} about fostering</h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              Goes straight to their fostering team. No obligation, and your details are not shared with anyone else.
            </p>
            <div className="form-card">
              <EnquiryForm providerId={p.id} providerName={p.name} />
            </div>
          </section>
        )}

        <p className="muted" style={{ marginTop: 20, fontSize: 15 }}>
          Wondering what fostering with {p.name} could pay? Their rates are on their website; put the weekly fee into our <Link href="/calculator/">pay calculator</Link> to see the yearly and tax-free picture.
        </p>

        <section style={{ marginTop: 48 }} aria-labelledby="sources-h">
          <h2 id="sources-h" style={{ fontSize: 32 }}>Where this information came from</h2>
          <ul style={{ marginTop: 14, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener" target="_blank" style={{ wordBreak: 'break-all' }}>{s.url}</a>
                <span className="muted"> · {SOURCE_LABEL[s.kind]} · checked {formatDate(s.retrievedOn)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div style={{ maxWidth: 720 }}><BadgeBlock id={p.id} name={p.name} /></div>

        <section id="report" style={{ marginTop: 56, maxWidth: 720 }} aria-labelledby="report-h">
          <h2 id="report-h" style={{ fontSize: 32, marginBottom: 8 }}>Report an inaccuracy</h2>
          <p className="muted" style={{ marginBottom: 20 }}>Corrections are always free. Tell us what is wrong and, if you can, how we can check it.</p>
          <div className="form-card">
            <SimpleForm
              idPrefix="fix"
              table="correction_requests"
              extra={{ provider_id: p.id }}
              fields={[
                { name: 'what_is_wrong', label: 'What is wrong?', type: 'textarea', required: true },
                { name: 'correct_information', label: 'What should it say?', type: 'textarea' },
                { name: 'evidence_url', label: 'Link to evidence', type: 'url', placeholder: 'https://' },
                { name: 'contact_email', label: 'Your email, if you want a reply', type: 'email' },
              ]}
              consentText="I agree that Fostering Today may use these details to review and correct this listing, and to reply to me if I gave an email address."
              submitLabel="Send correction"
              successTitle="Thank you."
              successBody="We'll review this and update the listing if we can confirm it."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
