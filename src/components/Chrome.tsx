import Link from 'next/link';
import { providers } from '@/lib/providers';
import { articles } from '@/lib/articles';

export function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="27" cy="12" r="7" fill="#FFC933" />
      <path d="M6 38V22a10 10 0 0 1 20 0v16z" fill="#0F3D33" />
      <path d="M26 38V27a6 6 0 0 1 12 0v11z" fill="#FF6A4D" />
    </svg>
  );
}

/**
 * Top strip. With news published it carries the latest headlines (each a link); before that, a few
 * useful facts about the site. The provider count comes from the data, so it stays right.
 */
function marqueeItems(): { text: string; href?: string }[] {
  const latest = articles.slice(0, 4);
  if (latest.length >= 2) {
    return [{ text: 'Latest' }, ...latest.map((a) => ({ text: a.title, href: `/news/${a.slug}/` }))];
  }
  return [
    { text: `${providers.length} fostering services across the UK, with sources shown`, href: '/find-an-agency/' },
    { text: 'Thinking about fostering? Start with the directory', href: '/find-an-agency/' },
    { text: 'Agencies and councils: claim your free profile', href: '/claim/' },
    { text: 'Sponsored content is always labelled', href: '/packages/' },
  ];
}

export function Marquee() {
  const items = marqueeItems();
  const run = (key: number, hidden: boolean) => (
    <span key={key} aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <span key={i} className="marquee-item">
          {it.href && !hidden ? <Link href={it.href}>{it.text}</Link> : it.text}
          <span className="marquee-dot" aria-hidden="true"> · </span>
        </span>
      ))}
    </span>
  );
  return (
    <div className="marquee">
      <div className="marquee-track">{run(0, false)}{run(1, true)}{run(2, true)}</div>
    </div>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand" aria-label="Fostering Today home">
          <BrandMark />
          <span>Fostering Today</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/news/">News</Link>
          <Link href="/guides/">Guides</Link>
          <Link href="/calculator/">Pay calculator</Link>
          <Link href="/find-an-agency/">Find an agency</Link>
          <Link href="/packages/">For agencies</Link>
        </nav>
        <Link href="/claim/" className="btn btn-yellow btn-small">Claim your free profile</Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-cols">
          <div>
            <h2>Read</h2>
            <ul>
              <li><Link href="/news/">News</Link></li>
              <li><Link href="/guides/">Guides</Link></li>
              <li><Link href="/payments/">Payments and allowances</Link></li>
            </ul>
          </div>
          <div>
            <h2>Explore</h2>
            <ul>
              <li><Link href="/find-an-agency/">Find an agency</Link></li>
              <li><Link href="/fostering-agencies/">Agencies by area</Link></li>
              <li><Link href="/fostering-allowance/">Allowances by council</Link></li>
              <li><Link href="/find-an-agency/?nation=England">England</Link></li>
              <li><Link href="/find-an-agency/?nation=Scotland">Scotland</Link></li>
              <li><Link href="/find-an-agency/?nation=Wales">Wales</Link></li>
              <li><Link href="/find-an-agency/?nation=Northern%20Ireland">Northern Ireland</Link></li>
            </ul>
          </div>
          <div>
            <h2>For agencies</h2>
            <ul>
              <li><Link href="/claim/">Claim your profile</Link></li>
              <li><Link href="/portal/">Agency login</Link></li>
              <li><Link href="/packages/">Packages and advertising</Link></li>
              <li><Link href="/contact/">Talk to us</Link></li>
            </ul>
          </div>
          <div>
            <h2>About</h2>
            <ul>
              <li><Link href="/legal/editorial-policy/">Editorial policy</Link></li>
              <li><Link href="/legal/corrections/">Corrections</Link></li>
              <li><Link href="/contact/">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-wordmark" aria-hidden="true">Fostering<span> Today</span></div>
        <div className="footer-legal">
          <p style={{ maxWidth: 760 }}>
            Fostering Today is an independent publication. It is not a fostering agency and does not provide
            fostering services. Sponsored content and advertisements are always labelled. Email: <a href="mailto:hello@fosteringtoday.com">hello@fosteringtoday.com</a>
          </p>
          <p style={{ display: 'flex', gap: 18 }}>
            <Link href="/legal/privacy/">Privacy</Link>
            <Link href="/legal/cookies/">Cookies</Link>
            <Link href="/legal/terms/">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
