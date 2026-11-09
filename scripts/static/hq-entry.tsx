// The owner dashboard hydrates from its own script (/assets/hq.js, loaded by the /hq/ page only), so its code is
// not sent to visitors of the public site.
import { hydrateRoot } from 'react-dom/client';
import HQ from '@/components/HQ';

document.querySelectorAll<HTMLElement>('[data-island="HQ"]').forEach((el) => {
  if (el.dataset.hydrated) return;
  const holder = document.getElementById(el.dataset.propsId || '');
  const props = holder ? JSON.parse(holder.textContent || '{}') : {};
  el.dataset.hydrated = '1';
  hydrateRoot(el, <HQ {...props} />);
});
