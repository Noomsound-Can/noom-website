-- Noom booking system, initial schema and seed.
-- Source: noom-booking/BOOKING-SPEC.md section 8 plus Addendum A.
-- Every timestamp is UTC ISO 8601 ('2026-09-13T10:30:00Z'). Local time is Asia/Bangkok (UTC+7).

CREATE TABLE service (
  id                  TEXT PRIMARY KEY,               -- 'handpan-demo'
  name                TEXT NOT NULL,
  kind                TEXT NOT NULL CHECK (kind IN ('group', 'private', 'partner')),
  duration_min        INTEGER NOT NULL,               -- per session, blocked in the calendar
  buffer_after_min    INTEGER NOT NULL DEFAULT 0,     -- subtracted from availability, never shown
  price_thb           INTEGER,                        -- base price, NULL = hidden (partner)
  price_base_guests   INTEGER,                        -- guests included in price_thb
  price_extra_thb     INTEGER,                        -- per guest above price_base_guests
  price_note          TEXT,                           -- display text only, server computes the price
  min_guests          INTEGER NOT NULL DEFAULT 1,
  max_guests          INTEGER NOT NULL DEFAULT 1,
  lead_time_h         INTEGER NOT NULL DEFAULT 0,
  sessions            INTEGER NOT NULL DEFAULT 1,     -- slots per booking (3-Day Journey = 3)
  session_window_days INTEGER,                        -- all slots within N days of the first
  show_duration       INTEGER NOT NULL DEFAULT 1,     -- 0 = keep duration off the guest page
  sort_order          INTEGER NOT NULL DEFAULT 0,     -- card order on /book/
  active              INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE partner (
  slug    TEXT PRIMARY KEY,                           -- used in /book/?partner=<slug>
  name    TEXT NOT NULL,
  contact TEXT,
  active  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE recurrence (                             -- defines the weekly sessions
  id         TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES service(id),
  weekday    INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0 = Sunday .. 6 = Saturday
  start_time TEXT NOT NULL,                           -- '17:30' Asia/Bangkok
  capacity   INTEGER NOT NULL,
  venue      TEXT,
  active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE occurrence (                             -- one concrete Wednesday or Sunday
  id            TEXT PRIMARY KEY,
  service_id    TEXT NOT NULL REFERENCES service(id),
  recurrence_id TEXT REFERENCES recurrence(id),
  starts_at_utc TEXT NOT NULL,
  ends_at_utc   TEXT NOT NULL,
  capacity      INTEGER NOT NULL,
  venue         TEXT,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'cancelled')),
  gcal_event_id TEXT,
  UNIQUE (recurrence_id, starts_at_utc)               -- generating the next weeks is idempotent
);

CREATE TABLE booking (
  ref             TEXT PRIMARY KEY,                   -- 'NM-7K3QD', speakable on the phone
  service_id      TEXT NOT NULL REFERENCES service(id),
  occurrence_id   TEXT REFERENCES occurrence(id),     -- weekly signups only
  starts_at_utc   TEXT NOT NULL,                      -- first slot start, for sorting
  ends_at_utc     TEXT NOT NULL,                      -- last slot end
  name            TEXT NOT NULL,
  whatsapp        TEXT,
  email           TEXT,
  party_size      INTEGER NOT NULL DEFAULT 1,
  notes           TEXT,
  location        TEXT,
  price_thb       INTEGER,                            -- price quoted at booking time, NULL for partner
  source          TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'manual', 'partner')),
  partner_slug    TEXT REFERENCES partner(slug),
  status          TEXT NOT NULL CHECK (status IN ('confirmed', 'pending', 'declined', 'cancelled')),
  hold_expires_at TEXT,                               -- pending only, created_at + 24 h
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- One row per blocked time range of a private or partner booking.
-- Single-slot bookings write one row, the 3-Day Journey writes three.
-- Availability reads this table (joined to booking.status), never booking directly.
-- Weekly signups write no rows here: their time is blocked by the occurrence.
CREATE TABLE booking_slot (
  ref           TEXT NOT NULL REFERENCES booking(ref) ON DELETE CASCADE,
  starts_at_utc TEXT NOT NULL,
  ends_at_utc   TEXT NOT NULL,                        -- session end, buffer is added at read time
  gcal_event_id TEXT,
  PRIMARY KEY (ref, starts_at_utc)
);

CREATE INDEX idx_booking_slot_starts ON booking_slot (starts_at_utc);
CREATE INDEX idx_booking_occurrence  ON booking (occurrence_id, status);
CREATE INDEX idx_booking_status      ON booking (status, starts_at_utc);
CREATE INDEX idx_occurrence_starts   ON occurrence (starts_at_utc);

-- Services, Addendum A. Price for a party of n:
--   price_thb + max(0, n - price_base_guests) * price_extra_thb
INSERT INTO service
  (id, name, kind, duration_min, buffer_after_min,
   price_thb, price_base_guests, price_extra_thb, price_note,
   min_guests, max_guests, lead_time_h, sessions, session_window_days, show_duration, sort_order)
VALUES
  ('terrace-weekly', 'Sound Journey, Noom Terrace', 'group', 75, 30,
   600, 1, 600, '600 THB per person',
   1, 8, 3, 1, NULL, 1, 10),
  ('sound-journey-terrace', 'Private Sound Journey at Noom Terrace', 'private', 90, 30,
   2500, 2, 500, '2,500 THB for 2, +500 per extra guest',
   2, 8, 12, 1, NULL, 1, 20),
  ('sound-journey-villa', 'Private Sound Journey at your villa', 'private', 90, 90,
   4000, 2, 500, '4,000 THB for 2, +500 per extra guest',
   2, 10, 12, 1, NULL, 1, 30),
  ('handpan-demo', 'Handpan Demo Lesson', 'private', 120, 30,
   2000, 1, 1000, '2,000 THB, +1,000 for a 2nd student',
   1, 2, 6, 1, NULL, 0, 40),
  ('handpan-journey', 'Handpan 3-Day Journey', 'private', 180, 30,
   10000, 1, 0, '10,000 THB',
   1, 1, 6, 3, 7, 0, 50),
  ('partner-slot', 'Partner Session', 'partner', 90, 90,
   NULL, NULL, NULL, NULL,
   2, 10, 12, 1, NULL, 1, 60);

-- Weekly terrace sessions, Wednesday and Sunday 17:30 Asia/Bangkok.
INSERT INTO recurrence (id, service_id, weekday, start_time, capacity, venue) VALUES
  ('terrace-wed', 'terrace-weekly', 3, '17:30', 8, 'Noom Terrace, Lamai'),
  ('terrace-sun', 'terrace-weekly', 0, '17:30', 8, 'Noom Terrace, Lamai');

-- partner starts empty. Adding a partner is one INSERT, no deploy.
