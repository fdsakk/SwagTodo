import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '@renderer/store/useAppStore'
import SessionsCalendar from '@renderer/components/SessionsCalendar'
import {
  addDays,
  buildIsoAtMinutes,
  isSameDay,
  startOfDay
} from '@renderer/utils/calendar'
import { cn } from '@renderer/utils/cn'
import { TaskPickerDialog, type DraftCreate } from './sessions/TaskPickerDialog'
import { GhostBlockDialog } from './sessions/GhostBlockDialog'

type DayCount = 1 | 3 | 5 | 7
const DAY_OPTIONS: readonly DayCount[] = [1, 3, 5, 7] as const
const NOW_TICK_MS = 60 * 1000

export default function SessionsPage(): React.JSX.Element {
  const {
    sessions,
    tasks,
    projects,
    timeBlocks,
    addSession,
    updateSession,
    deleteSession,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    openEditPanel
  } = useAppStore(
    useShallow((state) => ({
      sessions: state.sessions,
      tasks: state.tasks,
      projects: state.projects,
      timeBlocks: state.timeBlocks,
      addSession: state.addSession,
      updateSession: state.updateSession,
      deleteSession: state.deleteSession,
      addTimeBlock: state.addTimeBlock,
      updateTimeBlock: state.updateTimeBlock,
      deleteTimeBlock: state.deleteTimeBlock,
      openEditPanel: state.openEditPanel
    }))
  )

  const [dayCount, setDayCount] = useState<DayCount>(5)
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()))
  const [now, setNow] = useState<Date>(() => new Date())
  const [error, setError] = useState<string | null>(null)
  const [draftCreate, setDraftCreate] = useState<DraftCreate | null>(null)
  const [draftMode, setDraftMode] = useState<'task' | 'ghost'>('task')

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), NOW_TICK_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (draftCreate) return
      if (e.key === '[') {
        e.preventDefault()
        setAnchor((current) => addDays(current, -dayCount))
      } else if (e.key === ']') {
        e.preventDefault()
        setAnchor((current) => addDays(current, dayCount))
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault()
        setDayCount((current) => {
          const idx = DAY_OPTIONS.indexOf(current)
          return DAY_OPTIONS[(idx + 1) % DAY_OPTIONS.length] ?? current
        })
      } else if (e.key.toLowerCase() === 'g') {
        e.preventDefault()
        setAnchor(startOfDay(new Date()))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dayCount, draftCreate])

  const days = useMemo(() => {
    const out: Date[] = []
    for (let i = 0; i < dayCount; i++) out.push(addDays(anchor, i))
    return out
  }, [anchor, dayCount])

  const projectTasks = useMemo(() => tasks.filter((t) => Boolean(t.projectId)), [tasks])

  const pendingDraft = useMemo(() => {
    if (!draftCreate) return null
    const draftDay = new Date(draftCreate.dayIso)
    const dayIndex = days.findIndex((d) => isSameDay(d, draftDay))
    if (dayIndex === -1) return null
    const start = new Date(draftCreate.startAt)
    const end = new Date(draftCreate.endAt)
    return {
      dayIndex,
      startMin: start.getHours() * 60 + start.getMinutes(),
      endMin: end.getHours() * 60 + end.getMinutes()
    }
  }, [draftCreate, days])

  const projectById = useMemo(() => {
    const m = new Map<string, (typeof projects)[number]>()
    for (let i = 0; i < projects.length; i++) m.set(projects[i].id, projects[i])
    return m
  }, [projects])

  const shiftRange = useCallback(
    (direction: -1 | 1) => {
      setAnchor((current) => addDays(current, direction * dayCount))
    },
    [dayCount]
  )

  const goToday = useCallback(() => setAnchor(startOfDay(new Date())), [])

  const rangeLabel = useMemo(() => {
    const first = days[0]
    const last = days[days.length - 1]
    if (!first || !last) return ''
    const fmt = (d: Date): string =>
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const year = last.getFullYear()
    if (isSameDay(first, last)) return `${fmt(first)} ${year}`
    return `${fmt(first)} – ${fmt(last)} ${year}`
  }, [days])

  const handleCreateDraft = useCallback(
    (dayIndex: number, startMin: number, endMin: number) => {
      const day = days[dayIndex]
      if (!day) return
      const startAt = buildIsoAtMinutes(day, startMin)
      const endAt = buildIsoAtMinutes(day, endMin)
      setDraftMode('task')
      setDraftCreate({ dayIso: day.toISOString(), startAt, endAt })
    },
    [days]
  )

  const handleUpdate = useCallback(
    (sessionId: string, startAt: string, endAt: string) => {
      const result = updateSession(sessionId, { startAt, endAt })
      if (!result.ok) setError(result.error)
    },
    [updateSession]
  )

  const handleOpenSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return
      const task = tasks.find((t) => t.id === session.taskId)
      if (!task) return
      openEditPanel(task.id)
    },
    [sessions, tasks, openEditPanel]
  )

  const handlePickTask = useCallback(
    (taskId: string) => {
      if (!draftCreate) return
      const result = addSession({ taskId, startAt: draftCreate.startAt, endAt: draftCreate.endAt })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDraftCreate(null)
    },
    [addSession, draftCreate]
  )

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      deleteSession(sessionId)
    },
    [deleteSession]
  )

  const handleUpdateTimeBlock = useCallback(
    (id: string, startAt: string, endAt: string) => {
      const result = updateTimeBlock(id, { startAt, endAt })
      if (!result.ok) setError(result.error)
    },
    [updateTimeBlock]
  )

  const handleDeleteTimeBlock = useCallback(
    (id: string) => {
      deleteTimeBlock(id)
    },
    [deleteTimeBlock]
  )

  const handlePickGhostBlock = useCallback(
    (label: string) => {
      if (!draftCreate) return
      const result = addTimeBlock({ label, startAt: draftCreate.startAt, endAt: draftCreate.endAt })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDraftCreate(null)
    },
    [addTimeBlock, draftCreate]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftRange(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-app-text-muted hover:bg-app-hover hover:text-app-text"
            title="Previous range"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="h-7 rounded-md px-2 text-xs text-app-text-muted hover:bg-app-hover hover:text-app-text"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftRange(1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-app-text-muted hover:bg-app-hover hover:text-app-text"
            title="Next range"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <span className="text-sm text-app-text-secondary">{rangeLabel}</span>
        <div className="ml-auto flex items-center gap-1 rounded-md border border-app-border bg-app-hover p-0.5">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setDayCount(opt)}
              className={cn(
                'h-6 rounded-sm px-2 text-xs transition-colors',
                dayCount === opt
                  ? 'bg-app-active text-app-text'
                  : 'text-app-text-muted hover:text-app-text'
              )}
            >
              {opt} {opt === 1 ? 'day' : 'days'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {projectTasks.length === 0 && (
        <div className="mx-4 mb-2 rounded-md border border-app-border bg-app-hover px-3 py-1.5 text-xs text-app-text-secondary">
          Only tasks that belong to a project can be scheduled. Add a project first, then a task.
        </div>
      )}

      <div className="min-h-0 flex-1 border-t border-app-border">
        <SessionsCalendar
          days={days}
          sessions={sessions}
          tasks={tasks}
          projects={projects}
          timeBlocks={timeBlocks}
          now={now}
          pendingDraft={pendingDraft}
          onCreateDraft={handleCreateDraft}
          onUpdate={handleUpdate}
          onOpenSession={handleOpenSession}
          onDeleteSession={handleDeleteSession}
          onUpdateTimeBlock={handleUpdateTimeBlock}
          onDeleteTimeBlock={handleDeleteTimeBlock}
        />
      </div>

      {draftCreate && draftMode === 'task' && (
        <TaskPickerDialog
          draft={draftCreate}
          tasks={projectTasks}
          projectById={projectById}
          onCancel={() => setDraftCreate(null)}
          onPick={handlePickTask}
          onSwitchToGhost={() => setDraftMode('ghost')}
        />
      )}

      {draftCreate && draftMode === 'ghost' && (
        <GhostBlockDialog
          draft={draftCreate}
          onCancel={() => setDraftCreate(null)}
          onCreate={handlePickGhostBlock}
          onSwitchToTask={() => setDraftMode('task')}
        />
      )}
    </div>
  )
}
