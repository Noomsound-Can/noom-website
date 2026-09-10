-- Admin page (BUILD-PLAN step 7): who did what, and when.
-- One row per admin action, plus 'system' rows for holds the hourly Cron expired.
-- /admin/ shows the latest row per booking ("Confirmed by ... at ...").

CREATE TABLE admin_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  email  TEXT NOT NULL,                               -- Cloudflare Access email, or 'system'
  action TEXT NOT NULL,                               -- confirm | decline | cancel | manual | close | reopen | expire
  target TEXT NOT NULL,                               -- booking ref or occurrence id
  detail TEXT
);

CREATE INDEX idx_admin_log_target ON admin_log (target, id);
