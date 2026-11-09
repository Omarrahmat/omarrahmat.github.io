import type { Metadata } from 'next';
import HQ from '@/components/HQ';
import { providers } from '@/lib/providers';
import { areas } from '@/lib/areas';
import { guides } from '@/lib/guides';
import { articles } from '@/lib/articles';
import { councilAllowances } from '@/lib/allowances';
import areaGuides from '@/data/area-guides.json';

export const metadata: Metadata = {
  title: 'Mission control',
  description: 'Live business dashboard for the owner of Fostering Today.',
  alternates: { canonical: '/hq/' },
  robots: { index: false, follow: false },
};

// Read by the static builder (scripts/static/server-entry.tsx). The dashboard has its own black stylesheet,
// typeface and script, loaded by this page only, and hides the public site's header and footer through the body class.
// The manifest, icon and "web app" tags let the owner add the dashboard to a phone's Home Screen, where it opens
// full screen like an app and keeps its sign-in.
export const headExtra =
  '<meta name="theme-color" content="#000000">' +
  '<link rel="manifest" href="/hq.webmanifest">' +
  '<link rel="apple-touch-icon" href="/hq-icon-180.png">' +
  '<meta name="apple-mobile-web-app-capable" content="yes">' +
  '<meta name="mobile-web-app-capable" content="yes">' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="black">' +
  '<meta name="apple-mobile-web-app-title" content="Mission control">' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&amp;family=Barlow+Condensed:wght@500;600&amp;display=swap">' +
  '<link rel="stylesheet" href="/hq.css?v=__V__">' +
  '<script src="/assets/hq.js?v=__V__" defer></script>';
export const bodyClass = 'hq-body';

export default function HQPage() {
  const names = Object.fromEntries(providers.map((p) => [p.id, p.name]));
  const content = {
    profiles: providers.length,
    areaPages: areas.length,
    areaWriteups: (areaGuides as unknown[]).length,
    allowancePages: councilAllowances.length,
    guides: guides.length,
    news: articles.length,
  };
  return (
    <div className="hq">
      <HQ names={names} content={content} />
    </div>
  );
}
