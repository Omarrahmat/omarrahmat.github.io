-- Visitor enquiries to a specific provider (shown only on profiles with an active paid placement).
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  provider_name text not null,
  name text not null,
  email text not null,
  phone text not null,
  postcode text not null,
  best_time text,
  message text,
  consent_given boolean not null,
  consent_text text not null,
  status text not null default 'new',       -- new | sent_to_provider | closed
  forwarded_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.enquiries enable row level security;
create policy "anon insert with consent" on public.enquiries
  for insert to anon with check (consent_given is true and status = 'new');
revoke all on public.enquiries from anon;
grant insert on public.enquiries to anon;
