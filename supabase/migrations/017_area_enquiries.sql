-- 21 Nov 2026: "Ask for a call". A visitor on an area page, a pay page or the calculator can ask for one fostering
-- service that covers their area to call them, whether or not any service has paid for that area. Until now only a
-- paying partner's profile had an enquiry form, so on most of the site nobody could enquire at all.
-- The website can only insert a row; it can never read one. The inbox desk passes each enquiry to a single service
-- and records which (claude/inbox-playbook.md, "Ask for a call"). Rows are never deleted by a desk.
create table if not exists public.area_enquiries (
  id uuid primary key default gen_random_uuid(),
  area text not null check (char_length(area) between 2 and 80),
  wants text not null default 'Either' check (wants in ('Either', 'The council', 'An independent agency')),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200),
  phone text not null check (char_length(phone) between 6 and 40),
  postcode text not null check (char_length(postcode) between 2 and 12),
  best_time text check (best_time is null or char_length(best_time) <= 20),
  message text check (message is null or char_length(message) <= 2000),
  source text check (source is null or char_length(source) <= 40),
  consent_given boolean not null,
  consent_text text not null check (char_length(consent_text) <= 600),
  status text not null default 'new',
  provider_id text,
  provider_name text,
  free_intro boolean,
  passed_at timestamptz,
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  desk_note text
);

comment on table public.area_enquiries is
  'Enquiries from the "ask for a call" form: one person asking for one fostering service that covers their area to call them. Insert-only for the website; passed on by the inbox desk.';
comment on column public.area_enquiries.free_intro is
  'True when the enquiry was passed, free, to a service that is not a paying partner for the area.';

alter table public.area_enquiries enable row level security;

create policy "anon insert with consent" on public.area_enquiries
  for insert to anon
  with check (consent_given is true and status = 'new' and provider_id is null and provider_name is null
              and free_intro is null and passed_at is null and handled_at is null and desk_note is null);

-- Row level security is what keeps this table closed: the only policy is the insert above, so nobody signed out
-- or signed in can read, change or remove a row, and an insert cannot set any of the desk's own columns.
grant insert on public.area_enquiries to anon;

create index if not exists area_enquiries_status_idx on public.area_enquiries (status, created_at);
