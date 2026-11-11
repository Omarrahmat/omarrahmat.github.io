-- Which profiles have been claimed: an approved claim exists for them. (Applied 11 Nov 2026 as "claimed_providers".)
-- Public on purpose: a claimed profile page says that it is claimed. Returns provider ids only, nothing about the people.
-- With p_provider it answers for that one profile (an empty result means "not claimed"); without it, it lists them all,
-- which the site build uses so the page says "claimed" in its own HTML (scripts/build-static.mjs).
create or replace function public.claimed_providers(p_provider text default null)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct c.provider_id
  from public.claim_requests c
  where c.status = 'approved'
    and c.provider_id is not null
    and (p_provider is null or c.provider_id = p_provider);
$$;

revoke all on function public.claimed_providers(text) from public;
grant execute on function public.claimed_providers(text) to anon, authenticated;
