'use client';

import SimpleForm from '@/components/SimpleForm';

/**
 * Visitor enquiry about one provider. Shown only on profiles with an active placement.
 * Normally the enquiry is passed to the provider, which contacts the visitor. With `handledByUs` (a pilot partner in
 * data/owner-handled.json) it comes to Fostering Today's own team, who make the first call, so every line the visitor
 * reads and agrees to says that instead.
 */
export default function EnquiryForm({ providerId, providerName, handledByUs = false }: { providerId: string; providerName: string; handledByUs?: boolean }) {
  return (
    <SimpleForm
      idPrefix="enq"
      table="enquiries"
      extra={{ provider_id: providerId, provider_name: providerName }}
      fields={[
        { name: 'name', label: 'Your name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'postcode', label: 'Postcode', required: true, placeholder: handledByUs ? 'So we know where you are' : 'So they know you are in their area' },
        { name: 'best_time', label: 'Best time to call', type: 'select', required: true, options: ['Daytime', 'Evening', 'Weekend', 'Any time'] },
        { name: 'message', label: 'Anything you want to ask', type: 'textarea' },
      ]}
      consentText={handledByUs
        ? `I agree that Fostering Today may contact me about fostering with ${providerName}, may pass these details to ${providerName}, and may keep a record of this enquiry. My details will not be shared with anyone else. See the privacy notice.`
        : `I agree that Fostering Today may pass these details to ${providerName} so it can contact me about fostering, and may keep a record of this enquiry. My details will not be shared with anyone else. See the privacy notice.`}
      submitLabel={handledByUs ? 'Send my enquiry' : `Send to ${providerName}`}
      successTitle="Sent."
      successBody={handledByUs
        ? `The Fostering Today team will call you at the time you chose about fostering with ${providerName}.`
        : `${providerName} will contact you at the time you chose. If you don't hear back within a few days, you can also call them directly using the number on this page.`}
    />
  );
}
