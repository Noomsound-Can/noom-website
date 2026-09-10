// Run: node --test worker/booking.test.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeRef, priceFor, sessionDurations, slotLabel, validateBooking } from "./booking.js";
import { isoUtc } from "./availability.js";

const svc = (o) => ({
  duration_min: 90, min_guests: 2, max_guests: 8, sessions: 1, session_window_days: null,
  price_thb: 2500, price_base_guests: 2, price_extra_thb: 500, ...o,
});
const terrace = svc({ id: "sound-journey-terrace" });
const villa = svc({ id: "sound-journey-villa", max_guests: 10, price_thb: 4000 });
const demo = svc({ id: "handpan-demo", duration_min: 120, min_guests: 1, max_guests: 2,
  price_thb: 2000, price_base_guests: 1, price_extra_thb: 1000 });
const journey = svc({ id: "handpan-journey", duration_min: 180, min_guests: 1, max_guests: 1,
  price_thb: 10000, price_base_guests: 1, price_extra_thb: 0, sessions: 3, session_window_days: 7 });
const ok = { name: "Sarah", whatsapp: "+66 81 234 5678", party_size: 2,
  slots: [{ date: "2026-09-12", time: "10:00" }] };

test("prices, Addendum A", () => {
  assert.equal(priceFor(terrace, 2), 2500);
  assert.equal(priceFor(terrace, 5), 4000);
  assert.equal(priceFor(villa, 4), 5000);
  assert.equal(priceFor(demo, 1), 2000);
  assert.equal(priceFor(demo, 2), 3000);
  assert.equal(priceFor(journey, 1), 10000);
  assert.equal(priceFor(svc({ price_thb: null }), 4), null);
  assert.equal(priceFor({ price_thb: 600, price_base_guests: 1, price_extra_thb: 600 }, 3), 1800);
});

test("reference format", () => {
  assert.match(makeRef(), /^NM-[A-HJKMNP-Z2-9]{5}$/);
  assert.equal(makeRef(new Uint8Array([0, 1, 2, 3, 4])), "NM-ABCDE");
});

test("slot label is Bangkok time", () => {
  assert.equal(slotLabel(Date.parse("2026-09-12T03:00:00Z")), "Sat 12 Sep, 10:00");
});

test("valid booking becomes clean data with UTC slots", () => {
  const { data, errors } = validateBooking(ok, terrace);
  assert.equal(errors, undefined);
  assert.equal(data.whatsapp, "66812345678");
  assert.equal(isoUtc(data.slots[0].startMs), "2026-09-12T03:00:00Z");
  assert.equal(isoUtc(data.slots[0].endMs), "2026-09-12T04:30:00Z");
});

test("whatsapp needs a country code", () => {
  assert.ok(validateBooking({ ...ok, whatsapp: "081 234 5678" }, terrace).errors.whatsapp);
  assert.equal(validateBooking({ ...ok, whatsapp: "0066 81 234 5678" }, terrace).data.whatsapp, "66812345678");
  assert.ok(validateBooking({ ...ok, whatsapp: "12" }, terrace).errors.whatsapp);
});

test("guests, villa location, name", () => {
  assert.ok(validateBooking({ ...ok, party_size: 1 }, terrace).errors.party_size);
  assert.ok(validateBooking({ ...ok, party_size: 9 }, terrace).errors.party_size);
  assert.ok(validateBooking(ok, villa).errors.location);
  assert.equal(validateBooking({ ...ok, location: "Villa Moon, Bophut" }, villa).errors, undefined);
  assert.ok(validateBooking({ ...ok, name: " " }, terrace).errors.name);
  assert.ok(validateBooking({ ...ok, email: "nope" }, terrace).errors.email);
});

test("3-Day Journey: three different days inside a 7-day window", () => {
  const j = (dates) => validateBooking({ ...ok, party_size: 1,
    slots: dates.map((date) => ({ date, time: "09:00" })) }, journey);
  assert.equal(j(["2026-09-14", "2026-09-16", "2026-09-20"]).errors, undefined); // Mon, Wed, Sun
  assert.ok(j(["2026-09-14", "2026-09-16", "2026-09-21"]).errors.slots); // 8th day
  assert.ok(j(["2026-09-14", "2026-09-14", "2026-09-16"]).errors.slots); // same day twice
  assert.ok(j(["2026-09-14", "2026-09-16"]).errors.slots); // only two
  assert.deepEqual(j(["2026-09-20", "2026-09-14", "2026-09-16"]).data.slots.map((s) => s.date),
    ["2026-09-14", "2026-09-16", "2026-09-20"]); // sorted
});

test("3-Day Journey: the last day is 4 h, the others 3 h (migration 0002)", () => {
  const j4 = { ...journey, session_durations: "180,180,240" };
  assert.deepEqual(sessionDurations(j4), [180, 180, 240]);
  assert.deepEqual(sessionDurations(journey), [180, 180, 180]); // before the migration
  assert.deepEqual(sessionDurations(terrace), [90]);
  const { data } = validateBooking({ ...ok, party_size: 1, slots: [
    { date: "2026-09-20", time: "09:00" }, { date: "2026-09-14", time: "09:00" }, { date: "2026-09-16", time: "13:00" },
  ] }, j4);
  assert.deepEqual(data.slots.map((s) => s.durationMin), [180, 180, 240]);
  assert.equal(isoUtc(data.slots[2].endMs), "2026-09-20T06:00:00Z"); // Sun 09:00 to 13:00
});

test("demo lesson takes a third student at +1,000 (migration 0002)", () => {
  const demo3 = { ...demo, max_guests: 3 };
  assert.equal(priceFor(demo3, 3), 4000);
  assert.equal(validateBooking({ ...ok, party_size: 3 }, demo3).errors, undefined);
  assert.ok(validateBooking({ ...ok, party_size: 4 }, demo3).errors.party_size);
});

test("bad slot shapes are rejected", () => {
  assert.ok(validateBooking({ ...ok, slots: [{ date: "2026-02-30", time: "10:00" }] }, terrace).errors.slots);
  assert.ok(validateBooking({ ...ok, slots: [{ date: "2026-09-12", time: "25:00" }] }, terrace).errors.slots);
  assert.ok(validateBooking({ ...ok, slots: [] }, terrace).errors.slots);
});
