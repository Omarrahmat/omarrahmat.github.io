import type { Metadata } from 'next';
import SimpleForm from '@/components/SimpleForm';
import { ArticleCard } from '@/components/ArticleParts';
import { articles } from '@/lib/articles';

export const metadata: Metadata = {
  title: 'Fostering news',
  description: 'Independent news for the UK fostering sector: policy, allowances, recruitment and regulation, with sources on every story.',
  alternates: { canonical: '/news/' },
};

export default function News() {
  const [lead, ...rest] = articles;
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}>News</p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>Fostering news.</h1>
        <p className="lead" style={{ marginBottom: 32 }}>
          Written in plain English from primary sources, which are linked at the end of every story. We don&apos;t
          publish what we can&apos;t source.
        </p>

        {!lead && (
          <div className="empty" style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, marginBottom: 10 }}>No stories yet.</h2>
            <p>We will publish when stories have been checked against sources. Subscribe to hear when we start.</p>
          </div>
        )}
        {lead && (
          <div className="story-grid">
            <ArticleCard a={lead} large />
            {rest.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        )}

        <div className="form-card" style={{ maxWidth: 560, marginTop: 56 }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Get the news by email</h2>
          <SimpleForm
            idPrefix="news-sub"
            table="newsletter_subscribers"
            extra={{ source: 'news' }}
            fields={[{ name: 'email', label: 'Email', type: 'email', required: true }]}
            consentText="I agree to receive the Fostering Today newsletter by email. I can unsubscribe at any time."
            submitLabel="Subscribe"
            successTitle="Thanks."
            successBody="We'll be in touch when we publish."
          />
        </div>
      </div>
    </div>
  );
}
