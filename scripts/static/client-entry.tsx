import { hydrateRoot } from 'react-dom/client';
import SimpleForm from '@/components/SimpleForm';
import DirectoryClient from '@/components/DirectoryClient';
import { ClaimForm, ContactForm } from '@/components/ParamForms';
import EnquiryForm from '@/components/EnquiryForm';
import PayCalculator from '@/components/PayCalculator';
import Portal from '@/components/Portal';
import Unsubscribe from '@/components/Unsubscribe';
import HQ from '@/components/HQ';
import ProfileLive, { LogoTile } from '@/components/ProfileLive';
import { trackVisit } from '@/lib/supa';

const registry: Record<string, any> = { SimpleForm, DirectoryClient, ClaimForm, ContactForm, EnquiryForm, PayCalculator, Portal, Unsubscribe, HQ, ProfileLive, LogoTile };

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

(window as any).__hydrateIslands = hydrateIslands;
hydrateIslands();
trackVisit();
