import Link from 'next/link';
import type { Metadata } from 'next';
import { councilAllowances } from '@/lib/allowances';
import { NATIONS } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'Foster carer allowances by council',
  description: 'What each council pays its foster carers: the published weekly allowances and fees for 2026-27, council by council, with the source for every figure.',
  alternates: { canonical: '/fostering-allowance/' },
};

export default function AllowancesHub() {
  return (
    <div className="section-tight">
      <div className="container">
        <h1 className="display-l" style={{ margin: '0 0 16px' }}>Foster carer allowances, council by council.</h1>
        <p className="lead" style={{ marginBottom: 12 }}>
          Every council publishes what it pays its own foster carers. We copy the figures from the council&rsquo;s own page, show the date we checked, and link to the source.
          {councilAllowances.length === 0 ? ' The first council pages are being added now.' : ` ${councilAllowances.length} councils so far; more are added every day.`}
        </p>
        <p className="muted" style={{ marginBottom: 32 }}>Independent agencies covering the same areas often pay more. <Link href="/payments/" style={{ fontWeight: 700 }}>See what services publish</Link> or <Link href="/calculator/" style={{ fontWeight: 700 }}>try the pay calculator</Link>.</p>
        {NATIONS.map((n) => {
          const list = councilAllowances.filter((c) => c.nation === n);
          if (list.length === 0) return null;
          return (
            <section key={n} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 28, marginBottom: 6 }}>{n}</h2>
              <ul className="index-list">{list.map((c) => <li key={c.slug}><Link href={`/fostering-allowance/${c.slug}/`}>{c.council}</Link> <span className="muted">({c.year})</span></li>)}</ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
