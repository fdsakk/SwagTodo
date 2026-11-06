import type { Task } from "@renderer/types"
import { nextDueDate } from "@renderer/utils/recurrence"
import { v4 as uuidv4 } from "uuid"

export interface CompletionResult {
  task: Task
  spawned?: Task
}

/**
 * When a recurring task transitions to completed, the completed instance
 * keeps its history (rule removed so re-completing cannot duplicate) and a
 * fresh occurrence carrying the rule is created with the next due date.
 */
export const finalizeTaskChange = (
  before: Task,
  after: Task,
  timestamp: string,
  order: number,
  now: Date = new Date()
): CompletionResult => {
  if (before.completed || !after.completed || !after.recurrence) {
    return { task: after }
  }

  const { recurrence } = after
  const spawned: Task = {
    id: uuidv4(),
    title: after.title,
    description: after.description,
    priority: after.priority,
    dueDate: nextDueDate(recurrence, after.dueDate, now),
    dueTime: after.dueTime,
    recurrence,
    blockedBy: after.blockedBy,
    projectId: after.projectId,
    labels: after.labels,
    completed: false,
    status: "todo",
    createdAt: timestamp,
    updatedAt: timestamp,
    order,
    subTasks: after.subTasks.map((subTask) => ({
      ...subTask,
      completed: false
    }))
  }
  if (!spawned.dueTime) delete spawned.dueTime
  if (!spawned.blockedBy) delete spawned.blockedBy

  const task = { ...after }
  delete task.recurrence
  return { task, spawned }
}
