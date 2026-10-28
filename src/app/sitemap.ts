import type { MetadataRoute } from 'next';
import { providers } from '@/lib/providers';
import { articles } from '@/lib/articles';
import { areas } from '@/lib/areas';
import { councilAllowances } from '@/lib/allowances';
import { guides } from '@/lib/guides';

export const dynamic = 'force-static';
const BASE = 'https://fosteringtoday.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', 'find-an-agency', 'packages', 'claim', 'contact', 'guides', 'payments', 'calculator', 'news', 'fostering-agencies', 'fostering-allowance'].map((p) => ({ url: `${BASE}/${p ? p + '/' : ''}` }));
  return [...pages, ...guides.map((g) => ({ url: `${BASE}/guides/${g.slug}/`, lastModified: g.updatedOn })), ...articles.map((a) => ({ url: `${BASE}/news/${a.slug}/`, lastModified: a.publishedOn })), ...areas.map((a) => ({ url: `${BASE}/fostering-agencies/${a.slug}/` })), ...councilAllowances.map((c) => ({ url: `${BASE}/fostering-allowance/${c.slug}/`, lastModified: c.retrievedOn })), ...providers.map((p) => ({ url: `${BASE}/agency/${p.id}/` }))];
}
