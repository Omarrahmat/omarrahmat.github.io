import type { Metadata } from 'next';
import './globals.css';
import { Header, Footer, Marquee } from '@/components/Chrome';

export const metadata: Metadata = {
  metadataBase: new URL('https://fosteringtoday.com'),
  title: {
    default: 'Fostering Today: independent UK fostering news, advice and agency directory',
    template: '%s | Fostering Today',
  },
  description:
    'Independent fostering news, plain-English guides and a directory of fostering services across England, Scotland, Wales and Northern Ireland, with the source of every detail shown.',
  openGraph: { siteName: 'Fostering Today', locale: 'en_GB', type: 'website', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Fostering Today: independent UK fostering news, guides and agency directory' }] },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};


const siteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://fosteringtoday.com/#org',
      name: 'Fostering Today',
      url: 'https://fosteringtoday.com/',
      logo: 'https://fosteringtoday.com/og.png',
      email: 'hello@fosteringtoday.com',
      parentOrganization: { '@type': 'Organization', name: 'Urban Carers Ltd', identifier: '15419139' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://fosteringtoday.com/#site',
      url: 'https://fosteringtoday.com/',
      name: 'Fostering Today',
      inLanguage: 'en-GB',
      publisher: { '@id': 'https://fosteringtoday.com/#org' },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://fosteringtoday.com/find-an-agency/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:wght@400;500;700&display=swap"
        />
        {/* Plausible: cookieless, privacy-friendly analytics */}
        <script async src="https://plausible.io/js/pa-5UQnCJNyUu-5eLLn1c0yN.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()',
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <Marquee />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
