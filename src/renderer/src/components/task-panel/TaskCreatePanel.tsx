import { Button } from "@renderer/components/ui/button"
import {
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle
} from "@renderer/components/ui/dialog"
import { Separator } from "@renderer/components/ui/separator"
import { Textarea } from "@renderer/components/ui/textarea"
import { useDomainStore } from "@renderer/store"
import type { Priority, TaskStatus } from "@renderer/types"
import { useCallback, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { TaskFormFields } from "./task-form-fields"

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
  title: "",
  description: "",
  priority: "p4",
  dueDate: props.defaultDueDate ?? "",
  projectId: props.defaultProjectId ?? "",
  status: props.defaultStatus ?? "todo",
  labels: []
})

export function TaskCreatePanel(
  props: TaskCreatePanelProps
): React.JSX.Element {
  const { projects, labels, addTask } = useDomainStore(
    useShallow((state) => ({
      projects: state.projects,
      labels: state.labels,
      addTask: state.addTask
    }))
  )

  const [form, setForm] = useState<FormState>(() => INITIAL_STATE(props))

  const patch = useCallback(
    (updates: Partial<FormState>): void =>
      setForm((f) => ({ ...f, ...updates })),
    []
  )

  const toggleLabel = useCallback((id: string): void => {
    setForm((f) => ({
      ...f,
      labels: f.labels.includes(id)
        ? f.labels.filter((x) => x !== id)
        : [...f.labels, id]
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
      if (event.key === "Enter") {
        event.preventDefault()
        handleCreate()
      }
    },
    [handleCreate]
  )

  const canSubmit = form.title.trim().length > 0

  return (
    <>
      <DialogHeader>
        <DialogTitle>New task</DialogTitle>
      </DialogHeader>

      <Separator />

      <DialogPanel className="space-y-3 mt-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_13.5rem]">
          <div className="flex flex-col gap-6 min-h-0">
            <input
              className="w-full border-l-4 pl-2 rounded-sm bg-transparent text-2xl font-semibold leading-tight text-app-text placeholder:text-app-text-muted focus:outline-none"
              onChange={(event) => patch({ title: event.target.value })}
              onKeyDown={handleTitleKeyDown}
              placeholder="Task name"
              value={form.title}
            />

            <Textarea
              className="flex-1 min-h-32 resize-none"
              onChange={(event) => patch({ description: event.target.value })}
              placeholder="Add description..."
              value={form.description}
            />
          </div>

          <Separator orientation="vertical" />

          <TaskFormFields
            dueDate={form.dueDate || undefined}
            labels={labels}
            onDueDateChange={(v) => patch({ dueDate: v ?? "" })}
            onPriorityChange={(v) => patch({ priority: v })}
            onProjectChange={(v) => patch({ projectId: v ?? "" })}
            onStatusChange={(v) => patch({ status: v })}
            onToggleLabel={toggleLabel}
            priority={form.priority}
            projectId={form.projectId || undefined}
            projects={projects}
            selectedLabelIds={form.labels}
            status={form.status}
          />
        </div>
      </DialogPanel>

      <DialogFooter>
        <Button onClick={props.onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={handleCreate} type="button">
          Add task
        </Button>
      </DialogFooter>
    </>
  )
}
