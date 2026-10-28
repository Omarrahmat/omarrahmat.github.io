import { renderToString } from 'react-dom/server';
import * as Layout from '@/app/layout';
import * as Home from '@/app/page';
import * as Find from '@/app/find-an-agency/page';
import * as Packages from '@/app/packages/page';
import * as Claim from '@/app/claim/page';
import * as AreasHub from '@/app/fostering-agencies/page';
import * as AllowHub from '@/app/fostering-allowance/page';
import * as AllowPage from '@/app/fostering-allowance/[council]/page';
import * as AreaPage from '@/app/fostering-agencies/[area]/page';
import * as Portal from '@/app/portal/page';
import * as UnsubPage from '@/app/unsubscribe/page';
import * as Contact from '@/app/contact/page';
import * as Guides from '@/app/guides/page';
import * as Payments from '@/app/payments/page';
import * as News from '@/app/news/page';
import * as Calculator from '@/app/calculator/page';
import * as Agency from '@/app/agency/[id]/page';
import * as Legal from '@/app/legal/[slug]/page';
import * as ArticlePage from '@/app/news/[slug]/page';
import * as GuidePage from '@/app/guides/[slug]/page';
import NotFound from '@/app/not-found';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';

const BASE = 'https://fosteringtoday.com';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function headTags(meta: any, path: string, is404 = false) {
  const lm: any = (Layout as any).metadata;
  const t = meta?.title;
  const title = t ? lm.title.template.replace('%s', t) : lm.title.default;
  const desc = meta?.description || lm.description;
  const canonical = meta?.alternates?.canonical ? BASE + meta.alternates.canonical : BASE + path;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    is404 || meta?.robots?.index === false ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:site_name" content="Fostering Today">`,
    `<meta property="og:locale" content="en_GB">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    is404 ? '' : `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${BASE}/og.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${BASE}/og.png">`,
  ].join('');
}

async function page(path: string, mod: any, params: any, is404 = false) {
  const p = Promise.resolve(params);
  const meta = mod.generateMetadata ? await mod.generateMetadata({ params: p }) : mod.metadata;
  const el = await (mod.default ?? mod)({ params: p });
  let html = '<!DOCTYPE html>' + renderToString((Layout as any).default({ children: el }));
  html = html.replace(
    '<head>',
    `<head><meta charSet="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/favicon.svg" type="image/svg+xml">${headTags(meta, path, is404)}<link rel="stylesheet" href="/assets/site.css">`,
  ).replace('</body>', '<script src="/assets/client.js" defer></script></body>');
  return html;
}

const file = (path: string) => (path === '/' ? 'index.html' : path.replace(/^\//, '') + 'index.html');

export async function buildAll(): Promise<{ file: string; content: string }[]> {
  const out: { file: string; content: string }[] = [];
  const statics: [string, any][] = [
    ['/', Home], ['/find-an-agency/', Find], ['/packages/', Packages], ['/claim/', Claim], ['/portal/', Portal], ['/fostering-agencies/', AreasHub], ['/fostering-allowance/', AllowHub], ['/unsubscribe/', UnsubPage], ['/contact/', Contact],
    ['/guides/', Guides], ['/payments/', Payments], ['/news/', News], ['/calculator/', Calculator],
  ];
  for (const [path, mod] of statics) out.push({ file: file(path), content: await page(path, mod, {}) });

  for (const p of (Agency as any).generateStaticParams()) {
    const path = `/agency/${p.id}/`;
    out.push({ file: file(path), content: await page(path, Agency, p) });
  }
  for (const p of (AreaPage as any).generateStaticParams()) {
    const path = `/fostering-agencies/${p.area}/`;
    out.push({ file: file(path), content: await page(path, AreaPage, p) });
  }
  for (const p of (AllowPage as any).generateStaticParams()) {
    const path = `/fostering-allowance/${p.council}/`;
    out.push({ file: file(path), content: await page(path, AllowPage, p) });
  }
  for (const p of (ArticlePage as any).generateStaticParams()) {
    const path = `/news/${p.slug}/`;
    out.push({ file: file(path), content: await page(path, ArticlePage, p) });
  }
  for (const p of (GuidePage as any).generateStaticParams()) {
    const path = `/guides/${p.slug}/`;
    out.push({ file: file(path), content: await page(path, GuidePage, p) });
  }
  for (const p of (Legal as any).generateStaticParams()) {
    const path = `/legal/${p.slug}/`;
    out.push({ file: file(path), content: await page(path, Legal, p) });
  }
  out.push({ file: '404.html', content: await page('/404/', { default: NotFound, metadata: { title: 'Page not found' } }, {}, true) });

  const urls = (sitemap() as any[]).map((u) => `<url><loc>${esc(u.url)}</loc>${u.lastModified ? `<lastmod>${u.lastModified}</lastmod>` : ''}</url>`).join('');
  out.push({ file: 'sitemap.xml', content: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>` });
  const r: any = robots();
  out.push({ file: 'robots.txt', content: `User-agent: ${r.rules.userAgent}\nAllow: ${r.rules.allow}\n\nSitemap: ${r.sitemap}\n` });
  return out;
}
