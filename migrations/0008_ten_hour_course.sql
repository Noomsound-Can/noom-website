-- Ten-Hour Handpan Course (Can, 2026-09-15): the 3-Day Handpan Journey is renamed, goes to
-- 12,000 THB, and its three sessions can spread over two weeks instead of one.
-- The id stays handpan-journey, so old links and existing bookings keep working.
UPDATE service
   SET name = 'Ten-Hour Handpan Course',
       price_thb = 12000,
       price_note = '12,000 THB',
       session_window_days = 14
 WHERE id = 'handpan-journey';
