import Link from 'next/link';
import SimpleForm from '@/components/SimpleForm';
import { providers, countByNation } from '@/lib/providers';
import { articles } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleParts';
import { guides } from '@/lib/guides';
import payStats from '@/data/pay-stats.json';
import { FOSTERING_LABEL } from '@/lib/providers';

const GUIDES = [
  ['How to become a foster carer', 'From first enquiry to approval, explained plainly.'],
  ['Eligibility and requirements', 'Who can foster, and the questions people ask first.'],
  ['Assessment and approval', 'What happens, who you will meet, how long to plan for.'],
  ['Types of fostering', 'Short-term, long-term and emergency compared.'],
  ['Fostering teenagers', 'Practical guidance for carers supporting young people.'],
  ['Working with social workers', 'How the relationship works and how to make the most of it.'],
];

function HeroArt() {
  return (
    <svg viewBox="0 0 520 560" width="100%" role="img" aria-label="Illustration of a home made of arches, a sun and a small figure" style={{ display: 'block' }}>
      <circle cx="400" cy="120" r="96" fill="#FFC933" />
      <circle cx="86" cy="100" r="42" fill="#D8CCFF" />
      <path d="M40 560V250a150 150 0 0 1 300 0V560z" fill="#0F3D33" />
      <path d="M300 560V340a90 90 0 0 1 180 0V560z" fill="#FF6A4D" />
      <path d="M105 560V300a85 85 0 0 1 170 0V560z" fill="#FBF4E6" />
      <circle cx="190" cy="372" r="30" fill="#FF6A4D" />
      <path d="M130 560a60 60 0 0 1 120 0z" fill="#0F3D33" />
      <circle cx="392" cy="420" r="20" fill="#FFC933" />
      <path d="M352 560a40 40 0 0 1 80 0z" fill="#14130F" />
    </svg>
  );
}

export default function Home() {
  const total = providers.length;
  const nations = countByNation();
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <h1 className="display-xl">
              <span style={{ display: 'block' }}>Fostering <span className="hl">news.</span></span>
              <span style={{ display: 'block', color: 'var(--forest)' }}>Expert advice.</span>
              <span style={{ display: 'block' }}>The right <span style={{ color: 'var(--coral-text)' }}>connections.</span></span>
            </h1>
            <p className="lead" style={{ margin: '28px 0 34px' }}>
              The independent guide to fostering across England, Scotland, Wales and Northern Ireland. Real
              reporting, plain-English guides and a directory that shows where every detail came from.
            </p>
            <form className="search-card" action="/find-an-agency/" method="get" role="search">
              <div className="field field-wide">
                <label htmlFor="hero-q">Town, postcode or name</label>
                <input id="hero-q" name="q" className="input" type="text" placeholder="e.g. Cardiff or CF10" />
              </div>
              <div className="field">
                <label htmlFor="hero-ft">Type of fostering</label>
                <select id="hero-ft" name="ft" className="select" defaultValue="">
                  <option value="">Any type</option>
                  {['short-term', 'long-term', 'emergency', 'respite', 'teenagers'].map((t) => (
                    <option key={t} value={t}>{FOSTERING_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-dark">Find an agency</button>
            </form>
            <p style={{ marginTop: 20, fontSize: 15, display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
              <strong>Or start here:</strong>
              <Link href={guides[0] ? `/guides/${guides[0].slug}/` : '/guides/'} style={{ color: 'var(--forest)', fontWeight: 700 }}>How to become a foster carer</Link>
              <Link href="/calculator/" style={{ color: 'var(--forest)', fontWeight: 700 }}>What could fostering pay you?</Link>
              <Link href="/payments/" style={{ color: 'var(--forest)', fontWeight: 700 }}>Fostering allowances</Link>
            </p>
          </div>
          <div className="hero-art">
            <HeroArt />
            <div className="sticker">Independent · UK-wide</div>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 88 }}>
        <div className="container grid-3">
          <div className="step-card bg-yellow"><span className="step-num">01</span><span className="step-title">Read</span><p style={{ marginTop: 8 }}>Plain-English guides and independent news, with sources shown on every article.</p></div>
          <div className="step-card bg-coral"><span className="step-num">02</span><span className="step-title">Compare</span><p style={{ marginTop: 8 }}>Agencies and councils side by side, with the source of each detail labelled.</p></div>
          <div className="step-card bg-lilac"><span className="step-num">03</span><span className="step-title">Connect</span><p style={{ marginTop: 8 }}>Go straight to a provider you choose. We never pass your details on without asking.</p></div>
        </div>
      </section>

      <section className="section bg-forest">
        <div className="container">
          <p className="eyebrow" style={{ color: 'var(--yellow)' }}>The directory</p>
          <h2 className="display-l" style={{ margin: '12px 0 20px' }}>
            {total > 0 ? <>{total} fostering services and counting.</> : <>The directory is being built.</>}
          </h2>
          <p className="lead" style={{ color: '#dcebe5', marginBottom: 32 }}>
            Every listing comes from a public record and shows its source and the date we looked. Providers can
            claim their profile and correct it for free.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {nations.map((n) => (
              <Link key={n.nation} href={`/find-an-agency/?nation=${encodeURIComponent(n.nation)}`} className="pill-link">
                {n.nation}{n.count > 0 ? ` · ${n.count}` : ' · coming soon'}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="display-l" style={{ marginBottom: 24 }}>Guides, <span style={{ color: 'var(--coral-text)' }}>sourced.</span></h2>
          <p className="lead" style={{ marginBottom: 28 }}>
            Our guides are written and checked against official sources before they go live, with the sources listed on every page.
          </p>
          <div className="guide-list">
            {(guides.length ? guides.map((g) => [g.title, g.standfirst, `/guides/${g.slug}/`] as const) : GUIDES.map(([t, d]) => [t, d, '/guides/'] as const)).map(([title, desc, href], i) => (
              <Link key={title} href={href} className="guide-row">
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <span className="t">{title}</span>
                <span className="d">{desc}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-yellow bordered-y">
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
          <div style={{ flex: '1 1 480px' }}>
            <p className="eyebrow">Payments and allowances</p>
            <h2 className="display-l" style={{ margin: '14px 0 20px' }}>What could fostering pay you?</h2>
            <p className="lead" style={{ color: 'var(--ink)' }}>
              Agencies publish from about £{(payStats as { agency: { from: number; to: number; n: number } }).agency.from} to £{(payStats as { agency: { from: number; to: number; n: number } }).agency.to} a week per child, most of it tax-free.
              Pick your situation and see the yearly figure, built from {(payStats as { agency: { n: number } }).agency.n} agencies&rsquo; own published rates and the official allowances.
            </p>
          </div>
          <div style={{ flex: '1 1 320px' }}>
            <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/calculator/" className="btn btn-dark">Try the pay calculator</Link>
              <Link href="/payments/" className="btn">See what each service pays</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <h2 className="display-l">News</h2>
            {articles.length > 0 && <Link href="/news/" className="btn btn-small">All stories</Link>}
          </div>
          {articles.length === 0 ? (
            <div className="empty">
              <h3 style={{ fontSize: 28 }}>Our first reports are on the way.</h3>
              <p className="muted" style={{ marginTop: 8, maxWidth: 620 }}>
                We publish only what we can source: no invented stories, quotes or statistics. Sign up below and
                we&apos;ll tell you when the first edition is out.
              </p>
            </div>
          ) : (
            <div className="story-grid">
              {articles.slice(0, 3).map((a, i) => <ArticleCard key={a.slug} a={a} large={i === 0} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section bg-coral bordered-y" id="newsletter">
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
          <div style={{ flex: '1 1 440px' }}>
            <h2 className="display-xl" style={{ fontSize: 'clamp(48px, 8vw, 96px)', marginBottom: 16 }}>Get the news.</h2>
            <p className="lead" style={{ color: 'var(--ink)' }}>Pick your topics. Unsubscribe whenever you like. Sponsored placements are always labelled.</p>
          </div>
          <div className="form-card" style={{ flex: '1 1 400px' }}>
            <SimpleForm
              idPrefix="nl"
              table="newsletter_subscribers"
              fields={[
                { name: 'email', label: 'Email address', type: 'email', required: true, placeholder: 'you@example.com' },
                { name: 'topics', label: 'Topics', type: 'select', required: true, options: ['News and policy', 'Guides', 'For foster carers', 'Everything'] },
              ]}
              extra={{ source: 'homepage' }}
              consentText="I agree to receive the Fostering Today newsletter by email. I can unsubscribe at any time. See the privacy notice for how my details are used."
              submitLabel="Subscribe"
              successTitle="Thanks, nearly done."
              successBody="We'll email you a link to confirm your subscription."
            />
          </div>
        </div>
      </section>

      <section className="section bg-forest">
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
          <div style={{ flex: '1 1 520px' }}>
            <p className="eyebrow" style={{ color: 'var(--yellow)' }}>For agencies and local authorities</p>
            <h2 className="display-l" style={{ margin: '14px 0 18px' }}>Claim your free profile.</h2>
            <p className="lead" style={{ color: '#dcebe5' }}>
              Check your details, add your logo and correct anything inaccurate. Claiming and correcting a basic
              profile never requires payment.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/claim/" className="btn btn-yellow">Claim your free profile</Link>
            <Link href="/packages/" className="btn btn-outline-light">See packages</Link>
          </div>
        </div>
      </section>
    </>
  );
}
