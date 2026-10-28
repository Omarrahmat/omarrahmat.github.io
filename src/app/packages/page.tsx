import Link from 'next/link';
import type { Metadata } from 'next';
import { providers, PINNED_SLOTS } from '@/lib/providers';
import payments from '@/data/payments.json';

export const metadata: Metadata = {
  title: 'Packages for fostering agencies and councils',
  description: 'Every fostering service gets a free profile with its logo. Featured and Premium placements pin your listing in the areas you recruit in, always labelled. Indicative pricing.',
  alternates: { canonical: '/packages/' },
};

const tiers = [
  {
    name: 'Free listing', price: '£0', note: 'Always free', bg: 'var(--white)', cta: 'Claim your free profile', href: '/claim/', pay: '',
    items: [
      'Your own profile page, indexed by search engines',
      'Your logo, shown on your profile and in search results',
      'Contact details, areas served and types of fostering, each with its source shown',
      'Listed in the directory search and the A–Z of every service',
      'Claim it, correct it and keep it up to date, free of charge',
      'A "Listed on Fostering Today" badge for your own website',
    ],
  },
  {
    name: 'Featured Agency', price: 'from £199', note: 'per month, indicative', bg: 'var(--yellow)', cta: 'Ask about Featured', href: '/contact/?plan=featured', pay: (payments as any).featured as string,
    items: [
      'Everything in Free',
      'Pinned first on the local page for up to five areas you choose (for example "Fostering agencies in Croydon") and in search results, with a "Featured" label',
      'Richer profile: your logo, a longer description and a prominent button to your recruitment page, all edited by you in the agency portal',
      'Enquiry form on your profile, sent straight to your recruitment team',
      'Agency portal statistics: appearances in results, profile views, clicks to your website, recruitment page and phone, and enquiries',
      'Monthly rolling; change your areas whenever you like',
    ],
  },
  {
    name: 'Premium Recruitment Partner', price: 'from £799', note: 'per month, indicative', bg: 'var(--lilac)', cta: 'Ask about Premium', href: '/contact/?plan=premium', pay: (payments as any).premium as string,
    items: [
      'Everything in Featured',
      'Pinned first on the local page for every area you cover, and when visitors filter by your nation',
      'Area demand report in your portal: how many people search for each of your areas, month on month',
      'One sponsored slot a month in a guide or the newsletter, labelled as sponsored',
      'A recruitment-drive feature written with you and labelled as sponsored',
      'Named contact, with changes to your areas or profile made the same working day',
    ],
  },
];

const rows: [string, string, string, string][] = [
  ['Profile page with logo', 'Yes', 'Yes', 'Yes'],
  ['Appears in search and the A–Z', 'Yes', 'Yes', 'Yes'],
  ['Claim, correct, keep up to date', 'Yes', 'Yes', 'Yes'],
  ['Badge for your website', 'Yes', 'Yes', 'Yes'],
  ['Pinned first on area pages and in results', 'No', 'Up to 5 areas', 'All your areas and your nation'],
  ['Logo, longer description, recruitment button', 'No', 'Yes', 'Yes'],
  ['Enquiry form on your profile', 'No', 'Yes', 'Yes'],
  ['Sponsored slot in a guide or newsletter', 'No', 'No', 'Monthly'],
  ['Recruitment-drive feature', 'No', 'No', 'Yes'],
  ['Portal statistics (views, clicks, enquiries)', 'No', 'Yes', 'Yes'],
  ['Area demand report', 'No', 'No', 'Yes'],
  ['Named contact, same-day changes', 'No', 'No', 'Yes'],
];

export default function Packages() {
  const count = providers.length;
  return (
    <div className="section-tight">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--forest)' }}>For agencies and local authorities</p>
        <h1 className="display-l" style={{ margin: '12px 0 16px' }}>Free to be found. Paid to be seen.</h1>
        <p className="lead" style={{ marginBottom: 12 }}>
          All {count} fostering services in the UK are listed here free, logo included. Paid placements put you first in the
          places you recruit, always labelled so visitors know what they are looking at.
        </p>
        <p className="muted" style={{ marginBottom: 40, fontSize: 15 }}>
          Prices are indicative while we finalise packages. Payment never changes how information is checked or corrected.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {tiers.map((t) => (
            <section key={t.name} className="price-card" style={{ background: t.bg }} aria-labelledby={`t-${t.name}`}>
              <h2 id={`t-${t.name}`} style={{ fontSize: 28 }}>{t.name}</h2>
              <p style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 44, margin: '12px 0 0' }}>{t.price}</p>
              <p className="muted" style={{ marginBottom: 20 }}>{t.note}</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, marginBottom: 24 }}>
                {t.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
              {t.pay ? (
                <>
                  <a className="btn btn-dark" href={t.pay} rel="noopener">Subscribe: card or Direct Debit</a>
                  <Link className="btn btn-small" href={t.href} style={{ marginTop: 10 }}>Or ask a question first</Link>
                </>
              ) : (
                <Link className="btn" href={t.href}>{t.cta}</Link>
              )}
            </section>
          ))}
        </div>

        <h2 style={{ fontSize: 36, margin: '64px 0 16px' }}>How placement works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>1. You choose your areas</h3>
            <p>Towns or council areas where you recruit foster carers: Cardiff, Leeds, Kent, and so on. Featured covers up to five; Premium covers every area you serve.</p>
          </div>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>2. Visitors search those areas</h3>
            <p>When someone searches one of your areas (or, for Premium, filters by your nation), your card is pinned to the top of the results with a &ldquo;Featured&rdquo; label and a distinct outline. Everywhere else your listing sits in its normal place.</p>
          </div>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>3. It stays fair</h3>
            <p>At most {PINNED_SLOTS} pinned listings per search. If more qualify for an area, the slots rotate daily so each partner gets equal time at the top. Nothing is pinned on an empty search.</p>
          </div>
        </div>

        <h2 style={{ fontSize: 36, margin: '64px 0 16px' }}>Why partners go Featured</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>You reach people at the moment they choose</h3>
            <p>Our visitors are not browsing. They have typed their town into a fostering directory because they are deciding who to call. Being the first card they see, in the areas you recruit in, is the difference between their enquiry and a competitor&rsquo;s.</p>
          </div>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>Every enquiry is yours, not shared</h3>
            <p>Enquiries from your profile go straight to your team. We never sell leads, pass details around or charge per enquiry. One fixed monthly price, however many people get in touch.</p>
          </div>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>Your profile keeps working for you</h3>
            <p>Each profile is a page of its own in search engines, so searches like &ldquo;fostering agencies in Cardiff&rdquo; land on your listing, and the badge on your site links back to it. Featured partners get the richer profile that turns that traffic into enquiries.</p>
          </div>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>You see exactly what you get</h3>
            <p>Every month: profile views, how often you appeared in searches and for which areas, clicks to your recruitment page and enquiries received, each compared with the month before. If the numbers do not justify the price, you stop; there is no long contract.</p>
          </div>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>Scarce by design</h3>
            <p>No more than three pinned listings per search, and the slots rotate fairly. Placement is worth having because not everyone can have it. Founding partners get first choice of areas and keep their launch price for twelve months.</p>
          </div>
          <div className="notice">
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>Trusted by the people you want to reach</h3>
            <p>Visitors can see where every detail on the site came from, and paid placement is always labelled. That openness is why they trust the listing at the top, and why a Featured card reads as a recommendation, not an advert.</p>
          </div>
        </div>

        <h2 style={{ fontSize: 36, margin: '64px 0 20px' }}>Compare</h2>
        <div className="compare-wrap">
          <table className="compare">
            <thead><tr><th scope="col">Feature</th><th scope="col">Free</th><th scope="col">Featured</th><th scope="col">Premium</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]}>
                  <th scope="row">{r[0]}</th>
                  {r.slice(1).map((c, i) => <td key={i} className={c === 'No' ? 'no' : ''}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: 36, margin: '64px 0 8px' }}>Questions</h2>
        <details className="faq"><summary>Is the logo really free?</summary><p>Yes. Once you claim your profile you can add your logo at no cost. Until then your listing shows an initials tile.</p></details>
        <details className="faq"><summary>Does paying change what you publish about us?</summary><p>No. Paid and free providers are checked and corrected the same way. Paid placements and sponsored content are always labelled, and links from paid placements are marked as sponsored for search engines.</p></details>
        <details className="faq"><summary>How quickly can we go live?</summary><p>Tell us your areas and your placement is live within one working day. You can add your logo, description and recruitment link yourself in the agency portal as soon as your profile is claimed.</p></details>
        <details className="faq"><summary>Can we change our areas or stop?</summary><p>Yes. Change your areas whenever you like, and the subscription is monthly rolling with no long contract.</p></details>
        <details className="faq"><summary>What is included from day one?</summary><p>Your free profile, claims and corrections, pinned placement in your areas and the badge for your website are live now. The richer profile, the enquiry form and your portal statistics are live too. Sponsored slots and recruitment-drive features are arranged with you directly, and we never charge for a feature before it exists.</p></details>
        <details className="faq" style={{ borderBottom: '2px solid var(--ink)' }}><summary>Are these prices final?</summary><p>No. They are starting points. Contact us for current pricing and a written quote.</p></details>
      </div>
    </div>
  );
}
