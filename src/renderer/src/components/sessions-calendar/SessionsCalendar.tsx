import type { Project, Task, TaskSession, TimeBlock } from "@renderer/types"
import { HOUR_PX, isSameDay, PX_PER_MIN } from "@renderer/utils/calendar"
import { cn } from "@renderer/utils/cn"
import { useEffect, useMemo, useRef } from "react"
import { CalendarHeader } from "./CalendarHeader"
import { DraftGhost } from "./DraftGhost"
import { SessionBlockView } from "./SessionBlockView"
import { TimeBlockView } from "./TimeBlockView"
import {
  computeBlocks,
  computeTimeBlockDisplayBlocks,
  type PendingDraft,
  type SessionBlock,
  type TimeBlockDisplayBlock
} from "./types"
import { useCalendarDrag } from "./useCalendarDrag"

const HOURS = Array.from({ length: 25 }, (_, i) => i)
const pad = (n: number): string => (n < 10 ? `0${n}` : String(n))

interface SessionsCalendarProps {
  days: Date[]
  sessions: readonly TaskSession[]
  tasks: readonly Task[]
  projects: readonly Project[]
  timeBlocks: readonly TimeBlock[]
  now: Date
  pendingDraft: PendingDraft | null
  onCreateDraft: (dayIndex: number, startMin: number, endMin: number) => void
  onUpdate: (sessionId: string, startAt: string, endAt: string) => void
  onOpenSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onUpdateTimeBlock: (id: string, startAt: string, endAt: string) => void
  onDeleteTimeBlock: (id: string) => void
}

export function SessionsCalendar({
  days,
  sessions,
  tasks,
  projects,
  timeBlocks,
  now,
  pendingDraft,
  onCreateDraft,
  onUpdate,
  onOpenSession,
  onDeleteSession,
  onUpdateTimeBlock,
  onDeleteTimeBlock
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
                  return (
                    <SessionBlockView
                      key={block.session.id}
                      block={block}
                      startMin={startMin}
                      endMin={endMin}
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
                  return (
                    <TimeBlockView
                      key={tb.block.id}
                      tb={tb}
                      startMin={startMin}
                      endMin={endMin}
                      onMovePointerDown={handleTimeBlockPointerDown(tb, "move")}
                      onResizePointerDown={handleTimeBlockPointerDown(
                        tb,
                        "resize"
                      )}
                      onDelete={() => onDeleteTimeBlock(tb.block.id)}
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
