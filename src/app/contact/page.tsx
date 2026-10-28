import type { Metadata } from 'next';
import { ContactForm } from '@/components/ParamForms';

export const metadata: Metadata = {
  title: 'Talk to us',
  description: 'Ask about packages, advertising and recruitment marketing, or get in touch with the Fostering Today team.',
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  return (
    <div className="section-tight">
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
        <div style={{ flex: '1 1 420px' }}>
          <h1 className="display-l" style={{ marginBottom: 20 }}>Talk to us.</h1>
          <p className="lead">Ask about packages, advertising or recruitment marketing, or tell us about a mistake or a story idea.</p>
          <p style={{ marginTop: 20, fontSize: 18 }}>Prefer email? <a href="mailto:hello@fosteringtoday.com" style={{ fontWeight: 700 }}>hello@fosteringtoday.com</a></p>
        </div>
        <div className="form-card" style={{ flex: '1 1 460px' }}>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
