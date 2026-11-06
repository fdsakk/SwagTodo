import { TASK_STATUSES, type Task, type TaskStatus } from "@renderer/types"
import { v4 as uuidv4 } from "uuid"
import { normalizeTaskPatch } from "../../shared/normalize"
import type {
  DeletedTasksSnapshot,
  DomainActions,
  DomainState,
  DomainStoreGet,
  DomainStoreSet,
  UpdateTaskInput
} from "../../shared/types"
import {
  appendIfValid,
  nextOrder,
  nowIso,
  replaceByIdIfChanged
} from "../../shared/utils"
import { finalizeTaskChange } from "../helpers/recurrence"

export const AUTO_ARCHIVE_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000

type TaskActions = Pick<
  DomainActions,
  | "addTask"
  | "updateTask"
  | "updateTasks"
  | "toggleTaskComplete"
  | "setTasksCompleted"
  | "archiveTask"
  | "archiveTasks"
  | "archiveStaleCompletedTasks"
  | "unarchiveTask"
  | "unarchiveTasks"
  | "deleteTask"
  | "deleteTasks"
  | "restoreTasks"
  | "addSubTask"
  | "toggleSubTask"
  | "deleteSubTask"
  | "applyKanbanOrder"
  | "setTaskOrders"
  | "addAttachments"
  | "removeAttachment"
>

/**
 * Applies `change` to every task in `ids`, spawning the next occurrence for
 * recurring tasks that become completed. Returns `state` when nothing changed.
 */
const mapTasks = (
  state: DomainState,
  ids: readonly string[],
  change: (task: Task) => Task
): Partial<DomainState> | DomainState => {
  const idSet = new Set(ids)
  const timestamp = nowIso()
  let order = nextOrder(state.tasks)
  const spawned: Task[] = []
  let changed = false

  const tasks = state.tasks.map((task) => {
    if (!idSet.has(task.id)) return task
    const next = change(task)
    if (next === task) return task
    changed = true
    const result = finalizeTaskChange(task, next, timestamp, order)
    if (result.spawned) {
      spawned.push(result.spawned)
      order += 1
    }
    return result.task
  })

  if (!changed) return state
  return { tasks: spawned.length ? [...tasks, ...spawned] : tasks }
}

const patchWith =
  (updates: UpdateTaskInput, updatedAt: string) =>
  (task: Task): Task => {
    const patch = normalizeTaskPatch(task, updates, updatedAt)
    return patch ? { ...task, ...patch } : task
  }

const takeSnapshot = (
  state: DomainState,
  taskIds: readonly string[]
): DeletedTasksSnapshot => {
  const idSet = new Set(taskIds)
  const tasks: DeletedTasksSnapshot["tasks"] = []
  state.tasks.forEach((task, index) => {
    if (idSet.has(task.id)) tasks.push({ task, index })
  })
  return {
    tasks,
    sessions: state.sessions.filter((session) => idSet.has(session.taskId))
  }
}

export const createTaskActions = (
  set: DomainStoreSet,
  get: DomainStoreGet
): TaskActions => ({
  addTask: (input) => {
    const title = input.title.trim()
    if (!title) return

    const timestamp = nowIso()
    const status = input.status ?? "todo"
    const completed = status === "done"
    const task: Task = {
      id: uuidv4(),
      title,
      description: input.description?.trim() || undefined,
      priority: input.priority ?? "p4",
      dueDate: input.dueDate,
      projectId: input.projectId,
      labels: input.labels ?? [],
      completed,
      status,
      completedAt: completed ? timestamp : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      order: nextOrder(get().tasks),
      subTasks: []
    }
    if (input.dueDate && input.dueTime) task.dueTime = input.dueTime
    if (input.recurrence) task.recurrence = input.recurrence

    set((state) => ({ tasks: appendIfValid(state.tasks, task) }))
  },
  updateTask: (taskId, updates) =>
    set((state) => mapTasks(state, [taskId], patchWith(updates, nowIso()))),
  updateTasks: (taskIds, updates) =>
    set((state) => mapTasks(state, taskIds, patchWith(updates, nowIso()))),
  toggleTaskComplete: (taskId) => {
    const updatedAt = nowIso()
    set((state) =>
      mapTasks(state, [taskId], (task) =>
        patchWith({ completed: !task.completed }, updatedAt)(task)
      )
    )
  },
  setTasksCompleted: (taskIds, completed) =>
    set((state) =>
      mapTasks(state, taskIds, patchWith({ completed }, nowIso()))
    ),
  archiveTask: (taskId) => {
    const updatedAt = nowIso()
    set((state) =>
      mapTasks(state, [taskId], patchWith({ archivedAt: updatedAt }, updatedAt))
    )
  },
  archiveTasks: (taskIds) => {
    const updatedAt = nowIso()
    set((state) =>
      mapTasks(state, taskIds, patchWith({ archivedAt: updatedAt }, updatedAt))
    )
  },
  unarchiveTask: (taskId) =>
    set((state) =>
      mapTasks(state, [taskId], patchWith({ archivedAt: undefined }, nowIso()))
    ),
  archiveStaleCompletedTasks: (now = new Date()) => {
    const cutoffMs = now.getTime() - AUTO_ARCHIVE_DAYS * DAY_MS
    const archivedAt = now.toISOString()
    let count = 0
    set((state) => {
      const tasks = state.tasks.map((task) => {
        if (!task.completed || task.archivedAt || !task.completedAt) return task
        const completedMs = Date.parse(task.completedAt)
        if (!Number.isFinite(completedMs) || completedMs > cutoffMs) return task
        count += 1
        // updatedAt untouched on purpose: Activity would list it as an edit.
        return { ...task, archivedAt }
      })
      return count > 0 ? { tasks } : state
    })
    return count
  },
  unarchiveTasks: (taskIds) =>
    set((state) =>
      mapTasks(state, taskIds, patchWith({ archivedAt: undefined }, nowIso()))
    ),
  deleteTask: (taskId) => {
    get().deleteTasks([taskId])
  },
  deleteTasks: (taskIds) => {
    const snapshot = takeSnapshot(get(), taskIds)
    if (snapshot.tasks.length === 0) return snapshot

    const idSet = new Set(taskIds)
    set((state) => ({
      tasks: state.tasks.filter((task) => !idSet.has(task.id)),
      sessions: snapshot.sessions.length
        ? state.sessions.filter((session) => !idSet.has(session.taskId))
        : state.sessions
    }))
    return snapshot
  },
  restoreTasks: (snapshot) =>
    set((state) => {
      const existing = new Set(state.tasks.map((task) => task.id))
      const toRestore = snapshot.tasks.filter(
        ({ task }) => !existing.has(task.id)
      )
      if (toRestore.length === 0) return state

      const tasks = state.tasks.slice()
      for (const { task, index } of [...toRestore].sort(
        (a, b) => a.index - b.index
      )) {
        tasks.splice(Math.min(index, tasks.length), 0, task)
      }
      const sessionIds = new Set(state.sessions.map((session) => session.id))
      const sessions = snapshot.sessions.filter(
        (session) => !sessionIds.has(session.id)
      )
      return {
        tasks,
        sessions: sessions.length
          ? [...state.sessions, ...sessions]
          : state.sessions
      }
    }),
  addSubTask: (taskId, title) => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => ({
        ...task,
        updatedAt,
        subTasks: [
          ...task.subTasks,
          { id: uuidv4(), title: trimmedTitle, completed: false }
        ]
      }))
    }))
  },
  toggleSubTask: (taskId, subTaskId) => {
    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const subTaskIndex = task.subTasks.findIndex(
          (subTask) => subTask.id === subTaskId
        )
        if (subTaskIndex === -1) return task

        const subTasks = task.subTasks.slice()
        const nextCompleted = !subTasks[subTaskIndex].completed
        subTasks[subTaskIndex] = {
          ...subTasks[subTaskIndex],
          completed: nextCompleted
        }

        return {
          ...task,
          updatedAt,
          subTasks,
          ...(nextCompleted && task.status === "todo"
            ? { status: "in_progress" as const, completed: false }
            : {})
        }
      })
    }))
  },
  deleteSubTask: (taskId, subTaskId) => {
    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const subTasks = task.subTasks.filter(
          (subTask) => subTask.id !== subTaskId
        )
        return subTasks.length === task.subTasks.length
          ? task
          : { ...task, updatedAt, subTasks }
      })
    }))
  },
  applyKanbanOrder: (projectId, columns) => {
    const updatedAt = nowIso()
    const byTaskId = new Map<string, { status: TaskStatus; order: number }>()

    for (
      let statusIndex = 0;
      statusIndex < TASK_STATUSES.length;
      statusIndex++
    ) {
      const status = TASK_STATUSES[statusIndex]
      const ids = columns[status]
      for (let orderIndex = 0; orderIndex < ids.length; orderIndex++) {
        byTaskId.set(ids[orderIndex], { status, order: orderIndex + 1 })
      }
    }

    set((state) =>
      mapTasks(state, [...byTaskId.keys()], (task) => {
        if (task.projectId !== projectId) return task

        const next = byTaskId.get(task.id)
        if (!next) return task
        if (task.status === next.status && task.order === next.order)
          return task

        const patch = normalizeTaskPatch(
          task,
          { status: next.status, completed: next.status === "done" },
          updatedAt
        )

        return patch
          ? { ...task, ...patch, order: next.order }
          : { ...task, order: next.order, updatedAt }
      })
    )
  },
  setTaskOrders: (orders) =>
    set((state) => {
      const updatedAt = nowIso()
      let changed = false
      const tasks = state.tasks.map((task) => {
        const order = orders[task.id]
        if (order === undefined || order === task.order) return task
        changed = true
        return { ...task, order, updatedAt }
      })
      return changed ? { tasks } : state
    }),
  addAttachments: (taskId, attachments) => {
    if (attachments.length === 0) return
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => ({
        ...task,
        attachments: [...(task.attachments ?? []), ...attachments],
        updatedAt: nowIso()
      }))
    }))
  },
  removeAttachment: (taskId, attachmentId) =>
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const current = task.attachments ?? []
        const attachments = current.filter((a) => a.id !== attachmentId)
        if (attachments.length === current.length) return task
        const next: Task = { ...task, updatedAt: nowIso() }
        if (attachments.length) next.attachments = attachments
        else delete next.attachments
        return next
      })
    }))
})
