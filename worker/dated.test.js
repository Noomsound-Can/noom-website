// Run: node --test worker/dated.test.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { nextDate, rollJsonLd } from "./dated.js";

// A moment in Koh Samui time (UTC+7), as epoch ms.
const at = (local) => Date.parse(`${local}:00+07:00`);

const weekly = (day, start = "17:30", end = "18:45") => ({
  "@type": "Schedule", repeatFrequency: "P1W", byDay: `https://schema.org/${day}`,
  startTime: start, endTime: end, scheduleTimezone: "Asia/Bangkok",
  startDate: "2026-09-09", endDate: "2027-12-31",
});
const firstThursday = {
  "@type": "Schedule", repeatFrequency: "P1M", byDay: "https://schema.org/Thursday", byMonthWeek: 1,
  startTime: "17:00", endTime: "18:00", startDate: "2026-09-10", endDate: "2027-12-31",
};
const fullMoon = {
  "@type": "Schedule", repeatFrequency: "P1M", startTime: "18:00", endTime: "19:15",
  startDate: "2026-09-26", endDate: "2027-12-31",
};
const MOONS = ["2026-09-26", "2026-10-26", "2026-11-24", "2026-12-24"];

test("weekly: the next Wednesday after a Friday", () => {
  assert.equal(nextDate(weekly("Wednesday"), at("2026-09-11T10:00")), "2026-09-16");
});

test("weekly: today counts until the session has ended", () => {
  assert.equal(nextDate(weekly("Sunday"), at("2026-09-13T18:00")), "2026-09-13");
  assert.equal(nextDate(weekly("Sunday"), at("2026-09-13T18:45")), "2026-09-20");
});

test("weekly: Koh Samui date, not UTC (Sunday 01:00 local is still Saturday in UTC)", () => {
  assert.equal(nextDate(weekly("Sunday"), at("2026-09-13T01:00")), "2026-09-13");
});

test("monthly: the first Thursday, next month once this one has passed", () => {
  assert.equal(nextDate(firstThursday, at("2026-09-11T10:00")), "2026-10-01");
  assert.equal(nextDate(firstThursday, at("2026-10-01T16:00")), "2026-10-01");
  assert.equal(nextDate(firstThursday, at("2026-10-02T09:00")), "2026-11-05");
});

test("full moon: from the list, none left after the last one", () => {
  assert.equal(nextDate(fullMoon, at("2026-09-11T10:00"), MOONS), "2026-09-26");
  assert.equal(nextDate(fullMoon, at("2026-09-27T10:00"), MOONS), "2026-10-26");
  assert.equal(nextDate(fullMoon, at("2026-12-24T20:00"), MOONS), null);
});

test("a schedule that has not started yet waits for its start date", () => {
  assert.equal(nextDate({ ...weekly("Wednesday"), startDate: "2026-10-01" }, at("2026-09-11T10:00")), "2026-10-07");
});

test("a schedule past its end date has no next date", () => {
  assert.equal(nextDate({ ...weekly("Wednesday"), endDate: "2026-09-15" }, at("2026-09-11T10:00")), null);
});

test("an unknown rule is left alone", () => {
  assert.equal(nextDate({ ...weekly("Wednesday"), repeatFrequency: "P1D" }, at("2026-09-11T10:00")), undefined);
});

test("rollJsonLd moves Events, drops a finished one, keeps everything else", () => {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "LocalBusiness", name: "Noom Sound Studio" },
      { "@type": "Event", name: "Wed", startDate: "2026-09-09T17:30:00+07:00", endDate: "2026-09-09T18:45:00+07:00", eventSchedule: weekly("Wednesday") },
      { "@type": "Event", name: "Moon", startDate: "2026-09-26T18:00:00+07:00", endDate: "2026-09-26T19:15:00+07:00", eventSchedule: fullMoon },
    ],
  };
  const out = JSON.parse(rollJsonLd(JSON.stringify(graph), at("2026-12-25T10:00"), MOONS));
  assert.deepEqual(out["@graph"].map((x) => x.name), ["Noom Sound Studio", "Wed"]);
  assert.equal(out["@graph"][1].startDate, "2026-12-30T17:30:00+07:00");
  assert.equal(out["@graph"][1].endDate, "2026-12-30T18:45:00+07:00");
});

test("rollJsonLd leaves text that does not parse, and escapes <", () => {
  assert.equal(rollJsonLd("{ not json", at("2026-09-11T10:00")), "{ not json");
  const out = rollJsonLd(JSON.stringify({ "@type": "Thing", name: "</script>" }), at("2026-09-11T10:00"));
  assert.doesNotMatch(out, /</);
  assert.equal(JSON.parse(out).name, "</script>");
});
