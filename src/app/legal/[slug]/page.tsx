import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const PAGES: Record<string, { title: string; summary: string }> = {
  privacy: { title: 'Privacy notice', summary: 'How we collect and use personal data.' },
  cookies: { title: 'Cookie notice', summary: 'How we use cookies and similar technologies.' },
  terms: { title: 'Terms of use', summary: 'The terms for using this website.' },
  'editorial-policy': { title: 'Editorial policy', summary: 'How we research, check and correct what we publish.' },
  corrections: { title: 'Corrections policy', summary: 'How to ask for a correction and what happens next.' },
};


const UPDATED = '28 October 2026';

const PRIVACY = (
  <>
    <p className="muted">Last updated {UPDATED}</p>
    <h2>Who we are</h2>
    <p>
      Fostering Today (fosteringtoday.com) is operated by Urban Carers Ltd, registered in England and Wales, company number 15419139,
      3rd Floor, 45 Albemarle Street, London, England, W1S 4JL. Urban Carers Ltd is the controller of the personal data described here.
      You can reach us at <a href="mailto:hello@fosteringtoday.com">hello@fosteringtoday.com</a>.
    </p>
    <h2>What we collect, why, and how long we keep it</h2>
    <ul>
      <li><strong>Newsletter sign-up.</strong> Your email address and the time you agreed. We use it to send the newsletter. Our basis is your consent. We keep it until you unsubscribe, then keep only a record that you opted out so we do not email you again.</li>
      <li><strong>Contact and enquiry forms.</strong> Your name, email address, organisation, and what you write. We use it to reply and to deal with your enquiry. Our basis is our legitimate interest in answering people who contact us, or taking steps you ask for before a contract. We normally delete these within 24 months of the last message.</li>
      <li><strong>Claiming a listing.</strong> Your name, role, organisation, and contact details, so we can check you are authorised to speak for the service. Basis: legitimate interest in keeping the directory accurate. We keep the record for as long as the listing is claimed and for a reasonable period afterwards.</li>
      <li><strong>Correction requests.</strong> What you say is wrong, any contact details you give, and the evidence. Basis: legitimate interest in keeping the directory accurate. Kept for 24 months so we can show what changed and why.</li>
      <li><strong>Emails you send us.</strong> The message, your address and anything you include. Please do not send us personal details about children or anyone in care; we do not need them.</li>
      <li><strong>Paying for a placement.</strong> Payments are taken by Stripe. We receive your organisation name, billing address, email, and the status of the subscription. We never see full card or bank details. We keep accounting records for as long as the law requires (currently six years).</li>
      <li><strong>Business contacts.</strong> We email organisations that run fostering services, using generic organisational addresses published on their website or in public records. This is business to business contact. Our basis is legitimate interest in telling providers about their free listing and our paid options. Every email gives a clear way to opt out, and we keep a suppression list so we do not contact you again.</li>
      <li><strong>Visits to the website.</strong> We use Plausible Analytics. It uses no cookies, does not track you across other websites and does not build a profile of you. It records page views, the page you came from, country, browser and device type in aggregate.</li>
    </ul>
    <p>The directory itself describes organisations, using information from regulators, councils and the providers&rsquo; own websites, with the source shown. Where a listing includes a person&rsquo;s name or contact detail, tell us if it is wrong or should not be there and we will correct or remove it.</p>
    <h2>Who handles your data for us</h2>
    <p>We use these services to run the site. They act on our instructions, except where stated.</p>
    <ul>
      <li>Supabase: database that stores form submissions.</li>
      <li>AgentMail: sends and receives email for hello@fosteringtoday.com.</li>
      <li>Plausible Analytics: website statistics.</li>
      <li>Stripe: payments. Stripe is also an independent controller for its own legal and fraud-prevention duties.</li>
      <li>GitHub Pages: hosts the website and sees ordinary connection data such as IP addresses.</li>
      <li>Google Fonts: the site loads its typefaces from Google, which receives your IP address when a page loads.</li>
      <li>AI tools from Anthropic: help our team read, sort and draft replies to messages and form submissions. People review anything involving payments, complaints, legal questions or safeguarding before it is acted on. We do not use your messages to make decisions that have legal or similarly significant effects on you.</li>
    </ul>
    <p>Some of these providers are based outside the UK, including in the United States. Where that happens we rely on UK adequacy arrangements or appropriate safeguards such as the UK International Data Transfer Addendum. We do not sell personal data and we do not share enquiries with other providers.</p>
    <h2>Your rights</h2>
    <p>
      You can ask to see the personal data we hold about you, to have it corrected or deleted, to restrict or object to how we use it, and to
      receive a copy in a portable form. Where we rely on your consent you can withdraw it at any time, for example by using the unsubscribe
      link in any newsletter or replying &ldquo;unsubscribe&rdquo;. Email <a href="mailto:hello@fosteringtoday.com">hello@fosteringtoday.com</a> and we will respond within one month.
    </p>
    <p>
      If you are unhappy with how we have handled your data, you can complain to the Information Commissioner&rsquo;s Office at
      <a href="https://ico.org.uk/make-a-complaint/"> ico.org.uk</a> or on 0303 123 1113. We would like the chance to put it right first.
    </p>
    <h2>Children</h2>
    <p>This website is for adults and organisations. We do not knowingly collect personal data from children.</p>
    <h2>Changes</h2>
    <p>If we change this notice in a way that matters, we will update the date at the top and, where it affects newsletter subscribers, tell them.</p>
  </>
);

const COOKIES = (
  <>
    <p className="muted">Last updated {UPDATED}</p>
    <h2>The short version</h2>
    <p>Fostering Today does not use advertising, tracking or profiling cookies, so there is no cookie banner to accept.</p>
    <h2>What runs on this site</h2>
    <ul>
      <li><strong>Analytics.</strong> We use Plausible Analytics, which works without cookies and without storing anything on your device. It counts visits in aggregate and does not follow you around the web.</li>
      <li><strong>Fonts.</strong> The site loads its typefaces from Google Fonts. Google receives your IP address and browser details to deliver them. This does not set a tracking cookie on this site.</li>
      <li><strong>Paying us.</strong> If you subscribe to a placement you leave this site for a Stripe checkout page. Stripe uses its own cookies there, for security and fraud prevention. Their policy is at stripe.com/cookies-policy/legal.</li>
      <li><strong>Forms.</strong> When you send a form, it goes to our database. Nothing is kept on your device.</li>
    </ul>
    <h2>Your choices</h2>
    <p>You can block or delete cookies in your browser settings at any time; the site works the same without them. See our <a href="/legal/privacy/">privacy notice</a> for how we use personal data, or email <a href="mailto:hello@fosteringtoday.com">hello@fosteringtoday.com</a> with any question.</p>
  </>
);

const BODIES: Record<string, React.ReactNode> = { privacy: PRIVACY, cookies: COOKIES };

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PAGES[slug];
  return p ? { title: p.title, description: p.summary, alternates: { canonical: `/legal/${slug}/` } } : {};
}

export default async function Legal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PAGES[slug];
  if (!p) notFound();
  return (
    <div className="section-tight">
      <div className="container" style={{ maxWidth: 780 }}>
        <h1 className="display-l" style={{ marginBottom: 20 }}>{p.title}</h1>
        {BODIES[slug] ? (
          <div className="legal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{BODIES[slug]}</div>
        ) : (
          <>
            <div className="notice notice-warn">
              <strong>Draft: awaiting legal review.</strong> This page has not been finalised and should not be relied on. The full text will be
              published here once it has been reviewed by a qualified adviser.
            </div>
            <p className="lead" style={{ marginTop: 24 }}>{p.summary}</p>
            <p className="muted" style={{ marginTop: 16 }}>
              Questions or corrections in the meantime: please use the <a href="/contact/">contact form</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
