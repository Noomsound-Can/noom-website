-- Monthly sound therapy at Mulajoy (Can, 2026-09-10): first Thursday of every month,
-- 17:00 Asia/Bangkok, 60 min, 650 THB per person, 12 spots on the website.
-- Bookable on /book/ like the terrace sessions, with its own live counter.

-- NULL = every week (the terrace), 1 = only the first of that weekday in the month.
ALTER TABLE recurrence ADD COLUMN week_of_month INTEGER;

INSERT INTO service
  (id, name, kind, duration_min, buffer_after_min,
   price_thb, price_base_guests, price_extra_thb, price_note,
   min_guests, max_guests, lead_time_h, sessions, session_window_days, show_duration, sort_order)
VALUES
  ('mulajoy-monthly', 'Sound Therapy, Mulajoy', 'group', 60, 30,
   650, 1, 650, '650 THB per person',
   1, 12, 3, 1, NULL, 1, 15);

INSERT INTO recurrence (id, service_id, weekday, week_of_month, start_time, capacity, venue) VALUES
  ('mulajoy-thu', 'mulajoy-monthly', 4, 1, '17:00', 12, 'Mulajoy, Lamai');
