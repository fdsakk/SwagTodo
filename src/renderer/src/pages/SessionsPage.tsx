import {
  AgendaView,
  MonthView,
  SessionsCalendar
} from "@renderer/components/sessions-calendar"
import { useDomainStore, useUiStore } from "@renderer/store"
import {
  addDays,
  buildIsoAtMinutes,
  isSameDay,
  startOfDay,
  startOfMonth
} from "@renderer/utils/calendar"
import {
  buildCalendarItems,
  type CalendarItem
} from "@renderer/utils/calendarItems"
import { endOfMonth, endOfWeek, startOfWeek } from "date-fns"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import {
  EventEditorDialog,
  type EventEditorValues
} from "./sessions/EventEditorDialog"
import { GhostBlockDialog } from "./sessions/GhostBlockDialog"
import { SessionsToolbar, type ViewMode } from "./sessions/SessionsToolbar"
import { type DraftCreate, TaskPickerDialog } from "./sessions/TaskPickerDialog"
import { useSessionsKeyboard } from "./sessions/useSessionsKeyboard"

type DraftMode = "task" | "ghost" | "event"

const AGENDA_DAYS = 14

const NOW_TICK_MS = 60 * 1000

export default function SessionsPage(): React.JSX.Element {
  const {
    sessions,
    tasks,
    projects,
    timeBlocks,
    calendarEvents,
    addSession,
    updateSession,
    deleteSession,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
  } = useDomainStore(
    useShallow((state) => ({
      sessions: state.sessions,
      tasks: state.tasks,
      projects: state.projects,
      timeBlocks: state.timeBlocks,
      calendarEvents: state.calendarEvents,
      addSession: state.addSession,
      updateSession: state.updateSession,
      deleteSession: state.deleteSession,
      addTimeBlock: state.addTimeBlock,
      updateTimeBlock: state.updateTimeBlock,
      deleteTimeBlock: state.deleteTimeBlock,
      addCalendarEvent: state.addCalendarEvent,
      updateCalendarEvent: state.updateCalendarEvent,
      deleteCalendarEvent: state.deleteCalendarEvent
    }))
  )
  const openEditPanel = useUiStore((state) => state.openEditPanel)

  const [mode, setMode] = useState<ViewMode>({ kind: "days", count: 5 })
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()))
  const [now, setNow] = useState<Date>(() => new Date())
  const [error, setError] = useState<string | null>(null)
  const [draftCreate, setDraftCreate] = useState<DraftCreate | null>(null)
  const [draftMode, setDraftMode] = useState<DraftMode>("task")
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

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
    mode,
    blocked: Boolean(draftCreate) || Boolean(editingEventId),
    setAnchor,
    setMode
  })

  const days = useMemo(() => {
    if (mode.kind !== "days") return []
    const out: Date[] = []
    for (let i = 0; i < mode.count; i++) out.push(addDays(anchor, i))
    return out
  }, [anchor, mode])

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

  // Range covered by the active view, used for month/agenda item queries.
  const range = useMemo(() => {
    if (mode.kind === "month") {
      return {
        start: startOfWeek(startOfMonth(anchor)),
        end: addDays(endOfWeek(endOfMonth(anchor)), 1)
      }
    }
    if (mode.kind === "agenda") {
      const start = startOfDay(anchor)
      return { start, end: addDays(start, AGENDA_DAYS) }
    }
    const start = days[0] ?? startOfDay(anchor)
    const last = days[days.length - 1] ?? start
    return { start, end: addDays(last, 1) }
  }, [mode, anchor, days])

  const rangeItems = useMemo(
    () =>
      buildCalendarItems(
        sessions,
        timeBlocks,
        calendarEvents,
        tasks,
        projects,
        range.start.getTime(),
        range.end.getTime()
      ),
    [sessions, timeBlocks, calendarEvents, tasks, projects, range]
  )

  const editingEvent = useMemo(
    () =>
      editingEventId
        ? calendarEvents.find((e) => e.id === editingEventId)
        : undefined,
    [editingEventId, calendarEvents]
  )

  const shiftRange = useCallback(
    (direction: -1 | 1) =>
      setAnchor((current) => {
        if (mode.kind === "month") {
          const m = new Date(current)
          m.setMonth(m.getMonth() + direction)
          return m
        }
        const span = mode.kind === "days" ? mode.count : 7
        return addDays(current, direction * span)
      }),
    [mode]
  )

  const goToday = useCallback(() => setAnchor(startOfDay(new Date())), [])

  const rangeLabel = useMemo(() => {
    if (mode.kind === "month") {
      return anchor.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
      })
    }
    const fmt = (d: Date): string =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    const first = mode.kind === "agenda" ? range.start : days[0]
    const last =
      mode.kind === "agenda" ? addDays(range.end, -1) : days[days.length - 1]
    if (!first || !last) return ""
    const year = last.getFullYear()
    if (isSameDay(first, last)) return `${fmt(first)} ${year}`
    return `${fmt(first)} – ${fmt(last)} ${year}`
  }, [mode, anchor, days, range])

  const handlePickDay = useCallback((day: Date) => {
    setAnchor(startOfDay(day))
    setMode({ kind: "days", count: 1 })
  }, [])

  const handleCreateDraft = useCallback(
    (dayIndex: number, startMin: number, endMin: number) => {
      const day = days[dayIndex]
      if (!day) return
      const startAt = buildIsoAtMinutes(day, startMin)
      const endAt = buildIsoAtMinutes(day, endMin)
      setDraftMode("task")
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
      const result = addSession({
        taskId,
        startAt: draftCreate.startAt,
        endAt: draftCreate.endAt
      })
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
      const result = addTimeBlock({
        label,
        startAt: draftCreate.startAt,
        endAt: draftCreate.endAt
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDraftCreate(null)
    },
    [addTimeBlock, draftCreate]
  )

  const handleCreateEvent = useCallback(
    (values: EventEditorValues) => {
      if (!draftCreate) return
      const result = addCalendarEvent({
        title: values.title,
        startAt: draftCreate.startAt,
        endAt: draftCreate.endAt,
        allDay: values.allDay,
        description: values.description,
        location: values.location,
        color: values.color,
        rrule: values.rrule
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDraftCreate(null)
    },
    [addCalendarEvent, draftCreate]
  )

  const handleSaveEvent = useCallback(
    (values: EventEditorValues) => {
      if (!editingEventId) return
      const result = updateCalendarEvent(editingEventId, {
        title: values.title,
        allDay: values.allDay,
        description: values.description,
        location: values.location,
        color: values.color,
        rrule: values.rrule
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEditingEventId(null)
    },
    [updateCalendarEvent, editingEventId]
  )

  const handleOpenItem = useCallback(
    (item: CalendarItem) => {
      if (item.sessionId) {
        handleOpenSession(item.sessionId)
      } else if (item.eventId) {
        setEditingEventId(item.eventId)
      }
    },
    [handleOpenSession]
  )

  return (
    <div className="flex h-full flex-col">
      <SessionsToolbar
        mode={mode}
        rangeLabel={rangeLabel}
        onShiftRange={shiftRange}
        onGoToday={goToday}
        onModeChange={setMode}
      />

      {error && (
        <div className="mx-4 mb-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {projectTasks.length === 0 && (
        <div className="mx-4 mb-2 rounded-md border border-app-border bg-app-hover px-3 py-1.5 text-xs text-app-text-secondary">
          Only tasks that belong to a project can be scheduled. Add a project
          first, then a task.
        </div>
      )}

      <div className="min-h-0 flex-1 border-t border-app-border">
        {mode.kind === "days" && (
          <SessionsCalendar
            days={days}
            sessions={sessions}
            tasks={tasks}
            projects={projects}
            timeBlocks={timeBlocks}
            calendarEvents={calendarEvents}
            now={now}
            pendingDraft={pendingDraft}
            onCreateDraft={handleCreateDraft}
            onUpdate={handleUpdate}
            onOpenSession={handleOpenSession}
            onDeleteSession={deleteSession}
            onUpdateTimeBlock={handleUpdateTimeBlock}
            onDeleteTimeBlock={deleteTimeBlock}
            onOpenEvent={setEditingEventId}
            onDeleteEvent={deleteCalendarEvent}
          />
        )}
        {mode.kind === "month" && (
          <MonthView
            anchor={anchor}
            items={rangeItems}
            onOpenItem={handleOpenItem}
            onPickDay={handlePickDay}
          />
        )}
        {mode.kind === "agenda" && (
          <AgendaView
            items={rangeItems}
            now={now}
            onOpenItem={handleOpenItem}
          />
        )}
      </div>

      {draftCreate && draftMode === "task" && (
        <TaskPickerDialog
          draft={draftCreate}
          tasks={projectTasks}
          projectById={projectById}
          onCancel={() => setDraftCreate(null)}
          onPick={handlePickTask}
          onSwitchToGhost={() => setDraftMode("ghost")}
          onSwitchToEvent={() => setDraftMode("event")}
        />
      )}

      {draftCreate && draftMode === "ghost" && (
        <GhostBlockDialog
          draft={draftCreate}
          onCancel={() => setDraftCreate(null)}
          onCreate={handlePickGhostBlock}
          onSwitchToTask={() => setDraftMode("task")}
        />
      )}

      {draftCreate && draftMode === "event" && (
        <EventEditorDialog
          draft={draftCreate}
          onCancel={() => setDraftCreate(null)}
          onSubmit={handleCreateEvent}
          onSwitchToTask={() => setDraftMode("task")}
        />
      )}

      {editingEvent && (
        <EventEditorDialog
          event={editingEvent}
          onCancel={() => setEditingEventId(null)}
          onSubmit={handleSaveEvent}
          onDelete={() => {
            deleteCalendarEvent(editingEvent.id)
            setEditingEventId(null)
          }}
        />
      )}
    </div>
  )
}
