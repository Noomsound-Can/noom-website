// Daily digest (BUILD-PLAN step 10): at 08:00 Koh Samui time one email lists today
// and tomorrow, plus every request still waiting for an answer. It goes out even
// on an empty day, so a missing email means the Cron stopped, not a quiet day.

import { addDays } from "./availability.js";
import { slotLabel, thb, whatsappLink } from "./booking.js";
import { adminData } from "./admin.js";
import { alertRecipients, sendEmail } from "./email.js";

const ADMIN_URL = "https://www.noomsound.studio/admin/";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December"];
const SHORT = (s) => s.slice(0, 3);

export async function dailyDigest(env) {
  const data = await adminData(env, 2);
  const { subject, text } = digestEmail(data);
  await sendEmail(env, { to: alertRecipients(env), subject, text });
}

// 'YYYY-MM-DD' -> 'Sunday 13 September'
function longDay(date) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const contact = (g) => (g.whatsapp ? whatsappLink(g.whatsapp) : null);
const note = (s) => (s ? s.replace(/\s+/g, " ").trim().slice(0, 80) : null);

// Everything happening on `date`, sorted by start time: group sessions and the
// private or partner slots that fall on it. Declined and cancelled ones are left out.
function dayItems(data, date) {
  const items = [];
  for (const s of data.sessions) {
    if (s.date !== date) continue;
    const guests = s.guests.filter((g) => g.status === "confirmed");
    const lines = guests.map((g) =>
      [g.name, plural(g.party_size, "mat"), note(g.notes), contact(g)].filter(Boolean).join(", "));
    items.push({
      time: s.time,
      head: `${s.time} to ${s.end_time}, ${s.name}, ${s.taken} of ${s.capacity} mats` +
        (s.status === "open" ? "" : ` (${s.status})`),
      lines: lines.length ? lines : ["No one signed up yet."],
      summary: `${s.title.split(",")[0]} ${s.taken}/${s.capacity}`,
      kind: "group",
    });
  }
  for (const b of data.bookings) {
    if (b.status !== "confirmed" && b.status !== "pending") continue; // 'expired' is declined within the hour
    b.slots.forEach((slot, i) => {
      if (slot.date !== date) return;
      const part = b.slots.length > 1 ? `, day ${i + 1} of ${b.slots.length}` : "";
      const what = b.source === "partner" ? `PARTNER ${b.partner}: ${b.service}` : b.service;
      const state = b.status === "confirmed" ? "confirmed" : "waiting for you";
      const price = b.price_thb == null ? (b.partner ? `invoiced to ${b.partner}` : null) : thb(b.price_thb);
      items.push({
        time: slot.time,
        head: `${slot.time} to ${slot.end_time}, ${what}${part}, ${state}`,
        lines: [
          [b.name, plural(b.party_size, "guest"), b.location, price, contact(b)].filter(Boolean).join(", "),
          note(b.notes),
          b.ref,
        ].filter(Boolean),
        kind: b.source === "partner" ? "partner" : "private",
      });
    });
  }
  return items.sort((a, b) => (a.time < b.time ? -1 : 1));
}

function daySummary(items) {
  const parts = items.filter((i) => i.kind === "group").map((i) => i.summary);
  const priv = items.filter((i) => i.kind === "private").length;
  const partner = items.filter((i) => i.kind === "partner").length;
  if (priv) parts.push(`${priv} private`);
  if (partner) parts.push(`${partner} partner`);
  return parts.length ? parts.join(", ") : "nothing booked";
}

function dayBlock(title, items) {
  const body = items.length
    ? items.map((i) => [i.head, ...i.lines.map((l) => `- ${l}`)].join("\n")).join("\n\n")
    : "Nothing booked.";
  return `${title.toUpperCase()}\n\n${body}`;
}

// Pure: admin data (adminData(env, 2)) -> { subject, text }.
export function digestEmail(data) {
  const today = data.today;
  const tomorrow = addDays(today, 1);
  const todayItems = dayItems(data, today);
  const tomorrowItems = dayItems(data, tomorrow);
  const waiting = data.bookings.filter((b) => b.status === "pending");

  const d = new Date(`${today}T00:00:00Z`);
  const shortDay = `${SHORT(DAYS[d.getUTCDay()])} ${d.getUTCDate()} ${SHORT(MONTHS[d.getUTCMonth()])}`;
  let subject = `Today ${shortDay}: ${daySummary(todayItems)}`;
  if (waiting.length) subject += `. ${waiting.length} waiting for you`;

  const blocks = [
    dayBlock(`Today, ${longDay(today)}`, todayItems),
    dayBlock(`Tomorrow, ${longDay(tomorrow)}`, tomorrowItems),
  ];
  if (waiting.length) {
    blocks.push(
      `WAITING FOR YOU\n\n` +
      waiting.map((b) => {
        const first = b.slots[0];
        const hold = b.hold_expires_at ? `, hold ends ${slotLabel(Date.parse(b.hold_expires_at))}` : "";
        return `${b.ref}, ${b.service}, ${first ? first.label : "no time"}${hold}\n- ${b.name}` +
          (b.whatsapp ? `, ${whatsappLink(b.whatsapp)}` : "");
      }).join("\n\n"),
    );
  }
  blocks.push(`Admin: ${ADMIN_URL}`);
  return { subject, text: blocks.join("\n\n\n") };
}
