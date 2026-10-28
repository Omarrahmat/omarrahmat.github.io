import { useMemo, useSyncExternalStore } from 'react';

const subscribe = () => () => {};

function currentSearch(): string {
  if (window.location.search) return window.location.search;
  // The single-file preview keeps the query in the hash: #/find-an-agency/?q=cardiff
  const h = window.location.hash;
  const i = h.indexOf('?');
  return i >= 0 ? h.slice(i) : '';
}

/** Empty on the server and during hydration, then the real query string on the client. */
export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, currentSearch, () => '');
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND');
}
