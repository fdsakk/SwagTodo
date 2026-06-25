import type { CalendarEvent } from "@renderer/types"
import { RRule } from "rrule"

const SEP = "::"

/** Strip the synthetic occurrence suffix to recover a master event id. */
export const masterEventId = (displayId: string): string => {
  const i = displayId.indexOf(SEP)
  return i === -1 ? displayId : displayId.slice(0, i)
}

const expandOne = (
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] => {
  if (!event.rrule) return [event]

  const startMs = Date.parse(event.startAt)
  const endMs = Date.parse(event.endAt)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return [event]
  const durationMs = Math.max(0, endMs - startMs)

  let rule: RRule
  try {
    rule = RRule.fromString(
      `DTSTART:${toRRuleDate(startMs)}\nRRULE:${event.rrule}`
    )
  } catch {
    // Unparseable rule degrades to the single base event rather than throwing.
    return [event]
  }

  // Always bounded to the visible window so an unbounded rule can't expand
  // infinitely.
  const occurrences = rule.between(rangeStart, rangeEnd, true)
  return occurrences.map((occ) => {
    const occStart = occ.getTime()
    return {
      ...event,
      id: `${event.id}${SEP}${new Date(occStart).toISOString()}`,
      startAt: new Date(occStart).toISOString(),
      endAt: new Date(occStart + durationMs).toISOString()
    }
  })
}

// rrule expects a compact UTC basic-format DTSTART, e.g. 20260601T090000Z.
const toRRuleDate = (ms: number): string =>
  new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")

/**
 * Expand recurring events into concrete instances within [rangeStart, rangeEnd).
 * Single events pass through unchanged. Overrides (events carrying
 * `recurrenceId`) replace the generated instance that shares their start.
 */
export const expandEvents = (
  events: readonly CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] => {
  const overrides = new Map<string, CalendarEvent>()
  for (const e of events) {
    if (e.recurrenceId) overrides.set(`${e.recurrenceId}${SEP}${e.startAt}`, e)
  }

  const out: CalendarEvent[] = []
  for (const event of events) {
    if (event.recurrenceId) continue // handled as an override below
    for (const instance of expandOne(event, rangeStart, rangeEnd)) {
      const override = overrides.get(`${event.id}${SEP}${instance.startAt}`)
      out.push(override ?? instance)
    }
  }
  return out
}
