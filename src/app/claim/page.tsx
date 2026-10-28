import type { Metadata } from 'next';
import { ClaimForm } from '@/components/ParamForms';
import { providers } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'Claim your free profile',
  description: 'Fostering agencies and local authority fostering services can claim and update their profile for free.',
  alternates: { canonical: '/claim/' },
};

export default function ClaimPage() {
  const list = providers.map((p) => ({ id: p.id, name: p.name }));
  return (
    <div className="section-tight">
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
        <div style={{ flex: '1 1 420px' }}>
          <p className="eyebrow" style={{ color: 'var(--forest)' }}>For agencies and local authorities</p>
          <h1 className="display-l" style={{ margin: '12px 0 20px' }}>Claim your free profile.</h1>
          <p className="lead" style={{ marginBottom: 24 }}>
            Your profile may already be here, built from public records. Claim it to check the details, add your logo
            and keep it up to date.
          </p>
          <ol style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 18 }}>
            <li>Find your listing and send a claim request.</li>
            <li>We check you&apos;re authorised to represent the organisation.</li>
            <li>You get secure access to manage the profile.</li>
            <li>Optionally, explore upgrades. There is never any pressure to pay.</li>
          </ol>
          <p className="muted" style={{ marginTop: 24, fontSize: 15 }}>Claiming and correcting a basic profile, including adding your logo, is always free.</p>
          <div className="notice" style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Already listed? Link to your profile</h2>
            <p style={{ marginBottom: 12 }}>Every profile page has a &ldquo;Listed on Fostering Today&rdquo; badge with a snippet you can paste on your own site. It points carers to your profile and helps both sites in search.</p>
            <p><img src="/badge.svg" alt="Listed on Fostering Today" width={220} height={48} /></p>
          </div>
        </div>
        <div className="form-card" style={{ flex: '1 1 460px' }}>
          <ClaimForm providers={list} />
        </div>
      </div>
    </div>
  );
}
