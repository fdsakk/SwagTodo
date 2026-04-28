import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Field, FieldLabel } from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
import { Separator } from '@renderer/components/ui/separator'
import {
  DialogDescription,
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
    <>
      <DialogHeader>
        <DialogTitle>Edit task</DialogTitle>
      </DialogHeader>

      <Separator />

      <DialogPanel className="space-y-3 mt-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_13.5rem]">
          <div className="space-y-3">
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input
                autoFocus
                onBlur={flushTitle}
                onChange={handleTitleChange}
                placeholder="Task name"
                value={title}
              />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                className="min-h-[10.25rem]"
                onBlur={flushDescription}
                onChange={handleDescriptionChange}
                placeholder="Add description..."
                value={description}
              />
            </Field>
          </div>

          <Separator orientation="vertical" />

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

        <Separator className="mt-6 mb-5"/>

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
