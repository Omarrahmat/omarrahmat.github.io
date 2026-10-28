'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SimpleForm from '@/components/SimpleForm';
import type { Provider } from '@/types';

function ClaimInner({ providers }: { providers: Pick<Provider, 'id' | 'name'>[] }) {
  const params = useSearchParams();
  const wanted = params.get('provider');
  const preset = providers.find((p) => p.id === wanted);
  const options = providers.map((p) => p.name);
  return (
    <SimpleForm
      idPrefix="claim"
      table="claim_requests"
      extra={preset ? { provider_id: preset.id } : {}}
      fields={[
        { name: 'provider_name', label: 'Your organisation', type: 'datalist', required: true, options, defaultValue: preset?.name, help: 'Start typing to find your listing. Not listed? Type its name and we will add it.' },
        { name: 'requester_name', label: 'Your name', required: true },
        { name: 'requester_role', label: 'Your role', required: true, placeholder: 'e.g. Registered manager, Marketing lead' },
        { name: 'work_email', label: 'Work email', type: 'email', required: true, help: 'We use this to check you work for the organisation. Please use an organisation address, not a personal one.' },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'verification_notes', label: 'Anything that helps us check you can represent this organisation', type: 'textarea' },
      ]}
      consentText="I confirm I am authorised to represent this organisation. I agree that Fostering Today may use these details to verify my claim and contact me about it."
      submitLabel="Request to claim this profile"
      successTitle="Claim request received."
      successBody="We'll check that you're authorised to represent the organisation, then email you about next steps. Claiming a basic profile is free."
    />
  );
}

export function ClaimForm({ providers }: { providers: Pick<Provider, 'id' | 'name'>[] }) {
  return (
    <Suspense fallback={<p>Loading the form…</p>}>
      <ClaimInner providers={providers} />
    </Suspense>
  );
}

function ContactInner() {
  const params = useSearchParams();
  const plan = params.get('plan');
  const label = plan === 'featured' ? 'Featured Agency' : plan === 'premium' ? 'Premium Recruitment Partner' : plan === 'council' ? 'Featured placement (local authority)' : '';
  return (
    <SimpleForm
      idPrefix="contact"
      table="contact_requests"
      fields={[
        { name: 'name', label: 'Your name', required: true },
        { name: 'organisation', label: 'Organisation' },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'interest', label: 'What are you interested in?', type: 'select', required: true, options: ['Featured Agency', 'Premium Recruitment Partner', 'Advertising or sponsorship', 'Recruitment marketing', 'Something else'], defaultValue: label || undefined },
        { name: 'message', label: 'Message', type: 'textarea' },
      ]}
      consentText="I agree that Fostering Today may use these details to reply to my enquiry."
      submitLabel="Send message"
      successTitle="Thanks, we'll be in touch."
      successBody="We'll reply to the email address you gave."
    />
  );
}

export function ContactForm() {
  return (
    <Suspense fallback={<p>Loading the form…</p>}>
      <ContactInner />
    </Suspense>
  );
}
