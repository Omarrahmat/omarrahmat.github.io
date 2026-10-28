-- Agency portal: membership, editable public profile, private settings, usage events, subscriptions, logo storage.

-- Who may manage which provider profile. Rows are created by link_my_claims() once staff approve a claim.
create table if not exists public.agency_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null,
  email text,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (user_id, provider_id)
);
alter table public.agency_members enable row level security;
create policy "members read own memberships" on public.agency_members for select to authenticated using (user_id = auth.uid());
revoke all on public.agency_members from anon, authenticated;
grant select on public.agency_members to authenticated;

create or replace function public.is_member(pid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.agency_members m where m.user_id = auth.uid() and m.provider_id = pid);
$$;
revoke all on function public.is_member(text) from public, anon;
grant execute on function public.is_member(text) to authenticated;

-- Called by the portal after sign-in: links the signed-in email to any approved claim for that email.
create or replace function public.link_my_claims() returns setof public.agency_members
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or em = '' then return; end if;
  insert into public.agency_members (user_id, provider_id, email)
  select auth.uid(), c.provider_id, em
  from public.claim_requests c
  where c.status = 'approved' and c.provider_id is not null and lower(c.work_email) = em
  on conflict do nothing;
  return query select * from public.agency_members where user_id = auth.uid();
end $$;
revoke all on function public.link_my_claims() from public, anon;
grant execute on function public.link_my_claims() to authenticated;

-- Public, agency-editable profile content. Anyone can read published rows; only members can write their own.
create table if not exists public.provider_profiles (
  provider_id text primary key,
  about text check (char_length(about) <= 2000),
  logo_path text check (char_length(logo_path) <= 200),
  phone text check (char_length(phone) <= 40),
  website text check (website ~ '^https?://' and char_length(website) <= 300),
  recruitment_url text check (recruitment_url ~ '^https?://' and char_length(recruitment_url) <= 300),
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.provider_profiles enable row level security;
create policy "public reads published profiles" on public.provider_profiles for select to anon, authenticated using (published);
create policy "members insert own profile" on public.provider_profiles for insert to authenticated with check (public.is_member(provider_id));
create policy "members update own profile" on public.provider_profiles for update to authenticated using (public.is_member(provider_id)) with check (public.is_member(provider_id));
revoke all on public.provider_profiles from anon, authenticated;
grant select on public.provider_profiles to anon;
grant select, insert, update on public.provider_profiles to authenticated;

create or replace function public.touch_profile() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
create trigger trg_touch_profile before insert or update on public.provider_profiles for each row execute function public.touch_profile();

-- Audit trail of every edit, readable by staff only.
create table if not exists public.profile_edit_log (
  id bigint generated always as identity primary key,
  provider_id text not null,
  edited_by uuid,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.profile_edit_log enable row level security;
revoke all on public.profile_edit_log from anon, authenticated;
create or replace function public.log_profile_edit() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profile_edit_log (provider_id, edited_by, snapshot) values (new.provider_id, auth.uid(), to_jsonb(new)); return new; end $$;
create trigger trg_log_profile after insert or update on public.provider_profiles for each row execute function public.log_profile_edit();

-- Private per-agency settings (where enquiry alerts go).
create table if not exists public.agency_settings (
  provider_id text primary key,
  enquiry_email text check (enquiry_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(enquiry_email) <= 200),
  updated_at timestamptz not null default now()
);
alter table public.agency_settings enable row level security;
create policy "members manage own settings" on public.agency_settings for all to authenticated using (public.is_member(provider_id)) with check (public.is_member(provider_id));
revoke all on public.agency_settings from anon, authenticated;
grant select, insert, update on public.agency_settings to authenticated;

-- Which plan each provider is on. Written by staff or the billing desk only.
create table if not exists public.subscriptions (
  provider_id text primary key,
  tier text not null default 'free' check (tier in ('free','featured','premium')),
  active_until date,
  stripe_customer_id text,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "members read own subscription" on public.subscriptions for select to authenticated using (public.is_member(provider_id));
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

-- Daily counters for profile activity. Anyone can record an event through track_event(); only members can read their own.
create table if not exists public.profile_events (
  provider_id text not null,
  day date not null default current_date,
  kind text not null check (kind in ('view','website_click','phone_click','recruit_click','enquiry_open')),
  n integer not null default 0,
  primary key (provider_id, day, kind)
);
alter table public.profile_events enable row level security;
create policy "members read own events" on public.profile_events for select to authenticated using (public.is_member(provider_id));
revoke all on public.profile_events from anon, authenticated;
grant select on public.profile_events to authenticated;

create or replace function public.track_event(p_provider text, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_provider is null or p_provider !~ '^[a-z0-9-]{2,120}$' then return; end if;
  if p_kind not in ('view','website_click','phone_click','recruit_click','enquiry_open') then return; end if;
  insert into public.profile_events (provider_id, day, kind, n) values (p_provider, current_date, p_kind, 1)
  on conflict (provider_id, day, kind) do update set n = public.profile_events.n + 1;
end $$;
revoke all on function public.track_event(text, text) from public;
grant execute on function public.track_event(text, text) to anon, authenticated;

-- Members can read and mark the enquiries sent to their own profile.
create policy "members read own enquiries" on public.enquiries for select to authenticated using (public.is_member(provider_id));
create policy "members update own enquiries" on public.enquiries for update to authenticated using (public.is_member(provider_id)) with check (public.is_member(provider_id));
grant select on public.enquiries to authenticated;
grant update (status, handled_at) on public.enquiries to authenticated;

-- Logos: public bucket, one folder per provider, members only write inside their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-logos', 'provider-logos', true, 1048576, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/png','image/jpeg','image/webp'];
create policy "members upload own logo" on storage.objects for insert to authenticated
  with check (bucket_id = 'provider-logos' and public.is_member((storage.foldername(name))[1]));
create policy "members replace own logo" on storage.objects for update to authenticated
  using (bucket_id = 'provider-logos' and public.is_member((storage.foldername(name))[1]));
create policy "members delete own logo" on storage.objects for delete to authenticated
  using (bucket_id = 'provider-logos' and public.is_member((storage.foldername(name))[1]));
