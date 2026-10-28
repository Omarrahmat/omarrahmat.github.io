import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { articles, getArticle, TOPIC_LABEL } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleParts';
import { formatDate } from '@/lib/providers';

export const dynamicParams = false;
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  return a ? { title: a.title, description: a.standfirst, alternates: { canonical: `/news/${a.slug}/` }, openGraph: { type: 'article', publishedTime: a.publishedOn } } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();
  const more = articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: a.standfirst,
    datePublished: a.publishedOn,
    author: { '@type': 'Organization', name: 'Fostering Today' },
    publisher: { '@type': 'Organization', name: 'Fostering Today' },
    mainEntityOfPage: `https://fosteringtoday.com/news/${a.slug}/`,
  };
  return (
    <div className="section-tight">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <nav className="breadcrumb muted" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/news/">News</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{a.title}</span>
        </nav>
        <article className="story" style={{ maxWidth: 780, marginTop: 28 }}>
          <p className="story-meta">
            <time dateTime={a.publishedOn}>{formatDate(a.publishedOn)}</time>
            {a.topics.map((t) => <span key={t} className="tag">{TOPIC_LABEL[t] ?? t}</span>)}
          </p>
          <h1 className="display-m" style={{ margin: '12px 0 16px' }}>{a.title}</h1>
          <p className="lead" style={{ marginBottom: 28 }}>{a.standfirst}</p>
          <div className="story-body">
            {a.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <section className="story-sources" aria-labelledby="src-h">
            <h2 id="src-h" style={{ fontSize: 24, marginBottom: 10 }}>Sources</h2>
            <ul>
              {a.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener" target="_blank">{s.title}<span className="visually-hidden"> (opens in a new tab)</span></a>
                  <span className="muted">{s.publisher ? ` · ${s.publisher}` : ''}{s.date ? ` · ${formatDate(s.date)}` : ''}</span>
                </li>
              ))}
            </ul>
            <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>
              Spotted an error? <Link href="/contact/">Tell us</Link> and we will check it against the sources and correct the story.
            </p>
          </section>
        </article>
        {more.length > 0 && (
          <section style={{ marginTop: 64 }} aria-labelledby="more-h">
            <h2 id="more-h" style={{ fontSize: 32, marginBottom: 20 }}>More news</h2>
            <div className="grid-3">{more.map((x) => <ArticleCard key={x.slug} a={x} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
