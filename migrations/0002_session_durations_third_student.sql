-- Match the website copy (Can, 2026-09-10).
-- 1. Sessions of one booking can differ in length. Comma list in minutes, in date order;
--    NULL means every session is duration_min. The 3-Day Journey is 3 h, 3 h, 4 h = 10 h.
-- 2. The Handpan Demo Lesson takes a third student, +1,000 THB each extra.

ALTER TABLE service ADD COLUMN session_durations TEXT;

UPDATE service SET session_durations = '180,180,240' WHERE id = 'handpan-journey';

UPDATE service
   SET max_guests = 3, price_note = '2,000 THB, +1,000 per extra student'
 WHERE id = 'handpan-demo';
