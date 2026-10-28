import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { councilAllowances, getAllowance, NATION_MINIMUM, gbp } from '@/lib/allowances';
import { areas, slugify } from '@/lib/areas';
import { formatDate } from '@/lib/providers';

export const dynamicParams = false;
export function generateStaticParams() { return councilAllowances.map((c) => ({ council: c.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ council: string }> }): Promise<Metadata> {
  const { council } = await params;
  const c = getAllowance(council);
  if (!c) return {};
  const lo = Math.min(...c.allowances.map((r) => r.weekly));
  const hi = Math.max(...c.allowances.map((r) => r.weekly));
  return {
    title: `${c.council} foster carer allowance ${c.year}`,
    description: `What ${c.council} pays its foster carers in ${c.year}: weekly allowances of ${gbp(lo)} to ${gbp(hi)} per child${c.fees.length ? ', plus fees' : ''}, from the council's own published rates, with the source and the date checked.`,
    alternates: { canonical: `/fostering-allowance/${c.slug}/` },
  };
}

export default async function CouncilAllowancePage({ params }: { params: Promise<{ council: string }> }) {
  const { council } = await params;
  const c = getAllowance(council);
  if (!c) notFound();
  const lo = Math.min(...c.allowances.map((r) => r.weekly));
  const hi = Math.max(...c.allowances.map((r) => r.weekly));
  const areaLinks = c.areaNames.map((n) => areas.find((a) => a.slug === slugify(n))).filter(Boolean) as { slug: string; name: string; count: number }[];
  const others = councilAllowances.filter((x) => x.nation === c.nation && x.slug !== c.slug).slice(0, 12);
  const Table = ({ rows, caption, head }: { rows: typeof c.allowances; caption: string; head: string }) => (
    <table className="pay-table" style={{ width: '100%', maxWidth: 640, borderCollapse: 'collapse', marginBottom: 24 }}>
      <caption className="visually-hidden">{caption}</caption>
      <thead><tr><th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '2px solid var(--ink)' }}>{head}</th><th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '2px solid var(--ink)' }}>Per week</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.label}><td style={{ padding: '10px 8px', borderBottom: '1px solid #d9d2c3' }}>{r.label}{r.note ? <span className="muted" style={{ display: 'block', fontSize: 14 }}>{r.note}</span> : null}</td><td style={{ padding: '10px 8px', borderBottom: '1px solid #d9d2c3', textAlign: 'right', fontWeight: 700 }}>{gbp(r.weekly)}</td></tr>
      ))}</tbody>
    </table>
  );
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}><Link href="/fostering-allowance/">Allowances by council</Link></p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>{c.council}: foster carer allowances {c.year}.</h1>
        <p className="lead" style={{ marginBottom: 12 }}>
          {c.council} publishes the weekly allowances it pays its own foster carers: {gbp(lo)} to {gbp(hi)} per child for {c.year}{c.fees.length ? ', plus a fee for the carer' : ''}.
          These are the council&rsquo;s figures, taken from its website on {formatDate(c.retrievedOn)}.
        </p>
        <p className="muted" style={{ marginBottom: 28, maxWidth: 820 }}>{c.summary}</p>

        <h2 style={{ fontSize: 28, marginBottom: 10 }}>Weekly allowance by age</h2>
        <Table rows={c.allowances} caption={`${c.council} weekly fostering allowance by age band, ${c.year}`} head="Age of child" />
        {c.fees.length > 0 && (
          <>
            <h2 style={{ fontSize: 28, margin: '8px 0 10px' }}>Fees paid to the carer</h2>
            {c.feesNote && <p style={{ maxWidth: 820, marginBottom: 12 }}>{c.feesNote}</p>}
            <Table rows={c.fees} caption={`${c.council} weekly fostering fees, ${c.year}`} head="Level" />
          </>
        )}
        {c.extras.length > 0 && (
          <>
            <h2 style={{ fontSize: 24, margin: '8px 0 8px' }}>Also published by the council</h2>
            <ul className="guide-bullets" style={{ maxWidth: 820, marginBottom: 24 }}>{c.extras.map((x) => <li key={x}>{x}</li>)}</ul>
          </>
        )}

        <div className="notice" style={{ maxWidth: 820, marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>How this compares</h2>
          <p style={{ marginBottom: 8 }}>The national minimum allowance in {c.nation} is {NATION_MINIMUM[c.nation]}. The allowance covers the child&rsquo;s costs; any fee is the part that is for you, and it is where councils and independent agencies differ most.</p>
          <p style={{ marginBottom: 0 }}>Independent agencies covering the same area publish their own weekly totals, often higher, with more expected of the carer. <Link href="/calculator/" style={{ fontWeight: 700 }}>Use the pay calculator</Link> to see a year&rsquo;s figure and the tax relief, or <Link href="/payments/" style={{ fontWeight: 700 }}>compare what services publish</Link>.</p>
        </div>

        {areaLinks.length > 0 && (
          <p style={{ marginBottom: 24 }}>
            Thinking about fostering here? Compare every service that covers the area: {areaLinks.map((a, i) => <span key={a.slug}>{i > 0 ? ', ' : ''}<Link href={`/fostering-agencies/${a.slug}/`} style={{ fontWeight: 700 }}>Fostering agencies in {a.name}</Link> ({a.count})</span>)}.
          </p>
        )}

        <section aria-labelledby="src-h" style={{ marginTop: 8 }}>
          <h2 id="src-h" style={{ fontSize: 22, marginBottom: 6 }}>Source</h2>
          <p><a href={c.sourceUrl} rel="noopener" target="_blank">{c.sourceTitle}</a>, checked {formatDate(c.retrievedOn)}. Councils usually change their rates each April; if this page is out of date, <Link href="/contact/">tell us</Link> and we will correct it.</p>
        </section>

        {others.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Other councils in {c.nation}</h2>
            <ul className="index-list">{others.map((o) => <li key={o.slug}><Link href={`/fostering-allowance/${o.slug}/`}>{o.council} allowance {o.year}</Link></li>)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}
