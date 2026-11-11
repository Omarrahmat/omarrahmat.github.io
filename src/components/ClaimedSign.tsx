// What a claimed profile carries: a lit green tick. Used on the public profile (the sign) and in the agency portal (the pill).

/** The green light: a tick in a ring that glows, with a slow pulse around it (styles: .lit in globals.css). */
export function Lit({ size = 24 }: { size?: number }) {
  return (
    <span className="lit" aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.6" />
        <path d="M7.4 12.5l3.1 3.1 6.1-6.6" />
      </svg>
    </span>
  );
}

/** Shown on the public profile in place of the "not claimed yet" notice. One line only, by Omar's choice (11 Nov 2026). */
export function ClaimedSign({ name }: { name: string }) {
  return (
    <div className="claimed-sign" data-claimed>
      <Lit size={28} />
      <strong>Live profile, claimed by {name}</strong>
    </div>
  );
}

/** The same light, small, for the agency's own portal. */
export function LivePill() {
  return <span className="live-pill"><Lit size={16} />Live profile, claimed</span>;
}
