import type {
  CalendarEvent,
  Project,
  Task,
  TaskSession,
  TimeBlock
} from "@renderer/types"
import type { CSSProperties } from "react"

export const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Horizontal placement for a block within a side-by-side overlap cluster.
 * A 4px gutter mirrors the original `left-1 right-1` padding so a single
 * full-width column looks identical to the pre-overlap layout.
 */
export const columnStyle = (
  columnIndex: number,
  columnCount: number
): Pick<CSSProperties, "left" | "width"> => {
  const widthPct = 100 / columnCount
  return {
    left: `calc(${columnIndex * widthPct}% + 4px)`,
    width: `calc(${widthPct}% - 8px)`
  }
}

export interface SessionBlock {
  session: TaskSession
  task: Task | undefined
  project: Project | undefined
  startMin: number
  endMin: number
  dayIndex: number
}

export interface TimeBlockDisplayBlock {
  block: TimeBlock
  startMin: number
  endMin: number
  dayIndex: number
}

export interface CalendarEventDisplayBlock {
  event: CalendarEvent
  startMin: number
  endMin: number
  dayIndex: number
}

export interface AllDayEventSpan {
  event: CalendarEvent
  startDayIndex: number
  spanDays: number
}

export type DraftCreate = {
  kind: "create"
  dayIndex: number
  startMin: number
  endMin: number
}

export type DraftMove = {
  kind: "move"
  sessionId: string
  dayIndex: number
  startMin: number
  endMin: number
}

export type DraftResize = {
  kind: "resize"
  sessionId: string
  dayIndex: number
  startMin: number
  endMin: number
}

export type DraftTimeBlockMove = {
  kind: "tb_move"
  blockId: string
  dayIndex: number
  startMin: number
  endMin: number
}

export type DraftTimeBlockResize = {
  kind: "tb_resize"
  blockId: string
  dayIndex: number
  startMin: number
  endMin: number
}

export type Draft =
  | DraftCreate
  | DraftMove
  | DraftResize
  | DraftTimeBlockMove
  | DraftTimeBlockResize

export interface PendingDraft {
  dayIndex: number
  startMin: number
  endMin: number
}

export const computeBlocks = (
  sessions: readonly TaskSession[],
  days: Date[],
  taskMap: Map<string, Task>,
  projectMap: Map<string, Project>
): SessionBlock[] => {
  if (days.length === 0) return []
  const rangeStart = days[0].getTime()
  const rangeEnd = days[days.length - 1].getTime() + DAY_MS
  const blocks: SessionBlock[] = []
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const startMs = Date.parse(s.startAt)
    const endMs = Date.parse(s.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    if (endMs <= rangeStart || startMs >= rangeEnd) continue
    for (let d = 0; d < days.length; d++) {
      const dayStart = days[d].getTime()
      const dayEnd = dayStart + DAY_MS
      if (endMs <= dayStart || startMs >= dayEnd) continue
      const sd = startMs <= dayStart ? null : new Date(startMs)
      const startMin = sd ? sd.getHours() * 60 + sd.getMinutes() : 0
      const ed = endMs >= dayEnd ? null : new Date(endMs)
      const endMin = ed ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60
      if (endMin <= startMin) continue
      blocks.push({
        session: s,
        task: taskMap.get(s.taskId),
        project: projectMap.get(s.projectId),
        startMin,
        endMin,
        dayIndex: d
      })
    }
  }
  return blocks
}

export const computeTimeBlockDisplayBlocks = (
  timeBlocks: readonly TimeBlock[],
  days: Date[]
): TimeBlockDisplayBlock[] => {
  if (days.length === 0) return []
  const rangeStart = days[0].getTime()
  const rangeEnd = days[days.length - 1].getTime() + DAY_MS
  const out: TimeBlockDisplayBlock[] = []
  for (let i = 0; i < timeBlocks.length; i++) {
    const b = timeBlocks[i]
    const startMs = Date.parse(b.startAt)
    const endMs = Date.parse(b.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    if (endMs <= rangeStart || startMs >= rangeEnd) continue
    for (let d = 0; d < days.length; d++) {
      const dayStart = days[d].getTime()
      const dayEnd = dayStart + DAY_MS
      if (endMs <= dayStart || startMs >= dayEnd) continue
      const sd = startMs <= dayStart ? null : new Date(startMs)
      const startMin = sd ? sd.getHours() * 60 + sd.getMinutes() : 0
      const ed = endMs >= dayEnd ? null : new Date(endMs)
      const endMin = ed ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60
      if (endMin <= startMin) continue
      out.push({ block: b, startMin, endMin, dayIndex: d })
    }
  }
  return out
}

/** Timed (non-all-day) calendar events, split per visible day column. */
export const computeCalendarEventBlocks = (
  events: readonly CalendarEvent[],
  days: Date[]
): CalendarEventDisplayBlock[] => {
  if (days.length === 0) return []
  const rangeStart = days[0].getTime()
  const rangeEnd = days[days.length - 1].getTime() + DAY_MS
  const out: CalendarEventDisplayBlock[] = []
  for (const event of events) {
    if (event.allDay || event.deletedAt) continue
    const startMs = Date.parse(event.startAt)
    const endMs = Date.parse(event.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    if (endMs <= rangeStart || startMs >= rangeEnd) continue
    for (let d = 0; d < days.length; d++) {
      const dayStart = days[d].getTime()
      const dayEnd = dayStart + DAY_MS
      if (endMs <= dayStart || startMs >= dayEnd) continue
      const sd = startMs <= dayStart ? null : new Date(startMs)
      const startMin = sd ? sd.getHours() * 60 + sd.getMinutes() : 0
      const ed = endMs >= dayEnd ? null : new Date(endMs)
      const endMin = ed ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60
      if (endMin <= startMin) continue
      out.push({ event, startMin, endMin, dayIndex: d })
    }
  }
  return out
}

/** All-day events, mapped to a horizontal span across visible day columns. */
export const computeAllDaySpans = (
  events: readonly CalendarEvent[],
  days: Date[]
): AllDayEventSpan[] => {
  if (days.length === 0) return []
  const rangeStart = days[0].getTime()
  const rangeEnd = days[days.length - 1].getTime() + DAY_MS
  const out: AllDayEventSpan[] = []
  for (const event of events) {
    if (!event.allDay || event.deletedAt) continue
    const startMs = Date.parse(event.startAt)
    const endMs = Date.parse(event.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    if (endMs <= rangeStart || startMs >= rangeEnd) continue
    let startDayIndex = -1
    let endDayIndex = -1
    for (let d = 0; d < days.length; d++) {
      const dayStart = days[d].getTime()
      const dayEnd = dayStart + DAY_MS
      // endMs is inclusive here (local model), so a day overlaps when it starts
      // before the event ends and ends after it starts.
      if (endMs > dayStart && startMs < dayEnd) {
        if (startDayIndex === -1) startDayIndex = d
        endDayIndex = d
      }
    }
    if (startDayIndex === -1) continue
    out.push({
      event,
      startDayIndex,
      spanDays: endDayIndex - startDayIndex + 1
    })
  }
  return out
}
