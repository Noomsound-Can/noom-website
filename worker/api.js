// Public /api/* handlers. BOOKING-SPEC section 9.

import {
  addDays,
  blocks,
  dayStartMs,
  freeSlots,
  isDate,
  isoUtc,
  localDate,
  localTime,
  weeklyOccurrences,
} from "./availability.js";
import {
  CAN_WHATSAPP,
  HOLD_MS,
  makeRef,
  priceFor,
  sessionDurations,
  sessionName,
  slotLabel,
  thb,
  validateBooking,
  validateSignup,
  whatsappLink,
} from "./booking.js";
import { PUBLIC_REPLY_TO, alertRecipients, sendEmail } from "./email.js";
import { busyCalendars, createEvent, deleteEvent, freeBusy, patchEvent } from "./gcal.js";

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
  // A partner link books the partner service only, and only with an active partner.
  const partner = body.partner ? await activePartner(env, body.partner) : null;
  if (body.partner && !partner) return json({ error: "unknown_partner" }, 400);
  if ((service.kind === "partner") !== !!partner) return json({ error: "unknown_service" }, 400);

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
  if (!partner && open.results[0].n >= MAX_OPEN_REQUESTS_PER_NUMBER) return json({ error: "too_many_open" }, 429);

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
      if (await insertHold(env, candidate, service, d, price, nowMs, partner)) ref = candidate;
      else return json({ error: "slot_taken" }, 409);
    } catch (err) {
      if (!/UNIQUE/i.test(err.message)) throw err; // ref collision, try another
    }
  }
  if (!ref) return json({ error: "try_again" }, 503);

  const labels = d.slots.map((s) => slotLabel(s.startMs));
  const waText = partner
    ? `Hi Can, ${partner.name} just booked on the website. Reference ${ref}: ` +
      `${d.service_label}, ${labels.join(" / ")}, ${d.party_size} guest${d.party_size > 1 ? "s" : ""}.`
    : `Hi Can, I just sent a booking request on the website. Reference ${ref}: ` +
      `${service.name}, ${labels.join(" / ")}` +
      `${d.party_size > 1 ? `, ${d.party_size} guests` : ""}.`;

  ctx.waitUntil(afterRequest(env, { ref, service, d, price, labels, partner }));

  return json({
    ref,
    status: partner ? "confirmed" : "pending",
    whatsapp_url: whatsappLink(CAN_WHATSAPP, waText),
    price_thb: price,
    slots: labels,
  });
}

// GET /api/partner?slug=<slug> -> { slug, name, service } for an active partner link.
// Only the partner's name goes out, never their email.
export async function partnerInfo(request, env) {
  const partner = await activePartner(env, new URL(request.url).searchParams.get("slug"));
  if (!partner) return json({ error: "unknown_partner" }, 404);
  const s = await activeService(env, "partner-slot");
  if (!s) return json({ error: "unknown_partner" }, 404);
  return json({
    slug: partner.slug,
    name: partner.name,
    service: {
      id: s.id, name: s.name, kind: s.kind, duration_min: s.duration_min,
      min_guests: s.min_guests, max_guests: s.max_guests, sessions: s.sessions,
      session_window_days: s.session_window_days, price_thb: null,
    },
  });
}

function activePartner(env, slug) {
  return env.DB.prepare("SELECT * FROM partner WHERE slug = ? AND active = 1").bind(String(slug || "")).first();
}

// One atomic batch: the booking row goes in only if none of its slots overlaps a live
// booking slot (plus that booking's buffer); the slot rows go in only if the booking did.
// D1 runs a batch as one transaction, so two guests racing for a slot cannot both win.
// A partner booking goes in confirmed straight away (spec 6.3), with no hold.
async function insertHold(env, ref, service, d, price, nowMs, partner = null) {
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
                            party_size, notes, location, price_thb, source, status, hold_expires_at,
                            partner_slug, service_label)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${guards}`,
    ).bind(
      ref, service.id, isoUtc(d.slots[0].startMs), isoUtc(d.slots.at(-1).endMs),
      d.name, d.whatsapp, d.email, d.party_size, d.notes, d.location, price,
      partner ? "partner" : "web", partner ? "confirmed" : "pending",
      partner ? null : isoUtc(nowMs + HOLD_MS), partner?.slug ?? null, d.service_label ?? null,
      ...guardBinds,
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

// Where a private booking happens: the terrace, the villa the guest typed, or for a
// partner booking the room or villa they typed, else the partner itself.
export function bookingWhere(service, b) {
  if (service.id === "sound-journey-terrace") return TERRACE;
  if (b.source === "partner") return [b.partner_name, b.location].filter(Boolean).join(", ");
  return b.location || "";
}

// Event body text for a private booking. b: booking fields (ref, name, whatsapp, email,
// party_size, location, notes, price_thb, source, and for partners partner_name and
// service_label); slots: [{ startMs, endMs }].
export function bookingDetails(service, b, slots) {
  const where = bookingWhere(service, b);
  const partner = b.source === "partner";
  return [
    `Ref: ${b.ref}`,
    `Service: ${partner ? `${b.service_label} (partner session)` : service.name}`,
    partner ? `Partner: ${b.partner_name}` : null,
    `When: ${slots.map((s) => slotLabel(s.startMs)).join(" / ")} (Koh Samui time)`,
    `Name: ${b.name}`,
    `WhatsApp: +${b.whatsapp}  ${whatsappLink(b.whatsapp)}`,
    b.email ? `Email: ${b.email}` : null,
    `Guests: ${b.party_size}`,
    where ? `Where: ${where}` : null,
    `Price: ${partner ? `invoiced to ${b.partner_name}` : b.price_thb == null ? "hidden" : thb(b.price_thb)}`,
    b.notes ? `Notes: ${b.notes}` : null,
    `Source: ${b.source}`,
  ].filter(Boolean).join("\n");
}

// Noom Bookings event for slot i of a private booking: 'PENDING, ' and yellow while
// held, plain and green once confirmed (admin, step 7). Partner bookings (step 8):
// 'PARTNER, <partner>, <their session name> (n guests)', orange, confirmed from the start.
export function privateEvent(service, b, slots, i, pending) {
  const n = slots.length;
  const s = slots[i];
  const where = bookingWhere(service, b);
  const partner = b.source === "partner";
  const guests = b.party_size > 1 ? ` (${b.party_size} guests)` : "";
  return {
    summary: partner
      ? `PARTNER, ${b.partner_name}, ${b.service_label}${guests}`
      : `${pending ? "PENDING, " : ""}${service.name}${n > 1 ? ` (${i + 1}/${n})` : ""}, ${b.name}${guests}`,
    description: bookingDetails(service, b, slots),
    location: where || undefined,
    colorId: partner ? "6" : pending ? "5" : "10",
    start: { dateTime: isoUtc(s.startMs), timeZone: "Asia/Bangkok" },
    end: { dateTime: isoUtc(s.endMs), timeZone: "Asia/Bangkok" },
  };
}

// After the guest has their answer: PENDING calendar events (confirmed PARTNER events
// for a partner link), then the alert email (which says whether the calendar worked),
// then the guest's email, or for a partner the partner's confirmation.
async function afterRequest(env, { ref, service, d, price, labels, partner = null }) {
  const n = d.slots.length;
  const b = {
    ...d, ref, price_thb: price, source: partner ? "partner" : "web",
    partner_name: partner?.name, service_label: d.service_label,
  };
  const details = bookingDetails(service, b, d.slots);

  let calendarOk = true;
  for (let i = 0; i < n; i++) {
    const s = d.slots[i];
    try {
      const ev = await createEvent(env, env.GCAL_BOOKINGS_ID, privateEvent(service, b, d.slots, i, !partner));
      await env.DB.prepare(
        "UPDATE booking_slot SET gcal_event_id = ? WHERE ref = ? AND starts_at_utc = ?",
      ).bind(ev.id, ref, isoUtc(s.startMs)).run();
    } catch (err) {
      calendarOk = false;
      console.log(`book ${ref}: calendar event ${i + 1}/${n} failed: ${err.message}`);
    }
  }

  if (partner) {
    await sendEmail(env, {
      to: alertRecipients(env),
      subject: `New partner booking ${ref}: ${partner.name}, ${d.service_label}, ${labels[0]}`,
      replyTo: partner.email || undefined,
      text:
        `${details}\n\n` +
        `Confirmed automatically, invoiced to ${partner.name}.\n` +
        (calendarOk ? "" : "\nThe calendar event could not be created, add it by hand.\n"),
    });
    if (partner.email) {
      await sendEmail(env, {
        to: partner.email,
        subject: `Booking confirmed: ${d.service_label}, ${labels[0]} (${ref})`,
        replyTo: PUBLIC_REPLY_TO,
        text:
          `Hello ${partner.name},\n\n` +
          `Your booking with Noom Sound Studio is confirmed:\n\n` +
          `${d.service_label}\n${labels.join("\n")} (Koh Samui time), 60 minutes\n` +
          `Guest: ${d.name}, ${d.party_size} guest${d.party_size > 1 ? "s" : ""}\n` +
          `${d.location ? `Where: ${d.location}\n` : ""}` +
          `${d.notes ? `Notes: ${d.notes}\n` : ""}` +
          `\nInvoiced to ${partner.name} per our agreement. Your reference is ${ref}.\n` +
          `To change or cancel, message us on WhatsApp: ${whatsappLink(CAN_WHATSAPP)}\n\n` +
          `Noom Sound Studio\nLamai, Koh Samui\nhttps://www.noomsound.studio`,
      });
    }
    return;
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

// GET /api/occurrences?weeks=6 -> weekly sessions with live counts (spec 6.1).
// [{ id, date, time, end_time, venue, capacity, taken, spots_left, status, bookable }]
export async function occurrences(request, env) {
  const url = new URL(request.url);
  const weeks = clamp(parseInt(url.searchParams.get("weeks") || "6", 10) || 6, 1, 22); // /book/ asks for 22
  const nowMs = Date.now();
  const list = await sessionsWithCounts(env, localDate(nowMs), weeks * 7);
  return json(list.map((o) => publicOccurrence(o, nowMs)));
}

// POST /api/signup, a seat at a weekly session, confirmed instantly (spec 6.1).
// { occurrence: 'terrace-sun-2026-09-13', name, whatsapp, email?, party_size, notes? }
// -> { ref, status, spots_left, whatsapp_url, price_thb, slots: ['Sun 13 Sep, 17:30'] }
export async function signup(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  if (body.website) return json({ error: "rejected" }, 400); // honeypot

  const id = String(body.occurrence || "");
  const date = /-(\d{4}-\d{2}-\d{2})$/.exec(id)?.[1];
  if (!date || !isDate(date)) return json({ error: "unknown_occurrence" }, 400);
  const nowMs = Date.now();
  const occ = (await sessionsWithCounts(env, date, 1)).find((o) => o.id === id);
  if (!occ) return json({ error: "unknown_occurrence" }, 400);
  if (!publicOccurrence(occ, nowMs).bookable) {
    return json({ error: occ.capacity - occ.taken <= 0 ? "full" : "closed", spots_left: Math.max(0, occ.capacity - occ.taken) }, 409);
  }
  const service = await activeService(env, occ.service_id);
  if (!service) return json({ error: "unknown_occurrence" }, 400);

  const v = validateSignup(body, service, occ.capacity - occ.taken);
  if (v.errors) return json({ error: "invalid", fields: v.errors }, 400);
  const d = v.data;

  const recent = await env.DB.prepare("SELECT count(*) AS n FROM booking WHERE created_at > ?")
    .bind(isoUtc(nowMs - 3600 * 1000)).first();
  if (recent.n >= MAX_BOOKINGS_PER_HOUR) return json({ error: "busy" }, 429);

  const price = priceFor(service, d.party_size);
  const startIso = isoUtc(occ.startMs);
  const endIso = isoUtc(occ.endMs);
  let ref;
  for (let attempt = 0; attempt < 3 && !ref; attempt++) {
    const candidate = makeRef();
    try {
      // One atomic batch. The occurrence row is created on first signup; the booking
      // goes in only if the seats already taken plus this party still fit.
      const res = await env.DB.batch([
        env.DB.prepare(
          `INSERT OR IGNORE INTO occurrence (id, service_id, recurrence_id, starts_at_utc, ends_at_utc, capacity, venue)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(occ.id, occ.service_id, occ.recurrence_id, startIso, endIso, occ.capacity, occ.venue),
        env.DB.prepare(
          `INSERT INTO booking (ref, service_id, occurrence_id, starts_at_utc, ends_at_utc, name, whatsapp,
                                email, party_size, notes, price_thb, source, status)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'web', 'confirmed'
            WHERE (SELECT status FROM occurrence WHERE id = ?) = 'open'
              AND (SELECT COALESCE(SUM(party_size), 0) FROM booking
                    WHERE occurrence_id = ? AND status = 'confirmed') + ?
                  <= (SELECT capacity FROM occurrence WHERE id = ?)`,
        ).bind(
          candidate, occ.service_id, occ.id, startIso, endIso, d.name, d.whatsapp, d.email,
          d.party_size, d.notes, price, occ.id, occ.id, d.party_size, occ.id,
        ),
      ]);
      if (res[1].meta.changes !== 1) {
        const left = await spotsLeft(env, occ.id);
        return json({ error: left <= 0 ? "full" : "not_enough", spots_left: left }, 409);
      }
      ref = candidate;
    } catch (err) {
      if (!/UNIQUE/i.test(err.message)) throw err; // ref collision, try another
    }
  }
  if (!ref) return json({ error: "try_again" }, 503);

  const left = await spotsLeft(env, occ.id);
  const label = slotLabel(occ.startMs);
  const mats = `${d.party_size} mat${d.party_size > 1 ? "s" : ""}`;
  const waText = `Hi Can, I booked ${mats} for the ${sessionName(service)} on ${label}. Reference ${ref}.`;
  ctx.waitUntil(afterSignup(env, { ref, service, occ, d, price, label, mats, left }));

  return json({
    ref,
    status: "confirmed",
    spots_left: left,
    whatsapp_url: whatsappLink(CAN_WHATSAPP, waText),
    price_thb: price,
    slots: [label],
  });
}

async function afterSignup(env, { ref, service, occ, d, price, label, mats, left }) {
  let calendarOk = true;
  try {
    await syncOccurrenceEvent(env, occ.id);
  } catch (err) {
    calendarOk = false;
    console.log(`signup ${ref}: calendar sync failed: ${err.message}`);
  }
  const taken = occ.capacity - left;
  await sendEmail(env, {
    to: alertRecipients(env),
    subject: `New signup ${ref}: ${label}, ${mats} (${taken}/${occ.capacity})`,
    replyTo: d.email || undefined,
    text: [
      `Ref: ${ref}`,
      `Session: ${service.name}, ${label} (Koh Samui time)`,
      `Name: ${d.name}`,
      `WhatsApp: +${d.whatsapp}  ${whatsappLink(d.whatsapp)}`,
      d.email ? `Email: ${d.email}` : null,
      `Mats: ${d.party_size}`,
      `Price: ${thb(price)}, paid on the day`,
      d.notes ? `Notes: ${d.notes}` : null,
      "",
      `Now ${taken} of ${occ.capacity} mats taken, ${left} left. Confirmed automatically.`,
      calendarOk ? null : "The calendar event could not be updated, check Noom Bookings.",
    ].filter((x) => x !== null).join("\n"),
  });
  if (d.email) {
    await sendEmail(env, {
      to: d.email,
      subject: `Your mat is booked (${ref})`,
      replyTo: PUBLIC_REPLY_TO,
      text:
        `Hello ${d.name},\n\n` +
        `Your ${mats} ${d.party_size > 1 ? "are" : "is"} booked:\n\n` +
        `${service.name}\n${label} (Koh Samui time)\n${occ.venue}\n` +
        `${thb(price)}, paid on the day in cash, by bank transfer or Thai QR\n\n` +
        `Please arrive ten minutes early. Your reference is ${ref}.\n\n` +
        `Noom Sound Studio\nLamai, Koh Samui\nhttps://www.noomsound.studio`,
    });
  }
}

// One event per weekly session in Noom Bookings, titled with the live count and
// listing every guest. Created on first signup, patched after that. Also used by
// admin changes (step 7). A closed session keeps its event, marked CANCELLED and
// set to "free" so Noom Bookings stops blocking that time for private bookings.
export async function syncOccurrenceEvent(env, id) {
  if (env.DEV_NO_CALENDAR === "1") return; // local `wrangler dev` only
  const occ = await env.DB.prepare(
    "SELECT o.*, sv.id AS sid, sv.name AS service_name FROM occurrence o JOIN service sv ON sv.id = o.service_id WHERE o.id = ?",
  ).bind(id).first();
  if (!occ) return;
  const title = sessionName({ id: occ.sid, name: occ.service_name }, "calendar");
  const { results: guests } = await env.DB.prepare(
    `SELECT ref, name, whatsapp, party_size, source, notes FROM booking
      WHERE occurrence_id = ? AND status = 'confirmed' ORDER BY created_at`,
  ).bind(id).all();
  const closed = occ.status === "cancelled";
  if (closed && !occ.gcal_event_id && !guests.length) return; // nothing worth showing
  const taken = guests.reduce((n, g) => n + g.party_size, 0);
  const event = {
    summary: `${closed ? "CANCELLED, " : ""}${title} (${taken}/${occ.capacity})`,
    description:
      guests.map((g) =>
        `${g.party_size} · ${g.name}${g.whatsapp ? ` · +${g.whatsapp} ${whatsappLink(g.whatsapp)}` : ""}` +
        ` · ${g.source}${g.source === "manual" && g.notes ? ` (${g.notes})` : ""} · ${g.ref}`,
      ).join("\n") || "No guests yet.",
    location: occ.venue || undefined,
    colorId: closed ? "8" : "10", // grey when closed
    transparency: closed ? "transparent" : "opaque",
    status: "confirmed", // Google event status: brings back an event deleted by hand
    start: { dateTime: occ.starts_at_utc, timeZone: "Asia/Bangkok" },
    end: { dateTime: occ.ends_at_utc, timeZone: "Asia/Bangkok" },
  };
  const cal = env.GCAL_BOOKINGS_ID;
  if (occ.gcal_event_id) {
    try {
      await patchEvent(env, cal, occ.gcal_event_id, event);
      return;
    } catch (err) {
      if (!/ (404|410):/.test(err.message)) throw err;
      // Deleted by hand in the calendar: forget it and create a fresh one.
      await env.DB.prepare("UPDATE occurrence SET gcal_event_id = NULL WHERE id = ? AND gcal_event_id = ?")
        .bind(id, occ.gcal_event_id).run();
    }
  }
  const ev = await createEvent(env, cal, event);
  const res = await env.DB.prepare("UPDATE occurrence SET gcal_event_id = ? WHERE id = ? AND gcal_event_id IS NULL")
    .bind(ev.id, id).run();
  if (res.meta.changes === 0) {
    // Another signup created the event at the same moment: keep theirs.
    await deleteEvent(env, cal, ev.id);
    const winner = await env.DB.prepare("SELECT gcal_event_id FROM occurrence WHERE id = ?").bind(id).first();
    if (winner?.gcal_event_id) await patchEvent(env, cal, winner.gcal_event_id, event);
  }
}

// Weekly sessions in range, with confirmed seats counted and the service lead time.
export async function sessionsWithCounts(env, from, days) {
  const rangeStart = isoUtc(dayStartMs(from));
  const rangeEnd = isoUtc(dayStartMs(addDays(from, days)));
  const [recs, dbOcc, counts, svc] = await env.DB.batch([
    env.DB.prepare(
      `SELECT r.*, sv.duration_min, sv.buffer_after_min
         FROM recurrence r JOIN service sv ON sv.id = r.service_id
        WHERE r.active = 1 AND sv.active = 1`,
    ),
    env.DB.prepare(
      `SELECT o.*, sv.buffer_after_min FROM occurrence o JOIN service sv ON sv.id = o.service_id
        WHERE o.starts_at_utc >= ?1 AND o.starts_at_utc < ?2`,
    ).bind(rangeStart, rangeEnd),
    env.DB.prepare(
      `SELECT occurrence_id, SUM(party_size) AS taken FROM booking
        WHERE status = 'confirmed' AND occurrence_id IS NOT NULL
          AND starts_at_utc >= ?1 AND starts_at_utc < ?2
        GROUP BY occurrence_id`,
    ).bind(rangeStart, rangeEnd),
    env.DB.prepare("SELECT id, lead_time_h FROM service"),
  ]);
  const taken = new Map(counts.results.map((r) => [r.occurrence_id, r.taken]));
  const lead = new Map(svc.results.map((s) => [s.id, s.lead_time_h]));
  return weeklyOccurrences(recs.results, dbOcc.results, from, days).map((o) => ({
    ...o,
    taken: taken.get(o.id) || 0,
    leadTimeH: lead.get(o.service_id) || 0,
  }));
}

function publicOccurrence(o, nowMs) {
  const left = Math.max(0, o.capacity - o.taken);
  return {
    id: o.id,
    service_id: o.service_id,
    date: o.date,
    time: localTime(o.startMs),
    end_time: localTime(o.endMs),
    venue: o.venue,
    capacity: o.capacity,
    taken: o.taken,
    spots_left: left,
    status: o.status,
    bookable: o.status === "open" && left > 0 && o.startMs >= nowMs + o.leadTimeH * 3600 * 1000,
  };
}

async function spotsLeft(env, id) {
  const r = await env.DB.prepare(
    `SELECT o.capacity - COALESCE((SELECT SUM(party_size) FROM booking
                                    WHERE occurrence_id = o.id AND status = 'confirmed'), 0) AS spots
       FROM occurrence o WHERE o.id = ?`,
  ).bind(id).first();
  return Math.max(0, r?.spots ?? 0);
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

export function activeService(env, id) {
  return env.DB.prepare("SELECT * FROM service WHERE id = ? AND active = 1").bind(String(id || "")).first();
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function json(body, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
