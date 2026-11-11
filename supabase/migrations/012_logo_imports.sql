-- Logos that agencies email to hello@ (11 Nov 2026). The desks cannot download attachments themselves, so the
-- database asks an Edge Function (supabase/functions/ft-import-logo) to fetch the attachment, check it is an
-- image, store it in the logo bucket and put it on the agency's profile. Each request is recorded here.
-- Applied to project vbgustjtxjmjlgukzcfa through the Supabase connector.
create table if not exists public.logo_imports (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null check (provider_id ~ '^[a-z0-9][a-z0-9-]{1,120}$'),
  source_url text not null,
  requested_by text not null default 'desk',
  status text not null default 'pending' check (status in ('pending', 'working', 'done', 'failed')),
  detail text,
  created_at timestamptz not null default now(),
  done_at timestamptz
);
comment on table public.logo_imports is 'Staff-only. Logos emailed by agencies, brought in by the ft-import-logo Edge Function. No public policies on purpose.';
alter table public.logo_imports enable row level security;

-- Usage (desks, through execute_sql): get the attachment's download link from the mailbox tool, then
--   select public.import_logo('<provider id>', '<download link>', '<desk name>');
-- and a few seconds later read the outcome:
--   select status, detail from public.logo_imports where id = '<the id returned>';
create or replace function public.import_logo(p_provider text, p_url text, p_by text default 'desk')
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  if p_url !~ '^https://cdn\.agentmail\.to/' then
    raise exception 'Only attachments from the hello@ mailbox can be imported';
  end if;
  if not exists (select 1 from public.claim_requests where provider_id = p_provider and status = 'approved') then
    raise exception 'This profile has no approved claim';
  end if;
  insert into public.logo_imports (provider_id, source_url, requested_by)
  values (p_provider, p_url, coalesce(nullif(trim(p_by), ''), 'desk'))
  returning id into v_id;
  perform net.http_post(
    url := 'https://vbgustjtxjmjlgukzcfa.supabase.co/functions/v1/ft-import-logo',
    body := jsonb_build_object('id', v_id),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 30000);
  return v_id;
end
$function$;

revoke execute on function public.import_logo(text, text, text) from public, anon, authenticated;
