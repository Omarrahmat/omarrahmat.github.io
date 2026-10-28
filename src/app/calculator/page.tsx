import Link from 'next/link';
import type { Metadata } from 'next';
import PayCalculator from '@/components/PayCalculator';

export const metadata: Metadata = {
  title: 'Foster carer pay calculator',
  description: 'Estimate what fostering could pay where you live: the minimum allowance for each child, the fee a service quotes, your annual total and how much is tax-free under Qualifying Care Relief.',
  alternates: { canonical: '/calculator/' },
};

export default function CalculatorPage() {
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}>Payments</p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>Foster carer pay calculator.</h1>
        <p className="lead" style={{ marginBottom: 28 }}>
          Fostering pay has two parts: an allowance for each child, with a published minimum, and a fee for you that each service sets.
          Enter the fee a service quotes and see the weekly and yearly picture, including how much of it is tax-free.
        </p>
        <PayCalculator />
        <div className="notice" style={{ marginTop: 32, maxWidth: 820 }}>
          <p>
            Want the detail behind these numbers? Read <Link href="/guides/foster-carer-pay-and-allowances/">Foster carer pay and allowances</Link>, which lists every source.
            To find out what a specific service pays, open its profile in the <Link href="/find-an-agency/">directory</Link> and follow the link to its own website.
          </p>
        </div>
      </div>
    </div>
  );
}
