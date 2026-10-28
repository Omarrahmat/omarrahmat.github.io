import data from '@/data/guides.json';

export interface Guide {
  slug: string;
  title: string;
  standfirst: string;
  updatedOn: string;
  readingMinutes: number;
  sections: { heading: string; paragraphs: string[]; bullets: string[] }[];
  nations: Partial<Record<'England' | 'Scotland' | 'Wales' | 'Northern Ireland', string>>;
  faq: { question: string; answer: string }[];
  sources: { title: string; url: string; publisher: string; date: string | null }[];
}

export const guides = data as unknown as Guide[];
export const getGuide = (slug: string) => guides.find((g) => g.slug === slug);
export const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
