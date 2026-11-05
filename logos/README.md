Logos that agencies sent us by email (claim by reply). File name: <provider id>.<png|jpg|webp|svg>.
After adding one, set it live with: insert into provider_profiles(provider_id, logo_path) values ('<id>', '/logos/<id>.<ext>') on conflict (provider_id) do update set logo_path = excluded.logo_path;
Only add a logo the agency itself sent from its own address. Never copy one from a website.
