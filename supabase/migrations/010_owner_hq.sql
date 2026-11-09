-- Owner dashboard, second version (9 Nov 2026): Google Search Console data and one function that returns
-- every figure the dashboard at /hq/ shows. Applied to project vbgustjtxjmjlgukzcfa through the Supabase connector.

-- Search Console exports, loaded with scripts/gsc-to-sql.py. One snapshot per export.
create table if not exists public.gsc_snapshots (
  snapshot date primary key,
  range_start date not null,
  range_end date not null,
  source text not null default 'export',
  note text,
  loaded_at timestamptz not null default now()
);
create table if not exists public.gsc_daily (
  day date primary key,
  clicks integer not null default 0,
  impressions integer not null default 0,
  position numeric,
  snapshot date not null references public.gsc_snapshots(snapshot) on delete cascade
);
create table if not exists public.gsc_queries (
  snapshot date not null references public.gsc_snapshots(snapshot) on delete cascade,
  query text not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  position numeric not null,
  primary key (snapshot, query)
);
create table if not exists public.gsc_pages (
  snapshot date not null references public.gsc_snapshots(snapshot) on delete cascade,
  page text not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  position numeric not null,
  primary key (snapshot, page)
);
create table if not exists public.gsc_segments (
  snapshot date not null references public.gsc_snapshots(snapshot) on delete cascade,
  kind text not null check (kind in ('country', 'device')),
  name text not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  position numeric,
  primary key (snapshot, kind, name)
);
-- No policies: only the desks (service role) and the owner function below can read these.
alter table public.gsc_snapshots enable row level security;
alter table public.gsc_daily enable row level security;
alter table public.gsc_queries enable row level security;
alter table public.gsc_pages enable row level security;
alter table public.gsc_segments enable row level security;

create or replace function public.owner_hq(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  d integer := greatest(1, least(coalesce(p_days, 30), 365));
  since date;
  prev_since date;
  today_uk date := (now() at time zone 'Europe/London')::date;
  snap date;
  prev_snap date;
  r jsonb;
begin
  if not exists (select 1 from public.site_admins where user_id = auth.uid()) then raise exception 'not allowed'; end if;
  since := current_date - (d - 1);
  prev_since := since - d;
  select max(snapshot) into snap from public.gsc_snapshots;
  select max(snapshot) into prev_snap from public.gsc_snapshots where snapshot < snap;

  select jsonb_build_object(
    'generated_at', now(),
    'days', d,

    'money', (select jsonb_build_object(
        'featured', count(*) filter (where tier = 'featured'),
        'premium', count(*) filter (where tier = 'premium'),
        'mrr', coalesce(sum(case tier when 'featured' then 199 when 'premium' then 799 else 0 end), 0),
        'subs', coalesce(jsonb_agg(jsonb_build_object('provider_id', provider_id, 'tier', tier, 'started_on', started_on, 'active_until', active_until, 'source', source)
                         order by started_on desc nulls last, provider_id), '[]'::jsonb))
      from public.subscriptions
      where provider_id <> 'test-omar' and tier in ('featured', 'premium') and (active_until is null or active_until >= current_date)),

    'payments', jsonb_build_object(
        'total', (select count(*) from public.payment_events),
        'unmatched', (select count(*) from public.payment_events where outcome = 'unmatched'),
        'failed', (select count(*) from public.payment_events where kind = 'payment_failed'),
        'recent', (select coalesce(jsonb_agg(x order by x.received_at desc), '[]'::jsonb) from (
            select received_at, kind, amount_pence, product, provider_id, outcome from public.payment_events order by received_at desc limit 8) x)),

    'claims', jsonb_build_object(
        'total', (select count(*) from public.claim_requests where provider_id is distinct from 'test-omar'),
        'approved', (select count(*) from public.claim_requests where provider_id is distinct from 'test-omar' and status = 'approved'),
        'waiting', (select count(*) from public.claim_requests where provider_id is distinct from 'test-omar' and status in ('pending', 'awaiting_proof')),
        'profiles', (select count(distinct provider_id) from public.claim_requests where provider_id is distinct from 'test-omar' and status = 'approved'),
        'members', (select count(*) from public.agency_members where provider_id <> 'test-omar'),
        'signed_in', (select count(distinct provider_id) from public.agency_members where provider_id <> 'test-omar'),
        'logos', (select count(*) from public.provider_profiles where provider_id <> 'test-omar' and logo_path is not null),
        'edited', (select count(distinct provider_id) from public.profile_edit_log where provider_id <> 'test-omar'),
        'list', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
            select c.provider_id, c.provider_name, c.requester_name, c.requester_role, c.status, c.created_at,
              exists (select 1 from public.agency_members m where m.provider_id = c.provider_id) as signed_in,
              exists (select 1 from public.provider_profiles p where p.provider_id = c.provider_id and p.logo_path is not null) as has_logo,
              (select s.tier from public.subscriptions s where s.provider_id = c.provider_id and s.tier in ('featured', 'premium')
                 and (s.active_until is null or s.active_until >= current_date) limit 1) as tier
            from public.claim_requests c where c.provider_id is distinct from 'test-omar' order by c.created_at desc limit 50) x)),

    'outreach', (select jsonb_build_object(
        'total', count(*),
        'queued', count(*) filter (where status = 'queued'),
        'in_sequence', count(*) filter (where status = 'sent'),
        'completed', count(*) filter (where status = 'completed'),
        'replied', count(*) filter (where status = 'replied'),
        'bounced', count(*) filter (where status = 'bounced'),
        'unsubscribed', count(*) filter (where status = 'unsubscribed'),
        'skipped', count(*) filter (where status in ('skipped', 'held')),
        'emailed', count(*) filter (where step >= 1),
        'emailed_agencies', count(*) filter (where step >= 1 and kind = 'agency'),
        'emailed_councils', count(*) filter (where step >= 1 and kind = 'council'),
        'step1', count(*) filter (where step = 1),
        'step2', count(*) filter (where step = 2),
        'step3', count(*) filter (where step >= 3),
        'sent_today', count(*) filter (where (sent_at at time zone 'Europe/London')::date = today_uk),
        'scheduled', count(*) filter (where draft_id is not null and scheduled_for > now()),
        'next_send', min(scheduled_for) filter (where draft_id is not null and scheduled_for > now()))
      from public.outreach_queue where provider_id <> 'zz-test' and seq < 900000),

    'outreach_days', (select coalesce(jsonb_agg(x order by x.day), '[]'::jsonb) from (
        select g::date as day,
          (select count(*) from public.mail_messages m where m.direction = 'out' and 'outreach' = any(coalesce(m.labels, '{}'))
             and (m.at at time zone 'Europe/London')::date = g::date) as sent,
          (select count(*) from public.outreach_queue o where o.draft_id is not null and o.scheduled_for > now()
             and (o.scheduled_for at time zone 'Europe/London')::date = g::date) as scheduled
        from generate_series(today_uk - 13, today_uk + 6, interval '1 day') g) x),

    'mail', jsonb_build_object(
        'outreach_sent', (select count(*) from public.mail_messages where direction = 'out' and 'outreach' = any(coalesce(labels, '{}'))),
        'received', (select count(*) from public.mail_messages where direction = 'in' and at >= since),
        'sent', (select count(*) from public.mail_messages where direction = 'out' and at >= since),
        'mirrored_at', (select max(mirrored_at) from public.mail_messages),
        'latest_in', (select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) from (
            select at, from_addr, subject, labels from public.mail_messages where direction = 'in' order by at desc limit 6) x)),

    'forms', jsonb_build_object(
        'enquiries', (select count(*) from public.enquiries where created_at >= since),
        'enquiries_total', (select count(*) from public.enquiries),
        'contact_requests', (select count(*) from public.contact_requests where created_at >= since),
        'corrections', (select count(*) from public.correction_requests where created_at >= since),
        'newsletter_active', (select count(*) from public.newsletter_subscribers where status = 'active'),
        'sales_touches', (select count(*) from public.sales_touches where sent_at >= since)),

    'traffic', jsonb_build_object(
        'entries', (select coalesce(sum(n), 0) from public.site_visits where day >= since and entry and source <> 'internal'),
        'prev_entries', (select coalesce(sum(n), 0) from public.site_visits where day >= prev_since and day < since and entry and source <> 'internal'),
        'today', (select coalesce(sum(n), 0) from public.site_visits where day = current_date and entry and source <> 'internal'),
        'pageviews', (select coalesce(sum(n), 0) from public.site_visits where day >= since),
        'search', (select coalesce(sum(n), 0) from public.site_visits where day >= since and entry and medium = 'search'),
        'email', (select coalesce(sum(n), 0) from public.site_visits where day >= since and entry and medium = 'email'),
        'by_source', (select coalesce(jsonb_agg(x order by x.n desc), '[]'::jsonb) from (
            select source, medium, sum(n) n from public.site_visits where day >= since and entry and source <> 'internal' group by source, medium order by 3 desc limit 15) x),
        'by_day', (select coalesce(jsonb_agg(x order by x.day), '[]'::jsonb) from (select g::date as day,
            coalesce((select sum(n) from public.site_visits v where v.day = g::date and v.entry and v.source <> 'internal'), 0) as entries,
            coalesce((select sum(n) from public.site_visits v where v.day = g::date and v.entry and v.medium = 'search'), 0) as search,
            coalesce((select sum(n) from public.site_visits v where v.day = g::date and v.entry and v.medium = 'email'), 0) as email,
            coalesce((select sum(n) from public.site_visits v where v.day = g::date), 0) as pageviews
            from generate_series(since, current_date, interval '1 day') g) x),
        'top_landing', (select coalesce(jsonb_agg(x order by x.n desc), '[]'::jsonb) from (
            select landing, sum(n) n from public.site_visits where day >= since and entry and source <> 'internal' group by landing order by 2 desc limit 12) x),
        'top_search_landing', (select coalesce(jsonb_agg(x order by x.n desc), '[]'::jsonb) from (
            select landing, sum(n) n from public.site_visits where day >= since and entry and medium = 'search' group by landing order by 2 desc limit 10) x)),

    'profiles', jsonb_build_object(
        'by_kind', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, sum(n) n from public.profile_events where day >= since group by kind) x),
        'top_viewed', (select coalesce(jsonb_agg(x order by x.n desc), '[]'::jsonb) from (
            select provider_id, sum(n) n from public.profile_events where day >= since and kind = 'view' group by provider_id order by 2 desc limit 10) x)),

    'areas', (select coalesce(jsonb_agg(x order by x.n desc), '[]'::jsonb) from (
        select area, sum(n) n from public.area_searches where day >= since group by area order by 2 desc limit 10) x),

    'google', case when snap is null then null else jsonb_build_object(
        'snapshot', snap,
        'prev_snapshot', prev_snap,
        'range_start', (select range_start from public.gsc_snapshots where snapshot = snap),
        'range_end', (select range_end from public.gsc_snapshots where snapshot = snap),
        'loaded_at', (select loaded_at from public.gsc_snapshots where snapshot = snap),
        'totals', (select jsonb_build_object(
            'clicks', coalesce(sum(clicks), 0),
            'impressions', coalesce(sum(impressions), 0),
            'ctr', case when sum(impressions) > 0 then round(100.0 * sum(clicks) / sum(impressions), 2) end,
            'position', case when sum(impressions) filter (where position is not null) > 0
              then round(sum(position * impressions) filter (where position is not null) / sum(impressions) filter (where position is not null), 1) end)
          from public.gsc_daily),
        'daily', (select coalesce(jsonb_agg(x order by x.day), '[]'::jsonb) from (select day, clicks, impressions, position from public.gsc_daily order by day) x),
        'keywords', (select count(*) from public.gsc_queries where snapshot = snap),
        'pages', (select count(*) from public.gsc_pages where snapshot = snap),
        'ladder', (select jsonb_build_object(
            'page1', count(*) filter (where position <= 10),
            'page2', count(*) filter (where position > 10 and position <= 20),
            'page3', count(*) filter (where position > 20 and position <= 30),
            'deeper', count(*) filter (where position > 30))
          from public.gsc_queries where snapshot = snap),
        'prev_ladder', case when prev_snap is null then null else (select jsonb_build_object(
            'page1', count(*) filter (where position <= 10),
            'page2', count(*) filter (where position > 10 and position <= 20),
            'page3', count(*) filter (where position > 20 and position <= 30),
            'deeper', count(*) filter (where position > 30))
          from public.gsc_queries where snapshot = prev_snap) end,
        'top_queries', (select coalesce(jsonb_agg(x order by x.impressions desc, x.position), '[]'::jsonb) from (
            select q.query, q.clicks, q.impressions, q.position, p.position as prev_position
            from public.gsc_queries q left join public.gsc_queries p on p.snapshot = prev_snap and p.query = q.query
            where q.snapshot = snap order by q.impressions desc, q.position limit 30) x),
        'best_queries', (select coalesce(jsonb_agg(x order by x.position, x.impressions desc), '[]'::jsonb) from (
            select q.query, q.clicks, q.impressions, q.position, p.position as prev_position
            from public.gsc_queries q left join public.gsc_queries p on p.snapshot = prev_snap and p.query = q.query
            where q.snapshot = snap and q.position <= 20 order by q.position, q.impressions desc limit 80) x),
        'top_pages', (select coalesce(jsonb_agg(x order by x.impressions desc, x.position), '[]'::jsonb) from (
            select g.page, g.clicks, g.impressions, g.position, p.position as prev_position
            from public.gsc_pages g left join public.gsc_pages p on p.snapshot = prev_snap and p.page = g.page
            where g.snapshot = snap order by g.impressions desc, g.position limit 25) x),
        'page_types', (select coalesce(jsonb_agg(x order by x.impressions desc), '[]'::jsonb) from (
            select case when page like '/agency/%' then 'Agency profiles' when page like '/fostering-agencies/%' then 'Area pages'
                        when page like '/fostering-allowance/%' then 'Council pay pages' when page like '/guides/%' then 'Guides'
                        when page like '/news/%' then 'News' else 'Main pages' end as kind,
              count(*) as pages, sum(clicks) as clicks, sum(impressions) as impressions,
              round(sum(position * impressions) / nullif(sum(impressions), 0), 1) as position
            from public.gsc_pages where snapshot = snap group by 1) x),
        'countries', (select coalesce(jsonb_agg(x order by x.impressions desc), '[]'::jsonb) from (
            select name, clicks, impressions, position from public.gsc_segments where snapshot = snap and kind = 'country' order by impressions desc limit 6) x),
        'devices', (select coalesce(jsonb_agg(x order by x.impressions desc), '[]'::jsonb) from (
            select name, clicks, impressions, position from public.gsc_segments where snapshot = snap and kind = 'device' order by impressions desc) x)
      ) end
  ) into r;
  return r;
end
$function$;

revoke execute on function public.owner_hq(integer) from public, anon;
grant execute on function public.owner_hq(integer) to authenticated;
