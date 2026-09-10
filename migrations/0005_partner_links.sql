-- Partner links (BUILD-PLAN step 8), as Can set them on 2026-09-10:
-- partners book 60 minute sessions and give the session their own name; the partner
-- and Can both get an email. Partners are added in /admin/, no deploy.

-- The partner session is 60 min now (was 90), from 1 guest. Buffer stays 90 min:
-- it happens at the partner's venue, so Can drives.
UPDATE service SET duration_min = 60, min_guests = 1 WHERE id = 'partner-slot';

-- Where the partner's confirmation goes. `contact` stays free text.
ALTER TABLE partner ADD COLUMN email TEXT;
ALTER TABLE partner ADD COLUMN created_at TEXT;

-- The session name the partner typed ("Sunset sound bath for two"). NULL for others.
ALTER TABLE booking ADD COLUMN service_label TEXT;
