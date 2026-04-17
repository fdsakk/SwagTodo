import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { AnimatedCheckbox } from '@renderer/components/animated-checkbox'
import { Separator } from '@renderer/components/ui/separator'
import useAppStore from '@renderer/store/useAppStore'
import type { Priority, Task, TaskStatus } from '@renderer/types'
import { TaskFormFields } from '@renderer/components/task-form-fields'
import { cn } from '@renderer/utils/cn'
import { useShallow } from 'zustand/react/shallow'
import { computeTaskStats, formatDuration } from '@renderer/utils/sessions'

interface TaskEditPanelProps {
  task: Task
  onClose: () => void
}

const TEXT_COMMIT_DEBOUNCE_MS = 200

export default function TaskEditPanel({ task, onClose }: TaskEditPanelProps): React.JSX.Element {
  const {
    projects,
    labels,
    sessions,
    updateTask,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
    deleteTask
  } = useAppStore(
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

  const [lastTaskId, setLastTaskId] = useState(task.id)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('')

  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (lastTaskId !== task.id) {
    setLastTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description ?? '')
  }

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
      updateTask(task.id, { title })
    }
  }, [task.id, title, updateTask])

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
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center justify-between px-4">
        <span className="text-xs text-zinc-500">Task</span>
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
          onClick={onClose}
          type="button"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <input
          autoFocus
          className="w-full bg-transparent text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          onBlur={flushTitle}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Task name"
          value={title}
        />

        <textarea
          className="h-24 w-full resize-none bg-transparent text-sm text-zinc-400 placeholder:text-zinc-600 focus:outline-none"
          onBlur={flushDescription}
          onChange={handleDescriptionChange}
          placeholder="Add description..."
          value={description}
        />

        <Separator className="bg-white/[0.06]" />

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

        <Separator className="bg-white/[0.06]" />
        <div>
          <div className="mb-2 text-xs text-zinc-500">Sessions</div>
          {stats.count === 0 ? (
            <div className="text-xs text-zinc-600">No completed sessions yet.</div>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
              <div>
                <span className="text-zinc-500">Count:</span>{' '}
                <span className="text-zinc-300">{stats.count}</span>
              </div>
              <div>
                <span className="text-zinc-500">Total:</span>{' '}
                <span className="text-zinc-300">{formatDuration(stats.totalMs)}</span>
              </div>
              {stats.lastEndAt && (
                <div>
                  <span className="text-zinc-500">Last:</span>{' '}
                  <span className="text-zinc-300">
                    {new Date(stats.lastEndAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator className="bg-white/[0.06]" />
        <div>
          <div className="mb-2 text-xs text-zinc-500">Subtasks</div>
          <div className="space-y-1">
            {task.subTasks.map((subTask) => (
              <div
                className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-white/[0.02]"
                key={subTask.id}
              >
                <AnimatedCheckbox
                  checked={subTask.completed}
                  className="size-[14px]"
                  onCheckedChange={() => toggleSubTask(task.id, subTask.id)}
                />
                <span
                  className={cn(
                    'flex-1 text-sm text-zinc-300',
                    subTask.completed && 'line-through text-zinc-600'
                  )}
                >
                  {subTask.title}
                </span>
                <button
                  className="flex size-5 items-center justify-center rounded text-zinc-600 opacity-0 hover:bg-white/[0.04] hover:text-zinc-300 group-hover:opacity-100"
                  onClick={() => deleteSubTask(task.id, subTask.id)}
                  type="button"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
          <input
            className="mt-1 h-7 w-full bg-transparent px-1 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
            onChange={(event) => setNewSubTaskTitle(event.target.value)}
            onKeyDown={handleAddSubTask}
            placeholder="+ Add subtask"
            value={newSubTaskTitle}
          />
        </div>
      </div>

      <div className="flex items-center justify-end px-4 py-3">
        <Button
          className="h-7 bg-transparent px-2 text-xs text-zinc-500 hover:bg-white/[0.04] hover:text-red-400"
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
