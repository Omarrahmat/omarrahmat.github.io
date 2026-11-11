import { hydrateRoot } from 'react-dom/client';
import SimpleForm from '@/components/SimpleForm';
import DirectoryClient from '@/components/DirectoryClient';
import { ClaimForm, ContactForm } from '@/components/ParamForms';
import EnquiryForm from '@/components/EnquiryForm';
import PayCalculator from '@/components/PayCalculator';
import Portal from '@/components/Portal';
import Unsubscribe from '@/components/Unsubscribe';
import ProfileLive, { LogoTile } from '@/components/ProfileLive';
import { trackVisit, publicLogos, publicLogoUrl } from '@/lib/supa';

// The owner dashboard (HQ) is not in this list: it hydrates from its own script, scripts/static/hq-entry.tsx.
const registry: Record<string, any> = { SimpleForm, DirectoryClient, ClaimForm, ContactForm, EnquiryForm, PayCalculator, Portal, Unsubscribe, ProfileLive, LogoTile };

/** Hydrate every island under `root` that has not been hydrated yet. */
function hydrateIslands(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-island]').forEach((el) => {
    if (el.dataset.hydrated) return;
    const C = registry[el.dataset.island || ''];
    if (!C) return;
    const holder = document.getElementById(el.dataset.propsId || '');
    const props = holder ? JSON.parse(holder.textContent || '{}') : {};
    el.dataset.hydrated = '1';
    hydrateRoot(el, <C {...props} />);
  });
}

/**
 * Agency cards on the area pages are plain HTML written when the site was built. If an agency has added a logo
 * since then, swap it in for the initials, so a new logo shows everywhere at once. (Search results and the profile
 * page look after themselves.)
 */
function freshenLogos() {
  const tiles = [...document.querySelectorAll<HTMLElement>('span.tile[data-tile]:not(.tile-lg)')].filter((t) => !t.closest('[data-island]'));
  if (!tiles.length) return;
  publicLogos().then((logos) => {
    if (!logos) return;
    for (const t of tiles) {
      const path = logos[t.dataset.tile || ''];
      if (!path) continue;
      const img = document.createElement('img');
      img.src = publicLogoUrl(path); img.alt = ''; img.className = 'logo-img logo-sm'; img.width = 60; img.height = 60; img.dataset.tile = t.dataset.tile;
      t.replaceWith(img);
    }
  });
}

(window as any).__hydrateIslands = hydrateIslands;
hydrateIslands();
freshenLogos();
trackVisit();
