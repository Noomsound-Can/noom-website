// Noom booking Worker. Repo-only, never authored in Claude Design.
// Spec: ~/Noomsoundstudio/noom-booking/BOOKING-SPEC.md
//
// Static files are served by the assets layer before this code runs. The Worker
// only sees requests that match no file, so it owns /api/* and hands everything
// else back to the assets binding, which keeps 404s and redirects exactly as before.

import { accessEmail } from "./access.js";
import { availability, book, services } from "./api.js";

export default {
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
      if (url.pathname.startsWith("/api/admin/")) {
        if (!(await accessEmail(request))) {
          return Response.json({ error: "forbidden" }, { status: 403 });
        }
      }
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
