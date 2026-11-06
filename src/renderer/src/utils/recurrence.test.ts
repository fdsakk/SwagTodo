import assert from "node:assert/strict"
import test from "node:test"
import { describeRecurrence, nextDueDate } from "./recurrence"

// 2026-11-06 is a Friday.
const FRIDAY = new Date(2026, 10, 6, 12, 0)

test("nextDueDate advances daily/monthly/yearly from the due date", () => {
  assert.equal(
    nextDueDate({ freq: "daily", interval: 1 }, "2026-11-06", FRIDAY),
    "2026-11-07"
  )
  assert.equal(
    nextDueDate({ freq: "daily", interval: 3 }, "2026-11-10", FRIDAY),
    "2026-11-13"
  )
  assert.equal(
    nextDueDate(
      { freq: "monthly", interval: 1 },
      "2026-01-31",
      new Date(2026, 0, 31)
    ),
    "2026-02-28"
  )
  assert.equal(
    nextDueDate({ freq: "yearly", interval: 1 }, "2026-11-06", FRIDAY),
    "2027-11-06"
  )
})

test("nextDueDate skips past occurrences for overdue schedule-based rules", () => {
  assert.equal(
    nextDueDate({ freq: "daily", interval: 1 }, "2026-11-01", FRIDAY),
    "2026-11-07"
  )
  assert.equal(
    nextDueDate({ freq: "weekly", interval: 1 }, "2026-10-20", FRIDAY),
    "2026-11-10"
  )
})

test("nextDueDate counts from completion when requested", () => {
  assert.equal(
    nextDueDate(
      { freq: "daily", interval: 2, fromCompletion: true },
      "2026-10-01",
      FRIDAY
    ),
    "2026-11-08"
  )
})

test("nextDueDate handles weekly weekday sets and intervals", () => {
  const monWedFri = {
    freq: "weekly" as const,
    interval: 1,
    weekdays: [1, 3, 5]
  }
  assert.equal(nextDueDate(monWedFri, "2026-11-06", FRIDAY), "2026-11-09")
  assert.equal(
    nextDueDate(monWedFri, "2026-11-09", new Date(2026, 10, 9)),
    "2026-11-11"
  )
  const biweeklyMonFri = {
    freq: "weekly" as const,
    interval: 2,
    weekdays: [1, 5]
  }
  // From Friday the next Monday starts a new week, so skip one extra week.
  assert.equal(nextDueDate(biweeklyMonFri, "2026-11-06", FRIDAY), "2026-11-16")
  // Monday -> Friday stays inside the same week.
  assert.equal(
    nextDueDate(biweeklyMonFri, "2026-11-16", new Date(2026, 10, 16)),
    "2026-11-20"
  )
})

test("describeRecurrence renders readable text", () => {
  assert.equal(describeRecurrence({ freq: "daily", interval: 1 }), "Every day")
  assert.equal(
    describeRecurrence({ freq: "weekly", interval: 2, weekdays: [0, 1] }),
    "Every 2 weeks on Mon, Sun"
  )
  assert.equal(
    describeRecurrence({ freq: "monthly", interval: 1, fromCompletion: true }),
    "Every month after completion"
  )
})
