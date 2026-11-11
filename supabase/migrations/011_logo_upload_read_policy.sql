-- Agencies could not upload a logo in their portal (first reported 11 Nov 2026 by the first agency to try).
-- The upload is an "insert or replace", and Postgres only allows that when the member may also read the object
-- back. Members could insert, replace and delete objects in their own folder but had no read policy, so every
-- upload was refused with "new row violates row-level security policy". Applied through the Supabase connector.
create policy "members read own logo" on storage.objects for select to authenticated
using (bucket_id = 'provider-logos' and public.is_member((storage.foldername(name))[1]));

-- To check as a member without changing anything, run the upload statement inside a block that ends by raising
-- an exception (so it rolls back): set request.jwt.claims to the member's user id, `set local role authenticated`,
-- then: insert into storage.objects (name, bucket_id, owner, owner_id, metadata) values (...)
--       on conflict (bucket_id, name collate "C") where archived_at is null do update set metadata = excluded.metadata returning id;
