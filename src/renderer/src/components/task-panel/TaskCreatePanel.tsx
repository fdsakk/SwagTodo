import { useCallback, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import type { Priority, TaskStatus } from '@renderer/types'
import { TaskFormFields } from './task-form-fields'
import { useShallow } from 'zustand/react/shallow'
import { useDomainStore } from '@renderer/store'

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
  const { projects, labels, addTask } = useDomainStore(
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
    <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-border px-6 py-2.5">
        <span className="text-[11px] font-medium  tracking-widest text-app-text-muted">Create</span>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
          onClick={props.onClose}
          type="button"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <input
          autoFocus
          className="w-full bg-transparent text-xl font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          onChange={(event) => patch({ title: event.target.value })}
          onKeyDown={handleTitleKeyDown}
          placeholder="Task name"
          value={form.title}
        />

        <textarea
          className="h-20 w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-400 placeholder:text-zinc-600 focus:outline-none"
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="Add description..."
          value={form.description}
        />

        <Separator className="bg-app-border" />

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

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-app-border px-6 py-2.5">
        <Button
          className="h-7 bg-transparent px-3 text-xs text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
          onClick={props.onClose}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          className="h-7 px-4 text-xs"
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
