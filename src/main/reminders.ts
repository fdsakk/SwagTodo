import type { Task } from "../shared/types"

export interface DueReminder {
  key: string
  taskId: string
  title: string
  dueAtMs: number
  remindAtMs: number
}

/** Local wall-clock due moment, or null when the task has no time. */
export const taskDueAtMs = (task: Task): number | null => {
  if (!task.dueDate || !task.dueTime) return null
  const [y, m, d] = task.dueDate.split("-").map(Number)
  const [hh, mm] = task.dueTime.split(":").map(Number)
  const date = new Date(y, m - 1, d, hh, mm, 0, 0)
  const ms = date.getTime()
  return Number.isFinite(ms) ? ms : null
}

/** Reminders whose fire moment falls in (fromMs, toMs]. */
export function collectDueReminders(
  tasks: readonly Task[],
  leadMinutes: number,
  fromMs: number,
  toMs: number
): DueReminder[] {
  const out: DueReminder[] = []
  for (const task of tasks) {
    if (task.completed || task.archivedAt) continue
    const dueAtMs = taskDueAtMs(task)
    if (dueAtMs === null) continue
    const remindAtMs = dueAtMs - leadMinutes * 60_000
    if (remindAtMs <= fromMs || remindAtMs > toMs) continue
    out.push({
      key: `${task.id}:${remindAtMs}`,
      taskId: task.id,
      title: task.title,
      dueAtMs,
      remindAtMs
    })
  }
  return out
}
