import { v4 as uuidv4 } from 'uuid'
import { TASK_STATUSES, type Task, type TaskStatus } from '@renderer/types'
import { normalizeTaskPatch } from '../../shared/normalize'
import type { DomainActions, DomainStoreGet, DomainStoreSet } from '../../shared/types'
import {
  appendIfValid,
  nextOrder,
  nowIso,
  removeById,
  replaceByIdIfChanged
} from '../../shared/utils'
import { removeTaskRelations } from '../helpers/relations'

type TaskActions = Pick<
  DomainActions,
  | 'addTask'
  | 'updateTask'
  | 'toggleTaskComplete'
  | 'archiveTask'
  | 'unarchiveTask'
  | 'deleteTask'
  | 'addSubTask'
  | 'toggleSubTask'
  | 'deleteSubTask'
  | 'applyKanbanOrder'
>

export const createTaskActions = (set: DomainStoreSet, get: DomainStoreGet): TaskActions => ({
  addTask: (input) => {
    const title = input.title.trim()
    if (!title) return

    const timestamp = nowIso()
    const status = input.status ?? 'todo'
    const completed = status === 'done'
    const task: Task = {
      id: uuidv4(),
      title,
      description: input.description?.trim() || undefined,
      priority: input.priority ?? 'p4',
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

    set((state) => ({ tasks: appendIfValid(state.tasks, task) }))
  },
  updateTask: (taskId, updates) => {
    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const patch = normalizeTaskPatch(task, updates, updatedAt)
        return patch ? { ...task, ...patch } : task
      })
    }))
  },
  toggleTaskComplete: (taskId) => {
    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const patch = normalizeTaskPatch(task, { completed: !task.completed }, updatedAt)
        return patch ? { ...task, ...patch } : task
      })
    }))
  },
  archiveTask: (taskId) => {
    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const patch = normalizeTaskPatch(task, { archivedAt: updatedAt }, updatedAt)
        return patch ? { ...task, ...patch } : task
      })
    }))
  },
  unarchiveTask: (taskId) => {
    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const patch = normalizeTaskPatch(task, { archivedAt: undefined }, updatedAt)
        return patch ? { ...task, ...patch } : task
      })
    }))
  },
  deleteTask: (taskId) =>
    set((state) => {
      const tasks = removeById(state.tasks, taskId)
      if (tasks === state.tasks) return state

      const { sessions } = removeTaskRelations(state, taskId)
      return { tasks, sessions }
    }),
  addSubTask: (taskId, title) => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => ({
        ...task,
        updatedAt,
        subTasks: [...task.subTasks, { id: uuidv4(), title: trimmedTitle, completed: false }]
      }))
    }))
  },
  toggleSubTask: (taskId, subTaskId) => {
    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const subTaskIndex = task.subTasks.findIndex((subTask) => subTask.id === subTaskId)
        if (subTaskIndex === -1) return task

        const subTasks = task.subTasks.slice()
        const nextCompleted = !subTasks[subTaskIndex].completed
        subTasks[subTaskIndex] = { ...subTasks[subTaskIndex], completed: nextCompleted }

        return {
          ...task,
          updatedAt,
          subTasks,
          ...(nextCompleted && task.status === 'todo'
            ? { status: 'in_progress' as const, completed: false }
            : {})
        }
      })
    }))
  },
  deleteSubTask: (taskId, subTaskId) => {
    const updatedAt = nowIso()
    set((state) => ({
      tasks: replaceByIdIfChanged(state.tasks, taskId, (task) => {
        const subTasks = task.subTasks.filter((subTask) => subTask.id !== subTaskId)
        return subTasks.length === task.subTasks.length ? task : { ...task, updatedAt, subTasks }
      })
    }))
  },
  applyKanbanOrder: (projectId, columns) => {
    const updatedAt = nowIso()
    const byTaskId = new Map<string, { status: TaskStatus; order: number }>()

    for (let statusIndex = 0; statusIndex < TASK_STATUSES.length; statusIndex++) {
      const status = TASK_STATUSES[statusIndex]
      const ids = columns[status]
      for (let orderIndex = 0; orderIndex < ids.length; orderIndex++) {
        byTaskId.set(ids[orderIndex], { status, order: orderIndex + 1 })
      }
    }

    set((state) => {
      let changed = false
      const tasks = state.tasks.map((task) => {
        if (task.projectId !== projectId) return task

        const next = byTaskId.get(task.id)
        if (!next) return task
        if (task.status === next.status && task.order === next.order) return task

        changed = true
        const patch = normalizeTaskPatch(
          task,
          { status: next.status, completed: next.status === 'done' },
          updatedAt
        )

        return patch
          ? { ...task, ...patch, order: next.order }
          : { ...task, order: next.order, updatedAt }
      })

      return changed ? { tasks } : state
    })
  }
})
