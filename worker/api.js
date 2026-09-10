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
import { busyCalendars, freeBusy } from "./gcal.js";

const FREEBUSY_TTL_S = 60; // spec section 5, do not raise
const MAX_DAYS = 62;
const DAY_MS = 24 * 60 * 60 * 1000;

// GET /api/availability?service=<id>&from=<YYYY-MM-DD>&days=21
// -> { "2026-09-11": ["09:00", "09:30", ...], ... }
export async function availability(request, env, ctx) {
  const url = new URL(request.url);
  const nowMs = Date.now();

  const service = await env.DB.prepare(
    "SELECT * FROM service WHERE id = ? AND active = 1",
  ).bind(url.searchParams.get("service") || "").first();
  if (!service) return json({ error: "unknown_service" }, 400);
  if (service.kind === "group") return json({ error: "use_occurrences" }, 400);

  const today = localDate(nowMs);
  let from = url.searchParams.get("from") || today;
  if (!isDate(from)) return json({ error: "bad_from" }, 400);
  if (from < today) from = today;
  const days = clamp(parseInt(url.searchParams.get("days") || "21", 10) || 21, 1, MAX_DAYS);

  const rangeStart = dayStartMs(from);
  const rangeEnd = dayStartMs(addDays(from, days));

  let busy;
  try {
    busy = await calendarBusy(env, ctx, url.origin, isoUtc(rangeStart), isoUtc(rangeEnd));
  } catch (err) {
    console.log(`availability: calendar unavailable: ${err.message}`);
    return json({ error: "calendar_unavailable" }, 503);
  }

  const [holds, recurrences, dbOccurrences] = await Promise.all([
    // Live booking slots: confirmed, or pending with the 24 h hold still running.
    // Range starts a day early so a buffer spilling into the range is caught.
    env.DB.prepare(
      `SELECT s.starts_at_utc, s.ends_at_utc, sv.buffer_after_min
         FROM booking_slot s
         JOIN booking b ON b.ref = s.ref
         JOIN service sv ON sv.id = b.service_id
        WHERE (b.status = 'confirmed' OR (b.status = 'pending' AND b.hold_expires_at > ?1))
          AND s.starts_at_utc < ?3 AND s.ends_at_utc > ?2`,
    ).bind(isoUtc(nowMs), isoUtc(rangeStart - DAY_MS), isoUtc(rangeEnd)).all(),
    env.DB.prepare(
      `SELECT r.*, sv.duration_min, sv.buffer_after_min
         FROM recurrence r JOIN service sv ON sv.id = r.service_id
        WHERE r.active = 1 AND sv.active = 1`,
    ).all(),
    env.DB.prepare(
      `SELECT o.*, sv.buffer_after_min
         FROM occurrence o JOIN service sv ON sv.id = o.service_id
        WHERE o.starts_at_utc >= ?1 AND o.starts_at_utc < ?2`,
    ).bind(isoUtc(rangeStart), isoUtc(rangeEnd)).all(),
  ]);

  const occurrences = weeklyOccurrences(recurrences.results, dbOccurrences.results, from, days);
  const slots = freeSlots({
    durationMin: service.duration_min,
    bufferMin: service.buffer_after_min,
    leadTimeH: service.lead_time_h,
    fromDate: from,
    days,
    nowMs,
    blocks: blocks({ gcalBusy: busy, holds: holds.results, occurrences }),
  });
  return json(slots);
}

// Busy blocks from Can's, Melie's and the Noom Bookings calendar, cached 60 s in the
// Worker cache. Melie's calendar failing is logged and skipped (not shared yet);
// Can's or Noom Bookings failing throws, so no slot is offered on a blind guess.
async function calendarBusy(env, ctx, origin, fromIso, toIso) {
  const cals = busyCalendars(env);
  const key = new Request(
    `${origin}/api/_cache/freebusy?${new URLSearchParams({
      c: cals.map((c) => c.id).join(","),
      from: fromIso,
      to: toIso,
    })}`,
  );
  const cache = caches.default;
  const hit = await cache.match(key);
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

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
