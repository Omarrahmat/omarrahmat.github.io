import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { guides, getGuide, anchor } from '@/lib/guides';
import { formatDate } from '@/lib/providers';

export const dynamicParams = false;
export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  return g ? { title: g.title, description: g.standfirst, alternates: { canonical: `/guides/${g.slug}/` }, openGraph: { type: 'article', modifiedTime: g.updatedOn } } : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const others = guides.filter((x) => x.slug !== g.slug);
  const nations = Object.entries(g.nations) as [string, string][];
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.standfirst, dateModified: g.updatedOn,
      author: { '@type': 'Organization', name: 'Fostering Today' }, publisher: { '@type': 'Organization', name: 'Fostering Today' },
      mainEntityOfPage: `https://fosteringtoday.com/guides/${g.slug}/`,
    },
    g.faq.length
      ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faq.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })) }
      : null,
  ].filter(Boolean);

  return (
    <div className="section-tight">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <nav className="breadcrumb muted" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/guides/">Guides</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{g.title}</span>
        </nav>
        <div className="guide-layout">
          <article className="story" style={{ minWidth: 0 }}>
            <p className="story-meta" style={{ marginTop: 28 }}>
              <span className="tag">Guide</span>
              <span>{g.readingMinutes} min read</span>
              <span>Checked <time dateTime={g.updatedOn}>{formatDate(g.updatedOn)}</time></span>
            </p>
            <h1 className="display-m" style={{ margin: '12px 0 16px' }}>{g.title}</h1>
            <p className="lead" style={{ marginBottom: 28 }}>{g.standfirst}</p>
            <div className="story-body">
              {g.sections.map((s) => (
                <section key={s.heading} id={anchor(s.heading)}>
                  <h2 style={{ fontSize: 30, margin: '36px 0 12px' }}>{s.heading}</h2>
                  {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                  {s.bullets.length > 0 && <ul className="guide-bullets">{s.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
                </section>
              ))}
              {nations.length > 0 && (
                <section id="across-the-uk">
                  <h2 style={{ fontSize: 30, margin: '36px 0 12px' }}>Across the UK</h2>
                  <dl className="facts">
                    {nations.map(([n, text]) => (
                      <div key={n} style={{ display: 'contents' }}><dt>{n}</dt><dd><span>{text}</span></dd></div>
                    ))}
                  </dl>
                </section>
              )}
              {g.faq.length > 0 && (
                <section id="questions">
                  <h2 style={{ fontSize: 30, margin: '36px 0 12px' }}>Common questions</h2>
                  {g.faq.map((q, i) => (
                    <details key={i} className="faq" style={i === g.faq.length - 1 ? { borderBottom: '2px solid var(--ink)' } : undefined}>
                      <summary style={{ fontSize: 22 }}>{q.question}</summary>
                      <p>{q.answer}</p>
                    </details>
                  ))}
                </section>
              )}
            </div>
            <section className="story-sources" aria-labelledby="src-h" style={{ marginTop: 36 }}>
              <h2 id="src-h" style={{ fontSize: 24, marginBottom: 10 }}>Sources</h2>
              <ul>
                {g.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} rel="noopener" target="_blank">{s.title}<span className="visually-hidden"> (opens in a new tab)</span></a>
                    <span className="muted">{s.publisher ? ` · ${s.publisher}` : ''}{s.date ? ` · ${formatDate(s.date)}` : ''}</span>
                  </li>
                ))}
              </ul>
              <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>
                This guide is general information, checked against the sources above on the date shown. It is not legal, financial or medical advice. Rules and rates change: confirm anything that matters with the fostering service or official body concerned. Spotted an error? <Link href="/contact/">Tell us</Link>.
              </p>
            </section>
          </article>
          <aside className="guide-side">
            <div className="notice" style={{ position: 'sticky', top: 24 }}>
              <h2 style={{ fontSize: 18, marginBottom: 10 }}>In this guide</h2>
              <ol className="toc">
                {g.sections.map((s) => <li key={s.heading}><a href={`#${anchor(s.heading)}`}>{s.heading}</a></li>)}
                {nations.length > 0 && <li><a href="#across-the-uk">Across the UK</a></li>}
                {g.faq.length > 0 && <li><a href="#questions">Common questions</a></li>}
              </ol>
              <p style={{ marginTop: 16 }}><Link href="/find-an-agency/" className="btn btn-dark btn-small">Find a fostering service</Link></p>
            </div>
          </aside>
        </div>
        {others.length > 0 && (
          <section style={{ marginTop: 64 }} aria-labelledby="more-h">
            <h2 id="more-h" style={{ fontSize: 32, marginBottom: 12 }}>More guides</h2>
            <ul style={{ listStyle: 'none' }}>
              {others.map((x) => (
                <li key={x.slug} className="guide-list" style={{ padding: '14px 0' }}>
                  <Link href={`/guides/${x.slug}/`} style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22 }}>{x.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
