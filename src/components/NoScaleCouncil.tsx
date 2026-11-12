import Link from 'next/link';
import { councilAllowances, MINIMUM_TABLE, gbp, type NoScaleCouncil } from '@/lib/allowances';
import { areas, slugify } from '@/lib/areas';
import { formatDate, formatPhone } from '@/lib/providers';
import stats from '@/data/pay-stats.json';

const S = stats as { checked: string; council: { n: number; from: number; to: number } };

/**
 * The page for a council that does not publish a usable current scale. Neutral by design: it says only that we could
 * not find a current scale on the council's website and when we looked, never why (the private notes in
 * _not-published.txt stay private). It gives the legal minimum, what councils typically publish, where to ask, and
 * the local agencies. Omar (11 Nov 2026): nothing on our pages that could make a service want to leave.
 */
export default function NoScaleCouncilPage({ c }: { c: NoScaleCouncil }) {
  const t = MINIMUM_TABLE[c.nation];
  const areaLinks = [...new Set(c.areaNames.map((n) => slugify(n)))]
    .map((s) => areas.find((a) => a.slug === s))
    .filter(Boolean) as { slug: string; name: string; count: number }[];
  const published = councilAllowances.filter((x) => x.nation === c.nation).slice(0, 10);
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}><Link href="/fostering-allowance/">Allowances by council</Link></p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>{c.place}: foster carer allowances 2026-27.</h1>
        <p className="lead" style={{ marginBottom: 12 }}>
          We could not find a current 2026-27 scale of foster carer allowances on the website of {c.providerName}, the council&rsquo;s fostering service, when we last checked on {formatDate(c.checked)}.
          Here is what the law sets as the minimum, what councils that publish their rates pay, and how to get {c.place}&rsquo;s own figures.
        </p>

        <div className="notice" style={{ maxWidth: 820, margin: '20px 0 32px' }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Ask {c.place} directly</h2>
          <p style={{ marginBottom: 0 }}>
            Councils share their rates with anyone thinking about fostering. Ask {c.providerName} for the weekly allowance for each age band and any fee paid to the carer on top.
            {c.website && <> Its fostering pages: <a href={c.website} rel="noopener" target="_blank" style={{ fontWeight: 700 }}>{new URL(c.website).hostname.replace(/^www\./, '')}<span className="visually-hidden"> (opens in a new tab)</span></a>.</>}
            {c.phone && <> Phone: <a href={`tel:${c.phone}`} style={{ fontWeight: 700 }}>{formatPhone(c.phone)}</a>.</>}
            {' '}See its <Link href={`/agency/${c.providerId}/`} style={{ fontWeight: 700 }}>profile on Fostering Today</Link>.
          </p>
        </div>

        <h2 style={{ fontSize: 28, marginBottom: 10 }}>The legal minimum in {c.nation}, 2026-27</h2>
        <p style={{ maxWidth: 820, marginBottom: 12 }}>
          Every fostering service must pay at least the national minimum allowance for the child&rsquo;s costs. Most councils pay more, and many add a fee for the carer.
        </p>
        <table className="pay-table" style={{ width: '100%', maxWidth: 640, borderCollapse: 'collapse', marginBottom: 8 }}>
          <caption className="visually-hidden">Minimum weekly fostering allowance by age, {c.nation}, 2026-27</caption>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '2px solid var(--ink)' }}>Age of child</th>
              {t.columns.map((col) => <th key={col} style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '2px solid var(--ink)' }}>{t.columns.length > 1 ? col : 'Per week'}</th>)}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r) => (
              <tr key={r.label}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #d9d2c3' }}>{r.label}</td>
                {r.values.map((v, i) => <td key={i} style={{ padding: '10px 8px', borderBottom: '1px solid #d9d2c3', textAlign: 'right', fontWeight: 700 }}>{gbp(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 14, marginBottom: 28 }}>{t.source}. Weekly, per child.</p>

        <h2 style={{ fontSize: 28, marginBottom: 10 }}>What councils that publish their rates pay</h2>
        <p style={{ maxWidth: 820, marginBottom: 12 }}>
          Across the {S.council.n} councils whose published weekly totals we checked on {formatDate(S.checked)}, the typical package for one child was {gbp(S.council.from)} a week for a newly approved carer and {gbp(S.council.to)} with experience or a child with higher needs.
          {' '}<Link href="/calculator/" style={{ fontWeight: 700 }}>Use the pay calculator</Link> to see what that means over a year, and how much of it is tax-free.
        </p>
        {published.length > 0 && (
          <p style={{ maxWidth: 820, marginBottom: 28 }}>
            Councils in {c.nation} that publish a 2026-27 scale: {published.map((p, i) => <span key={p.slug}>{i > 0 ? ', ' : ''}<Link href={`/fostering-allowance/${p.slug}/`}>{p.council}</Link></span>)}.
          </p>
        )}

        {areaLinks.length > 0 && (
          <p style={{ marginBottom: 24, maxWidth: 820 }}>
            Thinking about fostering in {c.place}? Compare the council with the independent agencies that cover the area: {areaLinks.map((a, i) => <span key={a.slug}>{i > 0 ? ', ' : ''}<Link href={`/fostering-agencies/${a.slug}/`} style={{ fontWeight: 700 }}>Fostering agencies in {a.name}</Link> ({a.count})</span>)}.
          </p>
        )}

        <section aria-labelledby="src-h" style={{ marginTop: 8 }}>
          <h2 id="src-h" style={{ fontSize: 22, marginBottom: 6 }}>Checked</h2>
          <p style={{ maxWidth: 820 }}>We look for {c.place}&rsquo;s published scale again regularly. If the council publishes its 2026-27 rates, or you work there and can point us to them, <Link href="/contact/">tell us</Link> and we will add them to this page.</p>
        </section>
      </div>
    </div>
  );
}
