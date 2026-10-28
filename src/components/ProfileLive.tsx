'use client';

import { useEffect, useState } from 'react';
import { publicProfile, publicLogoUrl, trackEvent } from '@/lib/supa';

type Prof = Awaited<ReturnType<typeof publicProfile>>;
const cache = new Map<string, Promise<Prof>>();
const load = (id: string) => { if (!cache.has(id)) cache.set(id, publicProfile(id)); return cache.get(id)!; };

/** Logo from the agency, shown instead of the initials tile once loaded. */
export function LogoTile({ providerId, name, fallback }: { providerId: string; name: string; fallback?: string }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => { load(providerId).then((p) => p?.logo_path && setLogo(publicLogoUrl(p.logo_path))); }, [providerId]);
  if (!logo) return null;
  return <img src={logo} alt={`${name} logo`} className="logo-img" width={96} height={96} />;
}

/** Records views and clicks for the agency's own stats, and shows agency-written text. */
export default function ProfileLive({ providerId, name }: { providerId: string; name: string }) {
  const [prof, setProf] = useState<Prof>(null);
  useEffect(() => {
    trackEvent(providerId, 'view'); // every page load counts
    load(providerId).then((p) => {
      setProf(p);
      if (p?.logo_path) document.querySelectorAll('[data-logo-hide]').forEach((e) => ((e as HTMLElement).style.display = 'none'));
    });
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('[data-track]') as HTMLElement | null;
      if (a) trackEvent(providerId, a.dataset.track || '');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [providerId]);
  const about = prof?.about;
  const extra: [string, string, string, string][] = prof ? ([
    prof.phone ? ['Phone', `tel:${prof.phone}`, prof.phone, 'phone_click'] : null,
    prof.website ? ['Website', prof.website, prof.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), 'website_click'] : null,
    prof.recruitment_url ? ['Become a foster carer', prof.recruitment_url, 'Recruitment page', 'recruit_click'] : null,
  ].filter(Boolean) as [string, string, string, string][]) : [];
  if (!about && !extra.length) return null;
  return (
    <section style={{ margin: '0 0 28px', maxWidth: 820 }} aria-labelledby="about-h">
      <h2 id="about-h" style={{ fontSize: 28, marginBottom: 8 }}>From {name}</h2>
      {about && <p style={{ whiteSpace: 'pre-line' }}>{about}</p>}
      {extra.length > 0 && (
        <ul style={{ margin: '12px 0 0', paddingLeft: 20 }}>
          {extra.map(([l, href, text, kind]) => <li key={l}>{l}: <a href={href} data-track={kind} rel="noopener" target={href.startsWith('http') ? '_blank' : undefined}>{text}</a></li>)}
        </ul>
      )}
      <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>Written and supplied by {name}. Fostering Today has not checked this section.</p>
    </section>
  );
}
