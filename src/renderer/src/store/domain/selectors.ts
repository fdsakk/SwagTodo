import { endOfToday, isAfter, isBefore, isToday, parseISO, startOfToday } from 'date-fns'
import type { Project, Task, TaskGroup } from '@renderer/types'
import type { DomainState, UiState } from '../shared/types'

const PRIORITY_WEIGHT = { p1: 1, p2: 2, p3: 3, p4: 4 } as const

const getDueDateMs = (task: Task): number | null =>
  task.dueDate ? parseISO(task.dueDate).getTime() : null

export const isTaskDueToday = (task: Task): boolean => {
  const dueDateMs = getDueDateMs(task)
  return dueDateMs !== null && isToday(dueDateMs)
}

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.completed) return false
  const dueDateMs = getDueDateMs(task)
  return dueDateMs !== null && isBefore(dueDateMs, startOfToday())
}

export const isTaskInFuture = (task: Task): boolean => {
  const dueDateMs = getDueDateMs(task)
  return dueDateMs !== null && isAfter(dueDateMs, endOfToday())
}

const filterBySearch = (tasks: readonly Task[], query: string): Task[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) return tasks as Task[]
  return tasks.filter((task) => task.title.toLowerCase().includes(needle))
}

const sortByPriority = (a: Task, b: Task): number => {
  const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
  return diff !== 0 ? diff : a.order - b.order
}

const sortTasks = (tasks: readonly Task[], sortMode: VisibleTasksInput['sortMode']): Task[] => {
  const dueDateMs = new Map<string, number | null>()
  const createdAtMs = new Map<string, number>()

  for (const task of tasks) {
    dueDateMs.set(task.id, getDueDateMs(task))
    createdAtMs.set(task.id, Date.parse(task.createdAt))
  }

  return [...tasks].sort((a, b) => {
    if (sortMode === 'priority') return sortByPriority(a, b)
    if (sortMode === 'created_at') {
      return (createdAtMs.get(b.id) ?? 0) - (createdAtMs.get(a.id) ?? 0)
    }

    const aDueDateMs = dueDateMs.get(a.id) ?? null
    const bDueDateMs = dueDateMs.get(b.id) ?? null

    if (aDueDateMs === null && bDueDateMs === null) return a.order - b.order
    if (aDueDateMs === null) return 1
    if (bDueDateMs === null) return -1

    const diff = aDueDateMs - bDueDateMs
    return diff !== 0 ? diff : sortByPriority(a, b)
  })
}

export type VisibleTasksInput = Pick<
  UiState,
  'searchQuery' | 'sortMode' | 'showCompleted' | 'selectedView'
>

export const selectTaskById = (
  state: Pick<DomainState, 'tasks'>,
  taskId?: string
): Task | undefined => (taskId ? state.tasks.find((task) => task.id === taskId) : undefined)

export const selectProjectById = (
  state: Pick<DomainState, 'projects'>,
  projectId?: string
): Project | undefined =>
  projectId ? state.projects.find((project) => project.id === projectId) : undefined

export const selectEditingProjectById = selectProjectById

export const selectVisibleTasks = (
  state: Pick<DomainState, 'tasks'>,
  input: VisibleTasksInput
): Task[] => {
  const includeCompleted = input.showCompleted || input.selectedView === 'project'
  const base = includeCompleted ? state.tasks : state.tasks.filter((task) => !task.completed)
  return sortTasks(filterBySearch(base, input.searchQuery), input.sortMode)
}

export const selectTasksForProject = (
  state: Pick<DomainState, 'tasks'>,
  projectId?: string,
  input?: VisibleTasksInput
): Task[] => {
  if (!projectId) return []
  const tasks = input ? selectVisibleTasks(state, input) : state.tasks
  return tasks.filter((task) => task.projectId === projectId)
}

export const selectInboxTaskGroups = (
  state: Pick<DomainState, 'tasks'>,
  input: VisibleTasksInput
): TaskGroup[] => {
  const tasks = selectVisibleTasks(state, input)
  const overdue: Task[] = []
  const noDate: Task[] = []
  const today: Task[] = []
  const future: Task[] = []

  for (const task of tasks) {
    if (task.projectId) continue
    if (isTaskOverdue(task)) overdue.push(task)
    else if (!task.dueDate) noDate.push(task)
    else if (isTaskDueToday(task)) today.push(task)
    else if (isTaskInFuture(task)) future.push(task)
  }

  return [
    { id: 'overdue', title: 'Overdue', accentClass: 'text-app-text-secondary', tasks: overdue },
    { id: 'no-date', title: 'No date', tasks: noDate },
    { id: 'today', title: 'Today', tasks: today },
    { id: 'future', title: 'Future', tasks: future }
  ]
}

export const selectTodayTaskGroups = (
  state: Pick<DomainState, 'tasks'>,
  input: VisibleTasksInput
): TaskGroup[] => {
  const tasks = selectVisibleTasks(state, input)
  const overdue: Task[] = []
  const today: Task[] = []

  for (const task of tasks) {
    if (isTaskOverdue(task)) overdue.push(task)
    else if (isTaskDueToday(task)) today.push(task)
  }

  return [
    { id: 'overdue', title: 'Overdue', accentClass: 'text-app-text-secondary', tasks: overdue },
    { id: 'today', title: 'Today', tasks: today }
  ]
}

export const selectProjectTaskGroups = (
  state: Pick<DomainState, 'tasks'>,
  projectId: string,
  input: VisibleTasksInput
): TaskGroup[] => {
  const projectTasks = selectTasksForProject(state, projectId, input)
  const todo: Task[] = []
  const inProgress: Task[] = []
  const done: Task[] = []

  for (const task of projectTasks) {
    if (task.status === 'todo') todo.push(task)
    else if (task.status === 'in_progress') inProgress.push(task)
    else done.push(task)
  }

  return [
    { id: 'todo', title: 'To Do', tasks: todo },
    { id: 'in-progress', title: 'In Progress', tasks: inProgress },
    { id: 'done', title: 'Done', tasks: done }
  ]
}

export const selectInboxCounts = (
  state: Pick<DomainState, 'tasks'>
): {
  inboxCount: number
  todayCount: number
} => {
  let inboxCount = 0
  let todayCount = 0

  for (const task of state.tasks) {
    if (task.completed) continue
    if (!task.projectId && (!task.dueDate || isTaskInFuture(task))) inboxCount += 1
    if (isTaskDueToday(task) || isTaskOverdue(task)) todayCount += 1
  }

  return { inboxCount, todayCount }
}

export const domainSelectors = {
  isTaskDueToday,
  isTaskOverdue,
  isTaskInFuture,
  selectTaskById,
  selectProjectById,
  selectEditingProjectById,
  selectVisibleTasks,
  selectTasksForProject,
  selectInboxTaskGroups,
  selectTodayTaskGroups,
  selectProjectTaskGroups,
  selectInboxCounts
}
