import type { Label, Project, Task } from '@renderer/types'
import type {
  CreateLabelInput,
  CreateProjectInput,
  UpdateLabelInput,
  UpdateProjectInput,
  UpdateTaskInput
} from './types'

type MutableTaskPatch = Partial<Task>

const arrayShallowEqual = <T>(left: readonly T[], right: readonly T[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index])

const asObjectRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

export function normalizeStoredTask(raw: unknown): Task {
  const task = asObjectRecord(raw) ?? {}
  const updatedAt =
    typeof task.updatedAt === 'string'
      ? task.updatedAt
      : typeof task.createdAt === 'string'
        ? task.createdAt
        : new Date(0).toISOString()
  const status =
    task.status === 'done' || task.completed
      ? 'done'
      : task.status === 'in_progress'
        ? 'in_progress'
        : 'todo'
  const completed = status === 'done'

  return {
    id: typeof task.id === 'string' ? task.id : '',
    title: typeof task.title === 'string' ? task.title : '',
    description: typeof task.description === 'string' ? task.description : undefined,
    priority:
      task.priority === 'p1' ||
      task.priority === 'p2' ||
      task.priority === 'p3' ||
      task.priority === 'p4'
        ? task.priority
        : 'p4',
    dueDate: typeof task.dueDate === 'string' ? task.dueDate : undefined,
    projectId: typeof task.projectId === 'string' ? task.projectId : undefined,
    labels: Array.isArray(task.labels)
      ? task.labels.filter((value): value is string => typeof value === 'string')
      : [],
    completed,
    status,
    completedAt: completed
      ? typeof task.completedAt === 'string'
        ? task.completedAt
        : updatedAt
      : undefined,
    archivedAt: typeof task.archivedAt === 'string' ? task.archivedAt : undefined,
    createdAt: typeof task.createdAt === 'string' ? task.createdAt : updatedAt,
    updatedAt,
    order: typeof task.order === 'number' ? task.order : 0,
    subTasks: Array.isArray(task.subTasks)
      ? task.subTasks
          .map((subTask) => {
            const record = asObjectRecord(subTask)
            if (!record) return null
            return {
              id: typeof record.id === 'string' ? record.id : '',
              title: typeof record.title === 'string' ? record.title : '',
              completed: Boolean(record.completed)
            }
          })
          .filter((subTask): subTask is Task['subTasks'][number] => subTask !== null)
      : []
  }
}

export function normalizeTaskPatch(
  task: Task,
  updates: UpdateTaskInput,
  updatedAt: string
): MutableTaskPatch | null {
  const patch: MutableTaskPatch = {}

  if ('title' in updates) {
    const title = updates.title?.trim() ?? ''
    if (!title) return null
    if (title !== task.title) patch.title = title
  }

  if ('description' in updates) {
    const description = updates.description?.trim() || undefined
    if (description !== task.description) patch.description = description
  }

  if ('priority' in updates && updates.priority !== task.priority) patch.priority = updates.priority
  if ('dueDate' in updates && updates.dueDate !== task.dueDate) patch.dueDate = updates.dueDate
  if ('archivedAt' in updates && updates.archivedAt !== task.archivedAt)
    patch.archivedAt = updates.archivedAt
  if ('projectId' in updates && updates.projectId !== task.projectId)
    patch.projectId = updates.projectId

  if ('labels' in updates) {
    const labels = updates.labels ?? []
    if (!arrayShallowEqual(labels, task.labels)) patch.labels = labels
  }

  let nextStatus = task.status
  let nextCompleted = task.completed

  if (updates.status !== undefined) {
    nextStatus = updates.status
    nextCompleted = updates.status === 'done'
  } else if (typeof updates.completed === 'boolean') {
    nextCompleted = updates.completed
    nextStatus = updates.completed ? 'done' : 'todo'
  }

  if (nextStatus !== task.status) patch.status = nextStatus
  if (nextCompleted !== task.completed) patch.completed = nextCompleted

  const nextCompletedAt = nextCompleted
    ? task.completed
      ? (task.completedAt ?? task.updatedAt)
      : updatedAt
    : undefined

  if (nextCompletedAt !== task.completedAt) patch.completedAt = nextCompletedAt

  if (Object.keys(patch).length === 0) return null
  patch.updatedAt = updatedAt
  return patch
}

export function normalizeProjectInput(input: CreateProjectInput): CreateProjectInput | null {
  const name = input.name.trim()
  if (!name) return null
  return {
    name,
    color: input.color,
    emoji: input.emoji?.trim() || undefined,
    description: input.description?.trim() || undefined
  }
}

export function normalizeProjectPatch(
  current: Project,
  updates: UpdateProjectInput
): UpdateProjectInput | null {
  const patch: UpdateProjectInput = {}

  if ('name' in updates) {
    const name = updates.name?.trim() ?? ''
    if (!name) return null
    if (name !== current.name) patch.name = name
  }

  if ('color' in updates && updates.color !== current.color) patch.color = updates.color

  if ('emoji' in updates) {
    const emoji = updates.emoji?.trim() || undefined
    if (emoji !== current.emoji) patch.emoji = emoji
  }

  if ('description' in updates) {
    const description = updates.description?.trim() || undefined
    if (description !== current.description) patch.description = description
  }

  return Object.keys(patch).length > 0 ? patch : null
}

export function normalizeLabelInput(input: CreateLabelInput): CreateLabelInput | null {
  const name = input.name.trim()
  if (!name) return null
  return { name, color: input.color }
}

export function normalizeLabelPatch(
  current: Label,
  updates: UpdateLabelInput
): UpdateLabelInput | null {
  const patch: UpdateLabelInput = {}

  if ('name' in updates) {
    const name = updates.name?.trim() ?? ''
    if (!name) return null
    if (name !== current.name) patch.name = name
  }

  if ('color' in updates && updates.color !== current.color) patch.color = updates.color

  return Object.keys(patch).length > 0 ? patch : null
}
