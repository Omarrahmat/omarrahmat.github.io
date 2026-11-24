-- Emails that are booked to go but are not rows in outreach_queue: "Is this right?", the pay-rates check,
-- "Where you stand", the monthly emails, the page-one email and press pitches. One row per scheduled draft,
-- so the desks can see what is booked without paging through the mailbox: which drafts to cancel when a
-- service replies, claims or unsubscribes, and which pages must not change before an email goes.
-- Only the desks read and write it: row level security is on and there is no policy for site visitors.
-- Applied to the live project on 24 Nov 2026.
create table if not exists public.outreach_bookings (
  draft_id text primary key,
  provider_id text,
  kind text not null,
  sent_to text not null,
  send_at timestamptz not null,
  cancelled_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists outreach_bookings_send_at_idx on public.outreach_bookings (send_at);

alter table public.outreach_bookings enable row level security;

comment on table public.outreach_bookings is 'One row per scheduled email draft that is not a row in outreach_queue. Written by whoever books a batch; read by the desks.';
