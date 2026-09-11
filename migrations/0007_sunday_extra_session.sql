-- Extra Sunday session at 16:00 (Can, 2026-09-11): 75 min, same price and 8 mats as the
-- terrace session. It stays off the website until the 17:30 that same Sunday is full,
-- then /book/ shows it with a note that 17:30 is full. Once it has guests it stays.
-- It runs only once 4 mats are booked: until then guests join a list, and Can confirms
-- on WhatsApp when it reaches 4.
-- Deploy the code before applying this: older code would show 16:00 every Sunday.

-- NULL = a normal session. Otherwise the recurrence this one is the extra for.
ALTER TABLE recurrence ADD COLUMN overflow_of TEXT;
-- NULL = runs whatever the count. Otherwise mats needed before Can confirms it.
ALTER TABLE recurrence ADD COLUMN min_to_run INTEGER;

-- Same service, day, mats and venue as the Sunday 17:30.
INSERT INTO recurrence (id, service_id, weekday, start_time, capacity, venue, overflow_of, min_to_run)
SELECT 'terrace-sun-extra', service_id, weekday, '16:00', capacity, venue, id, 4
  FROM recurrence WHERE id = 'terrace-sun';
