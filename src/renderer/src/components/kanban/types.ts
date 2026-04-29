import type { Label, Task, TaskStatus } from "@renderer/types"

export const COLUMNS: readonly { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" }
] as const

export const COLUMN_PREFIX = "column-"

export const EMPTY_LABELS: Label[] = []

export const byOrderAsc = (a: Task, b: Task): number => a.order - b.order

export const resolveTaskLabels = (
  task: Task,
  labelMap: Map<string, Label>
): Label[] => {
  if (task.labels.length === 0) return EMPTY_LABELS
  const out: Label[] = []
  for (let i = 0; i < task.labels.length; i++) {
    const l = labelMap.get(task.labels[i])
    if (l) out.push(l)
  }
  return out
}
