/** The "Listed on Fostering Today" badge: a link back to a provider's profile that providers can paste on their own site. */
export function badgeSnippet(id: string, name: string) {
  return `<a href="https://fosteringtoday.com/agency/${id}/" title="${name.replace(/"/g, '&quot;')} on Fostering Today"><img src="https://fosteringtoday.com/badge.svg" alt="Listed on Fostering Today" width="220" height="48"></a>`;
}

export function BadgeBlock({ id, name }: { id: string; name: string }) {
  const code = badgeSnippet(id, name);
  return (
    <section className="notice" aria-labelledby={`badge-${id}`} style={{ marginTop: 40 }}>
      <h2 id={`badge-${id}`} style={{ fontSize: 24, marginBottom: 8 }}>Show you&apos;re listed</h2>
      <p style={{ marginBottom: 14 }}>Paste this on your website to link to your profile. It helps carers find you here and helps both sites in search.</p>
      <p style={{ marginBottom: 14 }}><img src="/badge.svg" alt="Listed on Fostering Today" width={220} height={48} /></p>
      <pre className="code" tabIndex={0}><code>{code}</code></pre>
    </section>
  );
}
