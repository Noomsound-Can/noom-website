// Noom booking Worker. Repo-only, never authored in Claude Design.
// Spec: ~/Noomsoundstudio/noom-booking/BOOKING-SPEC.md
//
// Static files are served by the assets layer before this code runs. The Worker
// only sees requests that match no file, so it owns /api/* and hands everything
// else back to the assets binding, which keeps 404s and redirects exactly as before.

import { accessEmail } from "./access.js";
import { adminRoute, expireHolds } from "./admin.js";
import { availability, book, occurrences, partnerInfo, services, signup } from "./api.js";
import { dailyDigest } from "./digest.js";

const DIGEST_CRON = "0 1 * * *";

// Local dev has no Access JWT. `wrangler dev --var DEV_ADMIN_EMAIL:dev@local` lets
// 127.0.0.1 through as that email. Never set DEV_ADMIN_EMAIL in production.
function adminEmail(request, env) {
  if (env.DEV_ADMIN_EMAIL && new URL(request.url).hostname === "127.0.0.1") return env.DEV_ADMIN_EMAIL;
  return accessEmail(request);
}

export default {
  // Crons (wrangler.jsonc triggers): hourly, decline holds nobody answered in 24 h;
  // 01:00 UTC (08:00 Koh Samui), the daily digest email.
  async scheduled(event, env, ctx) {
    if (event.cron === DIGEST_CRON) ctx.waitUntil(dailyDigest(env));
    else ctx.waitUntil(expireHolds(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/health") {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        return Response.json({ ok: row?.ok === 1 });
      }
      if (url.pathname === "/api/services" && request.method === "GET") {
        return services(request, env);
      }
      if (url.pathname === "/api/availability" && request.method === "GET") {
        return availability(request, env, ctx);
      }
      if (url.pathname === "/api/book" && request.method === "POST") {
        return book(request, env, ctx);
      }
      if (url.pathname === "/api/occurrences" && request.method === "GET") {
        return occurrences(request, env);
      }
      if (url.pathname === "/api/partner" && request.method === "GET") {
        return partnerInfo(request, env);
      }
      if (url.pathname === "/api/signup" && request.method === "POST") {
        return signup(request, env, ctx);
      }
      if (url.pathname.startsWith("/api/admin/")) {
        const email = await adminEmail(request, env);
        if (!email) return Response.json({ error: "forbidden" }, { status: 403 });
        return adminRoute(request, env, ctx, email);
      }
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
