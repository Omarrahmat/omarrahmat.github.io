import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import DirectoryClient from '@/components/DirectoryClient';
import { directoryEntries, NATIONS, TYPE_LABEL } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'Find a fostering agency or local authority service',
  description:
    'Search fostering agencies and local authority fostering services across the UK. Every detail shows its source and the date it was checked.',
  alternates: { canonical: '/find-an-agency/' },
};

export default function FindAnAgency() {
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}>Find an agency</p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>Compare fostering services.</h1>
        <p className="lead" style={{ marginBottom: 32 }}>
          Each listing shows where its details came from and the date we looked. Details are from public records
          unless the provider has claimed the profile. Spotted a mistake? Report it from any profile, free of charge.
        </p>
        <Suspense fallback={<p>Loading the directory…</p>}>
          <DirectoryClient providers={directoryEntries} />
        </Suspense>

        <section style={{ marginTop: 72 }} aria-labelledby="all-h">
          <h2 id="all-h" style={{ fontSize: 32, marginBottom: 8 }}>Every service, by nation</h2>
          <p className="muted" style={{ marginBottom: 16 }}>A full list of the {directoryEntries.length} services in the directory.</p>
          {NATIONS.map((nation) => {
            const list = directoryEntries.filter((p) => p.nation === nation);
            if (list.length === 0) return null;
            return (
              <details key={nation} className="faq">
                <summary>{nation} ({list.length})</summary>
                <ul className="index-list">
                  {list.map((p) => (
                    <li key={p.id}>
                      <Link href={`/agency/${p.id}/`}>{p.name}</Link>
                      <span className="muted"> · {TYPE_LABEL[p.providerType]}{p.town ? ` · ${p.town}` : ''}</span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </section>
      </div>
    </div>
  );
}
