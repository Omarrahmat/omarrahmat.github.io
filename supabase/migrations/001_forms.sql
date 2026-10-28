-- Form tables for Fostering Today. Visitors can insert but never read.
-- Staff read these through the admin area using a service role on the server.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  topics text,
  consent_given boolean not null,
  consent_text text not null,
  status text not null default 'pending_confirmation',
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.claim_requests (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null,
  provider_id text,
  requester_name text not null,
  requester_role text not null,
  work_email text not null,
  phone text,
  verification_notes text,
  consent_given boolean not null,
  consent_text text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  what_is_wrong text not null,
  correct_information text,
  evidence_url text,
  contact_email text,
  consent_given boolean not null,
  consent_text text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organisation text,
  email text not null,
  interest text,
  message text,
  consent_given boolean not null,
  consent_text text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
alter table public.claim_requests enable row level security;
alter table public.correction_requests enable row level security;
alter table public.contact_requests enable row level security;

-- Insert only, and only when consent was given. No select/update/delete policies exist for anon.
create policy "anon insert with consent" on public.newsletter_subscribers
  for insert to anon with check (consent_given is true and status = 'pending_confirmation');
create policy "anon insert with consent" on public.claim_requests
  for insert to anon with check (consent_given is true and status = 'pending');
create policy "anon insert with consent" on public.correction_requests
  for insert to anon with check (consent_given is true and status = 'pending');
create policy "anon insert with consent" on public.contact_requests
  for insert to anon with check (consent_given is true and status = 'new');

revoke all on public.newsletter_subscribers, public.claim_requests, public.correction_requests, public.contact_requests from anon;
grant insert on public.newsletter_subscribers, public.claim_requests, public.correction_requests, public.contact_requests to anon;
