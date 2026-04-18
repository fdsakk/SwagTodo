import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent
} from 'react'
import { X } from 'lucide-react'
import type { Project, Task, TaskSession, TimeBlock } from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import {
  HOUR_PX,
  PX_PER_MIN,
  SLOT_MIN,
  buildIsoAtMinutes,
  clampMin,
  formatHM,
  isSameDay,
  pointToMinutes,
  snapMin
} from '@renderer/utils/calendar'

const DAY_MS = 24 * 60 * 60 * 1000

const pad = (n: number): string => (n < 10 ? `0${n}` : String(n))

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface SessionBlock {
  session: TaskSession
  task: Task | undefined
  project: Project | undefined
  startMin: number
  endMin: number
  dayIndex: number
}

const computeBlocks = (
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
      const startMin =
        startMs <= dayStart ? 0 : new Date(startMs).getHours() * 60 + new Date(startMs).getMinutes()
      const endMin =
        endMs >= dayEnd ? 24 * 60 : new Date(endMs).getHours() * 60 + new Date(endMs).getMinutes()
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

type DraftCreate = {
  kind: 'create'
  dayIndex: number
  startMin: number
  endMin: number
}

type DraftMove = {
  kind: 'move'
  sessionId: string
  dayIndex: number
  startMin: number
  endMin: number
}

type DraftResize = {
  kind: 'resize'
  sessionId: string
  dayIndex: number
  startMin: number
  endMin: number
}

type Draft = DraftCreate | DraftMove | DraftResize | DraftTimeBlockMove | DraftTimeBlockResize

interface PendingDraft {
  dayIndex: number
  startMin: number
  endMin: number
}

interface TimeBlockDisplayBlock {
  block: TimeBlock
  startMin: number
  endMin: number
  dayIndex: number
}

type DraftTimeBlockMove = {
  kind: 'tb_move'
  blockId: string
  dayIndex: number
  startMin: number
  endMin: number
}

type DraftTimeBlockResize = {
  kind: 'tb_resize'
  blockId: string
  dayIndex: number
  startMin: number
  endMin: number
}

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

const computeTimeBlockDisplayBlocks = (
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
      const startMin =
        startMs <= dayStart ? 0 : new Date(startMs).getHours() * 60 + new Date(startMs).getMinutes()
      const endMin =
        endMs >= dayEnd ? 24 * 60 : new Date(endMs).getHours() * 60 + new Date(endMs).getMinutes()
      if (endMin <= startMin) continue
      out.push({ block: b, startMin, endMin, dayIndex: d })
    }
  }
  return out
}

const DEFAULT_CLICK_MIN = 60

export default function SessionsCalendar({
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
  const columnRefs = useRef<(HTMLDivElement | null)[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)

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

  const daysKey = days.length > 0 ? days[0].toISOString() : ''
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
    const target = Math.max(0, nowMinutes * PX_PER_MIN - el.clientHeight / 2)
    el.scrollTop = target
  }, [daysKey])

  const setColumnRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      columnRefs.current[idx] = el
    },
    []
  )

  const handleCreatePointerDown = useCallback(
    (dayIndex: number) =>
      (event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.button !== 0) return
        const target = event.target as HTMLElement
        if (target.closest('[data-session-block]')) return
        const column = columnRefs.current[dayIndex]
        if (!column) return
        event.preventDefault()
        const startMin = pointToMinutes(event.clientY, column)
        let current: DraftCreate = {
          kind: 'create',
          dayIndex,
          startMin,
          endMin: Math.min(24 * 60, startMin + SLOT_MIN)
        }
        let moved = false
        setDraft(current)
        const onMove = (e: PointerEvent): void => {
          const col = columnRefs.current[dayIndex]
          if (!col) return
          const cur = pointToMinutes(e.clientY, col)
          const endMin =
            cur <= current.startMin ? Math.min(24 * 60, current.startMin + SLOT_MIN) : cur
          if (endMin !== current.endMin) moved = true
          current = { ...current, endMin }
          setDraft(current)
        }
        const onUp = (): void => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          setDraft(null)
          let finalStart = current.startMin
          let finalEnd = current.endMin
          if (!moved) {
            finalEnd = Math.min(24 * 60, finalStart + DEFAULT_CLICK_MIN)
            if (finalEnd - finalStart < DEFAULT_CLICK_MIN) {
              finalStart = Math.max(0, 24 * 60 - DEFAULT_CLICK_MIN)
              finalEnd = 24 * 60
            }
          }
          if (finalEnd <= finalStart) return
          onCreateDraft(current.dayIndex, finalStart, finalEnd)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      },
    [onCreateDraft]
  )

  const handleBlockPointerDown = useCallback(
    (block: SessionBlock, mode: 'move' | 'resize') =>
      (event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        const startDayIndex = block.dayIndex
        const column = columnRefs.current[startDayIndex]
        if (!column) return
        const initialPointer = pointToMinutes(event.clientY, column)
        const duration = block.endMin - block.startMin
        const offsetMin = initialPointer - block.startMin
        let current: DraftMove | DraftResize =
          mode === 'move'
            ? {
                kind: 'move',
                sessionId: block.session.id,
                dayIndex: startDayIndex,
                startMin: block.startMin,
                endMin: block.endMin
              }
            : {
                kind: 'resize',
                sessionId: block.session.id,
                dayIndex: startDayIndex,
                startMin: block.startMin,
                endMin: block.endMin
              }
        setDraft(current)
        let moved = false
        const onMove = (e: PointerEvent): void => {
          moved = true
          let nextDayIndex = startDayIndex
          if (mode === 'move') {
            for (let i = 0; i < columnRefs.current.length; i++) {
              const col = columnRefs.current[i]
              if (!col) continue
              const r = col.getBoundingClientRect()
              if (e.clientX >= r.left && e.clientX <= r.right) {
                nextDayIndex = i
                break
              }
            }
          }
          const col = columnRefs.current[nextDayIndex]
          if (!col) return
          const cur = pointToMinutes(e.clientY, col)
          if (mode === 'move') {
            const nextStart = clampMin(snapMin(cur - offsetMin))
            const maxStart = 24 * 60 - duration
            const start = Math.min(maxStart, nextStart)
            current = {
              kind: 'move',
              sessionId: block.session.id,
              dayIndex: nextDayIndex,
              startMin: start,
              endMin: start + duration
            }
          } else {
            const end = Math.max(block.startMin + SLOT_MIN, clampMin(cur))
            current = {
              kind: 'resize',
              sessionId: block.session.id,
              dayIndex: startDayIndex,
              startMin: block.startMin,
              endMin: end
            }
          }
          setDraft(current)
        }
        const onUp = (): void => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          setDraft(null)
          if (!moved) {
            onOpenSession(block.session.id)
            return
          }
          const targetDay = days[current.dayIndex] ?? days[startDayIndex]
          const startAt = buildIsoAtMinutes(targetDay, current.startMin)
          const endAt = buildIsoAtMinutes(targetDay, current.endMin)
          onUpdate(block.session.id, startAt, endAt)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      },
    [days, onUpdate, onOpenSession]
  )

  const handleTimeBlockPointerDown = useCallback(
    (tb: TimeBlockDisplayBlock, mode: 'move' | 'resize') =>
      (event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        const startDayIndex = tb.dayIndex
        const column = columnRefs.current[startDayIndex]
        if (!column) return
        const initialPointer = pointToMinutes(event.clientY, column)
        const duration = tb.endMin - tb.startMin
        const offsetMin = initialPointer - tb.startMin
        let current: DraftTimeBlockMove | DraftTimeBlockResize =
          mode === 'move'
            ? { kind: 'tb_move', blockId: tb.block.id, dayIndex: startDayIndex, startMin: tb.startMin, endMin: tb.endMin }
            : { kind: 'tb_resize', blockId: tb.block.id, dayIndex: startDayIndex, startMin: tb.startMin, endMin: tb.endMin }
        setDraft(current)
        let moved = false
        const onMove = (e: PointerEvent): void => {
          moved = true
          let nextDayIndex = startDayIndex
          if (mode === 'move') {
            for (let i = 0; i < columnRefs.current.length; i++) {
              const col = columnRefs.current[i]
              if (!col) continue
              const r = col.getBoundingClientRect()
              if (e.clientX >= r.left && e.clientX <= r.right) { nextDayIndex = i; break }
            }
          }
          const col = columnRefs.current[nextDayIndex]
          if (!col) return
          const cur = pointToMinutes(e.clientY, col)
          if (mode === 'move') {
            const nextStart = clampMin(snapMin(cur - offsetMin))
            const maxStart = 24 * 60 - duration
            const start = Math.min(maxStart, nextStart)
            current = { kind: 'tb_move', blockId: tb.block.id, dayIndex: nextDayIndex, startMin: start, endMin: start + duration }
          } else {
            const end = Math.max(tb.startMin + SLOT_MIN, clampMin(cur))
            current = { kind: 'tb_resize', blockId: tb.block.id, dayIndex: startDayIndex, startMin: tb.startMin, endMin: end }
          }
          setDraft(current)
        }
        const onUp = (): void => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          setDraft(null)
          if (!moved) return
          const targetDay = days[current.dayIndex] ?? days[startDayIndex]
          const startAt = buildIsoAtMinutes(targetDay, current.startMin)
          const endAt = buildIsoAtMinutes(targetDay, current.endMin)
          onUpdateTimeBlock(tb.block.id, startAt, endAt)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      },
    [days, onUpdateTimeBlock]
  )

  const hours = useMemo(() => {
    const out: number[] = []
    for (let h = 0; h <= 24; h++) out.push(h)
    return out
  }, [])

  const nowDayIndex = days.findIndex((d) => isSameDay(d, now))
  const nowMin = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="flex h-full flex-col">
      <div
        className="grid border-b border-white/[0.06]"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((d) => {
          const today = isSameDay(d, now)
          return (
            <div
              key={d.toISOString()}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 text-xs',
                today ? 'text-zinc-100' : 'text-zinc-400'
              )}
            >
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                {WEEKDAYS[d.getDay()]}
              </span>
              <span
                className={cn(
                  'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm mb-0.5',
                  today ? 'bg-white/[0.1] text-zinc-100' : 'text-zinc-300'
                )}
              >
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))`,
            height: 24 * HOUR_PX
          }}
        >
          <div className="relative">
            {hours.slice(0, 24).map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 -translate-y-1/2 pr-2 text-right text-[10px] text-zinc-500"
                style={{ top: h * HOUR_PX }}
              >
                {h === 0 ? '' : `${pad(h)}:00`}
              </div>
            ))}
          </div>
          {days.map((day, dayIdx) => {
            const today = isSameDay(day, now)
            return (
              <div
                key={day.toISOString()}
                ref={setColumnRef(dayIdx)}
                data-day-index={dayIdx}
                onPointerDown={handleCreatePointerDown(dayIdx)}
                className={cn('relative border-l border-white/[0.05]', today && 'bg-white/[0.015]')}
                style={{ height: 24 * HOUR_PX, touchAction: 'none' }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="pointer-events-none absolute left-0 right-0 border-t border-white/[0.05]"
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
                {blocks
                  .filter((b) => b.dayIndex === dayIdx)
                  .map((block) => {
                    const isDraftTarget =
                      draft &&
                      (draft.kind === 'move' || draft.kind === 'resize') &&
                      draft.sessionId === block.session.id
                    if (isDraftTarget && draft.dayIndex !== dayIdx) return null
                    const startMin = isDraftTarget && draft ? draft.startMin : block.startMin
                    const endMin = isDraftTarget && draft ? draft.endMin : block.endMin
                    return (
                      <SessionBlockView
                        key={block.session.id}
                        block={block}
                        startMin={startMin}
                        endMin={endMin}
                        onMovePointerDown={handleBlockPointerDown(block, 'move')}
                        onResizePointerDown={handleBlockPointerDown(block, 'resize')}
                        onDelete={() => onDeleteSession(block.session.id)}
                      />
                    )
                  })}
                {tbBlocks
                  .filter((tb) => tb.dayIndex === dayIdx)
                  .map((tb) => {
                    const isDraftTarget =
                      draft &&
                      (draft.kind === 'tb_move' || draft.kind === 'tb_resize') &&
                      draft.blockId === tb.block.id
                    if (isDraftTarget && draft.dayIndex !== dayIdx) return null
                    const startMin = isDraftTarget && draft ? draft.startMin : tb.startMin
                    const endMin = isDraftTarget && draft ? draft.endMin : tb.endMin
                    return (
                      <TimeBlockView
                        key={tb.block.id}
                        tb={tb}
                        startMin={startMin}
                        endMin={endMin}
                        onMovePointerDown={handleTimeBlockPointerDown(tb, 'move')}
                        onResizePointerDown={handleTimeBlockPointerDown(tb, 'resize')}
                        onDelete={() => onDeleteTimeBlock(tb.block.id)}
                      />
                    )
                  })}
                {/* Ghost for tb move-across-days */}
                {draft &&
                  draft.kind === 'tb_move' &&
                  draft.dayIndex === dayIdx &&
                  !tbBlocks.some((tb) => tb.block.id === draft.blockId && tb.dayIndex === dayIdx) && (
                    <DraftGhost startMin={draft.startMin} endMin={draft.endMin} label="Moving..." />
                  )}
                {/* Ghost for move-across-days */}
                {draft &&
                  draft.kind === 'move' &&
                  draft.dayIndex === dayIdx &&
                  !blocks.some(
                    (b) => b.session.id === draft.sessionId && b.dayIndex === dayIdx
                  ) && (
                    <DraftGhost startMin={draft.startMin} endMin={draft.endMin} label="Moving..." />
                  )}
                {draft && draft.kind === 'create' && draft.dayIndex === dayIdx && (
                  <DraftGhost startMin={draft.startMin} endMin={draft.endMin} label="New session" />
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

interface SessionBlockViewProps {
  block: SessionBlock
  startMin: number
  endMin: number
  onMovePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onDelete: () => void
}

function SessionBlockView({
  block,
  startMin,
  endMin,
  onMovePointerDown,
  onResizePointerDown,
  onDelete
}: SessionBlockViewProps): React.JSX.Element {
  const top = startMin * PX_PER_MIN
  const height = Math.max(PX_PER_MIN * SLOT_MIN, (endMin - startMin) * PX_PER_MIN)
  const color = block.project?.color ?? '#52525b'
  const title = block.task?.title ?? 'Deleted task'
  const projectName = block.project?.name
  const style: CSSProperties = {
    top,
    height,
    borderColor: color,
    background: `${color}50`
  }
  return (
    <div
      data-session-block
      className="group absolute left-1 right-1 z-[5] select-none overflow-hidden rounded-md border-l-2 bg-zinc-900/70 px-1.5 py-1 text-[11px] text-zinc-100 shadow-sm hover:bg-zinc-900/85"
      style={style}
      onPointerDown={onMovePointerDown}
    >
      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
        <span>
          {formatHM(startMin)}–{formatHM(endMin)}
        </span>
      </div>
      <div className="truncate text-[11px] font-medium text-zinc-100">{title}</div>
      {projectName && <div className="truncate text-[10px] text-zinc-400">{projectName}</div>}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Delete session"
        className="rounded absolute right-1 top-1 z-50 flex h-5 w-5 items-center justify-center text-zinc-300 opacity-0 duration-200 hover: hover:border border-red-600 hover:bg-app-titlebar/80 group-hover:opacity-100 transition-all"
      >
        <X size={10} />
      </button>
      <div
        onPointerDown={onResizePointerDown}
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize bg-white/[0.04] hover:bg-white/[0.1]"
      />
    </div>
  )
}

interface TimeBlockViewProps {
  tb: TimeBlockDisplayBlock
  startMin: number
  endMin: number
  onMovePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onDelete: () => void
}

function TimeBlockView({
  tb,
  startMin,
  endMin,
  onMovePointerDown,
  onResizePointerDown,
  onDelete
}: TimeBlockViewProps): React.JSX.Element {
  const top = startMin * PX_PER_MIN
  const height = Math.max(PX_PER_MIN * SLOT_MIN, (endMin - startMin) * PX_PER_MIN)
  return (
    <div
      data-session-block
      className="group absolute left-1 right-1 z-[4] select-none overflow-hidden rounded-md border border-zinc-600/50 bg-zinc-700/40 px-1.5 py-1 text-[11px] text-zinc-400 shadow-sm hover:bg-zinc-700/60"
      style={{ top, height }}
      onPointerDown={onMovePointerDown}
    >
      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
        <span>{formatHM(startMin)}–{formatHM(endMin)}</span>
      </div>
      <div className="truncate text-[11px] font-medium text-zinc-300">{tb.block.label}</div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Delete block"
        className="rounded absolute right-1 top-1 z-50 flex h-5 w-5 items-center justify-center text-zinc-400 opacity-0 duration-200 hover:border border-red-600 hover:bg-app-titlebar/80 group-hover:opacity-100 transition-all"
      >
        <X size={10} />
      </button>
      <div
        onPointerDown={onResizePointerDown}
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize bg-white/[0.04] hover:bg-white/[0.1]"
      />
    </div>
  )
}

function DraftGhost({
  startMin,
  endMin,
  label
}: {
  startMin: number
  endMin: number
  label: string
}): React.JSX.Element {
  const top = startMin * PX_PER_MIN
  const height = Math.max(PX_PER_MIN * SLOT_MIN, (endMin - startMin) * PX_PER_MIN)
  return (
    <div
      className="pointer-events-none absolute left-1 right-1 z-[6] rounded-md border border-dashed border-zinc-300/50 bg-white/[0.08] px-1.5 py-1 text-[10px] text-zinc-200"
      style={{ top, height }}
    >
      <div>{label}</div>
      <div className="text-zinc-400">
        {formatHM(startMin)}–{formatHM(endMin)}
      </div>
    </div>
  )
}
