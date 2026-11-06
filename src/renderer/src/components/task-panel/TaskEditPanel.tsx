import {
  AttachmentList,
  DependencyList,
  MarkdownNote,
  SessionStats,
  SubtaskList
} from "@renderer/components/task-edit"
import { Button } from "@renderer/components/ui/button"
import {
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle
} from "@renderer/components/ui/dialog"
import { Separator } from "@renderer/components/ui/separator"
import { useUndoableTaskActions } from "@renderer/hooks/useUndoableTaskActions"
import { useDomainStore, useUiStore } from "@renderer/store"
import type { Priority, Recurrence, Task, TaskStatus } from "@renderer/types"
import { computeTaskStats } from "@renderer/utils/sessions"
import { startTaskTimer } from "@renderer/utils/timer"
import { Play, Timer, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { TaskFormFields } from "./task-form-fields"

interface TaskEditPanelProps {
  task: Task
  onClose: () => void
}

const TEXT_COMMIT_DEBOUNCE_MS = 200
type PendingTextCommit = { taskId: string; value: string }

export function TaskEditPanel({
  task,
  onClose
}: TaskEditPanelProps): React.JSX.Element {
  const {
    tasks,
    projects,
    labels,
    sessions,
    addAttachments,
    removeAttachment,
    updateTask,
    addSubTask,
    toggleSubTask,
    deleteSubTask
  } = useDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      addAttachments: state.addAttachments,
      removeAttachment: state.removeAttachment,
      projects: state.projects,
      labels: state.labels,
      sessions: state.sessions,
      updateTask: state.updateTask,
      addSubTask: state.addSubTask,
      toggleSubTask: state.toggleSubTask,
      deleteSubTask: state.deleteSubTask
    }))
  )

  const stats = useMemo(
    () => computeTaskStats(sessions, task.id),
    [sessions, task.id]
  )

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("")

  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTitleRef = useRef<PendingTextCommit | null>(null)
  const pendingDescriptionRef = useRef<PendingTextCommit | null>(null)

  const clearTitleTimer = useCallback((): void => {
    if (!titleTimerRef.current) return
    clearTimeout(titleTimerRef.current)
    titleTimerRef.current = null
  }, [])

  const clearDescriptionTimer = useCallback((): void => {
    if (!descTimerRef.current) return
    clearTimeout(descTimerRef.current)
    descTimerRef.current = null
  }, [])

  const flushPendingTitle = useCallback((): void => {
    const pending = pendingTitleRef.current
    if (!pending) return
    clearTitleTimer()
    pendingTitleRef.current = null
    if (pending.value.trim())
      updateTask(pending.taskId, { title: pending.value })
  }, [clearTitleTimer, updateTask])

  const flushPendingDescription = useCallback((): void => {
    const pending = pendingDescriptionRef.current
    if (!pending) return
    clearDescriptionTimer()
    pendingDescriptionRef.current = null
    updateTask(pending.taskId, { description: pending.value })
  }, [clearDescriptionTimer, updateTask])

  const commitTitle = useCallback(
    (value: string) => {
      clearTitleTimer()
      pendingTitleRef.current = { taskId: task.id, value }
      titleTimerRef.current = setTimeout(
        flushPendingTitle,
        TEXT_COMMIT_DEBOUNCE_MS
      )
    },
    [clearTitleTimer, flushPendingTitle, task.id]
  )

  const commitDescription = useCallback(
    (value: string) => {
      clearDescriptionTimer()
      pendingDescriptionRef.current = { taskId: task.id, value }
      descTimerRef.current = setTimeout(
        flushPendingDescription,
        TEXT_COMMIT_DEBOUNCE_MS
      )
    },
    [clearDescriptionTimer, flushPendingDescription, task.id]
  )

  useEffect(() => {
    return () => {
      flushPendingTitle()
      flushPendingDescription()
    }
  }, [flushPendingDescription, flushPendingTitle])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setTitle(v)
      commitTitle(v)
    },
    [commitTitle]
  )

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value
      setDescription(v)
      commitDescription(v)
    },
    [commitDescription]
  )

  const flushTitle = useCallback(() => {
    flushPendingTitle()
    if (!title.trim()) setTitle(task.title)
  }, [flushPendingTitle, task.title, title])

  const flushDescription = useCallback(() => {
    flushPendingDescription()
  }, [flushPendingDescription])

  const toggleLabel = useCallback(
    (labelId: string): void => {
      const next = task.labels.includes(labelId)
        ? task.labels.filter((id) => id !== labelId)
        : [...task.labels, labelId]
      updateTask(task.id, { labels: next })
    },
    [task.id, task.labels, updateTask]
  )

  const handleAddSubTask = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && newSubTaskTitle.trim()) {
        addSubTask(task.id, newSubTaskTitle)
        setNewSubTaskTitle("")
      }
    },
    [addSubTask, newSubTaskTitle, task.id]
  )

  const { deleteTask } = useUndoableTaskActions()
  const handleDelete = useCallback(() => {
    onClose()
    deleteTask(task.id)
  }, [deleteTask, onClose, task.id])

  const handleDueDateChange = useCallback(
    (v: string | undefined) => updateTask(task.id, { dueDate: v ?? undefined }),
    [task.id, updateTask]
  )

  const handlePriorityChange = useCallback(
    (v: Priority) => updateTask(task.id, { priority: v }),
    [task.id, updateTask]
  )

  const handleProjectChange = useCallback(
    (v: string | undefined) =>
      updateTask(task.id, { projectId: v ?? undefined }),
    [task.id, updateTask]
  )

  const handleDueTimeChange = useCallback(
    (v: string | undefined) => updateTask(task.id, { dueTime: v }),
    [task.id, updateTask]
  )

  const handleRecurrenceChange = useCallback(
    (v: Recurrence | undefined) => updateTask(task.id, { recurrence: v }),
    [task.id, updateTask]
  )

  const openEditPanel = useUiStore((state) => state.openEditPanel)
  const timerTaskId = useUiStore((state) => state.activeTimer?.taskId)

  const handleStatusChange = useCallback(
    (v: TaskStatus) => updateTask(task.id, { status: v }),
    [task.id, updateTask]
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit task</DialogTitle>
      </DialogHeader>

      <Separator />

      <DialogPanel className="space-y-3 mt-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_13.5rem]">
          <div className="flex flex-col gap-6 min-h-0">
            <input
              className="w-full bg-transparent border-l-4 pl-2 rounded-sm text-2xl font-semibold leading-tight text-app-text placeholder:text-app-text-muted focus:outline-none"
              onBlur={flushTitle}
              onChange={handleTitleChange}
              placeholder="Task name"
              value={title}
            />

            <MarkdownNote
              onBlur={flushDescription}
              onChange={handleDescriptionChange}
              value={description}
            />
          </div>

          <Separator orientation="vertical" />

          <TaskFormFields
            dueDate={task.dueDate}
            dueTime={task.dueTime}
            emptyLabelsMessage="No labels selected."
            labels={labels}
            onDueDateChange={handleDueDateChange}
            onDueTimeChange={handleDueTimeChange}
            onRecurrenceChange={handleRecurrenceChange}
            recurrence={task.recurrence}
            onPriorityChange={handlePriorityChange}
            onProjectChange={handleProjectChange}
            onStatusChange={handleStatusChange}
            onToggleLabel={toggleLabel}
            priority={task.priority}
            projectId={task.projectId}
            projects={projects}
            selectedLabelIds={task.labels}
            status={task.status}
          />
        </div>

        <Separator className="mt-6 mb-5" />

        <div className="max-w-fit">
          <SubtaskList
            taskId={task.id}
            subTasks={task.subTasks}
            newSubTaskTitle={newSubTaskTitle}
            onNewSubTaskTitleChange={setNewSubTaskTitle}
            onToggle={(subTaskId) => toggleSubTask(task.id, subTaskId)}
            onDelete={(subTaskId) => deleteSubTask(task.id, subTaskId)}
            onAdd={handleAddSubTask}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <DependencyList
            onChange={(blockedBy) => updateTask(task.id, { blockedBy })}
            onOpenTask={openEditPanel}
            task={task}
            tasks={tasks}
          />
          <AttachmentList
            attachments={task.attachments ?? []}
            onAdd={(added) => addAttachments(task.id, added)}
            onRemove={(attachmentId) => removeAttachment(task.id, attachmentId)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-app-text-muted">Sessions</p>
            {!task.completed && timerTaskId !== task.id && (
              <>
                <Button
                  className="h-6 px-1.5 text-xs"
                  onClick={() => startTaskTimer(task.id, "stopwatch")}
                  size="sm"
                  title={
                    task.projectId
                      ? undefined
                      : "Assign a project to track time"
                  }
                  type="button"
                  variant="ghost"
                >
                  <Play size={11} />
                  Timer
                </Button>
                <Button
                  className="h-6 px-1.5 text-xs"
                  onClick={() => startTaskTimer(task.id, "pomodoro")}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Timer size={11} />
                  Pomodoro
                </Button>
              </>
            )}
            {timerTaskId === task.id && (
              <span className="text-xs text-app-accent">Timer running</span>
            )}
          </div>
          <SessionStats stats={stats} />
        </div>
      </DialogPanel>

      <DialogFooter className="justify-between sm:justify-between">
        <Button
          onClick={handleDelete}
          type="button"
          variant="destructive-outline"
          size="sm"
        >
          <Trash2 size={12} />
          Delete
        </Button>
        <Button onClick={onClose} type="button" variant="outline" size="sm">
          Done
        </Button>
      </DialogFooter>
    </>
  )
}
