-- Delete a partner from /admin/ (Can, 2026-09-11). A partner with no bookings is
-- removed outright. One with bookings keeps its row, so those bookings still show
-- who to invoice, but gets deleted_at: the link is dead for good and the partner
-- leaves the admin list.
ALTER TABLE partner ADD COLUMN deleted_at TEXT;
