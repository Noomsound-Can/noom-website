// Noom booking Worker. Repo-only, never authored in Claude Design.
// Spec: ~/Noomsoundstudio/noom-booking/BOOKING-SPEC.md
//
// Static files are served by the assets layer before this code runs. The Worker
// only sees requests that match no file, so it owns /api/* and hands everything
// else back to the assets binding, which keeps 404s and redirects exactly as before.

import { accessEmail } from "./access.js";
import { busyCalendars, createEvent, deleteEvent, freeBusy, patchEvent } from "./gcal.js";

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Bangkok is UTC+7, no DST

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/health") {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        return Response.json({ ok: row?.ok === 1 });
      }
      if (url.pathname.startsWith("/api/admin/")) {
        if (!(await accessEmail(request))) {
          return Response.json({ error: "forbidden" }, { status: 403 });
        }
        // TEMPORARY, BUILD-PLAN step 3. Delete once the calendar connection is proven.
        if (url.pathname === "/api/admin/debug/freebusy") {
          return debugFreeBusy(env, url.searchParams.get("write") === "1");
        }
      }
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};

// TEMPORARY. Tomorrow's busy blocks (Bangkok time) from every configured calendar.
// With ?write=1 it also creates, renames and deletes a test event in Noom Bookings.
async function debugFreeBusy(env, write) {
  const bkkNow = new Date(Date.now() + BKK_OFFSET_MS);
  const dayStartUtc =
    Date.UTC(bkkNow.getUTCFullYear(), bkkNow.getUTCMonth(), bkkNow.getUTCDate() + 1) -
    BKK_OFFSET_MS;
  const from = new Date(dayStartUtc).toISOString();
  const to = new Date(dayStartUtc + 24 * 60 * 60 * 1000).toISOString();
  const bkk = (iso) => new Date(Date.parse(iso) + BKK_OFFSET_MS).toISOString().slice(11, 16);

  const out = { date: new Date(dayStartUtc + BKK_OFFSET_MS).toISOString().slice(0, 10) };
  try {
    const cals = busyCalendars(env);
    const fb = await freeBusy(env, cals.map((c) => c.id), from, to);
    out.calendars = {};
    for (const c of cals) {
      out.calendars[c.label] = {
        error: fb[c.id].error,
        busy: fb[c.id].busy.map((b) => `${bkk(b.start)}-${bkk(b.end)}`),
      };
    }
    if (!env.GCAL_MELIE_ID) out.calendars.melie = { error: "not configured yet" };

    if (write) {
      const start = new Date(dayStartUtc + 6 * 60 * 60 * 1000).toISOString(); // 06:00 BKK
      const end = new Date(dayStartUtc + 6.25 * 60 * 60 * 1000).toISOString();
      const ev = await createEvent(env, env.GCAL_BOOKINGS_ID, {
        summary: "TEST, booking system (deleted automatically)",
        start: { dateTime: start },
        end: { dateTime: end },
      });
      const patched = await patchEvent(env, env.GCAL_BOOKINGS_ID, ev.id, {
        summary: "TEST renamed",
      });
      await deleteEvent(env, env.GCAL_BOOKINGS_ID, ev.id);
      out.write = { created: !!ev.id, renamed: patched.summary === "TEST renamed", deleted: true };
    }
  } catch (err) {
    out.error = err.message;
  }
  return Response.json(out, { headers: { "cache-control": "no-store" } });
}
