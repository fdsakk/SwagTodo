export type Priority = 'p1' | 'p2' | 'p3' | 'p4'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']
export type TaskSort = 'priority' | 'due_date' | 'created_at'
export type ViewName = 'inbox' | 'today' | 'project' | 'activity' | 'sessions' | 'settings'
export type ProjectTab = 'list' | 'kanban'
export const UI_SCALE_OPTIONS = [100, 110, 125, 150, 175] as const
export type UiScale = (typeof UI_SCALE_OPTIONS)[number]

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: string
  projectId?: string
  labels: string[]
  completed: boolean
  status: TaskStatus
  createdAt: string
  updatedAt: string
  order: number
  subTasks: SubTask[]
}

export interface Project {
  id: string
  name: string
  color: string
  emoji?: string
  description?: string
  createdAt: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface TaskSession {
  id: string
  taskId: string
  projectId: string
  startAt: string
  endAt: string
  createdAt: string
  updatedAt: string
}

export interface TaskSessionStats {
  count: number
  totalMs: number
  lastEndAt?: string
}

export interface TimeBlock {
  id: string
  label: string
  startAt: string
  endAt: string
  createdAt: string
}

export interface AppState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  sessions: TaskSession[]
  timeBlocks: TimeBlock[]
  uiScale?: UiScale
  isSidebarCollapsed?: boolean
  appearance?: AppearanceSettings
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  projectId?: string
  labels?: string[]
  status?: TaskStatus
}

export interface ThemeTokens {
  '--app-bg': string
  '--app-sidebar': string
  '--app-titlebar': string
  '--app-content': string
  '--app-card': string
  '--app-text': string
  '--app-text-secondary': string
  '--app-text-muted': string
  '--app-border': string
  '--app-hover': string
  '--app-active': string
  '--app-accent': string
  '--app-accent-text': string
  '--app-scrollbar': string
  '--app-scrollbar-hover': string
}

export const THEME_TOKEN_KEYS: (keyof ThemeTokens)[] = [
  '--app-bg',
  '--app-sidebar',
  '--app-titlebar',
  '--app-content',
  '--app-card',
  '--app-text',
  '--app-text-secondary',
  '--app-text-muted',
  '--app-border',
  '--app-hover',
  '--app-active',
  '--app-accent',
  '--app-accent-text',
  '--app-scrollbar',
  '--app-scrollbar-hover'
]

export type ThemeId = 'default' | 'light' | 'retro' | 'cyberpunk' | 'nord'

export interface ThemePreset {
  id: ThemeId
  name: string
  tokens: ThemeTokens
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    tokens: {
      '--app-bg': '#0d0d0d',
      '--app-sidebar': '#080808',
      '--app-titlebar': '#040404',
      '--app-content': '#0d0d0d',
      '--app-card': '#111111',
      '--app-text': '#e4e4e7',
      '--app-text-secondary': '#a1a1aa',
      '--app-text-muted': '#71717a',
      '--app-border': 'rgba(255,255,255,0.06)',
      '--app-hover': 'rgba(255,255,255,0.03)',
      '--app-active': 'rgba(255,255,255,0.06)',
      '--app-accent': '#e4e4e7',
      '--app-accent-text': '#18181b',
      '--app-scrollbar': '#262626',
      '--app-scrollbar-hover': '#383838'
    }
  },
  {
    id: 'light',
    name: 'Light',
    tokens: {
      '--app-bg': '#ffffff',
      '--app-sidebar': '#f4f4f5',
      '--app-titlebar': '#e4e4e7',
      '--app-content': '#ffffff',
      '--app-card': '#f9f9fa',
      '--app-text': '#18181b',
      '--app-text-secondary': '#52525b',
      '--app-text-muted': '#a1a1aa',
      '--app-border': 'rgba(0,0,0,0.08)',
      '--app-hover': 'rgba(0,0,0,0.04)',
      '--app-active': 'rgba(0,0,0,0.08)',
      '--app-accent': '#18181b',
      '--app-accent-text': '#ffffff',
      '--app-scrollbar': '#d4d4d8',
      '--app-scrollbar-hover': '#a1a1aa'
    }
  },
  {
    id: 'retro',
    name: 'Retro',
    tokens: {
      '--app-bg': '#f5f0e8',
      '--app-sidebar': '#ece5d8',
      '--app-titlebar': '#d5cbba',
      '--app-content': '#f5f0e8',
      '--app-card': '#efe9de',
      '--app-text': '#3d3529',
      '--app-text-secondary': '#6b5f4f',
      '--app-text-muted': '#9c8e7a',
      '--app-border': 'rgba(61,53,41,0.12)',
      '--app-hover': 'rgba(61,53,41,0.05)',
      '--app-active': 'rgba(61,53,41,0.10)',
      '--app-accent': '#5c4a2f',
      '--app-accent-text': '#f5f0e8',
      '--app-scrollbar': '#c9bfae',
      '--app-scrollbar-hover': '#b0a48f'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    tokens: {
      '--app-bg': '#0a0a12',
      '--app-sidebar': '#08080f',
      '--app-titlebar': '#06060c',
      '--app-content': '#0a0a12',
      '--app-card': '#0f0f1a',
      '--app-text': '#e0d4f7',
      '--app-text-secondary': '#9a8bc2',
      '--app-text-muted': '#5c4f7a',
      '--app-border': 'rgba(157,78,221,0.15)',
      '--app-hover': 'rgba(157,78,221,0.06)',
      '--app-active': 'rgba(157,78,221,0.12)',
      '--app-accent': '#c026d3',
      '--app-accent-text': '#fdf4ff',
      '--app-scrollbar': '#1a1a2e',
      '--app-scrollbar-hover': '#2d1f4e'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    tokens: {
      '--app-bg': '#2e3440',
      '--app-sidebar': '#292e39',
      '--app-titlebar': '#242933',
      '--app-content': '#2e3440',
      '--app-card': '#3b4252',
      '--app-text': '#eceff4',
      '--app-text-secondary': '#d8dee9',
      '--app-text-muted': '#7b88a1',
      '--app-border': 'rgba(216,222,233,0.08)',
      '--app-hover': 'rgba(216,222,233,0.04)',
      '--app-active': 'rgba(216,222,233,0.08)',
      '--app-accent': '#88c0d0',
      '--app-accent-text': '#2e3440',
      '--app-scrollbar': '#434c5e',
      '--app-scrollbar-hover': '#4c566a'
    }
  }
]

export interface AppearanceSettings {
  themeId: ThemeId
  customTokens: Partial<ThemeTokens>
  backgroundId: string
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  themeId: 'default',
  customTokens: {},
  backgroundId: 'none'
}

export function normalizeAppearance(raw: unknown): AppearanceSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_APPEARANCE
  const obj = raw as Record<string, unknown>
  const themeId =
    typeof obj.themeId === 'string' && THEME_PRESETS.some((p) => p.id === obj.themeId)
      ? (obj.themeId as ThemeId)
      : 'default'
  const customTokens =
    obj.customTokens && typeof obj.customTokens === 'object'
      ? (obj.customTokens as Partial<ThemeTokens>)
      : {}
  const backgroundId = typeof obj.backgroundId === 'string' ? obj.backgroundId : 'none'
  return { themeId, customTokens, backgroundId }
}

export function getResolvedTokens(settings: AppearanceSettings): ThemeTokens {
  const preset = THEME_PRESETS.find((p) => p.id === settings.themeId) ?? THEME_PRESETS[0]
  return { ...preset.tokens, ...(settings.customTokens ?? {}) }
}

export interface TaskGroup {
  id: string
  title: string
  accentClass?: string
  tasks: Task[]
}
