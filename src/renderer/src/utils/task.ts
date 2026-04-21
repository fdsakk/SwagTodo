import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { endOfToday, format, isAfter, isBefore, isToday, parseISO, startOfToday } from 'date-fns'
import useAppStore from '@renderer/store/useAppStore'
import type { Priority, Task, TaskSort } from '@renderer/types'

export const PROJECT_COLOR_SWATCHES = [
  '#f4f4f5',
  '#a1a1aa',
  '#52525b',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78350f',
  '#14532d',
  '#1e3a8a',
  '#4a044e'
]

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  p1: { label: 'Urgent', color: 'hsl(0 70% 60%)' },
  p2: { label: 'High', color: 'hsl(30 70% 60%)' },
  p3: { label: 'Medium', color: 'hsl(210 60% 60%)' },
  p4: { label: 'None', color: 'hsl(0 0% 35%)' }
}

const PRIORITY_WEIGHT: Record<Priority, number> = { p1: 1, p2: 2, p3: 3, p4: 4 }

function getDueDateMs(task: Task): number | null {
  return task.dueDate ? parseISO(task.dueDate).getTime() : null
}

export function isTaskDueToday(task: Task): boolean {
  const dueDateMs = getDueDateMs(task)
  return dueDateMs !== null && isToday(dueDateMs)
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) return false
  const dueDateMs = getDueDateMs(task)
  return dueDateMs !== null && isBefore(dueDateMs, startOfToday())
}

export function isTaskInFuture(task: Task): boolean {
  const dueDateMs = getDueDateMs(task)
  return dueDateMs !== null && isAfter(dueDateMs, endOfToday())
}

export function formatDueDate(date?: string): string {
  return date ? format(parseISO(date), 'MMM d') : ''
}

export function filterBySearch(tasks: Task[], query: string): Task[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return tasks
  return tasks.filter((t) => t.title.toLowerCase().includes(needle))
}

function sortByPriority(a: Task, b: Task): number {
  const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
  return diff !== 0 ? diff : a.order - b.order
}

export function sortTasks(tasks: Task[], sortMode: TaskSort): Task[] {
  const dueDateMs = new Map<string, number | null>()
  const createdAtMs = new Map<string, number>()

  for (const task of tasks) {
    dueDateMs.set(task.id, getDueDateMs(task))
    createdAtMs.set(task.id, new Date(task.createdAt).getTime())
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

export function useVisibleTasks(): Task[] {
  const { tasks, sortMode, searchQuery, showCompleted, selectedView } = useAppStore(
    useShallow((state) => ({
      tasks: state.tasks,
      sortMode: state.sortMode,
      searchQuery: state.searchQuery,
      showCompleted: state.showCompleted,
      selectedView: state.selectedView
    }))
  )
  return useMemo(() => {
    const includeCompleted = showCompleted || selectedView === 'project'
    const base = includeCompleted ? tasks : tasks.filter((t) => !t.completed)
    return sortTasks(filterBySearch(base, searchQuery), sortMode)
  }, [tasks, searchQuery, sortMode, showCompleted, selectedView])
}
