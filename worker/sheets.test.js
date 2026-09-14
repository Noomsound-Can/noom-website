import assert from "node:assert/strict";
import test from "node:test";

import { freeRowIn, localParts, viaLabel } from "./sheets.js";

// Sunday 13 Sep 2026, 17:30 Koh Samui, is 10:30 UTC.
test("localParts gives the Koh Samui wall clock", () => {
  assert.deepEqual(localParts(Date.UTC(2026, 8, 13, 10, 30)), { date: "2026-09-13", time: "17:30" });
  assert.deepEqual(localParts(Date.UTC(2026, 8, 13, 9, 0)), { date: "2026-09-13", time: "16:00" });
  // Late session on the last day of a month still lands on that day.
  assert.deepEqual(localParts(Date.UTC(2026, 8, 30, 10, 30)), { date: "2026-09-30", time: "17:30" });
});

test("viaLabel reads the source chip, else the source", () => {
  assert.equal(viaLabel({ source: "manual", notes: "GetYourGuide GYG996V2Z2KW" }), "GetYourGuide");
  assert.equal(viaLabel({ source: "manual", notes: "walk-in, paid cash" }), "Walk-in");
  assert.equal(viaLabel({ source: "web", notes: "" }), "Website");
  assert.equal(viaLabel({ source: "manual", notes: "" }), "Other");
});

const grid = [
  ["2026-09-13", "Sun", "16:00", "", "", "", ""],
  ["2026-09-13", "Sun", "16:00", "", "", "", ""],
  ["2026-09-13", "Sun", "17:30", "GetYourGuide", "Daria Wagner", "2", ""],
  ["2026-09-13", "Sun", "17:30", "", "", "", ""],
  ["2026-09-16", "Wed", "17:30", "WhatsApp", "Fern", "1", "Sent"],
];

test("freeRowIn finds the first free row of the right block", () => {
  assert.equal(freeRowIn(grid, "2026-09-13", "16:00"), 2); // grid row 0 is sheet row 2
  assert.equal(freeRowIn(grid, "2026-09-13", "17:30"), 5);
  assert.equal(freeRowIn(grid, "2026-09-16", "17:30"), "block_full");
  assert.equal(freeRowIn(grid, "2026-12-31", "17:30"), "no_block");
});

test("a row counts as taken if any of the three columns is filled", () => {
  assert.equal(freeRowIn([["2026-10-04", "Sun", "16:00", "", "Name only", ""]], "2026-10-04", "16:00"), "block_full");
});
