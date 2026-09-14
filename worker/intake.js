// POST /api/intake/gyg: a GetYourGuide booking, read out of the notification email
// by the Apps Script in scripts/gyg-intake.gs and posted here.
//
// Secret: GYG_INTAKE_TOKEN, sent as the x-intake-token header. No Access JWT, so the
// token is the only guard: rotate it by changing the secret and the script.
//
// The booking lands like an admin "Add guest" with the GetYourGuide chip: source
// 'manual', status 'confirmed', seated up to capacity + 2. The GetYourGuide reference
// is the booking ref, so the same email arriving twice cannot double book.

import { isDate, isoUtc, localTime } from "./availability.js";
import { json, sessionsWithCounts, syncOccurrenceEvent } from "./api.js";
import { writeBooking } from "./sheets.js";

const TERRACE_SERVICE = "terrace-weekly";
const OVER = 2; // same headroom admin has
const MAX_PARTY = 12;

export async function gygIntake(request, env, ctx) {
  if (!env.GYG_INTAKE_TOKEN) return json({ error: "not_configured" }, 503);
  if (request.headers.get("x-intake-token") !== env.GYG_INTAKE_TOKEN) {
    return json({ error: "forbidden" }, 403);
  }
  if ((request.headers.get("content-type") || "").split(";")[0].trim() !== "application/json") {
    return json({ error: "json_only" }, 415);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const ref = String(body.ref || "").trim().toUpperCase();
  const date = String(body.date || "").trim();
  const time = String(body.time || "").trim();
  const name = String(body.name || "").trim().slice(0, 80);
  const party = Number(body.party_size);
  if (!/^GYG[A-Z0-9]{4,24}$/.test(ref)) return json({ error: "bad_ref" }, 400);
  if (!isDate(date)) return json({ error: "bad_date" }, 400);
  if (!/^\d{2}:\d{2}$/.test(time)) return json({ error: "bad_time" }, 400);
  if (!name) return json({ error: "bad_name" }, 400);
  if (!Number.isInteger(party) || party < 1 || party > MAX_PARTY) return json({ error: "bad_party" }, 400);

  // Already in? Say so and stop, so a retry is harmless.
  const seen = await env.DB.prepare("SELECT ref, status FROM booking WHERE ref = ?").bind(ref).first();
  if (seen) return json({ ok: true, ref, duplicate: true, status: seen.status });

  const sessions = await sessionsWithCounts(env, date, 1);
  const occ = sessions.find((o) => o.service_id === TERRACE_SERVICE && localTime(o.startMs) === time);
  if (!occ) return json({ error: "no_session", date, time }, 404);
  if (occ.status !== "open") return json({ error: "closed" }, 409);

  const limit = occ.capacity + OVER;
  const notes = `GetYourGuide ${ref}`;
  const res = await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO occurrence (id, service_id, recurrence_id, starts_at_utc, ends_at_utc, capacity, venue)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(occ.id, occ.service_id, occ.recurrence_id, isoUtc(occ.startMs), isoUtc(occ.endMs), occ.capacity, occ.venue),
    env.DB.prepare(
      `INSERT INTO booking (ref, service_id, occurrence_id, starts_at_utc, ends_at_utc, name,
                            party_size, notes, source, status)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 'confirmed'
        WHERE (SELECT status FROM occurrence WHERE id = ?) = 'open'
          AND (SELECT COALESCE(SUM(party_size), 0) FROM booking
                WHERE occurrence_id = ? AND status = 'confirmed') + ? <= ?`,
    ).bind(
      ref, occ.service_id, occ.id, isoUtc(occ.startMs), isoUtc(occ.endMs), name,
      party, notes, occ.id, occ.id, party, limit,
    ),
  ]);
  if (res[1].meta.changes !== 1) {
    return json({ error: "full", taken: occ.taken, capacity: occ.capacity, limit }, 409);
  }

  try {
    await env.DB.prepare("INSERT INTO admin_log (email, action, target, detail) VALUES (?, ?, ?, ?)")
      .bind("getyourguide@intake", "manual", ref, `${occ.id}, ${party} mat${party > 1 ? "s" : ""}, ${name}`).run();
  } catch (err) {
    console.log(`gyg intake: log write failed: ${err.message}`);
  }

  ctx.waitUntil((async () => {
    await writeBooking(env, { startMs: occ.startMs, name, party_size: party, notes, source: "manual" });
    try {
      await syncOccurrenceEvent(env, occ.id);
    } catch (err) {
      console.log(`gyg intake ${ref}: calendar sync failed: ${err.message}`);
    }
  })());

  return json({ ok: true, ref, occurrence: occ.id, taken: occ.taken + party, capacity: occ.capacity });
}
