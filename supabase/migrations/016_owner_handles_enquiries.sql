-- 21 Nov 2026: Omar put Amber Fostering on Premium free of charge as a pilot and asked that every enquiry from its
-- profile comes to him, to handle himself. A subscription row can now say so. The inbox desk reads this column
-- (claude/inbox-playbook.md); the website reads data/owner-handled.json, which must list the same services.
alter table public.subscriptions add column if not exists owner_handles_enquiries boolean not null default false;
comment on column public.subscriptions.owner_handles_enquiries is
  'True when enquiries for this service go to the owner (Fostering Today''s own team makes the first call) and are never forwarded to the service by a desk.';
