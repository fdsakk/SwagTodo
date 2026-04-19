import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import useAppStore from '@renderer/store/useAppStore'
import type { Priority, Task, TaskStatus } from '@renderer/types'
import { TaskFormFields } from './task-form-fields'
import { useShallow } from 'zustand/react/shallow'
import { computeTaskStats } from '@renderer/utils/sessions'
import { SessionStats } from '@renderer/components/task-edit/SessionStats'
import { SubtaskList } from '@renderer/components/task-edit/SubtaskList'

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
          <SessionStats stats={stats} />
        </div>

        <Separator className="bg-white/[0.06]" />
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
