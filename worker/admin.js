// /api/admin/* handlers (BOOKING-SPEC section 7, BUILD-PLAN step 7) and the hourly
// expiry of unanswered holds. index.js only routes here with a verified Access email.

import { addDays, dayStartMs, isDate, isoUtc, localDate, localTime } from "./availability.js";
import { CAN_WHATSAPP, makeRef, priceFor, sessionName, slotLabel, thb, validateManual, whatsappLink } from "./booking.js";
import { PUBLIC_REPLY_TO, alertRecipients, sendEmail } from "./email.js";
import { createEvent, deleteEvent, patchEvent } from "./gcal.js";
import {
  bookingWhere,
  clamp,
  json,
  privateEvent,
  sessionsWithCounts,
  syncOccurrenceEvent,
} from "./api.js";

// Can, 2026-09-10: the web stops at capacity, admin may seat walk-ins and
// GetYourGuide guests 2 over it (terrace 8 -> 10, Mulajoy 12 -> 14).
const MANUAL_OVER = 2;
const manualLimit = (occ) => occ.capacity + MANUAL_OVER;
const MAX_DAYS = 62;

export async function adminRoute(request, env, ctx, email) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === "GET" && path === "/api/admin/bookings") return adminBookings(url, env, email);
  if (request.method !== "POST") return json({ error: "not_found" }, 404);

  // JSON only: a cross-site form cannot send this content type without a CORS
  // preflight, which this Worker never answers.
  if ((request.headers.get("content-type") || "").split(";")[0].trim() !== "application/json") {
    return json({ error: "json_only" }, 415);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  if (path === "/api/admin/manual") return adminManual(body, env, email);
  let m = /^\/api\/admin\/booking\/([A-Za-z0-9-]{1,40})$/.exec(path);
  if (m) return adminBookingAction(body, env, ctx, email, m[1]);
  m = /^\/api\/admin\/occurrence\/([a-z0-9-]{1,80})$/.exec(path);
  if (m) return adminOccurrence(body, env, email, m[1]);
  return json({ error: "not_found" }, 404);
}

// GET /api/admin/bookings?days=30
// -> { me, today, days, bookings: [...], sessions: [...] }
// bookings: private and partner bookings with a slot in range, plus every pending
// one whatever its date. sessions: weekly occurrences in range with their guests.
// Dates and times are Koh Samui time.
async function adminBookings(url, env, email) {
  const days = clamp(parseInt(url.searchParams.get("days") || "30", 10) || 30, 1, MAX_DAYS);
  const nowMs = Date.now();
  const today = localDate(nowMs);
  const from = isoUtc(dayStartMs(today));
  const to = isoUtc(dayStartMs(addDays(today, days)));
  const lastAction = (col) =>
    `(SELECT json_object('email', l.email, 'action', l.action, 'at', l.at, 'detail', l.detail)
        FROM admin_log l WHERE l.target = ${col} ORDER BY l.id DESC LIMIT 1) AS last_action`;
  const wanted = `b.occurrence_id IS NULL AND (b.status = 'pending' OR EXISTS (
      SELECT 1 FROM booking_slot s WHERE s.ref = b.ref AND s.starts_at_utc >= ?1 AND s.starts_at_utc < ?2))`;

  const [bookings, slots, guests, logs, services] = await env.DB.batch([
    env.DB.prepare(
      `SELECT b.*, sv.name AS service_name, sv.kind, p.name AS partner_name, ${lastAction("b.ref")}
         FROM booking b JOIN service sv ON sv.id = b.service_id
         LEFT JOIN partner p ON p.slug = b.partner_slug
        WHERE ${wanted}`,
    ).bind(from, to),
    env.DB.prepare(
      `SELECT s.ref, s.starts_at_utc, s.ends_at_utc FROM booking_slot s
        WHERE s.ref IN (SELECT b.ref FROM booking b WHERE ${wanted})
        ORDER BY s.starts_at_utc`,
    ).bind(from, to),
    env.DB.prepare(
      `SELECT b.ref, b.occurrence_id, b.name, b.whatsapp, b.email, b.party_size, b.notes, b.source,
              b.status, b.price_thb, b.created_at, ${lastAction("b.ref")}
         FROM booking b
        WHERE b.occurrence_id IS NOT NULL AND b.starts_at_utc >= ?1 AND b.starts_at_utc < ?2
        ORDER BY b.created_at`,
    ).bind(from, to),
    env.DB.prepare(
      `SELECT l.target, json_object('email', l.email, 'action', l.action, 'at', l.at) AS last_action
         FROM admin_log l
        WHERE l.id IN (SELECT max(id) FROM admin_log WHERE action IN ('close', 'reopen') GROUP BY target)`,
    ),
    env.DB.prepare("SELECT id, name FROM service"),
  ]);
  const serviceById = new Map(services.results.map((s) => [s.id, s]));
  const sessions = await sessionsWithCounts(env, today, days);

  const slotsByRef = new Map();
  for (const s of slots.results) {
    const startMs = Date.parse(s.starts_at_utc);
    const endMs = Date.parse(s.ends_at_utc);
    if (!slotsByRef.has(s.ref)) slotsByRef.set(s.ref, []);
    slotsByRef.get(s.ref).push({
      date: localDate(startMs),
      time: localTime(startMs),
      end_time: localTime(endMs),
      label: slotLabel(startMs),
      in_range: s.starts_at_utc >= from && s.starts_at_utc < to,
    });
  }
  const guestsByOcc = new Map();
  for (const g of guests.results) {
    if (!guestsByOcc.has(g.occurrence_id)) guestsByOcc.set(g.occurrence_id, []);
    guestsByOcc.get(g.occurrence_id).push({ ...clean(g), occurrence_id: undefined });
  }
  const occLog = new Map(logs.results.map((r) => [r.target, parseJson(r.last_action)]));

  return json({
    me: email,
    today,
    days,
    bookings: bookings.results
      .map((b) => ({
        ...clean(b),
        status: shownStatus(b, nowMs),
        service: b.service_name,
        partner: b.partner_name,
        slots: slotsByRef.get(b.ref) || [],
        service_name: undefined,
        partner_name: undefined,
        occurrence_id: undefined,
        gcal_event_id: undefined,
      }))
      .sort((a, b) => (a.starts_at_utc < b.starts_at_utc ? -1 : 1)),
    sessions: sessions.map((o) => ({
      id: o.id,
      service_id: o.service_id,
      title: sessionName(serviceById.get(o.service_id) || { id: o.service_id, name: o.service_id }, "calendar"),
      name: sessionName(serviceById.get(o.service_id) || { id: o.service_id, name: o.service_id }),
      manual_max: manualLimit(o),
      date: o.date,
      time: localTime(o.startMs),
      end_time: localTime(o.endMs),
      label: slotLabel(o.startMs),
      venue: o.venue,
      capacity: o.capacity,
      taken: o.taken,
      status: o.status,
      started: o.startMs <= nowMs,
      last_action: occLog.get(o.id) || null,
      guests: guestsByOcc.get(o.id) || [],
    })),
  });
}

// POST /api/admin/booking/:ref { action: 'confirm' | 'decline' | 'cancel' }
// -> { ok, ref, status, calendar }. calendar: true, false (fix it by hand) or 'off' (local).
async function adminBookingAction(body, env, ctx, email, ref) {
  const action = body.action;
  if (!["confirm", "decline", "cancel", "mats"].includes(action)) return json({ error: "bad_action" }, 400);
  const b = await env.DB.prepare("SELECT * FROM booking WHERE ref = ?").bind(ref).first();
  if (!b) return json({ error: "not_found" }, 404);
  const service = await env.DB.prepare("SELECT * FROM service WHERE id = ?").bind(b.service_id).first();
  if (action === "mats") return adminMats(body, env, email, b, service);
  const nowIso = isoUtc(Date.now());

  let res;
  let status;
  if (action === "confirm") {
    // Also valid after the 24 h hold ran out, as long as nobody else has taken the
    // time since (the hourly Cron declines expired holds, so that window is short).
    status = "confirmed";
    res = await env.DB.prepare(
      `UPDATE booking SET status = 'confirmed', hold_expires_at = NULL
        WHERE ref = ?1 AND status = 'pending' AND occurrence_id IS NULL
          AND NOT EXISTS (
            SELECT 1
              FROM booking_slot mine
              JOIN booking me ON me.ref = mine.ref
              JOIN service msv ON msv.id = me.service_id
              JOIN booking_slot x ON x.ref != mine.ref
              JOIN booking o ON o.ref = x.ref
              JOIN service sv ON sv.id = o.service_id
             WHERE mine.ref = ?1
               AND (o.status = 'confirmed' OR (o.status = 'pending' AND o.hold_expires_at > ?2))
               AND x.starts_at_utc < strftime('%Y-%m-%dT%H:%M:%SZ', mine.ends_at_utc, '+' || msv.buffer_after_min || ' minutes')
               AND strftime('%Y-%m-%dT%H:%M:%SZ', x.ends_at_utc, '+' || sv.buffer_after_min || ' minutes') > mine.starts_at_utc)`,
    ).bind(ref, nowIso).run();
  } else if (action === "decline") {
    status = "declined";
    res = await env.DB.prepare("UPDATE booking SET status = 'declined' WHERE ref = ? AND status = 'pending'")
      .bind(ref).run();
  } else {
    status = "cancelled";
    res = await env.DB.prepare(
      "UPDATE booking SET status = 'cancelled' WHERE ref = ? AND status IN ('pending', 'confirmed')",
    ).bind(ref).run();
  }
  if (res.meta.changes !== 1) {
    if (action === "confirm" && b.status === "pending" && !b.occurrence_id) return json({ error: "slot_taken" }, 409);
    return json({ error: "wrong_status", status: b.status }, 409);
  }
  await log(env, email, action, ref, `${b.status} to ${status}`);

  let calendar;
  if (b.occurrence_id) {
    calendar = await calendarStep(env, `${action} ${ref}`, () => syncOccurrenceEvent(env, b.occurrence_id));
  } else if (action === "confirm") {
    calendar = await confirmEvents(env, service, { ...b, status });
  } else {
    calendar = await deleteEvents(env, ref);
  }

  if (action === "confirm" && b.email) ctx.waitUntil(confirmEmail(env, service, b));
  return json({ ok: true, ref, status, calendar });
}

// POST /api/admin/booking/:ref { action: 'mats', party_size } on a group session guest:
// one of a group of 6 cannot come, make it 5. Same ceiling as adding a guest
// (capacity + MANUAL_OVER), checked in one statement. A website guest's price follows
// the new size; a manual guest has no price. To remove the whole booking, cancel it.
async function adminMats(body, env, email, b, service) {
  if (!b.occurrence_id) return json({ error: "group_only" }, 400);
  if (b.status !== "confirmed") return json({ error: "wrong_status", status: b.status }, 409);
  const n = Number(body.party_size);
  if (!Number.isInteger(n) || n < 1) return json({ error: "invalid", fields: { party_size: "At least 1. To remove the booking, cancel it." } }, 400);
  if (n === b.party_size) return json({ ok: true, ref: b.ref, party_size: n, calendar: true });
  const occ = await findOccurrence(env, b.occurrence_id);
  if (!occ) return json({ error: "unknown_occurrence" }, 400);
  const price = b.price_thb == null ? null : priceFor(service, n);

  const res = await env.DB.prepare(
    `UPDATE booking SET party_size = ?1, price_thb = ?2
      WHERE ref = ?3 AND status = 'confirmed'
        AND (SELECT COALESCE(SUM(party_size), 0) FROM booking
              WHERE occurrence_id = ?4 AND status = 'confirmed' AND ref != ?3) + ?1 <= ?5`,
  ).bind(n, price, b.ref, b.occurrence_id, manualLimit(occ)).run();
  if (res.meta.changes !== 1) return json({ error: "full", fields: { party_size: "Not enough mats left." } }, 409);

  await log(env, email, "mats", b.ref, `${b.party_size} to ${n}`);
  const calendar = await calendarStep(env, `mats ${b.ref}`, () => syncOccurrenceEvent(env, b.occurrence_id));
  return json({ ok: true, ref: b.ref, party_size: n, price_thb: price, calendar });
}

// POST /api/admin/manual { occurrence, name, party_size, whatsapp?, notes? }
// A GetYourGuide, WhatsApp or walk-in guest on a weekly session, source 'manual'.
// Same atomic guard as /api/signup, but up to capacity + MANUAL_OVER.
async function adminManual(body, env, email) {
  const occ = await findOccurrence(env, body.occurrence);
  if (!occ) return json({ error: "unknown_occurrence" }, 400);
  if (occ.status !== "open") return json({ error: "closed" }, 409);
  const limit = manualLimit(occ);
  const v = validateManual(body, limit - occ.taken);
  if (v.errors) return json({ error: "invalid", fields: v.errors }, 400);
  const d = v.data;

  const startIso = isoUtc(occ.startMs);
  const endIso = isoUtc(occ.endMs);
  let ref;
  for (let attempt = 0; attempt < 3 && !ref; attempt++) {
    const candidate = makeRef();
    try {
      const res = await env.DB.batch([
        insertOccurrence(env, occ),
        env.DB.prepare(
          `INSERT INTO booking (ref, service_id, occurrence_id, starts_at_utc, ends_at_utc, name, whatsapp,
                                party_size, notes, source, status)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 'confirmed'
            WHERE (SELECT status FROM occurrence WHERE id = ?) = 'open'
              AND (SELECT COALESCE(SUM(party_size), 0) FROM booking
                    WHERE occurrence_id = ? AND status = 'confirmed') + ? <= ?`,
        ).bind(
          candidate, occ.service_id, occ.id, startIso, endIso, d.name, d.whatsapp,
          d.party_size, d.notes, occ.id, occ.id, d.party_size, limit,
        ),
      ]);
      if (res[1].meta.changes !== 1) return json({ error: "full", fields: { party_size: "Not enough mats left." } }, 409);
      ref = candidate;
    } catch (err) {
      if (!/UNIQUE/i.test(err.message)) throw err; // ref collision, try another
    }
  }
  if (!ref) return json({ error: "try_again" }, 503);

  await log(env, email, "manual", ref, `${occ.id}, ${d.party_size} mat${d.party_size > 1 ? "s" : ""}, ${d.name}`);
  const calendar = await calendarStep(env, `manual ${ref}`, () => syncOccurrenceEvent(env, occ.id));
  return json({ ok: true, ref, occurrence: occ.id, taken: occ.taken + d.party_size, capacity: occ.capacity, calendar });
}

// POST /api/admin/occurrence/:id { action: 'close' | 'reopen' }
// Closing keeps the guests' bookings (reopen brings them back) and messages nobody:
// the page lists their WhatsApp links so Can can tell them himself.
async function adminOccurrence(body, env, email, id) {
  const action = body.action;
  if (!["close", "reopen"].includes(action)) return json({ error: "bad_action" }, 400);
  const occ = await findOccurrence(env, id);
  if (!occ) return json({ error: "unknown_occurrence" }, 404);
  const status = action === "close" ? "cancelled" : "open";
  if (occ.status === status) return json({ error: "wrong_status", status }, 409);

  await env.DB.batch([
    insertOccurrence(env, occ),
    env.DB.prepare("UPDATE occurrence SET status = ? WHERE id = ?").bind(status, id),
  ]);
  await log(env, email, action, id, null);
  const calendar = await calendarStep(env, `${action} ${id}`, () => syncOccurrenceEvent(env, id));
  return json({ ok: true, id, status, calendar });
}

// Hourly Cron: a hold nobody confirmed or declined within 24 h is declined, its
// PENDING events deleted (Noom Bookings freeBusy would keep the slot blocked
// otherwise), and Can gets one email listing them.
export async function expireHolds(env) {
  const nowIso = isoUtc(Date.now());
  const { results } = await env.DB.prepare(
    `SELECT b.*, sv.name AS service_name FROM booking b JOIN service sv ON sv.id = b.service_id
      WHERE b.status = 'pending' AND b.hold_expires_at <= ?`,
  ).bind(nowIso).all();
  const lines = [];
  const refs = [];
  for (const b of results) {
    const res = await env.DB.prepare(
      "UPDATE booking SET status = 'declined' WHERE ref = ? AND status = 'pending' AND hold_expires_at <= ?",
    ).bind(b.ref, nowIso).run();
    if (res.meta.changes !== 1) continue;
    await log(env, "system", "expire", b.ref, "no answer within 24 hours");
    const { results: slots } = await env.DB.prepare(
      "SELECT starts_at_utc FROM booking_slot WHERE ref = ? ORDER BY starts_at_utc",
    ).bind(b.ref).all();
    const calendar = await deleteEvents(env, b.ref);
    refs.push(b.ref);
    lines.push(
      `${b.ref}  ${b.service_name}, ${slots.map((s) => slotLabel(Date.parse(s.starts_at_utc))).join(" / ")}\n` +
      `  ${b.name}${b.whatsapp ? `, +${b.whatsapp} ${whatsappLink(b.whatsapp)}` : ""}` +
      (calendar === false ? "\n  The PENDING event could not be deleted, remove it by hand." : ""),
    );
  }
  if (!lines.length) return;
  await sendEmail(env, {
    to: alertRecipients(env),
    subject: `Hold expired: ${refs.join(", ")}`,
    text:
      `Nobody confirmed or declined ${lines.length === 1 ? "this request" : "these requests"} within 24 hours, ` +
      `so ${lines.length === 1 ? "it was" : "they were"} declined and the time is free again on the website.\n\n` +
      `${lines.join("\n\n")}\n\nhttps://www.noomsound.studio/admin/`,
  });
}

// ---------- calendar ----------

function calendarOff(env) {
  return env.DEV_NO_CALENDAR === "1"; // local `wrangler dev` only
}

async function calendarStep(env, what, fn) {
  if (calendarOff(env)) return "off";
  try {
    await fn();
    return true;
  } catch (err) {
    console.log(`admin ${what}: calendar failed: ${err.message}`);
    return false;
  }
}

// Rename each PENDING event (drop the prefix, turn it green). An event deleted by
// hand is created again, the booking is real now.
async function confirmEvents(env, service, b) {
  if (calendarOff(env)) return "off";
  const { results: rows } = await env.DB.prepare(
    "SELECT * FROM booking_slot WHERE ref = ? ORDER BY starts_at_utc",
  ).bind(b.ref).all();
  const slots = rows.map((r) => ({ startMs: Date.parse(r.starts_at_utc), endMs: Date.parse(r.ends_at_utc) }));
  const cal = env.GCAL_BOOKINGS_ID;
  let ok = true;
  for (let i = 0; i < rows.length; i++) {
    const event = { ...privateEvent(service, b, slots, i, false), status: "confirmed" };
    try {
      if (rows[i].gcal_event_id) {
        try {
          await patchEvent(env, cal, rows[i].gcal_event_id, event);
          continue;
        } catch (err) {
          if (!/ (404|410):/.test(err.message)) throw err;
        }
      }
      const ev = await createEvent(env, cal, event);
      await env.DB.prepare("UPDATE booking_slot SET gcal_event_id = ? WHERE ref = ? AND starts_at_utc = ?")
        .bind(ev.id, b.ref, rows[i].starts_at_utc).run();
    } catch (err) {
      ok = false;
      console.log(`admin confirm ${b.ref}: event ${i + 1}/${rows.length} failed: ${err.message}`);
    }
  }
  return ok;
}

async function deleteEvents(env, ref) {
  if (calendarOff(env)) return "off";
  const { results: rows } = await env.DB.prepare(
    "SELECT starts_at_utc, gcal_event_id FROM booking_slot WHERE ref = ? AND gcal_event_id IS NOT NULL",
  ).bind(ref).all();
  let ok = true;
  for (const r of rows) {
    try {
      await deleteEvent(env, env.GCAL_BOOKINGS_ID, r.gcal_event_id);
      await env.DB.prepare("UPDATE booking_slot SET gcal_event_id = NULL WHERE ref = ? AND starts_at_utc = ?")
        .bind(ref, r.starts_at_utc).run();
    } catch (err) {
      ok = false;
      console.log(`admin delete events ${ref}: ${err.message}`);
    }
  }
  return ok;
}

// ---------- helpers ----------

async function confirmEmail(env, service, b) {
  const { results: slots } = await env.DB.prepare(
    "SELECT starts_at_utc FROM booking_slot WHERE ref = ? ORDER BY starts_at_utc",
  ).bind(b.ref).all();
  const where = bookingWhere(service, b);
  await sendEmail(env, {
    to: b.email,
    subject: `Your booking is confirmed (${b.ref})`,
    replyTo: PUBLIC_REPLY_TO,
    text:
      `Hello ${b.name},\n\n` +
      `Your booking with Noom Sound Studio is confirmed:\n\n` +
      `${service.name}\n` +
      `${slots.map((s) => slotLabel(Date.parse(s.starts_at_utc))).join("\n")} (Koh Samui time)\n` +
      `${b.party_size > 1 ? `${b.party_size} ${service.id.startsWith("handpan") ? "students" : "guests"}\n` : ""}` +
      `${where ? `${where}\n` : ""}` +
      `${b.price_thb == null ? "" : `${thb(b.price_thb)}, paid on the day in cash, by bank transfer or Thai QR\n`}` +
      `\nYour reference is ${b.ref}. If anything changes, message us on WhatsApp: ${whatsappLink(CAN_WHATSAPP)}\n\n` +
      `Noom Sound Studio\nLamai, Koh Samui\nhttps://www.noomsound.studio`,
  });
}

// A weekly session by id '<recurrence>-<YYYY-MM-DD>', generated or stored, with its count.
async function findOccurrence(env, id) {
  id = String(id || "");
  const date = /-(\d{4}-\d{2}-\d{2})$/.exec(id)?.[1];
  if (!date || !isDate(date)) return null;
  return (await sessionsWithCounts(env, date, 1)).find((o) => o.id === id) || null;
}

// The occurrence row exists only once someone signed up; admin actions create it.
function insertOccurrence(env, occ) {
  return env.DB.prepare(
    `INSERT OR IGNORE INTO occurrence (id, service_id, recurrence_id, starts_at_utc, ends_at_utc, capacity, venue)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(occ.id, occ.service_id, occ.recurrence_id, isoUtc(occ.startMs), isoUtc(occ.endMs), occ.capacity, occ.venue);
}

// Who did what. A missing log row must never undo an action that already happened.
async function log(env, email, action, target, detail) {
  console.log(`admin: ${email} ${action} ${target}${detail ? ` (${detail})` : ""}`);
  try {
    await env.DB.prepare("INSERT INTO admin_log (email, action, target, detail) VALUES (?, ?, ?, ?)")
      .bind(email, action, target, detail).run();
  } catch (err) {
    console.log(`admin: log write failed: ${err.message}`);
  }
}

// 'pending' whose 24 h hold ran out shows as 'expired' until the Cron declines it.
function shownStatus(b, nowMs) {
  return b.status === "pending" && b.hold_expires_at && Date.parse(b.hold_expires_at) <= nowMs ? "expired" : b.status;
}

function clean(row) {
  return { ...row, last_action: parseJson(row.last_action) };
}

function parseJson(s) {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
