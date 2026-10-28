import Link from 'next/link';
import type { Metadata } from 'next';
import { areas } from '@/lib/areas';

export const metadata: Metadata = {
  title: 'Fostering agencies by area',
  description: 'Find fostering agencies and local authority fostering services by town, county and region across the UK.',
  alternates: { canonical: '/fostering-agencies/' },
};

export default function AreasHub() {
  return (
    <div className="section-tight">
      <div className="container">
        <h1 className="display-l" style={{ margin: '0 0 16px' }}>Fostering agencies by area.</h1>
        <p className="lead" style={{ marginBottom: 24 }}>Pick your area to compare every fostering service that covers it. Or <Link href="/find-an-agency/" style={{ fontWeight: 700 }}>search the full directory</Link>.</p>
        <ul className="index-list">
          {areas.map((a) => <li key={a.slug}><Link href={`/fostering-agencies/${a.slug}/`}>{a.name}</Link> <span className="muted">({a.count})</span></li>)}
        </ul>
      </div>
    </div>
  );
}
