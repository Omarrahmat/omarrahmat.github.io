'use client';

import SimpleForm from '@/components/SimpleForm';

/** Visitor enquiry sent to one provider. Shown only on profiles with an active paid placement. */
export default function EnquiryForm({ providerId, providerName }: { providerId: string; providerName: string }) {
  return (
    <SimpleForm
      idPrefix="enq"
      table="enquiries"
      extra={{ provider_id: providerId, provider_name: providerName }}
      fields={[
        { name: 'name', label: 'Your name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'postcode', label: 'Postcode', required: true, placeholder: 'So they know you are in their area' },
        { name: 'best_time', label: 'Best time to call', type: 'select', required: true, options: ['Daytime', 'Evening', 'Weekend', 'Any time'] },
        { name: 'message', label: 'Anything you want to ask', type: 'textarea' },
      ]}
      consentText={`I agree that Fostering Today may pass these details to ${providerName} so it can contact me about fostering, and may keep a record of this enquiry. My details will not be shared with anyone else. See the privacy notice.`}
      submitLabel={`Send to ${providerName}`}
      successTitle="Sent."
      successBody={`${providerName} will contact you at the time you chose. If you don't hear back within a few days, you can also call them directly using the number on this page.`}
    />
  );
}
