// Public /api/* handlers. BOOKING-SPEC section 9.

import {
  addDays,
  blocks,
  dayStartMs,
  freeSlots,
  isDate,
  isoUtc,
  localDate,
  weeklyOccurrences,
} from "./availability.js";
import {
  CAN_WHATSAPP,
  HOLD_MS,
  makeRef,
  priceFor,
  sessionDurations,
  slotLabel,
  thb,
  validateBooking,
  whatsappLink,
} from "./booking.js";
import { PUBLIC_REPLY_TO, alertRecipients, sendEmail } from "./email.js";
import { busyCalendars, createEvent, freeBusy } from "./gcal.js";

const FREEBUSY_TTL_S = 60; // spec section 5, do not raise
const MAX_DAYS = 62;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_BOOKINGS_PER_HOUR = 30; // all sources, a brake on scripted spam
const MAX_OPEN_REQUESTS_PER_NUMBER = 3;
const TERRACE = "Noom Terrace, Lamai";

// GET /api/services -> [{ id, name, kind, price_thb, ... }] in page order.
// Partner services are only listed for a partner link (BUILD-PLAN step 8).
export async function services(request, env) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, kind, duration_min, show_duration, price_thb, price_base_guests,
            price_extra_thb, price_note, min_guests, max_guests, sessions, session_window_days
       FROM service WHERE active = 1 AND kind != 'partner' ORDER BY sort_order`,
  ).all();
  for (const s of results) {
    if (!s.show_duration) s.duration_min = null;
    delete s.show_duration;
  }
  return json(results);
}

// GET /api/availability?service=<id>&from=<YYYY-MM-DD>&days=21[&session=N]
// -> { "2026-09-11": ["09:00", "09:30", ...], ... }
// session (1-based, default 1) picks the length of that session for multi-session
// services, e.g. the 3rd day of the 3-Day Journey is longer.
export async function availability(request, env, ctx) {
  const url = new URL(request.url);
  const nowMs = Date.now();

  const service = await activeService(env, url.searchParams.get("service"));
  if (!service) return json({ error: "unknown_service" }, 400);
  if (service.kind === "group") return json({ error: "use_occurrences" }, 400);

  const today = localDate(nowMs);
  let from = url.searchParams.get("from") || today;
  if (!isDate(from)) return json({ error: "bad_from" }, 400);
  if (from < today) from = today;
  const days = clamp(parseInt(url.searchParams.get("days") || "21", 10) || 21, 1, MAX_DAYS);
  const durations = sessionDurations(service);
  const session = parseInt(url.searchParams.get("session") || "1", 10);
  if (!(session >= 1 && session <= durations.length)) return json({ error: "bad_session" }, 400);

  try {
    return json(await serviceSlots(env, ctx, url.origin, service, from, days, nowMs, false, durations[session - 1]));
  } catch (err) {
    console.log(`availability: calendar unavailable: ${err.message}`);
    return json({ error: "calendar_unavailable" }, 503);
  }
}

// POST /api/book, private booking request (spec 6.2).
// { service, slots: [{date, time}], name, whatsapp, email?, party_size, location?, notes? }
// -> { ref, status, whatsapp_url, price_thb, slots: ['Sat 12 Sep, 10:00'] }
export async function book(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  if (body.website) return json({ error: "rejected" }, 400); // honeypot field, humans leave it empty

  const service = await activeService(env, body.service);
  if (!service || service.kind === "group") return json({ error: "unknown_service" }, 400);
  if (service.kind === "partner") return json({ error: "unknown_service" }, 400); // step 8

  const v = validateBooking(body, service);
  if (v.errors) return json({ error: "invalid", fields: v.errors }, 400);
  const d = v.data;
  const nowMs = Date.now();
  const nowIso = isoUtc(nowMs);

  const [recent, open] = await env.DB.batch([
    env.DB.prepare("SELECT count(*) AS n FROM booking WHERE created_at > ?").bind(isoUtc(nowMs - 3600 * 1000)),
    env.DB.prepare(
      "SELECT count(*) AS n FROM booking WHERE whatsapp = ? AND status = 'pending' AND hold_expires_at > ?",
    ).bind(d.whatsapp, nowIso),
  ]);
  if (recent.results[0].n >= MAX_BOOKINGS_PER_HOUR) return json({ error: "busy" }, 429);
  if (open.results[0].n >= MAX_OPEN_REQUESTS_PER_NUMBER) return json({ error: "too_many_open" }, 429);

  // Every write re-validates against a fresh calendar read, never the cache.
  const first = d.slots[0].date;
  const last = d.slots.at(-1).date;
  const span = Math.round((dayStartMs(last) - dayStartMs(first)) / DAY_MS) + 1;
  const origin = new URL(request.url).origin;
  const free = {}; // durationMin -> { date: [times] }
  try {
    for (const len of new Set(d.slots.map((s) => s.durationMin))) {
      free[len] = await serviceSlots(env, ctx, origin, service, first, span, nowMs, true, len);
    }
  } catch (err) {
    console.log(`book: calendar unavailable: ${err.message}`);
    return json({ error: "calendar_unavailable" }, 503);
  }
  if (!d.slots.every((s) => free[s.durationMin][s.date]?.includes(s.time))) {
    return json({ error: "slot_taken" }, 409);
  }

  const price = priceFor(service, d.party_size);
  let ref;
  for (let attempt = 0; attempt < 3 && !ref; attempt++) {
    const candidate = makeRef();
    try {
      if (await insertHold(env, candidate, service, d, price, nowMs)) ref = candidate;
      else return json({ error: "slot_taken" }, 409);
    } catch (err) {
      if (!/UNIQUE/i.test(err.message)) throw err; // ref collision, try another
    }
  }
  if (!ref) return json({ error: "try_again" }, 503);

  const labels = d.slots.map((s) => slotLabel(s.startMs));
  const waText =
    `Hi Can, I just sent a booking request on the website. Reference ${ref}: ` +
    `${service.name}, ${labels.join(" / ")}` +
    `${d.party_size > 1 ? `, ${d.party_size} guests` : ""}.`;

  ctx.waitUntil(afterRequest(env, { ref, service, d, price, labels }));

  return json({
    ref,
    status: "pending",
    whatsapp_url: whatsappLink(CAN_WHATSAPP, waText),
    price_thb: price,
    slots: labels,
  });
}

// One atomic batch: the booking row goes in only if none of its slots overlaps a live
// booking slot (plus that booking's buffer); the slot rows go in only if the booking did.
// D1 runs a batch as one transaction, so two guests racing for a slot cannot both win.
async function insertHold(env, ref, service, d, price, nowMs) {
  const nowIso = isoUtc(nowMs);
  const overlap = `EXISTS (
      SELECT 1 FROM booking_slot x
        JOIN booking b ON b.ref = x.ref
        JOIN service sv ON sv.id = b.service_id
       WHERE (b.status = 'confirmed' OR (b.status = 'pending' AND b.hold_expires_at > ?))
         AND x.starts_at_utc < ?
         AND strftime('%Y-%m-%dT%H:%M:%SZ', x.ends_at_utc, '+' || sv.buffer_after_min || ' minutes') > ?)`;
  const guards = d.slots.map(() => `NOT ${overlap}`).join(" AND ");
  const guardBinds = d.slots.flatMap((s) => [
    nowIso,
    isoUtc(s.endMs + service.buffer_after_min * 60 * 1000),
    isoUtc(s.startMs),
  ]);

  const stmts = [
    env.DB.prepare(
      `INSERT INTO booking (ref, service_id, starts_at_utc, ends_at_utc, name, whatsapp, email,
                            party_size, notes, location, price_thb, source, status, hold_expires_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'web', 'pending', ? WHERE ${guards}`,
    ).bind(
      ref, service.id, isoUtc(d.slots[0].startMs), isoUtc(d.slots.at(-1).endMs),
      d.name, d.whatsapp, d.email, d.party_size, d.notes, d.location, price,
      isoUtc(nowMs + HOLD_MS), ...guardBinds,
    ),
    ...d.slots.map((s) =>
      env.DB.prepare(
        `INSERT INTO booking_slot (ref, starts_at_utc, ends_at_utc)
         SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM booking WHERE ref = ?)`,
      ).bind(ref, isoUtc(s.startMs), isoUtc(s.endMs), ref),
    ),
  ];
  const res = await env.DB.batch(stmts);
  return res[0].meta.changes === 1;
}

// After the guest has their answer: PENDING calendar events, then the alert email
// (which says whether the calendar worked), then the guest's email if they gave one.
async function afterRequest(env, { ref, service, d, price, labels }) {
  const n = d.slots.length;
  const where = service.id === "sound-journey-terrace" ? TERRACE : d.location || "";
  const waGuest = whatsappLink(d.whatsapp);
  const details = [
    `Ref: ${ref}`,
    `Service: ${service.name}`,
    `When: ${labels.join(" / ")} (Koh Samui time)`,
    `Name: ${d.name}`,
    `WhatsApp: +${d.whatsapp}  ${waGuest}`,
    d.email ? `Email: ${d.email}` : null,
    `Guests: ${d.party_size}`,
    where ? `Where: ${where}` : null,
    `Price: ${price == null ? "hidden" : thb(price)}`,
    d.notes ? `Notes: ${d.notes}` : null,
    `Source: web`,
  ].filter(Boolean).join("\n");

  let calendarOk = true;
  for (let i = 0; i < n; i++) {
    const s = d.slots[i];
    try {
      const ev = await createEvent(env, env.GCAL_BOOKINGS_ID, {
        summary:
          `PENDING, ${service.name}${n > 1 ? ` (${i + 1}/${n})` : ""}, ${d.name}` +
          `${d.party_size > 1 ? ` (${d.party_size} guests)` : ""}`,
        description: details,
        location: where || undefined,
        colorId: "5", // yellow while pending
        start: { dateTime: isoUtc(s.startMs), timeZone: "Asia/Bangkok" },
        end: { dateTime: isoUtc(s.endMs), timeZone: "Asia/Bangkok" },
      });
      await env.DB.prepare(
        "UPDATE booking_slot SET gcal_event_id = ? WHERE ref = ? AND starts_at_utc = ?",
      ).bind(ev.id, ref, isoUtc(s.startMs)).run();
    } catch (err) {
      calendarOk = false;
      console.log(`book ${ref}: calendar event ${i + 1}/${n} failed: ${err.message}`);
    }
  }

  await sendEmail(env, {
    to: alertRecipients(env),
    subject: `New request ${ref}: ${service.name}, ${labels[0]}`,
    replyTo: d.email || undefined,
    text:
      `${details}\n\n` +
      `Held for 24 hours. Message the guest on WhatsApp to confirm.\n` +
      (calendarOk ? "" : "\nThe calendar event could not be created, add it by hand.\n"),
  });

  if (d.email) {
    await sendEmail(env, {
      to: d.email,
      subject: `Your request with Noom Sound Studio (${ref})`,
      replyTo: PUBLIC_REPLY_TO,
      text:
        `Hello ${d.name},\n\n` +
        `Thank you. We have your request:\n\n` +
        `${service.name}\n${labels.join("\n")} (Koh Samui time)\n` +
        `${d.party_size > 1 ? `${d.party_size} guests\n` : ""}` +
        `${price == null ? "" : `${thb(price)}, paid on the day in cash, by bank transfer or Thai QR\n`}` +
        `\nThis is a request. We will message you on WhatsApp to confirm.\n` +
        `Your reference is ${ref}.\n\n` +
        `Noom Sound Studio\nLamai, Koh Samui\nhttps://www.noomsound.studio`,
    });
  }
}

// Free start times for one service session of durationMin. fresh = skip the 60 s
// calendar cache (writes).
async function serviceSlots(env, ctx, origin, service, from, days, nowMs, fresh, durationMin) {
  const rangeStart = dayStartMs(from);
  const rangeEnd = dayStartMs(addDays(from, days));
  const busy = await calendarBusy(env, ctx, origin, isoUtc(rangeStart), isoUtc(rangeEnd), fresh);

  const [holds, recurrences, dbOccurrences] = await env.DB.batch([
    // Live booking slots: confirmed, or pending with the 24 h hold still running.
    // Range starts a day early so a buffer spilling into the range is caught.
    env.DB.prepare(
      `SELECT s.starts_at_utc, s.ends_at_utc, sv.buffer_after_min
         FROM booking_slot s
         JOIN booking b ON b.ref = s.ref
         JOIN service sv ON sv.id = b.service_id
        WHERE (b.status = 'confirmed' OR (b.status = 'pending' AND b.hold_expires_at > ?1))
          AND s.starts_at_utc < ?3 AND s.ends_at_utc > ?2`,
    ).bind(isoUtc(nowMs), isoUtc(rangeStart - DAY_MS), isoUtc(rangeEnd)),
    env.DB.prepare(
      `SELECT r.*, sv.duration_min, sv.buffer_after_min
         FROM recurrence r JOIN service sv ON sv.id = r.service_id
        WHERE r.active = 1 AND sv.active = 1`,
    ),
    env.DB.prepare(
      `SELECT o.*, sv.buffer_after_min
         FROM occurrence o JOIN service sv ON sv.id = o.service_id
        WHERE o.starts_at_utc >= ?1 AND o.starts_at_utc < ?2`,
    ).bind(isoUtc(rangeStart), isoUtc(rangeEnd)),
  ]);

  const occurrences = weeklyOccurrences(recurrences.results, dbOccurrences.results, from, days);
  return freeSlots({
    durationMin,
    bufferMin: service.buffer_after_min,
    leadTimeH: service.lead_time_h,
    fromDate: from,
    days,
    nowMs,
    blocks: blocks({ gcalBusy: busy, holds: holds.results, occurrences }),
  });
}

// Busy blocks from Can's, Melie's and the Noom Bookings calendar, cached 60 s in the
// Worker cache. Melie's calendar failing is logged and skipped (not shared yet);
// Can's or Noom Bookings failing throws, so no slot is offered on a blind guess.
async function calendarBusy(env, ctx, origin, fromIso, toIso, fresh) {
  if (env.DEV_NO_CALENDAR === "1") return []; // local `wrangler dev --var DEV_NO_CALENDAR:1` only
  const cals = busyCalendars(env);
  const key = new Request(
    `${origin}/api/_cache/freebusy?${new URLSearchParams({
      c: cals.map((c) => c.id).join(","),
      from: fromIso,
      to: toIso,
    })}`,
  );
  const cache = caches.default;
  const hit = fresh ? null : await cache.match(key);
  const fb = hit
    ? await hit.json()
    : await freeBusy(env, cals.map((c) => c.id), fromIso, toIso);
  if (!hit) {
    ctx.waitUntil(
      cache.put(key, Response.json(fb, { headers: { "cache-control": `max-age=${FREEBUSY_TTL_S}` } })),
    );
  }

  const busy = [];
  for (const c of cals) {
    const r = fb[c.id];
    if (r.error && c.label !== "melie") throw new Error(`${c.label}: ${r.error}`);
    busy.push(...r.busy);
  }
  return busy;
}

function activeService(env, id) {
  return env.DB.prepare("SELECT * FROM service WHERE id = ? AND active = 1").bind(String(id || "")).first();
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
