import { z } from "zod"
import { DEFAULT_UI_SCALE, UI_SCALE_OPTIONS } from "../../shared/defaults"
import {
  labelSchema,
  medicationSchema,
  projectSchema,
  sessionSchema,
  sharedAppearanceSchema,
  taskSchema,
  timeBlockSchema
} from "../../shared/stateSchema"
import type {
  AppearanceSettings,
  AppState,
  Task,
  UiScale
} from "../../shared/types"

const UI_SCALE_SET: ReadonlySet<number> = new Set(UI_SCALE_OPTIONS)

export const defaultAppState: AppState = {
  tasks: [],
  projects: [],
  labels: [],
  sessions: [],
  timeBlocks: [],
  medications: [],
  uiScale: DEFAULT_UI_SCALE,
  isSidebarCollapsed: false
}

export const APP_STATE_KEYS: ReadonlySet<string> = new Set([
  "tasks",
  "projects",
  "labels",
  "sessions",
  "timeBlocks",
  "medications",
  "pkSettings",
  "uiScale",
  "isSidebarCollapsed",
  "appearance"
])

export const isUiScale = (v: unknown): v is UiScale =>
  typeof v === "number" && UI_SCALE_SET.has(v)

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isSafeId = (v: unknown): v is string =>
  typeof v === "string" && UUID_RE.test(v)

const isEntityWithSafeId = (item: unknown): boolean =>
  !!item && typeof item === "object" && isSafeId((item as { id?: unknown }).id)

const isValidEntityArray = (v: unknown): v is unknown[] =>
  Array.isArray(v) && v.every(isEntityWithSafeId)

const appStateSchema = z
  .object({
    tasks: z.array(taskSchema).catch([]),
    projects: z.array(projectSchema).catch([]),
    labels: z.array(labelSchema).catch([]),
    sessions: z.array(sessionSchema).catch([]),
    timeBlocks: z.array(timeBlockSchema).catch([]),
    medications: z.array(medicationSchema).catch([]),
    pkSettings: z.unknown().optional(),
    uiScale: z.number().refine(isUiScale).optional().catch(DEFAULT_UI_SCALE),
    isSidebarCollapsed: z.boolean().optional().catch(false),
    appearance: sharedAppearanceSchema.optional().catch(undefined)
  })
  .passthrough()

export const normalizeAppearance = (
  raw: unknown
): AppearanceSettings | undefined => {
  const parsed = sharedAppearanceSchema.safeParse(raw)
  return parsed.success ? parsed.data : undefined
}

const normalizeTask = (task: Task): Task => {
  const completed = task.status === "done" || task.completed
  return {
    ...task,
    completed,
    status: completed
      ? "done"
      : task.status === "in_progress"
        ? "in_progress"
        : "todo",
    completedAt: completed ? (task.completedAt ?? task.updatedAt) : undefined,
    archivedAt: task.archivedAt
  }
}

export const normalizeAppState = (state: unknown): AppState => {
  const data = appStateSchema.parse(state ?? {})
  const next: AppState = {
    tasks: data.tasks.map(normalizeTask),
    projects: data.projects,
    labels: data.labels,
    sessions: data.sessions,
    timeBlocks: data.timeBlocks,
    medications: data.medications,
    uiScale: data.uiScale ?? DEFAULT_UI_SCALE,
    isSidebarCollapsed: data.isSidebarCollapsed ?? false
  }

  if ("pkSettings" in data) next.pkSettings = data.pkSettings
  if (data.appearance) next.appearance = data.appearance

  return next
}

export const isAppState = (v: unknown): v is AppState => {
  if (!v || typeof v !== "object") return false
  const d = v as Partial<AppState>
  if (
    !isValidEntityArray(d.tasks) ||
    !isValidEntityArray(d.projects) ||
    !isValidEntityArray(d.labels) ||
    !isValidEntityArray(d.sessions) ||
    !isValidEntityArray(d.timeBlocks)
  ) {
    return false
  }
  if (d.medications !== undefined && !isValidEntityArray(d.medications))
    return false
  if (d.uiScale !== undefined && !isUiScale(d.uiScale)) return false
  if (
    d.isSidebarCollapsed !== undefined &&
    typeof d.isSidebarCollapsed !== "boolean"
  )
    return false
  if (d.appearance !== undefined && !normalizeAppearance(d.appearance))
    return false
  return true
}

export const isAppStatePatch = (v: unknown): v is Partial<AppState> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false
  const patch = v as Record<string, unknown>
  for (const key of Object.keys(patch)) {
    if (!APP_STATE_KEYS.has(key)) return false
  }
  const arrayKeys = [
    "tasks",
    "projects",
    "labels",
    "sessions",
    "timeBlocks"
  ] as const
  for (const key of arrayKeys) {
    if (key in patch && !isValidEntityArray(patch[key])) return false
  }
  if (
    "medications" in patch &&
    patch.medications !== undefined &&
    !isValidEntityArray(patch.medications)
  ) {
    return false
  }
  if (
    "uiScale" in patch &&
    patch.uiScale !== undefined &&
    !isUiScale(patch.uiScale)
  )
    return false
  if (
    "isSidebarCollapsed" in patch &&
    patch.isSidebarCollapsed !== undefined &&
    typeof patch.isSidebarCollapsed !== "boolean"
  ) {
    return false
  }
  if (patch.appearance !== undefined && !normalizeAppearance(patch.appearance))
    return false
  return true
}

export const mergeAppState = (
  current: AppState,
  patch: Partial<AppState>
): AppState => {
  const next: AppState = { ...current, ...patch }
  return patch.tasks !== undefined ? normalizeAppState(next) : next
}
