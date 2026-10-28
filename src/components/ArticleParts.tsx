import Link from 'next/link';
import type { Article } from '@/types';
import { TOPIC_LABEL } from '@/lib/articles';
import { formatDate } from '@/lib/providers';

export function ArticleCard({ a, large = false }: { a: Article; large?: boolean }) {
  return (
    <article className={`story-card${large ? ' story-card-lg' : ''}`}>
      <p className="story-meta">
        <time dateTime={a.publishedOn}>{formatDate(a.publishedOn)}</time>
        {a.topics.slice(0, 2).map((t) => <span key={t} className="tag">{TOPIC_LABEL[t] ?? t}</span>)}
      </p>
      <h3 className="story-title"><Link href={`/news/${a.slug}/`}>{a.title}</Link></h3>
      <p className="muted">{a.standfirst}</p>
    </article>
  );
}
