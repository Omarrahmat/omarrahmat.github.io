'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DirectoryEntry } from '@/types';
import { ProviderCard } from '@/components/ProviderParts';
import { trackImpressions, trackSearch } from '@/lib/supa';
import { NATIONS, FOSTERING_LABEL, TYPE_LABEL, pinnedFor } from '@/lib/providers';

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

const PAGE = 24;

export default function DirectoryClient({ providers }: { providers: DirectoryEntry[] }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [nation, setNation] = useState(params.get('nation') ?? '');
  const [type, setType] = useState(params.get('type') ?? '');
  const [ft, setFt] = useState(params.get('ft') ?? '');
  const [shown, setShown] = useState(PAGE);
  // The query string is not known until the page has loaded in the browser.
  const search = params.toString();
  useEffect(() => {
    setQ(params.get('q') ?? '');
    setNation(params.get('nation') ?? '');
    setType(params.get('type') ?? '');
    setFt(params.get('ft') ?? '');
    setShown(PAGE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const results = useMemo(() => {
    const nq = norm(q);
    const compactQ = nq.replace(/ /g, '');
    return providers.filter((p) => {
      if (nation && p.nation !== nation) return false;
      if (type && p.providerType !== type) return false;
      if (ft && !p.fosteringTypes.includes(ft as never)) return false;
      if (!nq) return true;
      const hay = norm([p.name, p.town ?? '', ...p.areasServed, ...p.placementAreas].join(' '));
      if (hay.includes(nq)) return true;
      const pc = (p.postcode ?? '').toLowerCase().replace(/ /g, '');
      return pc.length > 0 && compactQ.length >= 2 && pc.startsWith(compactQ);
    });
  }, [providers, q, nation, type, ft]);

  const filtersActive = Boolean(q || nation || type || ft);
  const pinned = useMemo(() => pinnedFor(results, q, nation), [results, q, nation]);
  const pinnedIds = new Set(pinned.map((p) => p.id));
  const ordered = [...pinned, ...results.filter((p) => !pinnedIds.has(p.id))];
  const visible = ordered.slice(0, shown);
  // Count searches for places we list (never free text), so Premium partners can see demand in their areas.
  const areaSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of providers) { for (const a of p.areasServed) set.add(norm(a)); if (p.town) set.add(norm(p.town)); }
    set.delete('');
    return set;
  }, [providers]);
  useEffect(() => {
    const nq = norm(q);
    if (nq.length < 3) return;
    const t = setTimeout(() => {
      let best = areaSet.has(nq) ? nq : '';
      if (!best) for (const a of areaSet) if (a.length > best.length && (' ' + nq + ' ').includes(' ' + a + ' ')) best = a;
      if (best) trackSearch(best);
    }, 2000);
    return () => clearTimeout(t);
  }, [q, areaSet]);
  const visibleKey = visible.map((p) => p.id).join(',');
  useEffect(() => {
    const t = setTimeout(() => trackImpressions(visibleKey ? visibleKey.split(',') : []), 1500);
    return () => clearTimeout(t);
  }, [visibleKey]);

  return (
    <>
      <form className="search-card" role="search" onSubmit={(e) => e.preventDefault()} style={{ maxWidth: 'none' }}>
        <div className="field field-wide">
          <label htmlFor="d-q">Town, postcode or name</label>
          <input id="d-q" className="input" type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="e.g. Cardiff or CF10" />
        </div>
        <div className="field">
          <label htmlFor="d-nation">Nation</label>
          <select id="d-nation" className="select" value={nation} onChange={(e) => { setNation(e.target.value); setShown(PAGE); }}>
            <option value="">All nations</option>
            {NATIONS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="d-type">Provider</label>
          <select id="d-type" className="select" value={type} onChange={(e) => { setType(e.target.value); setShown(PAGE); }}>
            <option value="">Agency or council</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="d-ft">Type of fostering</label>
          <select id="d-ft" className="select" value={ft} onChange={(e) => { setFt(e.target.value); setShown(PAGE); }}>
            <option value="">Any type</option>
            {Object.entries(FOSTERING_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {filtersActive && (
          <button type="button" className="btn btn-small" onClick={() => { setQ(''); setNation(''); setType(''); setFt(''); setShown(PAGE); }}>
            Clear filters
          </button>
        )}
      </form>

      <p className="result-count" style={{ margin: '28px 0 16px' }} role="status" aria-live="polite">
        {providers.length === 0
          ? 'No providers loaded yet.'
          : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
      </p>

      {providers.length === 0 && (
        <div className="empty"><h2 style={{ fontSize: 28 }}>The directory is being compiled.</h2><p className="muted" style={{ marginTop: 8 }}>Check back soon.</p></div>
      )}
      {providers.length > 0 && results.length === 0 && (
        <div className="empty">
          <h2 style={{ fontSize: 28 }}>Nothing matches yet.</h2>
          <p className="muted" style={{ marginTop: 8, maxWidth: 620 }}>
            Try fewer filters or a different spelling. Some areas are still being added. If you run a fostering
            service that is missing, you can add it for free.
          </p>
        </div>
      )}
      <div className="grid-3">
        {visible.map((p) => <ProviderCard key={p.id} provider={p} featured={pinnedIds.has(p.id)} />)}
      </div>
      {results.length > visible.length && (
        <p style={{ textAlign: 'center', marginTop: 32 }}>
          <button type="button" className="btn btn-dark" onClick={() => setShown((n) => n + PAGE)}>
            Show more ({results.length - visible.length} remaining)
          </button>
        </p>
      )}
    </>
  );
}
