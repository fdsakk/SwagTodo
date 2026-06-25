import { v4 as uuidv4 } from "uuid"
import type { CalendarEvent, GoogleSyncSummary } from "../../shared/types"
import { googleEventSchema } from "./googleSchema"

export type MapResult =
  | { kind: "event"; event: CalendarEvent }
  | { kind: "delete"; googleEventId: string }
  | { kind: "skip"; googleEventId: string; reason: string }

export interface MapContext {
  googleCalendarId: string
  /** Look up the existing local event for a Google id (for update/master refs). */
  findByGoogleId: (googleEventId: string) => CalendarEvent | undefined
  now: string
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Local-midnight ISO for an all-day "YYYY-MM-DD". Parsed component-wise (NOT via
 * `new Date(str)`, which would interpret it as UTC and shift the day in
 * non-UTC zones), so it lines up with the grid's local-wall-clock convention.
 */
const localMidnightIso = (dateStr: string): string | null => {
  const m = DATE_ONLY_RE.exec(dateStr)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0)
  return Number.isFinite(d.getTime()) ? d.toISOString() : null
}

const addLocalDays = (iso: string, days: number): string => {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** Parse a timed RFC3339 dateTime (with offset) to an absolute-instant ISO. */
const timedIso = (dateTime: string): string | null => {
  const ms = Date.parse(dateTime)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

const extractRrule = (recurrence?: string[]): string | undefined => {
  const line = recurrence?.find((r) => r.startsWith("RRULE:"))
  return line ? line.slice("RRULE:".length) : undefined
}

/**
 * Defensively map a raw Google Calendar event to a local result. Never throws:
 * malformed or unmappable events return a `skip` so a bad payload degrades to a
 * quarantined item rather than crashing the sync.
 */
export const mapGoogleEvent = (raw: unknown, ctx: MapContext): MapResult => {
  const parsed = googleEventSchema.safeParse(raw)
  if (!parsed.success) {
    const id =
      raw &&
      typeof raw === "object" &&
      typeof (raw as { id?: unknown }).id === "string"
        ? (raw as { id: string }).id
        : "unknown"
    return {
      kind: "skip",
      googleEventId: id,
      reason: "schema validation failed"
    }
  }
  const g = parsed.data
  const googleEventId = g.id

  // Rule 1: cancelled → delete locally.
  if (g.status === "cancelled") {
    return { kind: "delete", googleEventId }
  }

  let allDay: boolean
  let startAt: string
  let endAt: string

  if (g.start?.date) {
    // Rule 2: all-day. end.date is EXCLUSIVE → subtract one day for inclusive.
    allDay = true
    const start = localMidnightIso(g.start.date)
    if (!start) {
      return { kind: "skip", googleEventId, reason: "invalid all-day start" }
    }
    startAt = start
    const endExclusive = g.end?.date ? localMidnightIso(g.end.date) : null
    endAt = endExclusive ? addLocalDays(endExclusive, -1) : start
    // A single-day all-day event has start === end after the -1 day.
    if (Date.parse(endAt) < Date.parse(startAt)) endAt = startAt
  } else if (g.start?.dateTime) {
    // Rule 3: timed. Keep the absolute instant; the grid renders it in local
    // wall-clock via getHours(), matching buildIsoAtMinutes.
    allDay = false
    const start = timedIso(g.start.dateTime)
    const end = g.end?.dateTime ? timedIso(g.end.dateTime) : null
    if (!start || !end) {
      return { kind: "skip", googleEventId, reason: "invalid timed start/end" }
    }
    if (Date.parse(end) <= Date.parse(start)) {
      return { kind: "skip", googleEventId, reason: "end not after start" }
    }
    startAt = start
    endAt = end
  } else {
    // Rule 5: missing start → skip rather than crash.
    return { kind: "skip", googleEventId, reason: "missing start" }
  }

  const existing = ctx.findByGoogleId(googleEventId)

  // Rule 7: recurring instance/override → reference the master's local id.
  let recurrenceId: string | undefined
  if (g.recurringEventId) {
    const master = ctx.findByGoogleId(g.recurringEventId)
    if (!master) {
      return {
        kind: "skip",
        googleEventId,
        reason: "master not yet known (retry next pass)"
      }
    }
    recurrenceId = master.id
  }

  const event: CalendarEvent = {
    // Rule 8: keep our existing uuid on update; mint a new one on first insert.
    id: existing?.id ?? uuidv4(),
    title: g.summary?.trim() || "(No title)", // rule 4
    description: g.description ?? undefined,
    location: g.location ?? undefined,
    color: existing?.color, // Google colorId → hex mapping deferred; keep local
    startAt,
    endAt,
    allDay,
    rrule: extractRrule(g.recurrence), // rule 6
    recurrenceId,
    googleCalendarId: ctx.googleCalendarId,
    googleEventId,
    etag: g.etag,
    syncStatus: "synced",
    createdAt: existing?.createdAt ?? ctx.now,
    updatedAt: g.updated ?? ctx.now
  }

  return { kind: "event", event }
}

export interface OutboundDateTime {
  date?: string
  dateTime?: string
  timeZone?: string
}

const localDateStr = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number): string => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Build the Google {start,end} payload for a local event (reverse mapping). */
export const toGoogleTimes = (
  event: CalendarEvent
): { start: OutboundDateTime; end: OutboundDateTime } => {
  if (event.allDay) {
    // Re-add the exclusive end day Google expects.
    return {
      start: { date: localDateStr(event.startAt) },
      end: { date: localDateStr(addLocalDays(event.endAt, 1)) }
    }
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return {
    start: { dateTime: event.startAt, timeZone },
    end: { dateTime: event.endAt, timeZone }
  }
}

/**
 * Last-write-wins by timestamp. Returns the side whose update is newer; ties go
 * to remote (the server is authoritative on a draw). Used on a 412 conflict.
 */
export const resolveConflict = (
  localUpdatedAt: string,
  remoteUpdated: string | undefined
): "local" | "remote" => {
  const local = Date.parse(localUpdatedAt)
  const remote = remoteUpdated ? Date.parse(remoteUpdated) : NaN
  if (!Number.isFinite(remote)) return "local"
  if (!Number.isFinite(local)) return "remote"
  return local > remote ? "local" : "remote"
}

/** Build the full Google event resource body for insert/patch from a local event. */
export const toGoogleEventBody = (
  event: CalendarEvent
): Record<string, unknown> => {
  const { start, end } = toGoogleTimes(event)
  const body: Record<string, unknown> = {
    summary: event.title,
    start,
    end
  }
  if (event.description !== undefined) body.description = event.description
  if (event.location !== undefined) body.location = event.location
  if (event.rrule) body.recurrence = [`RRULE:${event.rrule}`]
  return body
}

/**
 * Pure reducer: fold raw Google items into the existing local calendarEvents
 * array. Two passes so recurring overrides resolve their (now-inserted) master.
 * Lives here (not the engine) so it can be tested without Electron/SQLite.
 */
export const reduceRemoteEvents = (
  existing: readonly CalendarEvent[],
  rawItems: readonly unknown[],
  calendarId: string,
  now: string = new Date().toISOString()
): { events: CalendarEvent[]; summary: GoogleSyncSummary } => {
  const events = [...existing]
  const byGoogleId = new Map<string, number>()
  events.forEach((e, i) => {
    if (e.googleEventId) byGoogleId.set(e.googleEventId, i)
  })

  const findByGoogleId = (gid: string): CalendarEvent | undefined => {
    const idx = byGoogleId.get(gid)
    return idx === undefined ? undefined : events[idx]
  }

  let upserted = 0
  let deleted = 0
  let skipped = 0

  const upsert = (event: CalendarEvent): void => {
    const idx = event.googleEventId
      ? byGoogleId.get(event.googleEventId)
      : undefined
    if (idx === undefined) {
      events.push(event)
      if (event.googleEventId)
        byGoogleId.set(event.googleEventId, events.length - 1)
    } else {
      events[idx] = event
    }
    upserted++
  }

  const remove = (gid: string): void => {
    const idx = byGoogleId.get(gid)
    if (idx === undefined) return
    events.splice(idx, 1)
    byGoogleId.clear()
    events.forEach((e, i) => {
      if (e.googleEventId) byGoogleId.set(e.googleEventId, i)
    })
    deleted++
  }

  const apply = (raw: unknown): void => {
    const result = mapGoogleEvent(raw, {
      googleCalendarId: calendarId,
      findByGoogleId,
      now
    })
    if (result.kind === "event") upsert(result.event)
    else if (result.kind === "delete") remove(result.googleEventId)
    else skipped++
  }

  // Pass 1: masters/standalone; pass 2: overrides (need their master present).
  const deferred: unknown[] = []
  for (const raw of rawItems) {
    const hasParent =
      raw &&
      typeof raw === "object" &&
      typeof (raw as { recurringEventId?: unknown }).recurringEventId ===
        "string"
    if (hasParent) deferred.push(raw)
    else apply(raw)
  }
  for (const raw of deferred) apply(raw)

  return { events, summary: { upserted, deleted, skipped } }
}
