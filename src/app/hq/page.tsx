import type { Metadata } from 'next';
import HQ from '@/components/HQ';
import { providers } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'Owner dashboard',
  description: 'Live business dashboard for the owner of Fostering Today.',
  alternates: { canonical: '/hq/' },
  robots: { index: false, follow: false },
};

export default function HQPage() {
  const names = Object.fromEntries(providers.map((p) => [p.id, p.name]));
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}>Owner only</p>
        <h1 className="display-m" style={{ margin: '12px 0 24px' }}>Fostering Today HQ.</h1>
        <HQ names={names} />
      </div>
    </div>
  );
}
