// Run: node --test worker/digest.test.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { digestEmail } from "./digest.js";

const session = (o) => ({
  id: "terrace-sun-2026-09-13", service_id: "terrace-weekly", title: "Sound Journey, Terrace",
  name: "Sound Journey", date: "2026-09-13", time: "17:30", end_time: "18:45",
  capacity: 8, taken: 0, status: "open", guests: [], ...o,
});
const booking = (o) => ({
  ref: "NM-AB12C", name: "Maria", whatsapp: "4915112345678", party_size: 2, notes: null,
  location: null, price_thb: 2500, source: "web", status: "confirmed",
  service: "Private Sound Journey at Noom Terrace", partner: null, hold_expires_at: null,
  slots: [{ date: "2026-09-13", time: "11:00", end_time: "12:30", label: "Sun 13 Sep, 11:00" }], ...o,
});

test("empty day still sends, and says so", () => {
  const { subject, text } = digestEmail({ today: "2026-09-14", sessions: [], bookings: [] });
  assert.equal(subject, "Today Mon 14 Sep: nothing booked");
  assert.match(text, /TODAY, MONDAY 14 SEPTEMBER\n\nNothing booked\./);
  assert.match(text, /TOMORROW, TUESDAY 15 SEPTEMBER\n\nNothing booked\./);
  assert.doesNotMatch(text, /WAITING/);
});

test("today: session with guests and a private booking, in time order", () => {
  const data = {
    today: "2026-09-13",
    sessions: [session({
      taken: 5,
      guests: [
        { name: "Anna", party_size: 2, whatsapp: "66812345678", status: "confirmed", notes: null },
        { name: "Tom", party_size: 3, whatsapp: null, status: "confirmed", notes: "GetYourGuide" },
        { name: "Gone", party_size: 1, whatsapp: null, status: "cancelled", notes: null },
      ],
    })],
    bookings: [booking()],
  };
  const { subject, text } = digestEmail(data);
  assert.equal(subject, "Today Sun 13 Sep: Sound Journey 5/8, 1 private");
  assert.ok(text.indexOf("11:00 to 12:30") < text.indexOf("17:30 to 18:45"));
  assert.match(text, /17:30 to 18:45, Sound Journey, 5 of 8 mats\n- Anna, 2 mats, https:\/\/wa\.me\/66812345678\n- Tom, 3 mats, GetYourGuide/);
  assert.match(text, /11:00 to 12:30, Private Sound Journey at Noom Terrace, confirmed\n- Maria, 2 guests, 2,500 THB/);
  assert.doesNotMatch(text, /Gone/);
});

test("pending request shows on its day and under waiting; declined ones are left out", () => {
  const data = {
    today: "2026-09-13",
    sessions: [],
    bookings: [
      booking({ ref: "NM-PEND1", status: "pending", hold_expires_at: "2026-09-13T05:00:00.000Z",
        slots: [{ date: "2026-09-14", time: "10:00", end_time: "12:00", label: "Mon 14 Sep, 10:00" }] }),
      booking({ ref: "NM-DECL1", status: "declined" }),
    ],
  };
  const { subject, text } = digestEmail(data);
  assert.equal(subject, "Today Sun 13 Sep: nothing booked. 1 waiting for you");
  assert.match(text, /TOMORROW[^]*10:00 to 12:00, Private Sound Journey at Noom Terrace, waiting for you/);
  assert.match(text, /WAITING FOR YOU\n\nNM-PEND1, Private Sound Journey at Noom Terrace, Mon 14 Sep, 10:00, hold ends Sun 13 Sep, 12:00/);
  assert.doesNotMatch(text, /NM-DECL1/);
});

test("partner and 3-day bookings", () => {
  const data = {
    today: "2026-09-13",
    sessions: [session({ status: "closed" })],
    bookings: [
      booking({ ref: "NM-PART1", source: "partner", partner: "Lime Samui", service: "Sunset bath",
        price_thb: null, location: "Villa 4",
        slots: [{ date: "2026-09-13", time: "15:00", end_time: "16:00", label: "Sun 13 Sep, 15:00" }] }),
      booking({ ref: "NM-JRNY1", service: "Handpan 3-Day Journey", party_size: 1, price_thb: 10000,
        slots: [
          { date: "2026-09-12", time: "10:00", end_time: "13:00" },
          { date: "2026-09-13", time: "10:00", end_time: "13:00" },
          { date: "2026-09-14", time: "10:00", end_time: "14:00" },
        ] }),
    ],
  };
  const { subject, text } = digestEmail(data);
  assert.equal(subject, "Today Sun 13 Sep: Sound Journey 0/8, 1 private, 1 partner");
  assert.match(text, /15:00 to 16:00, PARTNER Lime Samui: Sunset bath, confirmed\n- Maria, 2 guests, Villa 4, invoiced to Lime Samui/);
  assert.match(text, /TODAY[^]*10:00 to 13:00, Handpan 3-Day Journey, day 2 of 3/);
  assert.match(text, /TOMORROW[^]*10:00 to 14:00, Handpan 3-Day Journey, day 3 of 3/);
  assert.match(text, /0 of 8 mats \(closed\)\n- No one signed up yet\./);
});
