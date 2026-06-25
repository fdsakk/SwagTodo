import assert from "node:assert/strict"
import test from "node:test"
import type { CalendarEvent } from "../../shared/types"
import {
  mapGoogleEvent,
  reduceRemoteEvents,
  resolveConflict,
  toGoogleEventBody,
  toGoogleTimes
} from "../google/eventMapper"

const ctx = (
  existing: CalendarEvent[] = []
): Parameters<typeof mapGoogleEvent>[1] => ({
  googleCalendarId: "primary",
  findByGoogleId: (gid) => existing.find((e) => e.googleEventId === gid),
  now: "2026-06-01T00:00:00.000Z"
})

const localEvent = (overrides: Partial<CalendarEvent>): CalendarEvent => ({
  id: overrides.id ?? "11111111-1111-4111-8111-111111111111",
  title: overrides.title ?? "x",
  startAt: overrides.startAt ?? "2026-06-01T09:00:00.000Z",
  endAt: overrides.endAt ?? "2026-06-01T10:00:00.000Z",
  allDay: overrides.allDay ?? false,
  googleEventId: overrides.googleEventId,
  color: overrides.color,
  createdAt: overrides.createdAt ?? "2026-06-01T00:00:00.000Z",
  updatedAt: overrides.updatedAt ?? "2026-06-01T00:00:00.000Z",
  ...overrides
})

// --- the riskiest case first: never throw ---

test("malformed payloads are skipped, never thrown", () => {
  for (const bad of [null, undefined, 42, "nope", {}, { id: 5 }, { foo: 1 }]) {
    const result = mapGoogleEvent(bad, ctx())
    assert.equal(result.kind, "skip")
  }
})

test("cancelled event maps to a delete", () => {
  const result = mapGoogleEvent({ id: "g1", status: "cancelled" }, ctx())
  assert.deepEqual(result, { kind: "delete", googleEventId: "g1" })
})

test("timed event preserves the absolute instant (TZ-correct)", () => {
  const result = mapGoogleEvent(
    {
      id: "g1",
      status: "confirmed",
      summary: "Standup",
      start: { dateTime: "2026-06-05T10:00:00-07:00" },
      end: { dateTime: "2026-06-05T10:30:00-07:00" }
    },
    ctx()
  )
  assert.equal(result.kind, "event")
  if (result.kind !== "event") return
  // -07:00 10:00 == 17:00Z, regardless of the test runner's local zone.
  assert.equal(result.event.startAt, "2026-06-05T17:00:00.000Z")
  assert.equal(result.event.endAt, "2026-06-05T17:30:00.000Z")
  assert.equal(result.event.allDay, false)
})

test("all-day event converts exclusive end to inclusive (off-by-one)", () => {
  // One-day event on the 5th: Google sends end.date = the 6th.
  const result = mapGoogleEvent(
    {
      id: "g1",
      status: "confirmed",
      summary: "Holiday",
      start: { date: "2026-06-05" },
      end: { date: "2026-06-06" }
    },
    ctx()
  )
  assert.equal(result.kind, "event")
  if (result.kind !== "event") return
  assert.equal(result.event.allDay, true)
  // start and inclusive end land on the same local day (the 5th).
  assert.equal(new Date(result.event.startAt).getDate(), 5)
  assert.equal(new Date(result.event.endAt).getDate(), 5)
})

test("multi-day all-day event spans inclusive days", () => {
  const result = mapGoogleEvent(
    {
      id: "g1",
      status: "confirmed",
      summary: "Conf",
      start: { date: "2026-06-05" },
      end: { date: "2026-06-08" } // exclusive → inclusive through the 7th
    },
    ctx()
  )
  assert.equal(result.kind, "event")
  if (result.kind !== "event") return
  assert.equal(new Date(result.event.startAt).getDate(), 5)
  assert.equal(new Date(result.event.endAt).getDate(), 7)
})

test("missing summary falls back to (No title)", () => {
  const result = mapGoogleEvent(
    {
      id: "g1",
      status: "confirmed",
      start: { dateTime: "2026-06-05T10:00:00Z" },
      end: { dateTime: "2026-06-05T11:00:00Z" }
    },
    ctx()
  )
  assert.equal(result.kind, "event")
  if (result.kind !== "event") return
  assert.equal(result.event.title, "(No title)")
})

test("missing start is skipped", () => {
  const result = mapGoogleEvent({ id: "g1", status: "confirmed" }, ctx())
  assert.equal(result.kind, "skip")
})

test("end not after start is skipped", () => {
  const result = mapGoogleEvent(
    {
      id: "g1",
      status: "confirmed",
      start: { dateTime: "2026-06-05T11:00:00Z" },
      end: { dateTime: "2026-06-05T10:00:00Z" }
    },
    ctx()
  )
  assert.equal(result.kind, "skip")
})

test("recurring master extracts the RRULE without prefix", () => {
  const result = mapGoogleEvent(
    {
      id: "g1",
      status: "confirmed",
      summary: "Daily",
      start: { dateTime: "2026-06-05T09:00:00Z" },
      end: { dateTime: "2026-06-05T09:15:00Z" },
      recurrence: ["RRULE:FREQ=DAILY;COUNT=5", "EXDATE:20260606T090000Z"]
    },
    ctx()
  )
  assert.equal(result.kind, "event")
  if (result.kind !== "event") return
  assert.equal(result.event.rrule, "FREQ=DAILY;COUNT=5")
})

test("recurring override references the master local id", () => {
  const master = localEvent({
    id: "22222222-2222-4222-8222-222222222222",
    googleEventId: "master-g"
  })
  const result = mapGoogleEvent(
    {
      id: "instance-g",
      status: "confirmed",
      summary: "Moved",
      recurringEventId: "master-g",
      start: { dateTime: "2026-06-06T10:00:00Z" },
      end: { dateTime: "2026-06-06T10:30:00Z" }
    },
    ctx([master])
  )
  assert.equal(result.kind, "event")
  if (result.kind !== "event") return
  assert.equal(result.event.recurrenceId, master.id)
})

test("override is skipped when the master is unknown (retry next pass)", () => {
  const result = mapGoogleEvent(
    {
      id: "instance-g",
      status: "confirmed",
      recurringEventId: "master-g",
      start: { dateTime: "2026-06-06T10:00:00Z" },
      end: { dateTime: "2026-06-06T10:30:00Z" }
    },
    ctx()
  )
  assert.equal(result.kind, "skip")
})

test("existing local event keeps its id and createdAt on update", () => {
  const existing = localEvent({
    id: "33333333-3333-4333-8333-333333333333",
    googleEventId: "g1",
    createdAt: "2025-01-01T00:00:00.000Z"
  })
  const result = mapGoogleEvent(
    {
      id: "g1",
      status: "confirmed",
      summary: "Renamed",
      start: { dateTime: "2026-06-05T10:00:00Z" },
      end: { dateTime: "2026-06-05T11:00:00Z" }
    },
    ctx([existing])
  )
  assert.equal(result.kind, "event")
  if (result.kind !== "event") return
  assert.equal(result.event.id, existing.id)
  assert.equal(result.event.createdAt, existing.createdAt)
  assert.equal(result.event.title, "Renamed")
})

test("synced event always carries a uuid id (passes the UUID gate)", () => {
  const result = mapGoogleEvent(
    {
      id: "non-uuid-google-id",
      status: "confirmed",
      start: { dateTime: "2026-06-05T10:00:00Z" },
      end: { dateTime: "2026-06-05T11:00:00Z" }
    },
    ctx()
  )
  assert.equal(result.kind, "event")
  if (result.kind !== "event") return
  assert.match(
    result.event.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  )
  assert.equal(result.event.googleEventId, "non-uuid-google-id")
})

// --- outbound (reverse) mapping ---

test("toGoogleTimes re-adds the exclusive end day for all-day events", () => {
  const event = localEvent({
    allDay: true,
    startAt: new Date(2026, 5, 5).toISOString(),
    endAt: new Date(2026, 5, 7).toISOString()
  })
  const { start, end } = toGoogleTimes(event)
  assert.equal(start.date, "2026-06-05")
  assert.equal(end.date, "2026-06-08") // inclusive 7th → exclusive 8th
})

test("toGoogleTimes emits dateTime + timeZone for timed events", () => {
  const event = localEvent({ allDay: false })
  const { start, end } = toGoogleTimes(event)
  assert.equal(start.dateTime, event.startAt)
  assert.ok(start.timeZone)
  assert.equal(end.dateTime, event.endAt)
})

// --- pull reducer ---

const timedRaw = (id: string, summary = id): unknown => ({
  id,
  status: "confirmed",
  summary,
  start: { dateTime: "2026-06-05T10:00:00Z" },
  end: { dateTime: "2026-06-05T11:00:00Z" }
})

test("reduceRemoteEvents inserts new events and counts them", () => {
  const { events, summary } = reduceRemoteEvents(
    [],
    [timedRaw("g1"), timedRaw("g2")],
    "primary"
  )
  assert.equal(events.length, 2)
  assert.equal(summary.upserted, 2)
  assert.equal(summary.deleted, 0)
})

test("reduceRemoteEvents updates an existing event in place by googleEventId", () => {
  const existing = localEvent({
    id: "44444444-4444-4444-8444-444444444444",
    googleEventId: "g1",
    title: "Old"
  })
  const { events, summary } = reduceRemoteEvents(
    [existing],
    [timedRaw("g1", "New")],
    "primary"
  )
  assert.equal(events.length, 1)
  assert.equal(events[0].id, existing.id)
  assert.equal(events[0].title, "New")
  assert.equal(summary.upserted, 1)
})

test("reduceRemoteEvents removes cancelled events", () => {
  const existing = localEvent({
    id: "55555555-5555-4555-8555-555555555555",
    googleEventId: "g1"
  })
  const { events, summary } = reduceRemoteEvents(
    [existing],
    [{ id: "g1", status: "cancelled" }],
    "primary"
  )
  assert.equal(events.length, 0)
  assert.equal(summary.deleted, 1)
})

test("reduceRemoteEvents resolves an override even when its master is later in the list", () => {
  const master = {
    id: "master-g",
    status: "confirmed",
    summary: "Series",
    start: { dateTime: "2026-06-05T09:00:00Z" },
    end: { dateTime: "2026-06-05T09:30:00Z" },
    recurrence: ["RRULE:FREQ=DAILY"]
  }
  const override = {
    id: "instance-g",
    status: "confirmed",
    summary: "Moved",
    recurringEventId: "master-g",
    start: { dateTime: "2026-06-06T10:00:00Z" },
    end: { dateTime: "2026-06-06T10:30:00Z" }
  }
  // Override appears BEFORE the master in the page.
  const { events, summary } = reduceRemoteEvents(
    [],
    [override, master],
    "primary"
  )
  assert.equal(summary.skipped, 0)
  assert.equal(events.length, 2)
  const inst = events.find((e) => e.googleEventId === "instance-g")
  const m = events.find((e) => e.googleEventId === "master-g")
  assert.ok(inst?.recurrenceId)
  assert.equal(inst?.recurrenceId, m?.id)
})

test("reduceRemoteEvents counts malformed items as skipped without throwing", () => {
  const { events, summary } = reduceRemoteEvents(
    [],
    [timedRaw("g1"), { garbage: true }, null],
    "primary"
  )
  assert.equal(summary.upserted, 1)
  assert.equal(summary.skipped, 2)
  assert.equal(events.length, 1)
})

// --- conflict resolution (last-write-wins) ---

test("resolveConflict picks the newer side; ties favour remote", () => {
  assert.equal(
    resolveConflict("2026-06-05T12:00:00Z", "2026-06-05T11:00:00Z"),
    "local"
  )
  assert.equal(
    resolveConflict("2026-06-05T10:00:00Z", "2026-06-05T11:00:00Z"),
    "remote"
  )
  assert.equal(
    resolveConflict("2026-06-05T11:00:00Z", "2026-06-05T11:00:00Z"),
    "remote"
  )
  // Missing/invalid remote timestamp → local wins (can't prove remote newer).
  assert.equal(resolveConflict("2026-06-05T11:00:00Z", undefined), "local")
})

// --- outbound event body ---

test("toGoogleEventBody includes recurrence and optional fields when present", () => {
  const body = toGoogleEventBody(
    localEvent({
      title: "Daily",
      description: "d",
      location: "Office",
      rrule: "FREQ=DAILY"
    })
  )
  assert.equal(body.summary, "Daily")
  assert.equal(body.description, "d")
  assert.equal(body.location, "Office")
  assert.deepEqual(body.recurrence, ["RRULE:FREQ=DAILY"])
  assert.ok(body.start)
  assert.ok(body.end)
})

test("toGoogleEventBody omits recurrence for non-recurring events", () => {
  const body = toGoogleEventBody(localEvent({}))
  assert.equal("recurrence" in body, false)
})
