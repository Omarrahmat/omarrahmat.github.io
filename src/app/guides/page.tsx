import Link from 'next/link';
import type { Metadata } from 'next';
import SimpleForm from '@/components/SimpleForm';
import { guides } from '@/lib/guides';
import { formatDate } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'Fostering guides',
  description: 'Plain-English guides to becoming a foster carer in the UK: who can foster, the assessment, types of fostering, pay and allowances, and choosing a council or agency.',
  alternates: { canonical: '/guides/' },
};

export default function Guides() {
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}>Guides</p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>Guides, sourced.</h1>
        <p className="lead" style={{ marginBottom: 32 }}>
          Written in plain English from official sources, which are listed at the end of every guide, with the date we last checked them.
          Where the rules differ between England, Scotland, Wales and Northern Ireland, we say so.
        </p>
        {guides.length === 0 ? (
          <div className="empty"><h2 style={{ fontSize: 28 }}>Guides are being written.</h2></div>
        ) : (
          <ol className="guide-index">
            {guides.map((g, i) => (
              <li key={g.slug} className="guide-list" style={{ padding: '22px 0' }}>
                <span className="guide-num">{String(i + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 28, lineHeight: 1.1 }}><Link href={`/guides/${g.slug}/`}>{g.title}</Link></h2>
                  <p className="muted" style={{ marginTop: 6 }}>{g.standfirst}</p>
                  <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>{g.readingMinutes} min read · checked {formatDate(g.updatedOn)}</p>
                </div>
                <Link href={`/guides/${g.slug}/`} className="btn btn-small" aria-label={`Read: ${g.title}`}>Read</Link>
              </li>
            ))}
          </ol>
        )}
        <div className="form-card" style={{ maxWidth: 560, marginTop: 48 }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>New guides by email</h2>
          <SimpleForm
            idPrefix="guides-news"
            table="newsletter_subscribers"
            extra={{ source: 'guides' }}
            fields={[{ name: 'email', label: 'Email', type: 'email', required: true }]}
            consentText="I agree to receive the Fostering Today newsletter by email. I can unsubscribe at any time."
            submitLabel="Subscribe"
            successTitle="Thanks."
            successBody="We'll email you when new guides are published."
          />
        </div>
      </div>
    </div>
  );
}
