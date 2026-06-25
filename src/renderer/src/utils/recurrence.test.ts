import assert from "node:assert/strict"
import test from "node:test"
import type { CalendarEvent } from "@renderer/types"
import { expandEvents, masterEventId } from "./recurrence"

const base = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: overrides.id ?? "11111111-1111-4111-8111-111111111111",
  title: overrides.title ?? "Daily standup",
  startAt: overrides.startAt ?? "2026-06-01T09:00:00.000Z",
  endAt: overrides.endAt ?? "2026-06-01T09:15:00.000Z",
  allDay: overrides.allDay ?? false,
  rrule: overrides.rrule,
  recurrenceId: overrides.recurrenceId,
  syncStatus: overrides.syncStatus ?? "local_only",
  createdAt: "2026-06-01T08:00:00.000Z",
  updatedAt: "2026-06-01T08:00:00.000Z"
})

test("non-recurring event passes through unchanged", () => {
  const event = base()
  const out = expandEvents(
    [event],
    new Date("2026-06-01T00:00:00.000Z"),
    new Date("2026-06-08T00:00:00.000Z")
  )
  assert.deepEqual(out, [event])
})

test("daily rule expands to one instance per day in range, duration preserved", () => {
  const out = expandEvents(
    [base({ rrule: "FREQ=DAILY" })],
    new Date("2026-06-01T00:00:00.000Z"),
    new Date("2026-06-04T00:00:00.000Z")
  )
  assert.equal(out.length, 3)
  for (const inst of out) {
    assert.equal(Date.parse(inst.endAt) - Date.parse(inst.startAt), 15 * 60_000)
  }
  assert.match(out[1].id, /::/)
})

test("expansion is bounded to the window for an unbounded rule", () => {
  const out = expandEvents(
    [base({ rrule: "FREQ=DAILY" })],
    new Date("2026-06-01T00:00:00.000Z"),
    new Date("2026-06-02T00:00:00.000Z")
  )
  assert.equal(out.length, 1)
})

test("override replaces the generated instance at the same start", () => {
  const master = base({ rrule: "FREQ=DAILY" })
  const override = base({
    id: "22222222-2222-4222-8222-222222222222",
    title: "Standup (moved room)",
    recurrenceId: master.id,
    startAt: "2026-06-02T09:00:00.000Z",
    endAt: "2026-06-02T09:15:00.000Z"
  })
  const out = expandEvents(
    [master, override],
    new Date("2026-06-01T00:00:00.000Z"),
    new Date("2026-06-04T00:00:00.000Z")
  )
  assert.equal(out.length, 3)
  const moved = out.find((e) => e.startAt === "2026-06-02T09:00:00.000Z")
  assert.equal(moved?.title, "Standup (moved room)")
})

test("unparseable rrule degrades to the base event", () => {
  const out = expandEvents(
    [base({ rrule: "NOT A RULE" })],
    new Date("2026-06-01T00:00:00.000Z"),
    new Date("2026-06-08T00:00:00.000Z")
  )
  assert.equal(out.length, 1)
  assert.equal(out[0].rrule, "NOT A RULE")
})

test("masterEventId strips the occurrence suffix", () => {
  assert.equal(masterEventId("abc::2026-06-02T09:00:00.000Z"), "abc")
  assert.equal(masterEventId("abc"), "abc")
})
