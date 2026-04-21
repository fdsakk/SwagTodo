import type { Label, Project, Task } from '@renderer/types'

type EditableTaskPatch = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'priority'
    | 'dueDate'
    | 'projectId'
    | 'labels'
    | 'status'
    | 'completed'
  >
>

type MutableTaskPatch = Partial<Task>

type ProjectInput = Pick<Project, 'name' | 'color' | 'emoji' | 'description'>
type ProjectPatch = Partial<ProjectInput>

type LabelInput = Pick<Label, 'name' | 'color'>
type LabelPatch = Partial<LabelInput>

const arrayShallowEqual = <T>(left: readonly T[], right: readonly T[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index])

export function normalizeStoredTask(task: Task): Task {
  const completed = task.status === 'done' || task.completed
  return {
    ...task,
    completed,
    status: completed ? 'done' : task.status === 'in_progress' ? 'in_progress' : 'todo',
    completedAt: completed ? (task.completedAt ?? task.updatedAt) : undefined
  }
}

export function normalizeTaskPatch(
  task: Task,
  updates: EditableTaskPatch,
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

  if ('projectId' in updates && updates.projectId !== task.projectId) {
    patch.projectId = updates.projectId
  }

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
    ? (task.completedAt ?? (task.completed ? task.updatedAt : updatedAt))
    : undefined

  if (nextCompletedAt !== task.completedAt) patch.completedAt = nextCompletedAt

  if (Object.keys(patch).length === 0) return null
  patch.updatedAt = updatedAt
  return patch
}

export function normalizeProjectInput(input: ProjectInput): ProjectInput | null {
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
  updates: ProjectPatch
): ProjectPatch | null {
  const patch: ProjectPatch = {}

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

export function normalizeLabelInput(input: LabelInput): LabelInput | null {
  const name = input.name.trim()
  if (!name) return null
  return { name, color: input.color }
}

export function normalizeLabelPatch(current: Label, updates: LabelPatch): LabelPatch | null {
  const patch: LabelPatch = {}

  if ('name' in updates) {
    const name = updates.name?.trim() ?? ''
    if (!name) return null
    if (name !== current.name) patch.name = name
  }

  if ('color' in updates && updates.color !== current.color) patch.color = updates.color

  return Object.keys(patch).length > 0 ? patch : null
}
