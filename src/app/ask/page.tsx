import Link from 'next/link';
import type { Metadata } from 'next';
import { AskForm } from '@/components/ParamForms';

export const metadata: Metadata = {
  title: 'Ask a fostering service to call you',
  description: 'Thinking about fostering? Tell us where you live and when to ring, and one fostering service that covers your area will call you. Free, with no obligation.',
  alternates: { canonical: '/ask/' },
};

export default function AskPage() {
  return (
    <div className="section-tight">
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
        <div style={{ flex: '1 1 420px' }}>
          <h1 className="display-l" style={{ marginBottom: 20 }}>Ask a fostering service to call you.</h1>
          <p className="lead">
            Tell us where you live and when to ring. We pass your details to one fostering service that covers your area,
            and to no one else. It is free and there is no obligation.
          </p>
          <ol style={{ marginTop: 24, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 18 }}>
            <li>You fill in the form.</li>
            <li>We choose one service that covers your area: the council&rsquo;s own fostering service or an independent agency, as you prefer.</li>
            <li>It calls you at the time you chose. We email you its name, and if you have not heard within three working days, reply to that email and we will ask another.</li>
          </ol>
          <p className="muted" style={{ marginTop: 24, fontSize: 15 }}>
            Where a service has paid to be a Featured partner for your area, your enquiry goes to it first. Payment never
            changes how a service&rsquo;s details are checked. You can also <Link href="/find-an-agency/">compare every service yourself</Link> or{' '}
            <Link href="/calculator/">see what foster carers can earn</Link>.
          </p>
        </div>
        <div className="form-card" style={{ flex: '1 1 460px' }}>
          <AskForm />
        </div>
      </div>
    </div>
  );
}
