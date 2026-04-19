import { useCallback, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import useAppStore from '@renderer/store/useAppStore'
import type { Priority, TaskStatus } from '@renderer/types'
import { TaskFormFields } from './task-form-fields'
import { useShallow } from 'zustand/react/shallow'

interface FormState {
  title: string
  description: string
  priority: Priority
  dueDate: string
  projectId: string
  status: TaskStatus
  labels: string[]
}

interface TaskCreatePanelProps {
  defaultProjectId?: string
  defaultStatus?: TaskStatus
  defaultDueDate?: string
  onClose: () => void
}

const INITIAL_STATE = (props: TaskCreatePanelProps): FormState => ({
  title: '',
  description: '',
  priority: 'p4',
  dueDate: props.defaultDueDate ?? '',
  projectId: props.defaultProjectId ?? '',
  status: props.defaultStatus ?? 'todo',
  labels: []
})

export function TaskCreatePanel(props: TaskCreatePanelProps): React.JSX.Element {
  const { projects, labels, addTask } = useAppStore(
    useShallow((state) => ({
      projects: state.projects,
      labels: state.labels,
      addTask: state.addTask
    }))
  )

  const [form, setForm] = useState<FormState>(() => INITIAL_STATE(props))

  const patch = useCallback(
    (updates: Partial<FormState>): void => setForm((f) => ({ ...f, ...updates })),
    []
  )

  const toggleLabel = useCallback((id: string): void => {
    setForm((f) => ({
      ...f,
      labels: f.labels.includes(id) ? f.labels.filter((x) => x !== id) : [...f.labels, id]
    }))
  }, [])

  const handleCreate = useCallback((): void => {
    const title = form.title.trim()
    if (!title) return
    addTask({
      title,
      description: form.description.trim() || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      projectId: form.projectId || undefined,
      labels: form.labels,
      status: form.status
    })
    props.onClose()
  }, [form, addTask, props])

  const handleTitleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        event.preventDefault()
        handleCreate()
      } else if (event.key === 'Escape') {
        props.onClose()
      }
    },
    [handleCreate, props]
  )

  const canSubmit = form.title.trim().length > 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center justify-between px-4">
        <span className="text-xs text-zinc-500">New task</span>
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
          onClick={props.onClose}
          type="button"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <input
          autoFocus
          className="w-full bg-transparent text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          onChange={(event) => patch({ title: event.target.value })}
          onKeyDown={handleTitleKeyDown}
          placeholder="Task name"
          value={form.title}
        />

        <textarea
          className="h-24 w-full resize-none bg-transparent text-sm text-zinc-400 placeholder:text-zinc-600 focus:outline-none"
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="Add description..."
          value={form.description}
        />

        <Separator className="bg-white/[0.06]" />

        <TaskFormFields
          dueDate={form.dueDate || undefined}
          labels={labels}
          onDueDateChange={(v) => patch({ dueDate: v ?? '' })}
          onPriorityChange={(v) => patch({ priority: v })}
          onProjectChange={(v) => patch({ projectId: v ?? '' })}
          onStatusChange={(v) => patch({ status: v })}
          onToggleLabel={toggleLabel}
          priority={form.priority}
          projectId={form.projectId || undefined}
          projects={projects}
          selectedLabelIds={form.labels}
          status={form.status}
        />
      </div>

      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <Button
          className="h-7 bg-transparent px-3 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
          onClick={props.onClose}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          className="h-7 px-3 text-xs"
          disabled={!canSubmit}
          onClick={handleCreate}
          type="button"
        >
          Add task
        </Button>
      </div>
    </div>
  )
}
