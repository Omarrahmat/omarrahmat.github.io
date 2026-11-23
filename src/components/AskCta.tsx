import Link from 'next/link';

/**
 * The way from an article to the "ask for a call" form (22 Nov 2026). It sits at the end of every guide and news
 * story and on the pay overview, where people who are reading about fostering are. `from` is recorded with the
 * enquiry so we can see which pages bring them. Never use this on a service's own profile: nothing goes on a
 * service's page that sends its visitors to another service.
 */
export default function AskCta({ from }: { from: 'guide' | 'news' | 'payments' }) {
  return (
    <aside className="notice notice-ok ask-cta" aria-labelledby="ask-cta-h" style={{ margin: '36px 0 28px', maxWidth: from === 'payments' ? 820 : undefined }}>
      <h2 id="ask-cta-h" style={{ fontSize: 24, marginBottom: 8 }}>Thinking about fostering?</h2>
      <p style={{ marginBottom: 14 }}>
        Tell us where you live and when to ring, and one fostering service that covers your area will call you. It is free and there is no obligation.
      </p>
      <p style={{ marginBottom: 0 }}>
        <Link href={`/ask/?from=${from}`} className="btn btn-dark btn-small">Ask a fostering service to call you</Link>
      </p>
    </aside>
  );
}
