// Availability engine, BOOKING-SPEC section 5. Pure functions, no I/O.
//
// Every instant is a UTC millisecond number. Dates and clock times are Asia/Bangkok
// (UTC+7, no DST) and only exist at the edges: 'YYYY-MM-DD' in, 'HH:MM' out.

export const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const WORK_START_MIN = 8 * 60; // 08:00
export const WORK_END_MIN = 20 * 60; // 20:00
export const STEP_MIN = 30;

// Stored format: '2026-09-11T10:30:00Z' (no milliseconds, so strings sort correctly).
export function isoUtc(ms) {
  return new Date(ms).toISOString().slice(0, 19) + "Z";
}

// 00:00 Bangkok on that date, as UTC ms.
export function dayStartMs(date) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - BKK_OFFSET_MS;
}

export function localDate(ms) {
  return new Date(ms + BKK_OFFSET_MS).toISOString().slice(0, 10);
}

export function localTime(ms) {
  return new Date(ms + BKK_OFFSET_MS).toISOString().slice(11, 16);
}

export function addDays(date, n) {
  return localDate(dayStartMs(date) + n * DAY_MS);
}

export function isDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;
}

// Weekly sessions in [fromDate, fromDate + days). Generated from recurrence rows, then
// overlaid with occurrence rows already in the database (which carry status, capacity
// and the calendar event id), matched by id '<recurrence-id>-<YYYY-MM-DD>', so a row
// can also move one session to another time. Cancelled ones are returned too.
//
// recurrences: rows joined with their service's duration_min and buffer_after_min.
//   week_of_month (migration 0004): NULL = every week, 1 = only the first of that
//   weekday in the month (Mulajoy, first Thursday), 2 = the second, and so on.
// dbOccurrences: occurrence rows joined with their service's buffer_after_min.
export function weeklyOccurrences(recurrences, dbOccurrences, fromDate, days) {
  const byKey = new Map();
  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    const start = dayStartMs(date);
    const weekday = new Date(start + BKK_OFFSET_MS).getUTCDay();
    const weekOfMonth = Math.ceil(Number(date.slice(8, 10)) / 7);
    for (const r of recurrences) {
      if (r.weekday !== weekday) continue;
      if (r.week_of_month && r.week_of_month !== weekOfMonth) continue;
      const [h, m] = r.start_time.split(":").map(Number);
      const startMs = start + (h * 60 + m) * MIN_MS;
      byKey.set(`${r.id}-${date}`, {
        id: `${r.id}-${date}`,
        date,
        recurrence_id: r.id,
        service_id: r.service_id,
        startMs,
        endMs: startMs + r.duration_min * MIN_MS,
        bufferMin: r.buffer_after_min,
        capacity: r.capacity,
        venue: r.venue,
        status: "open",
        gcal_event_id: null,
      });
    }
  }
  for (const o of dbOccurrences) {
    const startMs = Date.parse(o.starts_at_utc);
    byKey.set(o.id, {
      id: o.id,
      date: localDate(startMs),
      recurrence_id: o.recurrence_id,
      service_id: o.service_id,
      startMs,
      endMs: Date.parse(o.ends_at_utc),
      bufferMin: o.buffer_after_min,
      capacity: o.capacity,
      venue: o.venue,
      status: o.status,
      gcal_event_id: o.gcal_event_id,
    });
  }
  return [...byKey.values()].sort((a, b) => a.startMs - b.startMs);
}

// Everything that takes time away, as [startMs, endMs) pairs. Buffers of existing
// bookings and sessions are added here, the new slot's own buffer in freeSlots.
//   gcalBusy:    [{ start, end }] ISO strings from Google freeBusy
//   holds:       [{ starts_at_utc, ends_at_utc, buffer_after_min }] live booking slots
//   occurrences: output of weeklyOccurrences
export function blocks({ gcalBusy = [], holds = [], occurrences = [] }) {
  const out = [];
  for (const b of gcalBusy) out.push([Date.parse(b.start), Date.parse(b.end)]);
  for (const h of holds) {
    out.push([
      Date.parse(h.starts_at_utc),
      Date.parse(h.ends_at_utc) + (h.buffer_after_min || 0) * MIN_MS,
    ]);
  }
  for (const o of occurrences) {
    if (o.status !== "open") continue;
    out.push([o.startMs, o.endMs + (o.bufferMin || 0) * MIN_MS]);
  }
  return out;
}

// { 'YYYY-MM-DD': ['HH:MM', ...] } for every date in range, empty array if none.
// A slot occupies [start, start + duration + buffer). It is offered only if that
// ends by 20:00, starts after now + lead time, and overlaps no block.
export function freeSlots({ durationMin, bufferMin, leadTimeH, fromDate, days, nowMs, blocks }) {
  const spanMin = durationMin + bufferMin;
  const earliest = nowMs + leadTimeH * 60 * MIN_MS;
  const out = {};
  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    const day = dayStartMs(date);
    const times = [];
    for (let t = WORK_START_MIN; t + spanMin <= WORK_END_MIN; t += STEP_MIN) {
      const s = day + t * MIN_MS;
      const e = s + spanMin * MIN_MS;
      if (s < earliest) continue;
      if (blocks.some(([bs, be]) => bs < e && be > s)) continue;
      times.push(localTime(s));
    }
    out[date] = times;
  }
  return out;
}
