// Google Sheets client: mirrors every confirmed terrace booking into the
// "Noom Bookings 2026" sheet, so the sheet fills itself.
//
// Same service account as the calendar (worker/gcal.js), one extra scope.
// Secret: SHEET_BOOKINGS_ID (the spreadsheet id from its URL).
// The service account address needs Editor access on that sheet.
//
// The sheet is laid out as fixed session blocks: ten rows per session, columns
// A Date, B Day, C Time, D Booked via, E Name, F Guests, G Review sent.
// A booking is written into the first free row of its own block, so Can's layout
// and his Review sent column are left alone. A date the sheet does not have
// (Mulajoy, anything past the last block) is skipped without an error.

import { googleToken } from "./gcal.js";

const API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const FIRST_ROW = 2; // row 1 is the header
const LAST_ROW = 481; // 48 session blocks of ten rows, to 30 Dec 2026
const TZ_OFFSET_MS = 7 * 3600 * 1000; // Asia/Bangkok, no daylight saving

// Koh Samui wall clock for a UTC instant, as the sheet writes it.
export function localParts(startMs) {
  const d = new Date(startMs + TZ_OFFSET_MS);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

// What goes in the Booked via column. Admin adds carry their source chip in notes.
export function viaLabel(booking) {
  const notes = String(booking.notes || "");
  for (const name of ["GetYourGuide", "WhatsApp", "Instagram", "Facebook", "Walk-in", "The Regulars"]) {
    if (notes.toLowerCase().includes(name.toLowerCase())) return name;
  }
  if (booking.source === "web") return "Website";
  if (booking.source === "partner") return "Other";
  return "Other";
}

// Never throws: a booking must not fail because Google is slow or a secret is missing.
export async function writeBooking(env, booking) {
  try {
    if (!env.SHEET_BOOKINGS_ID) return { ok: false, reason: "no_sheet_id" };
    const { date, time } = localParts(booking.startMs);
    const row = { via: viaLabel(booking), name: booking.name || "", guests: booking.party_size || 1 };
    const grid = await values(env, `A${FIRST_ROW}:G${LAST_ROW}`);
    const target = freeRowIn(grid, date, time);
    if (target === "no_block") return { ok: false, reason: "date_not_in_sheet" };
    if (target === "block_full") {
      await append(env, [[date, dayName(date), time, row.via, row.name, row.guests]]);
      return { ok: true, where: "appended" };
    }
    await update(env, `D${target}:F${target}`, [[row.via, row.name, row.guests]]);
    return { ok: true, where: `row ${target}` };
  } catch (err) {
    console.log(`sheets: ${err.message}`);
    return { ok: false, reason: "error" };
  }
}

// Row number of the first free row in this session's block, or why there is none.
export function freeRowIn(grid, date, time) {
  let seenBlock = false;
  for (let i = 0; i < grid.length; i++) {
    const r = grid[i] || [];
    if (String(r[0] || "").trim() !== date) continue;
    if (String(r[2] || "").trim() !== time) continue;
    seenBlock = true;
    const taken = String(r[3] || "").trim() || String(r[4] || "").trim() || String(r[5] || "").trim();
    if (!taken) return i + FIRST_ROW;
  }
  return seenBlock ? "block_full" : "no_block";
}

function dayName(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${date}T00:00:00Z`).getUTCDay()];
}

async function values(env, range) {
  const res = await sheetsFetch(env, `/${env.SHEET_BOOKINGS_ID}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`);
  const data = await res.json();
  return data.values || [];
}

async function update(env, range, rows) {
  await sheetsFetch(
    env,
    `/${env.SHEET_BOOKINGS_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    { method: "PUT", body: JSON.stringify({ values: rows }) },
  );
}

async function append(env, rows) {
  await sheetsFetch(
    env,
    `/${env.SHEET_BOOKINGS_ID}/values/${encodeURIComponent(`A${FIRST_ROW}:G${LAST_ROW}`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: rows }) },
  );
}

async function sheetsFetch(env, path, init = {}) {
  const token = await googleToken(env, SCOPE);
  const res = await fetch(API + path, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`sheets ${init.method || "GET"} ${path.split("?")[0]} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res;
}
