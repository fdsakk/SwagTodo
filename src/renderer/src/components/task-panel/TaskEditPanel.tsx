import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
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

  useEffect(() => {
    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
      if (descTimerRef.current) clearTimeout(descTimerRef.current)
    }
  }, [])

  const commitTitle = useCallback(
    (value: string) => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
      titleTimerRef.current = setTimeout(() => {
        titleTimerRef.current = null
        updateTask(task.id, { title: value })
      }, TEXT_COMMIT_DEBOUNCE_MS)
    },
    [task.id, updateTask]
  )

  const commitDescription = useCallback(
    (value: string) => {
      if (descTimerRef.current) clearTimeout(descTimerRef.current)
      descTimerRef.current = setTimeout(() => {
        descTimerRef.current = null
        updateTask(task.id, { description: value })
      }, TEXT_COMMIT_DEBOUNCE_MS)
    },
    [task.id, updateTask]
  )

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

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  const flushTitle = useCallback(() => {
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current)
      titleTimerRef.current = null
      if (title.trim()) updateTask(task.id, { title })
      else setTitle(task.title)
    }
  }, [task.id, task.title, title, updateTask])

  const flushDescription = useCallback(() => {
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current)
      descTimerRef.current = null
      updateTask(task.id, { description })
    }
  }, [task.id, description, updateTask])

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

  return (
    <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-border px-6 py-2.5">
        <span className="text-[11px] font-medium tracking-widest text-app-text-muted">Task</span>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
          onClick={onClose}
          type="button"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body — two columns */}
      <div className="grid grid-cols-8">
        {/* Left: title, description, subtasks */}
        <div className="col-span-5 overflow-y-auto px-6 py-5">
          <input
            autoFocus
            className="mb-3 w-full bg-transparent text-xl font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            onBlur={flushTitle}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="Task name"
            value={title}
          />

          <textarea
            className="mb-5 min-h-[120px] w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-400 placeholder:text-zinc-600 focus:outline-none"
            onBlur={flushDescription}
            onChange={handleDescriptionChange}
            placeholder="Add description..."
            value={description}
          />

          <Separator className="mb-5 bg-app-border" />

          <SubtaskList
            taskId={task.id}
            subTasks={task.subTasks}
            newSubTaskTitle={newSubTaskTitle}
            onNewSubTaskTitleChange={setNewSubTaskTitle}
            onToggle={(subTaskId) => toggleSubTask(task.id, subTaskId)}
            onDelete={(subTaskId) => deleteSubTask(task.id, subTaskId)}
            onAdd={handleAddSubTask}
          />

          <Separator className="my-5 bg-app-border" />

          <div>
            <div className="mb-3 text-[11px] font-medium text-app-text-muted">Sessions</div>
            <SessionStats stats={stats} />
          </div>
        </div>

        {/* Right: metadata */}
        <div className="col-span-3  border-l border-app-border bg-app-titlebar/30 px-4 py-5">
          <div className="mb-3 text-[11px] font-medium text-app-text-muted">Details</div>
          <TaskFormFields
            dueDate={task.dueDate}
            emptyLabelsMessage="No labels selected."
            labels={labels}
            onDueDateChange={(v) => updateTask(task.id, { dueDate: v ?? undefined })}
            onPriorityChange={(v: Priority) => updateTask(task.id, { priority: v })}
            onProjectChange={(v) => updateTask(task.id, { projectId: v ?? undefined })}
            onStatusChange={(v: TaskStatus) => updateTask(task.id, { status: v })}
            onToggleLabel={toggleLabel}
            priority={task.priority}
            projectId={task.projectId}
            projects={projects}
            selectedLabelIds={task.labels}
            status={task.status}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-app-border px-4 py-2.5">
        <Button
          className="h-7 bg-transparent px-2 text-xs text-app-text-muted hover:bg-app-hover hover:text-red-400"
          onClick={handleDelete}
          type="button"
          variant="ghost"
        >
          <Trash2 size={12} />
          Delete
        </Button>
      </div>
    </div>
  )
}
