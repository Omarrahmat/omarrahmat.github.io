-- 12 Nov 2026: a 'trial' placement (subscriptions.source = 'trial', an agency's free week of advertising agreed by
-- Omar) is not a paying partner. owner_dashboard and owner_hq leave it out of the paying count and MRR.
-- Applied in place by text replacement of the two functions' subscriptions filters:
--   where provider_id <> 'test-omar' and tier in (...)
-- became
--   where provider_id <> 'test-omar' and coalesce(source, '') <> 'trial' and tier in (...)
-- The live definitions are the source of truth; re-create them from pg_get_functiondef if needed.
select 1;
