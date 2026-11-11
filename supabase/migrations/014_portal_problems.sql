-- A note the portal leaves when something fails for an agency on our side (for example a logo upload we refuse),
-- so the team hears about it straight away instead of waiting for the agency to email. On 11 Nov 2026 an agency
-- tried to upload a logo seven times before anyone here knew. (Applied 11 Nov 2026 as "portal_problems".)
-- A member can leave notes for their own profile only, through report_portal_problem(). Nobody signed in to the
-- portal can read the table; the desks and the owner's tools read it.
create table if not exists public.portal_problems (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  provider_id text not null,
  user_id uuid,
  kind text not null,
  detail text,
  seen_at timestamptz,
  seen_note text
);
alter table public.portal_problems enable row level security;

create or replace function public.report_portal_problem(p_provider text, p_kind text, p_detail text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_member(p_provider) then
    return;
  end if;
  -- At most 20 notes a day from one person, so a fault that repeats cannot fill the table.
  if (select count(*) from public.portal_problems where user_id = auth.uid() and at > now() - interval '1 day') >= 20 then
    return;
  end if;
  insert into public.portal_problems (provider_id, user_id, kind, detail)
  values (p_provider, auth.uid(), left(coalesce(nullif(p_kind, ''), 'other'), 40), left(p_detail, 500));
end
$$;

revoke all on function public.report_portal_problem(text, text, text) from public, anon;
grant execute on function public.report_portal_problem(text, text, text) to authenticated;
