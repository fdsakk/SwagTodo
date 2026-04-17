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

export function isTaskDueToday(task: Task): boolean {
  return Boolean(task.dueDate) && isToday(parseISO(task.dueDate!))
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) return false
  return isBefore(parseISO(task.dueDate), startOfToday())
}

export function isTaskInFuture(task: Task): boolean {
  return Boolean(task.dueDate) && isAfter(parseISO(task.dueDate!), endOfToday())
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

function sortByDueDate(a: Task, b: Task): number {
  if (!a.dueDate && !b.dueDate) return a.order - b.order
  if (!a.dueDate) return 1
  if (!b.dueDate) return -1
  const diff = parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
  return diff !== 0 ? diff : sortByPriority(a, b)
}

function sortByCreatedAt(a: Task, b: Task): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

const SORT_FN: Record<TaskSort, (a: Task, b: Task) => number> = {
  priority: sortByPriority,
  due_date: sortByDueDate,
  created_at: sortByCreatedAt
}

export function sortTasks(tasks: Task[], sortMode: TaskSort): Task[] {
  return [...tasks].sort(SORT_FN[sortMode])
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
