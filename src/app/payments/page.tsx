import Link from 'next/link';
import type { Metadata } from 'next';
import { PayStats, PayTable } from '@/components/PayTable';
import stats from '@/data/pay-stats.json';

export const metadata: Metadata = {
  title: 'What foster carers are paid',
  description: 'What fostering agencies and councils publish as weekly pay per child, the typical figures, the minimum allowances, and a calculator to see what it means for you, with sources.',
  alternates: { canonical: '/payments/' },
};

export default function Payments() {
  const S = stats as { agency: { from: number; to: number } };
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}>Payments</p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>What foster carers are actually paid.</h1>
        <p className="lead" style={{ marginBottom: 24 }}>
          Not the minimum allowance you may have seen quoted. Services publish their own weekly totals for one child, and most agencies
          start around £{S.agency.from} a week. Here are the figures from their own websites, what they depend on, and a calculator to make them yours.
        </p>
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
          <Link className="btn btn-dark" href="/calculator/">Try the pay calculator</Link>
          <Link className="btn" href="/guides/foster-carer-pay-and-allowances/">Read the pay guide</Link>
        </p>
        <h2 style={{ fontSize: 34, marginBottom: 16 }}>Typical weekly pay per child</h2>
        <PayStats />
        <p className="muted" style={{ marginTop: 14, fontSize: 15, maxWidth: 820 }}>
          Typical figures are the middle of what the services below publish. The real figure depends on the child&rsquo;s age and needs, your experience and training, and whether you have a child placed; payments stop between placements unless a service pays a retainer.
        </p>
        <h2 style={{ fontSize: 34, margin: '56px 0 4px' }}>What each service publishes</h2>
        <PayTable />
        <div className="notice" style={{ marginTop: 40, maxWidth: 820 }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Why the headline minimums look low</h2>
          <p>Each government sets a minimum weekly allowance for the child&rsquo;s costs (£176 to £309 in England for 2026-27). That is the floor for one part of the payment. The fee for you comes on top and is set by each service, which is why the totals above are two or three times the minimum. Most of what you receive is also tax-free under Qualifying Care Relief; the <Link href="/calculator/">calculator</Link> shows how much.</p>
        </div>
      </div>
    </div>
  );
}
