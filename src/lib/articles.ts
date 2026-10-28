import data from '@/data/articles.json';
import type { Article } from '@/types';

export const articles = data as unknown as Article[];
export const getArticle = (slug: string) => articles.find((a) => a.slug === slug);

export const TOPIC_LABEL: Record<string, string> = {
  policy: 'Policy', regulation: 'Regulation', 'pay-and-allowances': 'Pay and allowances', recruitment: 'Recruitment',
  councils: 'Councils', agencies: 'Agencies', campaigns: 'Campaigns', research: 'Research',
  wales: 'Wales', scotland: 'Scotland', 'northern-ireland': 'Northern Ireland', england: 'England',
};
