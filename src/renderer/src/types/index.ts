export type Priority = 'p1' | 'p2' | 'p3' | 'p4'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']
export type TaskSort = 'priority' | 'due_date' | 'created_at'
export type ViewName = 'inbox' | 'today' | 'project' | 'activity' | 'sessions' | 'settings' | 'health'
export type ProjectTab = 'list' | 'kanban'
export const UI_SCALE_OPTIONS = [100, 110, 125, 150, 175] as const
export type UiScale = (typeof UI_SCALE_OPTIONS)[number]
export type SyncMode = 'local' | 'postgres'

export interface SyncSettings {
  mode: SyncMode
  postgresUrl: string
}

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  mode: 'local',
  postgresUrl: ''
}

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

export interface MedicationLog {
  id: string
  medId: string
  medName: string
  dose: number
  takenAt: string
  createdAt: string
}

export interface MedPkSettings {
  /** Effect-site equilibration rate [1/h]. Higher = faster onset AND faster offset. Default 1.0 */
  ke0: number
  /** Multiplies the drug's base duration. <1 shorter, >1 longer. Default 1.0 */
  durationScale: number
  /** Scales peak effect height (EC50 inverse). Higher = more sensitive. Default 1.0 */
  sensitivity: number
}

export const DEFAULT_MED_PK_SETTINGS: MedPkSettings = {
  ke0: 1.0,
  durationScale: 1.0,
  sensitivity: 1.0
}

export interface PkSettings {
  perMed: Record<string, MedPkSettings>
}

export const DEFAULT_PK_SETTINGS: PkSettings = {
  perMed: {}
}

export interface AppState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  sessions: TaskSession[]
  timeBlocks: TimeBlock[]
  medications: MedicationLog[]
  pkSettings?: PkSettings
  uiScale?: UiScale
  isSidebarCollapsed?: boolean
  appearance?: AppearanceSettings
  sync?: SyncSettings
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

export type ThemeId =
  | 'default'
  | 'light'
  | 'retro'
  | 'cyberpunk'
  | 'nord'
  | 'dracula'
  | 'gruvbox'
  | 'solarized'
  | 'rose-pine'
  | 'nero'
  | 'everforest'

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
      '--app-content': '#fcfcfc',
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
      '--app-bg': '#e8e0d0',
      '--app-sidebar': '#ddd4c0',
      '--app-titlebar': '#c8bcaa',
      '--app-content': '#e8e0d0',
      '--app-card': '#e0d8c8',
      '--app-text': '#2e2518',
      '--app-text-secondary': '#5a4d3c',
      '--app-text-muted': '#7a6e5e',
      '--app-border': 'rgba(46,37,24,0.18)',
      '--app-hover': 'rgba(46,37,24,0.07)',
      '--app-active': 'rgba(46,37,24,0.13)',
      '--app-accent': '#5c4a2f',
      '--app-accent-text': '#f5f0e8',
      '--app-scrollbar': '#b8ac9a',
      '--app-scrollbar-hover': '#9e9080'
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
  },
  {
    id: 'dracula',
    name: 'Dracula',
    tokens: {
      '--app-bg': '#282a36',
      '--app-sidebar': '#21222c',
      '--app-titlebar': '#191a21',
      '--app-content': '#282a36',
      '--app-card': '#44475a',
      '--app-text': '#f8f8f2',
      '--app-text-secondary': '#bd93f9',
      '--app-text-muted': '#6272a4',
      '--app-border': 'rgba(98,114,164,0.25)',
      '--app-hover': 'rgba(98,114,164,0.08)',
      '--app-active': 'rgba(98,114,164,0.16)',
      '--app-accent': '#bd93f9',
      '--app-accent-text': '#282a36',
      '--app-scrollbar': '#44475a',
      '--app-scrollbar-hover': '#6272a4'
    }
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    tokens: {
      '--app-bg': '#282828',
      '--app-sidebar': '#1d2021',
      '--app-titlebar': '#181818',
      '--app-content': '#282828',
      '--app-card': '#3c3836',
      '--app-text': '#ebdbb2',
      '--app-text-secondary': '#d5c4a1',
      '--app-text-muted': '#928374',
      '--app-border': 'rgba(235,219,178,0.10)',
      '--app-hover': 'rgba(235,219,178,0.04)',
      '--app-active': 'rgba(235,219,178,0.08)',
      '--app-accent': '#d65d0e',
      '--app-accent-text': '#fbf1c7',
      '--app-scrollbar': '#504945',
      '--app-scrollbar-hover': '#665c54'
    }
  },
  {
    id: 'solarized',
    name: 'Solarized',
    tokens: {
      '--app-bg': '#002b36',
      '--app-sidebar': '#00212b',
      '--app-titlebar': '#001a22',
      '--app-content': '#002b36',
      '--app-card': '#073642',
      '--app-text': '#839496',
      '--app-text-secondary': '#657b83',
      '--app-text-muted': '#586e75',
      '--app-border': 'rgba(131,148,150,0.15)',
      '--app-hover': 'rgba(131,148,150,0.05)',
      '--app-active': 'rgba(131,148,150,0.10)',
      '--app-accent': '#268bd2',
      '--app-accent-text': '#002b36',
      '--app-scrollbar': '#073642',
      '--app-scrollbar-hover': '#094555'
    }
  },
  {
    id: 'rose-pine',
    name: 'Rose Pine',
    tokens: {
      '--app-bg': '#191724',
      '--app-sidebar': '#13111e',
      '--app-titlebar': '#0f0d17',
      '--app-content': '#191724',
      '--app-card': '#1f1d2e',
      '--app-text': '#e0def4',
      '--app-text-secondary': '#c4c0d9',
      '--app-text-muted': '#6e6a86',
      '--app-border': 'rgba(110,106,134,0.20)',
      '--app-hover': 'rgba(110,106,134,0.07)',
      '--app-active': 'rgba(110,106,134,0.14)',
      '--app-accent': '#ebbcba',
      '--app-accent-text': '#191724',
      '--app-scrollbar': '#2a2837',
      '--app-scrollbar-hover': '#3a3750'
    }
  },
  {
    id: 'nero',
    name: 'Nero',
    tokens: {
      '--app-bg': '#010101',
      '--app-sidebar': '#080808',
      '--app-titlebar': '#050505',
      '--app-content': '#020202',
      '--app-card': '#121212',
      '--app-text': '#eeeeee',
      '--app-text-secondary': '#aaaaaa',
      '--app-text-muted': '#666666',
      '--app-border': 'rgba(255,255,255,0.07)',
      '--app-hover': 'rgba(255,255,255,0.03)',
      '--app-active': 'rgba(255,255,255,0.06)',
      '--app-accent': '#9e9e9e',
      '--app-accent-text': '#000000',
      '--app-scrollbar': '#222222',
      '--app-scrollbar-hover': '#333333'
    }
  },
  {
    id: 'everforest',
    name: 'Everforest',
    tokens: {
      '--app-bg': '#2b3339',
      '--app-sidebar': '#232b30',
      '--app-titlebar': '#1e2529',
      '--app-content': '#2b3339',
      '--app-card': '#323d43',
      '--app-text': '#d3c6aa',
      '--app-text-secondary': '#b9a98a',
      '--app-text-muted': '#7a8478',
      '--app-border': 'rgba(167,192,128,0.14)',
      '--app-hover': 'rgba(167,192,128,0.05)',
      '--app-active': 'rgba(167,192,128,0.10)',
      '--app-accent': '#a7c080',
      '--app-accent-text': '#2b3339',
      '--app-scrollbar': '#404d52',
      '--app-scrollbar-hover': '#516066'
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
  const customTokens: Partial<ThemeTokens> = {}
  if (obj.customTokens && typeof obj.customTokens === 'object') {
    const raw = obj.customTokens as Record<string, unknown>
    for (const key of THEME_TOKEN_KEYS) {
      const v = raw[key]
      if (typeof v === 'string') customTokens[key] = v
    }
  }
  const backgroundId = typeof obj.backgroundId === 'string' ? obj.backgroundId : 'none'
  return { themeId, customTokens, backgroundId }
}

export function getResolvedTokens(settings: AppearanceSettings): ThemeTokens {
  const preset = THEME_PRESETS.find((p) => p.id === settings.themeId) ?? THEME_PRESETS[0]
  return { ...preset.tokens, ...(settings.customTokens ?? {}) }
}

export function normalizeSyncSettings(raw: unknown): SyncSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SYNC_SETTINGS
  const obj = raw as Record<string, unknown>
  const mode: SyncMode = obj.mode === 'postgres' ? 'postgres' : 'local'
  const postgresUrl = typeof obj.postgresUrl === 'string' ? obj.postgresUrl : ''
  return { mode, postgresUrl }
}

export interface TaskGroup {
  id: string
  title: string
  accentClass?: string
  tasks: Task[]
}
