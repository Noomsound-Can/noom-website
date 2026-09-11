// Past dates off the homepage and /schedule/. Repo-only, never authored in Claude Design.
//
// Those pages are static files, so their dates go stale: each Event in the JSON-LD
// keeps the date that was next when the page was written, and the What's on lists keep
// full moons that have passed. For these paths the Worker runs before the static files
// (wrangler.jsonc assets.run_worker_first) and fixes both on the way out:
// - every Event gets the next date its eventSchedule gives, or is dropped when its
//   schedule has no date left;
// - every element with data-until="YYYY-MM-DD" is removed once that day is over.
// Translated text is put in by i18n.js in the browser, after this, so the homepage
// script and page.js apply the same data-until rule there.

const TZ_MS = 7 * 3600e3; // Koh Samui, no daylight saving
const DAY_MS = 864e5;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Full moon sessions follow the moon, not a weekday, so their dates are listed here.
// Keep in step with the full moon dates on the homepage (and its translations) and
// on /schedule/. When the last one has passed, the full moon Event is dropped.
export const FULL_MOONS = ["2026-09-26", "2026-10-26", "2026-11-24", "2026-12-24"];

export const DATED_PAGES = new Set(["/", "/schedule/"]);

// 'YYYY-MM-DD' and 'HH:MM' in Koh Samui time.
export function localNow(nowMs) {
  const iso = new Date(nowMs + TZ_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const weekday = (date) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
const dayName = (byDay) => String(byDay || "").replace(/^https?:\/\/schema\.org\//, "");

// Does the schedule hold a session on this date? undefined for a rule this file does
// not know, so the caller leaves that Event alone.
function onSchedule(s, date, fullMoons) {
  const day = dayName(s.byDay);
  if (s.repeatFrequency === "P1W" && day) return weekday(date) === day;
  if (s.repeatFrequency === "P1M" && day && Number(s.byMonthWeek) >= 1) {
    const week = Math.ceil(Number(date.slice(8, 10)) / 7);
    return weekday(date) === day && week === Number(s.byMonthWeek);
  }
  if (s.repeatFrequency === "P1M" && !day) return fullMoons.includes(date);
  return undefined;
}

// The next date the schedule gives, counting today until its session has ended.
// null when there is none before the schedule ends, undefined for an unknown rule.
export function nextDate(s, nowMs, fullMoons = FULL_MOONS) {
  if (!/^\d\d:\d\d$/.test(s.startTime || "") || !/^\d\d:\d\d$/.test(s.endTime || "")) return undefined;
  const now = localNow(nowMs);
  let date = now.date;
  if (s.startDate && s.startDate > date) date = s.startDate;
  const last = s.repeatFrequency === "P1M" && !dayName(s.byDay) ? fullMoons.at(-1) : s.endDate;
  for (let i = 0; i < 400; i++, date = addDays(date, 1)) {
    if (last && date > last) return null;
    const hit = onSchedule(s, date, fullMoons);
    if (hit === undefined) return undefined;
    if (hit && !(date === now.date && s.endTime <= now.time)) return date;
  }
  return null;
}

// One Event: false when it should be dropped.
function rollEvent(item, nowMs, fullMoons) {
  if (item?.["@type"] !== "Event" || !item.eventSchedule) return true;
  const s = item.eventSchedule;
  const date = nextDate(s, nowMs, fullMoons);
  if (date === undefined) return true;
  if (date === null) return false;
  item.startDate = `${date}T${s.startTime}:00+07:00`;
  item.endDate = `${date}T${s.endTime}:00+07:00`;
  return true;
}

// The text of one JSON-LD <script>, with its Events moved to their next date. Text that
// does not parse comes back unchanged.
export function rollJsonLd(text, nowMs, fullMoons = FULL_MOONS) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return text;
  }
  if (Array.isArray(data?.["@graph"])) data["@graph"] = data["@graph"].filter((x) => rollEvent(x, nowMs, fullMoons));
  else if (Array.isArray(data)) data = data.filter((x) => rollEvent(x, nowMs, fullMoons));
  else rollEvent(data, nowMs, fullMoons); // a lone Event is moved, never dropped
  // '<' escaped so no text can close the <script> early.
  return `\n${JSON.stringify(data, null, 2).replace(/</g, "\\u003c")}\n`;
}

// GET / and /schedule/: the static file with its dates brought up to today.
export async function datedPage(request, env) {
  // Always a full body. The file's ETag stays the same while its dates change, so a
  // browser's If-None-Match must not turn into a 304 with yesterday's dates.
  const headers = new Headers(request.headers);
  headers.delete("if-none-match");
  headers.delete("if-modified-since");
  const res = await env.ASSETS.fetch(new Request(request, { headers }));
  if (res.status !== 200 || !(res.headers.get("content-type") || "").includes("text/html")) return res;

  const nowMs = Date.now();
  const today = localNow(nowMs).date;
  let buf = "";
  const out = new HTMLRewriter()
    .on('script[type="application/ld+json"]', {
      text(t) {
        buf += t.text;
        if (!t.lastInTextNode) return t.remove();
        t.replace(rollJsonLd(buf, nowMs), { html: true });
        buf = "";
      },
    })
    .on("[data-until]", {
      element(el) {
        if (el.getAttribute("data-until") < today) el.remove();
      },
    })
    .transform(res);

  const h = new Headers(out.headers);
  h.delete("etag");
  h.delete("last-modified");
  h.delete("content-length");
  return new Response(out.body, { status: out.status, headers: h });
}
