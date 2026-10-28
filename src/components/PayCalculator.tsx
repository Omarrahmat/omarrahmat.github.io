'use client';

import { useMemo, useState } from 'react';
import stats from '@/data/pay-stats.json';

/**
 * Pay calculator. Built-in figures: the published minimum allowances and tax relief for 2026-27 (official pages
 * listed on the guide) and the typical weekly totals services publish on their own websites (src/data/pay-stats.json,
 * medians across the services checked on the date shown there).
 */
type Nation = 'England' | 'Scotland' | 'Wales' | 'Northern Ireland';
type Region = 'London' | 'South East' | 'Rest of England';
type Basis = 'agency' | 'council' | 'minimum' | 'custom';
type Level = 'from' | 'to';

const BANDS: Record<Nation, { label: string; min: (region: Region) => number; under11: boolean }[]> = {
  England: [
    { label: '0 to 2', min: (r) => ({ London: 205, 'South East': 195, 'Rest of England': 176 })[r], under11: true },
    { label: '3 to 4', min: (r) => ({ London: 208, 'South East': 203, 'Rest of England': 182 })[r], under11: true },
    { label: '5 to 10', min: (r) => ({ London: 233, 'South East': 223, 'Rest of England': 201 })[r], under11: true },
    { label: '11 to 15', min: (r) => ({ London: 266, 'South East': 255, 'Rest of England': 227 })[r], under11: false },
    { label: '16 to 17', min: (r) => ({ London: 309, 'South East': 298, 'Rest of England': 267 })[r], under11: false },
  ],
  Scotland: [
    { label: '0 to 4', min: () => 177.68, under11: true },
    { label: '5 to 10', min: () => 206.71, under11: true },
    { label: '11 to 15', min: () => 206.71, under11: false },
    { label: '16 to 17', min: () => 283.35, under11: false },
  ],
  Wales: [
    { label: '0 to 4', min: () => 229, under11: true },
    { label: '5 to 10', min: () => 208, under11: true },
    { label: '11 to 15', min: () => 208, under11: false },
    { label: '16 to 17', min: () => 260, under11: false },
  ],
  'Northern Ireland': [
    { label: '0 to 4', min: () => 149, under11: true },
    { label: '5 to 10', min: () => 166, under11: true },
    { label: '11 to 15', min: () => 187, under11: false },
    { label: '16 and over', min: () => 219, under11: false },
  ],
};

const MIN_NOTE: Record<Nation, string> = {
  England: 'England minimum allowances for 6 April 2026 to 5 April 2027 (GOV.UK).',
  Scotland: 'Scottish Recommended Allowance for 2026-27 (Scottish Government); councils set fees separately.',
  Wales: 'National minimum allowance for 2026-27 as published by Foster Wales.',
  'Northern Ireland': 'Scale published on nidirect (from 1 April 2024); the Department of Health has published later rates.',
};

// Qualifying Care Relief 2026-27 (GOV.UK): a fixed amount per household plus a weekly amount per child.
const QCR_FIXED = 20440;
const QCR_UNDER_11 = 435;
const QCR_11_PLUS = 515;

const S = stats as { checked: string; agency: { n: number; from: number; to: number; min: number; max: number }; council: { n: number; from: number; to: number; min: number; max: number } };
const gbp = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const gbp2 = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

interface Child { band: number; total: string }

export default function PayCalculator() {
  const [nation, setNation] = useState<Nation>('England');
  const [region, setRegion] = useState<Region>('Rest of England');
  const [basis, setBasis] = useState<Basis>('agency');
  const [level, setLevel] = useState<Level>('from');
  const [children, setChildren] = useState<Child[]>([{ band: 2, total: '' }]);
  const [weeks, setWeeks] = useState(52);

  const bands = BANDS[nation];
  const rows = useMemo(() => children.map((c) => {
    const b = bands[Math.min(c.band, bands.length - 1)];
    const allowance = b.min(region);
    let weekly = allowance;
    let note = 'Minimum allowance only';
    if (basis === 'agency') { weekly = S.agency[level]; note = `Typical agency package (${level === 'from' ? 'starting' : 'experienced'})`; }
    if (basis === 'council') { weekly = S.council[level]; note = `Typical council package (${level === 'from' ? 'starting' : 'experienced'})`; }
    if (basis === 'custom') { weekly = Math.max(0, Number(c.total) || 0); note = 'Figure you entered'; }
    return { label: b.label, allowance, weekly, note, qcr: (b.under11 ? QCR_UNDER_11 : QCR_11_PLUS) * weeks };
  }), [children, bands, region, basis, level, weeks]);

  const weekly = rows.reduce((s, r) => s + r.weekly, 0);
  const annual = weekly * weeks;
  const relief = QCR_FIXED + rows.reduce((s, r) => s + r.qcr, 0);
  const taxable = Math.max(0, annual - relief);
  const setChild = (i: number, patch: Partial<Child>) => setChildren((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <div className="calc">
      <div className="calc-grid">
        <div className="form-stack">
          <div className="field">
            <label htmlFor="calc-basis">What to base it on</label>
            <select id="calc-basis" className="select" value={basis} onChange={(e) => setBasis(e.target.value as Basis)}>
              <option value="agency">Typical independent agency package</option>
              <option value="council">Typical council package</option>
              <option value="minimum">Minimum allowance only (no fee)</option>
              <option value="custom">A weekly figure a service has quoted me</option>
            </select>
            {basis === 'agency' && <p className="help">Median of the weekly totals {S.agency.n} agencies publish on their own sites: from {gbp(S.agency.from)} starting out to {gbp(S.agency.to)} with experience or a child with higher needs (published range {gbp(S.agency.min)} to {gbp(S.agency.max)}). Checked {formatDate(S.checked)}.</p>}
            {basis === 'council' && <p className="help">Median of the weekly totals {S.council.n} councils publish: from {gbp(S.council.from)} to {gbp(S.council.to)} (published range {gbp(S.council.min)} to {gbp(S.council.max)}). Checked {formatDate(S.checked)}.</p>}
            {basis === 'minimum' && <p className="help">What a service must pay at least for the child&apos;s costs, with nothing for you. Almost every service pays more than this.</p>}
            {basis === 'custom' && <p className="help">Enter the weekly total per child the service quotes (allowance and fee together).</p>}
          </div>
          {(basis === 'agency' || basis === 'council') && (
            <fieldset className="calc-child" style={{ gap: 8 }}>
              <legend>Your level</legend>
              <label className="radio"><input type="radio" name="calc-level" checked={level === 'from'} onChange={() => setLevel('from')} /> Newly approved (the &ldquo;from&rdquo; rate)</label>
              <label className="radio"><input type="radio" name="calc-level" checked={level === 'to'} onChange={() => setLevel('to')} /> Experienced, or a child with higher needs (the upper rate)</label>
            </fieldset>
          )}
          <div className="field">
            <label htmlFor="calc-nation">Where you live</label>
            <select id="calc-nation" className="select" value={nation} onChange={(e) => { setNation(e.target.value as Nation); setChildren((cs) => cs.map((c) => ({ ...c, band: Math.min(c.band, BANDS[e.target.value as Nation].length - 1) }))); }}>
              {(Object.keys(BANDS) as Nation[]).map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          {nation === 'England' && basis === 'minimum' && (
            <div className="field">
              <label htmlFor="calc-region">Region</label>
              <select id="calc-region" className="select" value={region} onChange={(e) => setRegion(e.target.value as Region)}>
                <option>London</option><option>South East</option><option>Rest of England</option>
              </select>
            </div>
          )}
          {children.map((c, i) => (
            <fieldset key={i} className="calc-child">
              <legend>Child {i + 1}</legend>
              <div className="field">
                <label htmlFor={`calc-age-${i}`}>Age</label>
                <select id={`calc-age-${i}`} className="select" value={c.band} onChange={(e) => setChild(i, { band: Number(e.target.value) })}>
                  {bands.map((b, j) => <option key={b.label} value={j}>{b.label}</option>)}
                </select>
              </div>
              {basis === 'custom' && (
                <div className="field">
                  <label htmlFor={`calc-total-${i}`}>Weekly total quoted, £</label>
                  <input id={`calc-total-${i}`} className="input" inputMode="decimal" placeholder="e.g. 520" value={c.total} onChange={(e) => setChild(i, { total: e.target.value.replace(/[^0-9.]/g, '') })} />
                </div>
              )}
              {children.length > 1 && <button type="button" className="btn btn-small" onClick={() => setChildren((cs) => cs.filter((_, j) => j !== i))}>Remove child {i + 1}</button>}
            </fieldset>
          ))}
          {children.length < 4 && <button type="button" className="btn btn-small" onClick={() => setChildren((cs) => [...cs, { band: 2, total: '' }])}>Add another child</button>}
          <div className="field">
            <label htmlFor="calc-weeks">Weeks a year with a child placed: {weeks}</label>
            <input id="calc-weeks" type="range" min={10} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
            <p className="help">Payments stop between placements unless the service pays a retainer. 52 assumes a child all year.</p>
          </div>
        </div>

        <div className="calc-out" aria-live="polite">
          <table className="calc-table">
            <thead><tr><th scope="col">Child</th><th scope="col">Basis</th><th scope="col">Per week</th></tr></thead>
            <tbody>
              {rows.map((r, i) => <tr key={i}><td>Age {r.label}</td><td style={{ textAlign: 'left', fontSize: 14 }}>{r.note}</td><td>{gbp2(r.weekly)}</td></tr>)}
            </tbody>
          </table>
          <dl className="calc-totals">
            <div><dt>Per week</dt><dd>{gbp2(weekly)}</dd></div>
            <div><dt>Per year ({weeks} weeks)</dt><dd>{gbp(annual)}</dd></div>
            <div><dt>Tax-free under Qualifying Care Relief</dt><dd>{gbp(relief)}</dd></div>
            <div className="calc-big"><dt>Estimated taxable amount</dt><dd>{gbp(taxable)}</dd></div>
          </dl>
          <p className="muted" style={{ fontSize: 14 }}>
            {basis === 'minimum' ? MIN_NOTE[nation] + ' ' : ''}
            Qualifying Care Relief for 2026-27: £20,440 per household plus £435 a week for each child under 11 and £515 a week for each child aged 11 or over (GOV.UK). Only income above the relief is taxable, at your usual rates after your personal allowance. Typical packages are what services publish for one child and vary with the child&apos;s needs and your experience; a service&apos;s own quote always beats a typical figure. This is an estimate, not tax advice.
          </p>
        </div>
      </div>
    </div>
  );
}
