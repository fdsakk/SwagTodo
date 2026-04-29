import type { Task, UiScale, ViewName } from "@renderer/types"
import { UI_SCALE_OPTIONS } from "@renderer/types"
import type { TaskCreateDefaults } from "./types"

const UI_SCALE_SET: ReadonlySet<number> = new Set(UI_SCALE_OPTIONS)

export const nowIso = (): string => new Date().toISOString()

export const nextOrder = (tasks: readonly Task[]): number => {
  let max = 0
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].order > max) max = tasks[i].order
  }
  return max + 1
}

export const isUiScale = (value: unknown): value is UiScale =>
  typeof value === "number" && UI_SCALE_SET.has(value)

export const findIndexById = <T extends { id: string }>(
  items: readonly T[],
  id: string
): number => items.findIndex((item) => item.id === id)

export const replaceByIdIfChanged = <T extends { id: string }>(
  items: readonly T[],
  id: string,
  update: (item: T) => T
): T[] => {
  const index = findIndexById(items, id)
  if (index === -1) return items as T[]

  const current = items[index]
  const nextItem = update(current)
  if (nextItem === current) return items as T[]

  const next = items.slice()
  next[index] = nextItem
  return next
}

export const removeById = <T extends { id: string }>(
  items: readonly T[],
  id: string
): T[] => {
  const index = findIndexById(items, id)
  if (index === -1) return items as T[]

  const next = items.slice()
  next.splice(index, 1)
  return next
}

export const appendIfValid = <T>(items: readonly T[], item?: T | null): T[] =>
  item == null ? (items as T[]) : [...items, item]

export const getTimeRangeError = (
  startAt: string,
  endAt: string
): string | null => {
  const startMs = Date.parse(startAt)
  const endMs = Date.parse(endAt)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs))
    return "Invalid start/end time"
  if (endMs <= startMs) return "End must be after start"
  return null
}

export const getCreatePanelDefaults = (
  selectedView: ViewName,
  selectedProjectId?: string
): TaskCreateDefaults => {
  if (selectedView === "project" && selectedProjectId) {
    return { projectId: selectedProjectId, status: "todo" }
  }
  if (selectedView === "today") {
    return { dueDate: new Date().toISOString().slice(0, 10) }
  }
  return {}
}
