import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import {
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Textarea } from '@renderer/components/ui/textarea'
import type { Priority, Task, TaskStatus } from '@renderer/types'
import { TaskFormFields } from './task-form-fields'
import { useShallow } from 'zustand/react/shallow'
import { computeTaskStats } from '@renderer/utils/sessions'
import { SessionStats } from '@renderer/components/task-edit/SessionStats'
import { SubtaskList } from '@renderer/components/task-edit/SubtaskList'
import { useDomainStore } from '@renderer/store'

interface TaskEditPanelProps {
  task: Task
  onClose: () => void
}

const TEXT_COMMIT_DEBOUNCE_MS = 200
type PendingTextCommit = { taskId: string; value: string }

export function TaskEditPanel({ task, onClose }: TaskEditPanelProps): React.JSX.Element {
  const {
    projects,
    labels,
    sessions,
    updateTask,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
    deleteTask
  } = useDomainStore(
    useShallow((state) => ({
      projects: state.projects,
      labels: state.labels,
      sessions: state.sessions,
      updateTask: state.updateTask,
      addSubTask: state.addSubTask,
      toggleSubTask: state.toggleSubTask,
      deleteSubTask: state.deleteSubTask,
      deleteTask: state.deleteTask
    }))
  )

  const stats = useMemo(() => computeTaskStats(sessions, task.id), [sessions, task.id])

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('')

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
    if (pending.value.trim()) updateTask(pending.taskId, { title: pending.value })
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
      titleTimerRef.current = setTimeout(flushPendingTitle, TEXT_COMMIT_DEBOUNCE_MS)
    },
    [clearTitleTimer, flushPendingTitle, task.id]
  )

  const commitDescription = useCallback(
    (value: string) => {
      clearDescriptionTimer()
      pendingDescriptionRef.current = { taskId: task.id, value }
      descTimerRef.current = setTimeout(flushPendingDescription, TEXT_COMMIT_DEBOUNCE_MS)
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
      if (e.key === 'Enter' && newSubTaskTitle.trim()) {
        addSubTask(task.id, newSubTaskTitle)
        setNewSubTaskTitle('')
      }
    },
    [addSubTask, newSubTaskTitle, task.id]
  )

  const handleDelete = useCallback(() => {
    if (window.confirm('Delete this task?')) {
      deleteTask(task.id)
      onClose()
    }
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
    (v: string | undefined) => updateTask(task.id, { projectId: v ?? undefined }),
    [task.id, updateTask]
  )

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

            <Textarea
              className="flex-1 min-h-[10.25rem] resize-none"
              onBlur={flushDescription}
              onChange={handleDescriptionChange}
              placeholder="Add description..."
              value={description}
            />
          </div>

          <Separator orientation="vertical" />

          <TaskFormFields
            dueDate={task.dueDate}
            emptyLabelsMessage="No labels selected."
            labels={labels}
            onDueDateChange={handleDueDateChange}
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
        <div className="space-y-2">
          <p className="text-xs font-medium text-app-text-muted">Sessions</p>
          <SessionStats stats={stats} />
        </div>
      </DialogPanel>

      <DialogFooter className="justify-between sm:justify-between">
        <Button onClick={handleDelete} type="button" variant="destructive-outline" size="sm">
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
