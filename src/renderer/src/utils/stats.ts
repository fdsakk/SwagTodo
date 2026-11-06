import type { Project, Task, TaskSession } from "@renderer/types"
import { addDays, format, parseISO, startOfDay, subDays } from "date-fns"

export interface DailyCount {
  date: string
  label: string
  count: number
}

export interface ProjectTime {
  projectId: string
  name: string
  color: string
  minutes: number
}

export interface TaskStatsSummary {
  completedToday: number
  completedThisWeek: number
  createdThisWeek: number
  active: number
  overdue: number
  /** Consecutive days (ending today or yesterday) with >= 1 completion. */
  streak: number
  trackedMinutes: number
}

const dayKey = (date: Date): string => format(date, "yyyy-MM-dd")

const completionDays = (tasks: readonly Task[]): Map<string, number> => {
  const counts = new Map<string, number>()
  for (const task of tasks) {
    if (!task.completed || !task.completedAt) continue
    const key = dayKey(parseISO(task.completedAt))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

export function completionsPerDay(
  tasks: readonly Task[],
  days: number,
  today: Date = new Date()
): DailyCount[] {
  const counts = completionDays(tasks)
  const start = subDays(startOfDay(today), days - 1)
  return Array.from({ length: days }, (_, offset) => {
    const date = addDays(start, offset)
    const key = dayKey(date)
    return {
      date: key,
      label: format(date, "d MMM"),
      count: counts.get(key) ?? 0
    }
  })
}

export function timePerProject(
  sessions: readonly TaskSession[],
  projects: readonly Project[],
  days: number,
  today: Date = new Date()
): ProjectTime[] {
  const fromMs = subDays(startOfDay(today), days - 1).getTime()
  const minutes = new Map<string, number>()
  for (const session of sessions) {
    const start = Date.parse(session.startAt)
    const end = Date.parse(session.endAt)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
      continue
    const clippedStart = Math.max(start, fromMs)
    if (end <= clippedStart) continue
    minutes.set(
      session.projectId,
      (minutes.get(session.projectId) ?? 0) + (end - clippedStart) / 60000
    )
  }
  const byId = new Map(projects.map((project) => [project.id, project]))
  return [...minutes.entries()]
    .map(([projectId, value]) => {
      const project = byId.get(projectId)
      return {
        projectId,
        name: project
          ? `${project.emoji ?? ""} ${project.name}`.trim()
          : "Deleted",
        color: project?.color ?? "#71717a",
        minutes: Math.round(value)
      }
    })
    .sort((a, b) => b.minutes - a.minutes)
}

export function summarizeTasks(
  tasks: readonly Task[],
  sessions: readonly TaskSession[],
  today: Date = new Date()
): TaskStatsSummary {
  const todayStart = startOfDay(today)
  const todayKey = dayKey(todayStart)
  const weekStartMs = subDays(todayStart, 6).getTime()
  const counts = completionDays(tasks)

  let completedThisWeek = 0
  let createdThisWeek = 0
  let active = 0
  let overdue = 0
  for (const task of tasks) {
    if (task.archivedAt) continue
    if (Date.parse(task.createdAt) >= weekStartMs) createdThisWeek += 1
    if (task.completed) {
      if (task.completedAt && Date.parse(task.completedAt) >= weekStartMs)
        completedThisWeek += 1
      continue
    }
    active += 1
    if (task.dueDate && task.dueDate < todayKey) overdue += 1
  }

  let streak = 0
  let cursor = counts.has(todayKey) ? todayStart : subDays(todayStart, 1)
  while (counts.has(dayKey(cursor))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }

  const trackedMinutes = timePerProject(sessions, [], 30, today).reduce(
    (sum, row) => sum + row.minutes,
    0
  )

  return {
    completedToday: counts.get(todayKey) ?? 0,
    completedThisWeek,
    createdThisWeek,
    active,
    overdue,
    streak,
    trackedMinutes
  }
}
