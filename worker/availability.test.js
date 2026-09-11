// Run: node --test worker/availability.test.js
// Not bundled into the Worker (only files imported from worker/index.js are).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  blocks,
  dayStartMs,
  freeSlots,
  isDate,
  isoUtc,
  localDate,
  openExtras,
  weeklyOccurrences,
} from "./availability.js";

// Build a UTC instant from a Bangkok wall-clock time.
const bkk = (date, hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return dayStartMs(date) + (h * 60 + m) * 60000;
};
const FRI = "2026-09-11";
const WED = "2026-09-16";
const LONG_AGO = Date.parse("2026-01-01T00:00:00Z");

const demo = { durationMin: 120, bufferMin: 30, leadTimeH: 6 }; // handpan-demo
const villa = { durationMin: 90, bufferMin: 90, leadTimeH: 12 }; // sound-journey-villa
const terrace = { durationMin: 90, bufferMin: 30, leadTimeH: 12 }; // sound-journey-terrace

const oneDay = (svc, blockList, nowMs = LONG_AGO, date = FRI) =>
  freeSlots({ ...svc, fromDate: date, days: 1, nowMs, blocks: blockList })[date];

test("Bangkok day boundaries in UTC", () => {
  assert.equal(isoUtc(dayStartMs(FRI)), "2026-09-10T17:00:00Z");
  assert.equal(localDate(Date.parse("2026-09-10T16:59:00Z")), "2026-09-10");
  assert.equal(localDate(Date.parse("2026-09-10T17:00:00Z")), "2026-09-11");
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.ok(isDate(FRI));
  assert.ok(!isDate("2026-02-30"));
  assert.ok(!isDate("11-09-2026"));
});

test("empty day: grid from 08:00, last start leaves duration + buffer before 20:00", () => {
  const d = oneDay(demo, []);
  assert.equal(d[0], "08:00");
  assert.equal(d.at(-1), "17:30"); // 17:30 + 2 h + 30 min = 20:00
  assert.equal(d.length, 20);
  assert.equal(oneDay(villa, []).at(-1), "17:00"); // 90 + 90
  assert.equal(oneDay(terrace, []).at(-1), "18:00"); // 90 + 30
});

test("Google busy block removes every slot whose span overlaps it", () => {
  const d = oneDay(demo, blocks({
    gcalBusy: [{ start: isoUtc(bkk(FRI, "14:00")), end: isoUtc(bkk(FRI, "15:00")) }],
  }));
  assert.ok(d.includes("11:30")); // 11:30 to 14:00 incl. buffer, touches but no overlap
  for (const t of ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"]) {
    assert.ok(!d.includes(t), t);
  }
  assert.ok(d.includes("15:00"));
});

test("existing booking blocks its own buffer after it", () => {
  const hold = {
    starts_at_utc: isoUtc(bkk(FRI, "10:00")),
    ends_at_utc: isoUtc(bkk(FRI, "11:30")),
    buffer_after_min: 90, // villa, so blocked until 13:00
  };
  const d = oneDay(terrace, blocks({ holds: [hold] }));
  assert.ok(d.includes("08:00")); // 08:00 + 120 = 10:00, touches
  assert.ok(!d.includes("08:30"));
  assert.ok(!d.includes("12:30"));
  assert.ok(d.includes("13:00"));
});

test("lead time: nothing earlier than now + lead, rounded up to the grid", () => {
  const d = oneDay(demo, [], bkk(FRI, "09:10")); // + 6 h = 15:10
  assert.equal(d[0], "15:30");
  assert.deepEqual(oneDay(villa, [], bkk(FRI, "09:10")), []); // + 12 h = 21:10
});

const recurrences = [
  { id: "terrace-wed", service_id: "terrace-weekly", weekday: 3, start_time: "17:30",
    capacity: 8, venue: "Noom Terrace, Lamai", duration_min: 75, buffer_after_min: 30 },
  { id: "terrace-sun", service_id: "terrace-weekly", weekday: 0, start_time: "17:30",
    capacity: 8, venue: "Noom Terrace, Lamai", duration_min: 75, buffer_after_min: 30 },
];

test("weekly occurrences land on Wednesday and Sunday 17:30 Bangkok", () => {
  const occ = weeklyOccurrences(recurrences, [], FRI, 14);
  assert.deepEqual(occ.map((o) => o.id), [
    "terrace-sun-2026-09-13",
    "terrace-wed-2026-09-16",
    "terrace-sun-2026-09-20",
    "terrace-wed-2026-09-23",
  ]);
  assert.equal(isoUtc(occ[0].startMs), "2026-09-13T10:30:00Z");
  assert.equal(isoUtc(occ[0].endMs), "2026-09-13T11:45:00Z");
});

test("Mulajoy: first Thursday of each month only, 17:00 to 18:00 (migration 0004)", () => {
  const mulajoy = [{ id: "mulajoy-thu", service_id: "mulajoy-monthly", weekday: 4, week_of_month: 1,
    start_time: "17:00", capacity: 12, venue: "Mulajoy, Lamai", duration_min: 60, buffer_after_min: 30 }];
  const occ = weeklyOccurrences(mulajoy, [], "2026-09-01", 122); // Sep to Dec
  assert.deepEqual(occ.map((o) => o.id), [
    "mulajoy-thu-2026-09-03",
    "mulajoy-thu-2026-10-01",
    "mulajoy-thu-2026-11-05",
    "mulajoy-thu-2026-12-03",
  ]);
  assert.equal(isoUtc(occ[1].startMs), "2026-10-01T10:00:00Z");
  assert.equal(isoUtc(occ[1].endMs), "2026-10-01T11:00:00Z");
  // A weekly row next to it is unaffected (week_of_month missing = every week).
  assert.equal(weeklyOccurrences([...recurrences, ...mulajoy], [], FRI, 14).length, 4);
});

test("weekly session blocks private slots, a cancelled one frees them", () => {
  const occ = weeklyOccurrences(recurrences, [], WED, 1);
  const d = oneDay(demo, blocks({ occurrences: occ }), LONG_AGO, WED);
  assert.ok(d.includes("15:00")); // 15:00 + 150 min = 17:30, touches
  assert.ok(!d.includes("15:30"));
  assert.ok(!d.includes("17:30"));

  const cancelled = weeklyOccurrences(recurrences, [{
    id: "terrace-wed-2026-09-16", recurrence_id: "terrace-wed", service_id: "terrace-weekly",
    starts_at_utc: "2026-09-16T10:30:00Z", ends_at_utc: "2026-09-16T11:45:00Z",
    capacity: 8, venue: "Noom Terrace, Lamai", status: "cancelled", buffer_after_min: 30,
  }], WED, 1);
  assert.equal(cancelled.length, 1);
  assert.equal(cancelled[0].status, "cancelled");
  assert.equal(oneDay(demo, blocks({ occurrences: cancelled }), LONG_AGO, WED).at(-1), "17:30");
});

test("a database row moves one session to another time without duplicating it", () => {
  const moved = weeklyOccurrences(recurrences, [{
    id: "terrace-sun-2026-09-13", recurrence_id: "terrace-sun", service_id: "terrace-weekly",
    starts_at_utc: "2026-09-13T11:00:00Z", ends_at_utc: "2026-09-13T13:00:00Z", // 18:00 to 20:00
    capacity: 8, venue: "Noom Terrace, Lamai", status: "open", buffer_after_min: 30,
  }], "2026-09-13", 1);
  assert.equal(moved.length, 1);
  assert.equal(isoUtc(moved[0].startMs), "2026-09-13T11:00:00Z");
  assert.equal(moved[0].date, "2026-09-13");
});

// Migration 0007: the Sunday 16:00 extra, shown only while the 17:30 is full.
const SUN = "2026-09-13";
const extra = { id: "terrace-sun-extra", service_id: "terrace-weekly", weekday: 0, start_time: "16:00",
  capacity: 8, venue: "Noom Terrace, Lamai", duration_min: 75, buffer_after_min: 30,
  overflow_of: "terrace-sun", min_to_run: 4 };
const sunday = (takenMain, takenExtra = 0, mainStatus = "open") =>
  weeklyOccurrences([...recurrences, extra], [], SUN, 1).map((o) => ({
    ...o,
    status: o.overflow_of ? "open" : mainStatus,
    taken: o.overflow_of ? takenExtra : takenMain,
  }));

test("extra Sunday 16:00: generated with its main session, 16:00 to 17:15", () => {
  const occ = weeklyOccurrences([...recurrences, extra], [], SUN, 1);
  assert.deepEqual(occ.map((o) => o.id), ["terrace-sun-extra-2026-09-13", "terrace-sun-2026-09-13"]);
  assert.equal(occ[0].overflow_of, "terrace-sun");
  assert.equal(occ[0].min_to_run, 4);
  assert.equal(occ[1].overflow_of, null);
  assert.equal(isoUtc(occ[0].startMs), "2026-09-13T09:00:00Z");
  assert.equal(isoUtc(occ[0].endMs), "2026-09-13T10:15:00Z");
  // A stored row of the extra keeps knowing it is one.
  const stored = weeklyOccurrences([...recurrences, extra], [{
    id: "terrace-sun-extra-2026-09-13", recurrence_id: "terrace-sun-extra", service_id: "terrace-weekly",
    starts_at_utc: "2026-09-13T09:00:00Z", ends_at_utc: "2026-09-13T10:15:00Z",
    capacity: 8, venue: "Noom Terrace, Lamai", status: "open", buffer_after_min: 30,
  }], SUN, 1);
  assert.equal(stored[0].overflow_of, "terrace-sun");
  assert.equal(stored[0].min_to_run, 4);
});

test("extra Sunday 16:00 opens only when 17:30 is full", () => {
  const ids = (list) => list.map((o) => o.id);
  assert.deepEqual(ids(openExtras(sunday(7))), ["terrace-sun-2026-09-13"]);
  assert.deepEqual(ids(openExtras(sunday(8))), ["terrace-sun-extra-2026-09-13", "terrace-sun-2026-09-13"]);
  assert.equal(openExtras(sunday(10)).length, 2); // admin seated 2 over
  assert.equal(openExtras(sunday(8, 0, "cancelled")).length, 1); // 17:30 closed: no extra
  // Once it has guests it stays, even if 17:30 frees up again.
  assert.equal(openExtras(sunday(6, 2)).length, 2);
  // Wednesday and other sessions are untouched.
  assert.equal(openExtras(weeklyOccurrences(recurrences, [], FRI, 14).map((o) => ({ ...o, taken: 0 }))).length, 4);
});

test("extra Sunday 16:00 stays shut if a private booking holds its time", () => {
  const hold = (from, to, buffer) => ({
    starts_at_utc: isoUtc(bkk(SUN, from)), ends_at_utc: isoUtc(bkk(SUN, to)), buffer_after_min: buffer,
  });
  assert.equal(openExtras(sunday(8), [hold("14:00", "15:30", 30)]).length, 2); // ends 16:00, touches
  assert.equal(openExtras(sunday(8), [hold("14:00", "15:30", 90)]).length, 1); // villa buffer to 17:00
  assert.equal(openExtras(sunday(8), [hold("10:00", "11:30", 90)]).length, 2);
});

test("an open extra blocks private slots, an unopened one does not", () => {
  const privateOn = (occ) => oneDay(terrace, blocks({ occurrences: openExtras(occ) }), LONG_AGO, SUN);
  assert.ok(privateOn(sunday(7)).includes("15:30")); // 15:30 + 120 = 17:30, touches the 17:30
  assert.ok(!privateOn(sunday(8)).includes("15:30"));
  assert.ok(!privateOn(sunday(8)).includes("14:30")); // 14:30 + 120 = 16:30, into the 16:00
  assert.ok(privateOn(sunday(8)).includes("14:00")); // ends 16:00, touches
});

test("a busy block across midnight blocks the end of one day and the start of the next", () => {
  const b = blocks({
    gcalBusy: [{ start: isoUtc(bkk(FRI, "19:00")), end: isoUtc(bkk("2026-09-12", "09:00")) }],
  });
  const res = freeSlots({ ...terrace, fromDate: FRI, days: 2, nowMs: LONG_AGO, blocks: b });
  assert.equal(res[FRI].at(-1), "17:00"); // 17:00 + 120 = 19:00
  assert.equal(res["2026-09-12"][0], "09:00");
});
