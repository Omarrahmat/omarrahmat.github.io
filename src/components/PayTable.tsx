import examples from '@/data/pay-examples.json';
import stats from '@/data/pay-stats.json';
import { formatDate } from '@/lib/providers';

interface Row { name: string; type: 'agency' | 'council'; nation: string; url: string; from: number | null; to: number | null; basis: string; dependsOn: string; pageDate: string | null; example: boolean }
const rows = examples as Row[];
const S = stats as { checked: string; agency: { n: number; from: number; to: number; min: number; max: number }; council: { n: number; from: number; to: number; min: number; max: number } };
const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
const money = (r: Row) => r.from != null && r.to != null && r.from !== r.to ? `${gbp(r.from)} to ${gbp(r.to)}` : r.from != null ? `from ${gbp(r.from)}` : r.to != null ? `up to ${gbp(r.to)}` : '';

/** Typical weekly totals (medians) and the service-by-service table behind them. */
export function PayStats() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
      <div className="price-card" style={{ background: 'var(--lilac)' }}>
        <p className="eyebrow">Independent agencies</p>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 40, lineHeight: 1.05, margin: '10px 0 6px' }}>{gbp(S.agency.from)} to {gbp(S.agency.to)}</p>
        <p className="muted">a week per child, from newly approved to experienced. Typical of {S.agency.n} agencies&rsquo; published rates (range {gbp(S.agency.min)} to {gbp(S.agency.max)}).</p>
      </div>
      <div className="price-card" style={{ background: 'var(--mint)' }}>
        <p className="eyebrow">Council services</p>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 40, lineHeight: 1.05, margin: '10px 0 6px' }}>{gbp(S.council.from)} to {gbp(S.council.to)}</p>
        <p className="muted">a week per child. Typical of {S.council.n} councils&rsquo; published rates (range {gbp(S.council.min)} to {gbp(S.council.max)}).</p>
      </div>
      <div className="price-card" style={{ background: 'var(--white)' }}>
        <p className="eyebrow">Minimum allowance</p>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 40, lineHeight: 1.05, margin: '10px 0 6px' }}>£176 to £309</p>
        <p className="muted">a week in England for 2026-27, for the child&rsquo;s costs only; the fee for you comes on top. Scotland, Wales and Northern Ireland set their own.</p>
      </div>
    </div>
  );
}

export function PayTable() {
  const agencies = rows.filter((r) => r.type === 'agency');
  const councils = rows.filter((r) => r.type === 'council');
  const Table = ({ list, caption }: { list: Row[]; caption: string }) => (
    <div className="compare-wrap" style={{ marginTop: 16 }}>
      <table className="compare" style={{ minWidth: 640 }}>
        <caption className="visually-hidden">{caption}</caption>
        <thead><tr><th scope="col">Service</th><th scope="col">Nation</th><th scope="col">Per child per week</th><th scope="col">Depends on</th><th scope="col">Checked</th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.url + r.name}>
              <th scope="row"><a href={r.url} rel="noopener" target="_blank">{r.name}</a>{r.example ? <span className="muted"> (worked example)</span> : ''}</th>
              <td>{r.nation}</td>
              <td>{money(r)}</td>
              <td style={{ fontSize: 14 }}>{r.dependsOn}</td>
              <td style={{ fontSize: 14 }}>{r.pageDate ? formatDate(r.pageDate) : formatDate(S.checked)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div>
      <h3 style={{ fontSize: 26, marginTop: 28 }}>Independent agencies ({agencies.length})</h3>
      <Table list={agencies} caption="Weekly totals published by independent fostering agencies" />
      <h3 style={{ fontSize: 26, marginTop: 36 }}>Council fostering services ({councils.length})</h3>
      <Table list={councils} caption="Weekly totals published by council fostering services" />
      <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>
        Each figure is as published on the service&rsquo;s own website on the date shown, for one child, and in most cases combines the child&rsquo;s allowance and the carer&rsquo;s fee. Rates change: the service&rsquo;s own page is the authority. Is yours wrong or missing? <a href="/contact/">Tell us</a>.
      </p>
    </div>
  );
}
