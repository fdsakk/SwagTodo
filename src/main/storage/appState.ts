import { DEFAULT_UI_SCALE, UI_SCALE_OPTIONS } from '../../shared/defaults'
import { type AppState, type AppearanceSettings, type Task, type UiScale } from '../../shared/types'

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
  'tasks',
  'projects',
  'labels',
  'sessions',
  'timeBlocks',
  'medications',
  'pkSettings',
  'uiScale',
  'isSidebarCollapsed',
  'appearance'
])

export const isUiScale = (v: unknown): v is UiScale => typeof v === 'number' && UI_SCALE_SET.has(v)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isSafeId = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v)

const isEntityWithSafeId = (item: unknown): boolean =>
  !!item && typeof item === 'object' && isSafeId((item as { id?: unknown }).id)

const isValidEntityArray = (v: unknown): v is unknown[] =>
  Array.isArray(v) && v.every(isEntityWithSafeId)

const isStringRecord = (v: unknown): v is Record<string, string> =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.values(v as object).every((x) => typeof x === 'string')

export const normalizeAppearance = (raw: unknown): AppearanceSettings | undefined => {
  if (!raw || typeof raw !== 'object') return undefined
  const appearance = raw as Partial<AppearanceSettings>
  if (typeof appearance.themeId !== 'string') return undefined
  if (appearance.customTokens !== undefined && !isStringRecord(appearance.customTokens)) {
    return undefined
  }
  return {
    themeId: appearance.themeId,
    customTokens: appearance.customTokens ?? {}
  }
}

const normalizeTask = (task: Task): Task => {
  const completed = task.status === 'done' || task.completed
  return {
    ...task,
    completed,
    status: completed ? 'done' : task.status === 'in_progress' ? 'in_progress' : 'todo',
    completedAt: completed ? (task.completedAt ?? task.updatedAt) : undefined
  }
}

export const normalizeAppState = (state: unknown): AppState => {
  const data = state && typeof state === 'object' ? (state as Partial<AppState>) : {}
  const next: AppState = {
    tasks: Array.isArray(data.tasks) ? data.tasks.map((task) => normalizeTask(task)) : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    labels: Array.isArray(data.labels) ? data.labels : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    timeBlocks: Array.isArray(data.timeBlocks) ? data.timeBlocks : [],
    medications: Array.isArray(data.medications) ? data.medications : [],
    uiScale: isUiScale(data.uiScale) ? data.uiScale : DEFAULT_UI_SCALE,
    isSidebarCollapsed:
      typeof data.isSidebarCollapsed === 'boolean' ? data.isSidebarCollapsed : false
  }

  if ('pkSettings' in data) next.pkSettings = data.pkSettings

  const appearance = normalizeAppearance(data.appearance)
  if (appearance) next.appearance = appearance

  return next
}

export const isAppState = (v: unknown): v is AppState => {
  if (!v || typeof v !== 'object') return false
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
  if (d.medications !== undefined && !isValidEntityArray(d.medications)) return false
  if (d.uiScale !== undefined && !isUiScale(d.uiScale)) return false
  if (d.isSidebarCollapsed !== undefined && typeof d.isSidebarCollapsed !== 'boolean') return false
  if (d.appearance !== undefined && !normalizeAppearance(d.appearance)) return false
  return true
}

export const isAppStatePatch = (v: unknown): v is Partial<AppState> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const patch = v as Record<string, unknown>
  for (const key of Object.keys(patch)) {
    if (!APP_STATE_KEYS.has(key)) return false
  }
  const arrayKeys = ['tasks', 'projects', 'labels', 'sessions', 'timeBlocks'] as const
  for (const key of arrayKeys) {
    if (key in patch && !isValidEntityArray(patch[key])) return false
  }
  if ('medications' in patch && patch.medications !== undefined && !isValidEntityArray(patch.medications)) {
    return false
  }
  if ('uiScale' in patch && patch.uiScale !== undefined && !isUiScale(patch.uiScale)) return false
  if (
    'isSidebarCollapsed' in patch &&
    patch.isSidebarCollapsed !== undefined &&
    typeof patch.isSidebarCollapsed !== 'boolean'
  ) {
    return false
  }
  if (patch.appearance !== undefined && !normalizeAppearance(patch.appearance)) return false
  return true
}

export const mergeAppState = (current: AppState, patch: Partial<AppState>): AppState => {
  const next: AppState = { ...current, ...patch }
  return patch.tasks !== undefined ? normalizeAppState(next) : next
}
