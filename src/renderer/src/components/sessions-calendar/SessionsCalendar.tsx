import type {
  CalendarEvent,
  Project,
  Task,
  TaskSession,
  TimeBlock
} from "@renderer/types"
import { HOUR_PX, isSameDay, PX_PER_MIN } from "@renderer/utils/calendar"
import { cn } from "@renderer/utils/cn"
import { type LayoutResult, packColumns } from "@renderer/utils/overlapLayout"
import { expandEvents } from "@renderer/utils/recurrence"
import { useEffect, useMemo, useRef } from "react"
import { AllDayLane } from "./AllDayLane"
import { CalendarHeader } from "./CalendarHeader"
import { DraftGhost } from "./DraftGhost"
import { EventBlockView } from "./EventBlockView"
import { SessionBlockView } from "./SessionBlockView"
import { TimeBlockView } from "./TimeBlockView"
import {
  type CalendarEventDisplayBlock,
  computeAllDaySpans,
  computeBlocks,
  computeCalendarEventBlocks,
  computeTimeBlockDisplayBlocks,
  type PendingDraft,
  type SessionBlock,
  type TimeBlockDisplayBlock
} from "./types"
import { useCalendarDrag } from "./useCalendarDrag"

const DAY_MS = 24 * 60 * 60 * 1000

const HOURS = Array.from({ length: 25 }, (_, i) => i)
const pad = (n: number): string => (n < 10 ? `0${n}` : String(n))

interface SessionsCalendarProps {
  days: Date[]
  sessions: readonly TaskSession[]
  tasks: readonly Task[]
  projects: readonly Project[]
  timeBlocks: readonly TimeBlock[]
  calendarEvents: readonly CalendarEvent[]
  now: Date
  pendingDraft: PendingDraft | null
  onCreateDraft: (dayIndex: number, startMin: number, endMin: number) => void
  onUpdate: (sessionId: string, startAt: string, endAt: string) => void
  onOpenSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onUpdateTimeBlock: (id: string, startAt: string, endAt: string) => void
  onDeleteTimeBlock: (id: string) => void
  onOpenEvent: (eventId: string) => void
  onDeleteEvent: (eventId: string) => void
}

export function SessionsCalendar({
  days,
  sessions,
  tasks,
  projects,
  timeBlocks,
  calendarEvents,
  now,
  pendingDraft,
  onCreateDraft,
  onUpdate,
  onOpenSession,
  onDeleteSession,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onOpenEvent,
  onDeleteEvent
}: SessionsCalendarProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)

  const taskMap = useMemo(() => {
    const m = new Map<string, Task>()
    for (let i = 0; i < tasks.length; i++) m.set(tasks[i].id, tasks[i])
    return m
  }, [tasks])

  const projectMap = useMemo(() => {
    const m = new Map<string, Project>()
    for (let i = 0; i < projects.length; i++) m.set(projects[i].id, projects[i])
    return m
  }, [projects])

  const blocks = useMemo(
    () => computeBlocks(sessions, days, taskMap, projectMap),
    [sessions, days, taskMap, projectMap]
  )

  const tbBlocks = useMemo(
    () => computeTimeBlockDisplayBlocks(timeBlocks, days),
    [timeBlocks, days]
  )

  // Recurring events are expanded to concrete instances within the visible
  // range before being split into timed grid blocks / all-day spans.
  const expandedEvents = useMemo(() => {
    if (days.length === 0) return []
    const rangeStart = days[0]
    const rangeEnd = new Date(days[days.length - 1].getTime() + DAY_MS)
    return expandEvents(calendarEvents, rangeStart, rangeEnd)
  }, [calendarEvents, days])

  const eventBlocks = useMemo(
    () => computeCalendarEventBlocks(expandedEvents, days),
    [expandedEvents, days]
  )

  const allDaySpans = useMemo(
    () => computeAllDaySpans(expandedEvents, days),
    [expandedEvents, days]
  )

  const eventBlocksByDay = useMemo(() => {
    const m = new Map<number, CalendarEventDisplayBlock[]>()
    for (const eb of eventBlocks) {
      const arr = m.get(eb.dayIndex) ?? []
      arr.push(eb)
      m.set(eb.dayIndex, arr)
    }
    return m
  }, [eventBlocks])

  const blocksByDay = useMemo(() => {
    const m = new Map<number, SessionBlock[]>()
    for (const b of blocks) {
      const arr = m.get(b.dayIndex) ?? []
      arr.push(b)
      m.set(b.dayIndex, arr)
    }
    return m
  }, [blocks])

  const tbBlocksByDay = useMemo(() => {
    const m = new Map<number, TimeBlockDisplayBlock[]>()
    for (const tb of tbBlocks) {
      const arr = m.get(tb.dayIndex) ?? []
      arr.push(tb)
      m.set(tb.dayIndex, arr)
    }
    return m
  }, [tbBlocks])

  // Side-by-side column packing per day. Sessions and time blocks share one
  // packing pass so they never visually overlap each other; ids are namespaced
  // (`s:`/`t:`) to keep the two kinds distinct within `packColumns`. Computed
  // from committed start/end only — an active drag is laid out full width.
  const layoutByDay = useMemo(() => {
    const m = new Map<number, Map<string, LayoutResult>>()
    const dayIndices = new Set<number>([
      ...blocksByDay.keys(),
      ...tbBlocksByDay.keys(),
      ...eventBlocksByDay.keys()
    ])
    for (const dayIdx of dayIndices) {
      const inputs = [
        ...(blocksByDay.get(dayIdx) ?? []).map((b) => ({
          id: `s:${b.session.id}`,
          startMin: b.startMin,
          endMin: b.endMin
        })),
        ...(tbBlocksByDay.get(dayIdx) ?? []).map((tb) => ({
          id: `t:${tb.block.id}`,
          startMin: tb.startMin,
          endMin: tb.endMin
        })),
        ...(eventBlocksByDay.get(dayIdx) ?? []).map((eb) => ({
          id: `e:${eb.event.id}`,
          startMin: eb.startMin,
          endMin: eb.endMin
        }))
      ]
      m.set(dayIdx, packColumns(inputs))
    }
    return m
  }, [blocksByDay, tbBlocksByDay, eventBlocksByDay])

  const _daysKey = days.length > 0 ? days[0].toISOString() : ""
  void _daysKey
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const n = new Date()
    const nowMinutes = n.getHours() * 60 + n.getMinutes()
    const target = Math.max(0, nowMinutes * PX_PER_MIN - el.clientHeight / 2)
    el.scrollTop = target
  }, [])

  const {
    draft,
    setColumnRef,
    handleCreatePointerDown,
    handleBlockPointerDown,
    handleTimeBlockPointerDown
  } = useCalendarDrag({
    days,
    onCreateDraft,
    onUpdate,
    onOpenSession,
    onUpdateTimeBlock
  })

  const nowDayIndex = days.findIndex((d) => isSameDay(d, now))
  const nowMin = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="flex h-full flex-col">
      <CalendarHeader days={days} now={now} />
      <AllDayLane
        dayCount={days.length}
        spans={allDaySpans}
        onOpenEvent={onOpenEvent}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))`,
            height: 24 * HOUR_PX
          }}
        >
          <div className="relative">
            {HOURS.slice(0, 24).map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 -translate-y-1/2 pr-2 text-right text-[10px] text-app-text-muted"
                style={{ top: h * HOUR_PX }}
              >
                {h === 0 ? "" : `${pad(h)}:00`}
              </div>
            ))}
          </div>

          {days.map((day, dayIdx) => {
            const today = isSameDay(day, now)
            const dayBlocks = blocksByDay.get(dayIdx) ?? []
            const dayTbBlocks = tbBlocksByDay.get(dayIdx) ?? []
            const dayEventBlocks = eventBlocksByDay.get(dayIdx) ?? []
            const dayLayout = layoutByDay.get(dayIdx)

            return (
              <div
                key={day.toISOString()}
                ref={setColumnRef(dayIdx)}
                data-day-index={dayIdx}
                onPointerDown={handleCreatePointerDown}
                className={cn(
                  "relative border-l border-app-border",
                  today && "bg-black/[0.025]"
                )}
                style={{ height: 24 * HOUR_PX, touchAction: "none" }}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="pointer-events-none absolute left-0 right-0 border-t border-app-border"
                    style={{ top: h * HOUR_PX }}
                  />
                ))}

                {today && nowDayIndex === dayIdx && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-10 border-t border-red-400/80"
                    style={{ top: nowMin * PX_PER_MIN }}
                  >
                    <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
                  </div>
                )}

                {dayBlocks.map((block) => {
                  const isDraftTarget =
                    draft &&
                    (draft.kind === "move" || draft.kind === "resize") &&
                    draft.sessionId === block.session.id
                  if (isDraftTarget && draft.dayIndex !== dayIdx) return null
                  const startMin =
                    isDraftTarget && draft ? draft.startMin : block.startMin
                  const endMin =
                    isDraftTarget && draft ? draft.endMin : block.endMin
                  const layout = isDraftTarget
                    ? undefined
                    : dayLayout?.get(`s:${block.session.id}`)
                  return (
                    <SessionBlockView
                      key={block.session.id}
                      block={block}
                      startMin={startMin}
                      endMin={endMin}
                      columnIndex={layout?.columnIndex}
                      columnCount={layout?.columnCount}
                      onMovePointerDown={handleBlockPointerDown(block, "move")}
                      onResizePointerDown={handleBlockPointerDown(
                        block,
                        "resize"
                      )}
                      onDelete={() => onDeleteSession(block.session.id)}
                    />
                  )
                })}

                {dayTbBlocks.map((tb) => {
                  const isDraftTarget =
                    draft &&
                    (draft.kind === "tb_move" || draft.kind === "tb_resize") &&
                    draft.blockId === tb.block.id
                  if (isDraftTarget && draft.dayIndex !== dayIdx) return null
                  const startMin =
                    isDraftTarget && draft ? draft.startMin : tb.startMin
                  const endMin =
                    isDraftTarget && draft ? draft.endMin : tb.endMin
                  const layout = isDraftTarget
                    ? undefined
                    : dayLayout?.get(`t:${tb.block.id}`)
                  return (
                    <TimeBlockView
                      key={tb.block.id}
                      tb={tb}
                      startMin={startMin}
                      endMin={endMin}
                      columnIndex={layout?.columnIndex}
                      columnCount={layout?.columnCount}
                      onMovePointerDown={handleTimeBlockPointerDown(tb, "move")}
                      onResizePointerDown={handleTimeBlockPointerDown(
                        tb,
                        "resize"
                      )}
                      onDelete={() => onDeleteTimeBlock(tb.block.id)}
                    />
                  )
                })}

                {dayEventBlocks.map((eb) => {
                  const layout = dayLayout?.get(`e:${eb.event.id}`)
                  return (
                    <EventBlockView
                      key={eb.event.id}
                      block={eb}
                      startMin={eb.startMin}
                      endMin={eb.endMin}
                      columnIndex={layout?.columnIndex}
                      columnCount={layout?.columnCount}
                      onOpen={() => onOpenEvent(eb.event.id)}
                      onDelete={() => onDeleteEvent(eb.event.id)}
                    />
                  )
                })}

                {draft &&
                  draft.kind === "tb_move" &&
                  draft.dayIndex === dayIdx &&
                  !(tbBlocksByDay.get(dayIdx) ?? []).some(
                    (tb) =>
                      tb.block.id === (draft as { blockId: string }).blockId
                  ) && (
                    <DraftGhost
                      startMin={draft.startMin}
                      endMin={draft.endMin}
                      label="Moving..."
                    />
                  )}

                {draft &&
                  draft.kind === "move" &&
                  draft.dayIndex === dayIdx &&
                  !(blocksByDay.get(dayIdx) ?? []).some(
                    (b) =>
                      b.session.id ===
                      (draft as { sessionId: string }).sessionId
                  ) && (
                    <DraftGhost
                      startMin={draft.startMin}
                      endMin={draft.endMin}
                      label="Moving..."
                    />
                  )}

                {draft &&
                  draft.kind === "create" &&
                  draft.dayIndex === dayIdx && (
                    <DraftGhost
                      startMin={draft.startMin}
                      endMin={draft.endMin}
                      label="New session"
                    />
                  )}

                {!draft && pendingDraft && pendingDraft.dayIndex === dayIdx && (
                  <DraftGhost
                    startMin={pendingDraft.startMin}
                    endMin={pendingDraft.endMin}
                    label="New session"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
