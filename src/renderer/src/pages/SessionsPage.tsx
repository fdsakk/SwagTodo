import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { SessionsCalendar } from '@renderer/components/sessions-calendar'
import { addDays, buildIsoAtMinutes, isSameDay, startOfDay } from '@renderer/utils/calendar'

import { TaskPickerDialog, type DraftCreate } from './sessions/TaskPickerDialog'
import { GhostBlockDialog } from './sessions/GhostBlockDialog'
import { SessionsToolbar, type DayCount } from './sessions/SessionsToolbar'
import { useSessionsKeyboard } from './sessions/useSessionsKeyboard'
import { useDomainStore, useUiStore } from '@renderer/store'

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
    deleteTimeBlock
  } = useDomainStore(
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
      deleteTimeBlock: state.deleteTimeBlock
    }))
  )
  const openEditPanel = useUiStore((state) => state.openEditPanel)

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

  useSessionsKeyboard({
    dayCount,
    blocked: Boolean(draftCreate),
    setAnchor,
    setDayCount
  })

  const days = useMemo(() => {
    const out: Date[] = []
    for (let i = 0; i < dayCount; i++) out.push(addDays(anchor, i))
    return out
  }, [anchor, dayCount])

  const projectTasks = useMemo(
    () => tasks.filter((t) => Boolean(t.projectId) && !t.archivedAt),
    [tasks]
  )

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
    (direction: -1 | 1) => setAnchor((current) => addDays(current, direction * dayCount)),
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

  const handleUpdateTimeBlock = useCallback(
    (id: string, startAt: string, endAt: string) => {
      const result = updateTimeBlock(id, { startAt, endAt })
      if (!result.ok) setError(result.error)
    },
    [updateTimeBlock]
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
      <SessionsToolbar
        dayCount={dayCount}
        rangeLabel={rangeLabel}
        onShiftRange={shiftRange}
        onGoToday={goToday}
        onDayCountChange={setDayCount}
      />

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
          onDeleteSession={deleteSession}
          onUpdateTimeBlock={handleUpdateTimeBlock}
          onDeleteTimeBlock={deleteTimeBlock}
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
