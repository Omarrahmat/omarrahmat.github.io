import type { Metadata } from 'next';
import Unsubscribe from '@/components/Unsubscribe';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  description: 'Stop emails from Fostering Today.',
  alternates: { canonical: '/unsubscribe/' },
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <div className="section-tight">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 className="display-m" style={{ margin: '0 0 20px' }}>Unsubscribe.</h1>
        <Unsubscribe />
      </div>
    </div>
  );
}
