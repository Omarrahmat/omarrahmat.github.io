import type { Metadata } from 'next';
import Portal from '@/components/Portal';
import { providers } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'Agency portal',
  description: 'Sign in to manage your Fostering Today profile, see your enquiries and view your profile activity.',
  alternates: { canonical: '/portal/' },
  robots: { index: false, follow: false },
};

export default function PortalPage() {
  const list = providers.map((p) => ({ id: p.id, name: p.name, phone: p.phone, website: p.website, recruitmentUrl: p.recruitmentUrl, areasServed: p.areasServed }));
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}>For agencies and local authorities</p>
        <h1 className="display-m" style={{ margin: '12px 0 24px' }}>Your portal.</h1>
        <Portal providers={list} />
      </div>
    </div>
  );
}
