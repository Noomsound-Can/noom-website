// Noom booking Worker. Repo-only, never authored in Claude Design.
// Spec: ~/Noomsoundstudio/noom-booking/BOOKING-SPEC.md
//
// Static files are served by the assets layer before this code runs. The Worker
// only sees requests that match no file, so it owns /api/* and hands everything
// else back to the assets binding, which keeps 404s and redirects exactly as before.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/health") {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        return Response.json({ ok: row?.ok === 1 });
      }
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
