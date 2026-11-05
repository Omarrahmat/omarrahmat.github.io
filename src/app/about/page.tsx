import Link from 'next/link';
import type { Metadata } from 'next';
import { providers } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'About Fostering Today',
  description: 'Fostering Today was started by Omar, a foster carer for about seven years, to give people thinking about fostering one honest place to compare every UK fostering service.',
  alternates: { canonical: '/about/' },
};

export default function About() {
  return (
    <div className="section-tight">
      <div className="container" style={{ maxWidth: 780 }}>
        <h1 className="display-l" style={{ marginBottom: 20 }}>About Fostering Today</h1>
        <div className="legal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p className="lead">Fostering Today was started by Omar, a foster carer for about seven years.</p>
          <p>
            When I began fostering, the hardest part wasn&rsquo;t the assessment. It was knowing where to start. Every agency and council said
            something different about pay, support and what to expect, and there was no single place to compare them honestly.
          </p>
          <p>
            Fostering Today is that place. It lists every fostering agency and council fostering service in the UK ({providers.length} services),
            built from public records, alongside plain-English guides and the allowances councils actually publish, each linked to its official
            source so you can check it yourself.
          </p>
          <h2>What we promise you</h2>
          <ul>
            <li><strong>Facts from official sources.</strong> Every pay figure and rule links to the council, gov.uk or regulator page it comes from. If something is wrong, tell us on the listing and we will correct it (see our <Link href="/legal/corrections/">corrections policy</Link>).</li>
            <li><strong>Paid placements are always labelled.</strong> Agencies can pay to be shown first in their areas. That never changes what we say about them, and we never charge per enquiry.</li>
            <li><strong>No pressure.</strong> We don&rsquo;t sell your details. When you contact an agency through us, your message goes to that agency only.</li>
          </ul>
          <h2>How the site is made</h2>
          <p>
            A small team, with software tools that help us research and keep every listing up to date. Every page is checked against official
            sources before it goes live. Read more in our <Link href="/legal/editorial-policy/">editorial policy</Link>.
          </p>
          <p style={{ marginTop: 10 }}>
            Thinking about fostering? Start with <Link href="/calculator/">how much foster carers are paid</Link> or{' '}
            <Link href="/find-an-agency/">find fostering services near you</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
