import type {
  CalendarEvent,
  Project,
  Task,
  TaskSession,
  TimeBlock
} from "@renderer/types"

/**
 * A flattened, render-ready item shared by the Month and Agenda views. It
 * unifies task-linked sessions, unlinked time blocks, and calendar events
 * behind one shape so those views don't each re-derive title/color/time.
 */
export interface CalendarItem {
  id: string
  kind: "session" | "block" | "event"
  title: string
  subtitle?: string
  color?: string
  startMs: number
  endMs: number
  allDay?: boolean
  /** Underlying session id, for opening the linked task. */
  sessionId?: string
  /** Underlying calendar event id, for opening the event editor. */
  eventId?: string
}

const toItems = (
  sessions: readonly TaskSession[],
  timeBlocks: readonly TimeBlock[],
  calendarEvents: readonly CalendarEvent[],
  taskMap: Map<string, Task>,
  projectMap: Map<string, Project>
): CalendarItem[] => {
  const out: CalendarItem[] = []
  for (const s of sessions) {
    const startMs = Date.parse(s.startAt)
    const endMs = Date.parse(s.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    const project = projectMap.get(s.projectId)
    out.push({
      id: `s:${s.id}`,
      kind: "session",
      title: taskMap.get(s.taskId)?.title ?? "Deleted task",
      subtitle: project?.name,
      color: project?.color,
      startMs,
      endMs,
      sessionId: s.id
    })
  }
  for (const b of timeBlocks) {
    const startMs = Date.parse(b.startAt)
    const endMs = Date.parse(b.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    out.push({
      id: `t:${b.id}`,
      kind: "block",
      title: b.label,
      startMs,
      endMs
    })
  }
  for (const e of calendarEvents) {
    if (e.deletedAt) continue
    const startMs = Date.parse(e.startAt)
    const endMs = Date.parse(e.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    out.push({
      id: `e:${e.id}`,
      kind: "event",
      title: e.title,
      subtitle: e.location,
      color: e.color,
      startMs,
      endMs,
      allDay: e.allDay,
      eventId: e.id
    })
  }
  return out
}

/** Build a sorted list of calendar items overlapping [fromMs, toMs). */
export const buildCalendarItems = (
  sessions: readonly TaskSession[],
  timeBlocks: readonly TimeBlock[],
  calendarEvents: readonly CalendarEvent[],
  tasks: readonly Task[],
  projects: readonly Project[],
  fromMs: number,
  toMs: number
): CalendarItem[] => {
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  return toItems(sessions, timeBlocks, calendarEvents, taskMap, projectMap)
    .filter((item) => item.endMs > fromMs && item.startMs < toMs)
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs)
}
