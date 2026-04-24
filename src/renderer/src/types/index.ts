import {
  type AppState as SharedAppState,
  type Label,
  type MedicationLog,
  type Priority,
  type Project,
  type SubTask,
  type Task,
  type TaskSession,
  type TaskStatus,
  type TimeBlock,
  type UiScale,
  type WindowState
} from '../../../shared/types'
import { UI_SCALE_OPTIONS } from '../../../shared/defaults'

export { UI_SCALE_OPTIONS }
export type {
  Label,
  MedicationLog,
  Priority,
  Project,
  SubTask,
  Task,
  TaskSession,
  TaskStatus,
  TimeBlock,
  UiScale,
  WindowState
}

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']
export type TaskSort = 'priority' | 'due_date' | 'created_at'
export type InboxStatusFilter = 'all' | 'active' | 'done'
export type InboxProjectFilter = 'all' | 'no_project' | string
export type InboxPriorityFilter = 'all' | Priority
export type ViewName =
  | 'inbox'
  | 'today'
  | 'project'
  | 'activity'
  | 'sessions'
  | 'settings'
  | 'health'
export type ProjectTab = 'list' | 'kanban'

export interface TaskSessionStats {
  count: number
  totalMs: number
  lastEndAt?: string
}

export interface PkSettings {
  /** Vertical scale — subjective sensitivity. 1.0 = one dose peaks at 1.0 on Y. Default 1.0. */
  peakScale: number
  /** Tmax offset in hours — shifts absorption peak (metabolism/gastric speed). Default 0. */
  tMaxOffsetH: number
  /** Elimination rate multiplier — 1.0 = average liver/kidney function. Default 1.0. */
  keMultiplier: number
  /** MEC: Minimal Effective Concentration (0..1). Default 0.3. */
  mec: number
  /** MTC: Maximum Tolerated Concentration (0..1). Default 0.85. */
  mtc: number
  /** Crash detection: dC/dt threshold (negative, per 5-min step). Default -0.04. */
  crashThreshold: number
}

export const DEFAULT_PK_SETTINGS: PkSettings = {
  peakScale: 1.0,
  tMaxOffsetH: 0,
  keMultiplier: 1.0,
  mec: 0.3,
  mtc: 0.85,
  crashThreshold: -0.04
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
  | 'nero'
  | 'concrete-dark'
  | 'dracula'
  | 'rose-pine'
  | 'tokyo-night'
  | 'kanagawa'
  | 'nord'
  | 'everforest'
  | 'gruvbox'
  | 'solarized'
  | 'cyberpunk'
  | 'slate'
  | 'light'
  | 'retro'
  | 'retro-dark'

export type ThemeTone = 'dark' | 'light'

export interface ThemePreset {
  id: ThemeId
  name: string
  tone: ThemeTone
  tokens: ThemeTokens
}

export const THEME_PRESETS: ThemePreset[] = [
  // ── dark neutral ────────────────────────────────────────────────────────────
  {
    id: 'default',
    name: 'Default',
    tone: 'dark',
    tokens: {
      '--app-bg': '#101011',
      '--app-sidebar': '#0b0b0c',
      '--app-titlebar': '#070708',
      '--app-content': '#101011',
      '--app-card': '#161617',
      '--app-text': '#e6e6e8',
      '--app-text-secondary': '#b4b4bc',
      '--app-text-muted': '#7c7c85',
      '--app-border': 'rgba(255,255,255,0.07)',
      '--app-hover': 'rgba(255,255,255,0.035)',
      '--app-active': 'rgba(255,255,255,0.07)',
      '--app-accent': '#e1e1e5',
      '--app-accent-text': '#1b1b1f',
      '--app-scrollbar': '#2b2b31',
      '--app-scrollbar-hover': '#3a3a42'
    }
  },
  {
    id: 'nero',
    name: 'Black',
    tone: 'dark',
    tokens: {
      '--app-bg': '#020202',
      '--app-sidebar': '#090909',
      '--app-titlebar': '#060606',
      '--app-content': '#030303',
      '--app-card': '#131313',
      '--app-text': '#eeeeee',
      '--app-text-secondary': '#b0b0b0',
      '--app-text-muted': '#707070',
      '--app-border': 'rgba(255,255,255,0.08)',
      '--app-hover': 'rgba(255,255,255,0.035)',
      '--app-active': 'rgba(255,255,255,0.07)',
      '--app-accent': '#a8a8a8',
      '--app-accent-text': '#050505',
      '--app-scrollbar': '#242424',
      '--app-scrollbar-hover': '#363636'
    }
  },
  {
    id: 'concrete-dark',
    name: 'Concrete Dark',
    tone: 'dark',
    tokens: {
      '--app-bg': '#2d2a28',
      '--app-sidebar': '#24211f',
      '--app-titlebar': '#1c1918',
      '--app-content': '#2d2a28',
      '--app-card': '#353231',
      '--app-text': '#e0dbd5',
      '--app-text-secondary': '#c7beb6',
      '--app-text-muted': '#8f8880',
      '--app-border': 'rgba(224,219,213,0.14)',
      '--app-hover': 'rgba(224,219,213,0.055)',
      '--app-active': 'rgba(224,219,213,0.11)',
      '--app-accent': '#cdc4bc',
      '--app-accent-text': '#2d2a28',
      '--app-scrollbar': '#4b4642',
      '--app-scrollbar-hover': '#615c58'
    }
  },
  // ── dark coloured ────────────────────────────────────────────────────────────
  {
    id: 'dracula',
    name: 'Dracula',
    tone: 'dark',
    tokens: {
      '--app-bg': '#282a36',
      '--app-sidebar': '#21222c',
      '--app-titlebar': '#191a21',
      '--app-content': '#282a36',
      '--app-card': '#44475a',
      '--app-text': '#f8f8f2',
      '--app-text-secondary': '#bd93f9',
      '--app-text-muted': '#7383b5',
      '--app-border': 'rgba(98,114,164,0.30)',
      '--app-hover': 'rgba(98,114,164,0.08)',
      '--app-active': 'rgba(98,114,164,0.16)',
      '--app-accent': '#bd93f9',
      '--app-accent-text': '#282a36',
      '--app-scrollbar': '#44475a',
      '--app-scrollbar-hover': '#6272a4'
    }
  },
  {
    id: 'rose-pine',
    name: 'Rose Pine',
    tone: 'dark',
    tokens: {
      '--app-bg': '#191724',
      '--app-sidebar': '#13111e',
      '--app-titlebar': '#0f0d17',
      '--app-content': '#191724',
      '--app-card': '#1f1d2e',
      '--app-text': '#e0def4',
      '--app-text-secondary': '#c4c0d9',
      '--app-text-muted': '#837ea0',
      '--app-border': 'rgba(110,106,134,0.25)',
      '--app-hover': 'rgba(110,106,134,0.07)',
      '--app-active': 'rgba(110,106,134,0.14)',
      '--app-accent': '#ebbcba',
      '--app-accent-text': '#191724',
      '--app-scrollbar': '#2a2837',
      '--app-scrollbar-hover': '#3a3750'
    }
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    tone: 'dark',
    tokens: {
      '--app-bg': '#1a1b26',
      '--app-sidebar': '#16161e',
      '--app-titlebar': '#13131a',
      '--app-content': '#1a1b26',
      '--app-card': '#24283b',
      '--app-text': '#c0caf5',
      '--app-text-secondary': '#a9b1d6',
      '--app-text-muted': '#6870a0',
      '--app-border': 'rgba(122,162,247,0.16)',
      '--app-hover': 'rgba(122,162,247,0.05)',
      '--app-active': 'rgba(122,162,247,0.10)',
      '--app-accent': '#7aa2f7',
      '--app-accent-text': '#1a1b26',
      '--app-scrollbar': '#292e42',
      '--app-scrollbar-hover': '#3b4261'
    }
  },
  {
    id: 'kanagawa',
    name: 'Kanagawa',
    tone: 'dark',
    tokens: {
      '--app-bg': '#1f1f28',
      '--app-sidebar': '#16161d',
      '--app-titlebar': '#12121a',
      '--app-content': '#1f1f28',
      '--app-card': '#2a2a37',
      '--app-text': '#dcd7ba',
      '--app-text-secondary': '#c8c093',
      '--app-text-muted': '#8a8880',
      '--app-border': 'rgba(220,215,186,0.14)',
      '--app-hover': 'rgba(220,215,186,0.04)',
      '--app-active': 'rgba(220,215,186,0.08)',
      '--app-accent': '#e46876',
      '--app-accent-text': '#1f1f28',
      '--app-scrollbar': '#363646',
      '--app-scrollbar-hover': '#54546d'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    tone: 'dark',
    tokens: {
      '--app-bg': '#2e3440',
      '--app-sidebar': '#292e39',
      '--app-titlebar': '#242933',
      '--app-content': '#2e3440',
      '--app-card': '#3b4252',
      '--app-text': '#eceff4',
      '--app-text-secondary': '#d8dee9',
      '--app-text-muted': '#8f9db8',
      '--app-border': 'rgba(216,222,233,0.11)',
      '--app-hover': 'rgba(216,222,233,0.04)',
      '--app-active': 'rgba(216,222,233,0.08)',
      '--app-accent': '#88c0d0',
      '--app-accent-text': '#2e3440',
      '--app-scrollbar': '#434c5e',
      '--app-scrollbar-hover': '#4c566a'
    }
  },
  {
    id: 'everforest',
    name: 'Everforest',
    tone: 'dark',
    tokens: {
      '--app-bg': '#2b3339',
      '--app-sidebar': '#232b30',
      '--app-titlebar': '#1e2529',
      '--app-content': '#2b3339',
      '--app-card': '#323d43',
      '--app-text': '#d3c6aa',
      '--app-text-secondary': '#b9a98a',
      '--app-text-muted': '#8e9a8c',
      '--app-border': 'rgba(167,192,128,0.18)',
      '--app-hover': 'rgba(167,192,128,0.05)',
      '--app-active': 'rgba(167,192,128,0.10)',
      '--app-accent': '#a7c080',
      '--app-accent-text': '#2b3339',
      '--app-scrollbar': '#404d52',
      '--app-scrollbar-hover': '#516066'
    }
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    tone: 'dark',
    tokens: {
      '--app-bg': '#282828',
      '--app-sidebar': '#1d2021',
      '--app-titlebar': '#181818',
      '--app-content': '#282828',
      '--app-card': '#3c3836',
      '--app-text': '#ebdbb2',
      '--app-text-secondary': '#d5c4a1',
      '--app-text-muted': '#a89880',
      '--app-border': 'rgba(235,219,178,0.14)',
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
    tone: 'dark',
    tokens: {
      '--app-bg': '#002b36',
      '--app-sidebar': '#00212b',
      '--app-titlebar': '#001a22',
      '--app-content': '#002b36',
      '--app-card': '#073642',
      '--app-text': '#fdf6e3',
      '--app-text-secondary': '#eee8d5',
      '--app-text-muted': '#a8b8b8',
      '--app-border': 'rgba(131,148,150,0.22)',
      '--app-hover': 'rgba(131,148,150,0.06)',
      '--app-active': 'rgba(131,148,150,0.12)',
      '--app-accent': '#268bd2',
      '--app-accent-text': '#002b36',
      '--app-scrollbar': '#073642',
      '--app-scrollbar-hover': '#094555'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    tone: 'dark',
    tokens: {
      '--app-bg': '#0a0a12',
      '--app-sidebar': '#08080f',
      '--app-titlebar': '#06060c',
      '--app-content': '#0a0a12',
      '--app-card': '#0f0f1a',
      '--app-text': '#e8deff',
      '--app-text-secondary': '#b09fd4',
      '--app-text-muted': '#8f84b8',
      '--app-border': 'rgba(157,78,221,0.22)',
      '--app-hover': 'rgba(157,78,221,0.07)',
      '--app-active': 'rgba(157,78,221,0.14)',
      '--app-accent': '#c026d3',
      '--app-accent-text': '#fdf4ff',
      '--app-scrollbar': '#1a1a2e',
      '--app-scrollbar-hover': '#2d1f4e'
    }
  },
  // ── light ────────────────────────────────────────────────────────────────────
  {
    id: 'slate',
    name: 'Concrete',
    tone: 'light',
    tokens: {
      '--app-bg': '#a8a39b',
      '--app-sidebar': '#9f9a93',
      '--app-titlebar': '#8f887f',
      '--app-content': '#aaa59f',
      '--app-card': '#b4afa8',
      '--app-text': '#1b1917',
      '--app-text-secondary': '#2f2c29',
      '--app-text-muted': '#68625a',
      '--app-border': 'rgba(27,25,23,0.24)',
      '--app-hover': 'rgba(27,25,23,0.08)',
      '--app-active': 'rgba(27,25,23,0.14)',
      '--app-accent': '#3d3933',
      '--app-accent-text': '#f0ebe4',
      '--app-scrollbar': '#847e77',
      '--app-scrollbar-hover': '#6d6760'
    }
  },
  {
    id: 'light',
    name: 'Light',
    tone: 'light',
    tokens: {
      '--app-bg': '#f2f1ee',
      '--app-sidebar': '#e9e7e3',
      '--app-titlebar': '#dedcd8',
      '--app-content': '#f2f1ee',
      '--app-card': '#eceae6',
      '--app-text': '#1d1c1b',
      '--app-text-secondary': '#3b3937',
      '--app-text-muted': '#73706b',
      '--app-border': 'rgba(0,0,0,0.10)',
      '--app-hover': 'rgba(0,0,0,0.045)',
      '--app-active': 'rgba(0,0,0,0.08)',
      '--app-accent': '#1f1d1b',
      '--app-accent-text': '#f5f3ee',
      '--app-scrollbar': '#c9c5bf',
      '--app-scrollbar-hover': '#a9a49e'
    }
  },
  {
    id: 'retro',
    name: 'Retro',
    tone: 'light',
    tokens: {
      '--app-bg': '#e9dfcf',
      '--app-sidebar': '#d7cab3',
      '--app-titlebar': '#c8b9a6',
      '--app-content': '#ddd2bf',
      '--app-card': '#e2d8c6',
      '--app-text': '#302517',
      '--app-text-secondary': '#604f3e',
      '--app-text-muted': '#7b6f5d',
      '--app-border': 'rgba(48,37,23,0.18)',
      '--app-hover': 'rgba(48,37,23,0.07)',
      '--app-active': 'rgba(48,37,23,0.13)',
      '--app-accent': '#66513a',
      '--app-accent-text': '#f6f0e6',
      '--app-scrollbar': '#b7a794',
      '--app-scrollbar-hover': '#9f8f7e'
    }
  },
  {
    id: 'retro-dark',
    name: 'Retro Dark',
    tone: 'light',
    tokens: {
      '--app-bg': '#cbb89c',
      '--app-sidebar': '#c0ac8f',
      '--app-titlebar': '#b29b7a',
      '--app-content': '#cbb89c',
      '--app-card': '#d2c1a4',
      '--app-text': '#231508',
      '--app-text-secondary': '#3f2d1d',
      '--app-text-muted': '#675341',
      '--app-border': 'rgba(33,20,7,0.22)',
      '--app-hover': 'rgba(33,20,7,0.08)',
      '--app-active': 'rgba(33,20,7,0.15)',
      '--app-accent': '#4d371f',
      '--app-accent-text': '#f2e8d8',
      '--app-scrollbar': '#95826f',
      '--app-scrollbar-hover': '#7d695a'
    }
  }
]

export interface AppearanceSettings {
  themeId: ThemeId
  customTokens: Partial<ThemeTokens>
  customTokensByTheme: Partial<Record<ThemeId, Partial<ThemeTokens>>>
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  themeId: 'default',
  customTokens: {},
  customTokensByTheme: {}
}

export type AppState = Omit<SharedAppState, 'pkSettings' | 'appearance' | 'medications'> & {
  medications: MedicationLog[]
  pkSettings?: PkSettings
  appearance?: AppearanceSettings
}

export function normalizeAppearance(raw: unknown): AppearanceSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_APPEARANCE
  const obj = raw as Record<string, unknown>
  const themeId =
    typeof obj.themeId === 'string' && THEME_PRESETS.some((p) => p.id === obj.themeId)
      ? (obj.themeId as ThemeId)
      : 'default'
  const customTokensByTheme: Partial<Record<ThemeId, Partial<ThemeTokens>>> = {}
  if (obj.customTokensByTheme && typeof obj.customTokensByTheme === 'object') {
    const rawByTheme = obj.customTokensByTheme as Record<string, unknown>
    for (const preset of THEME_PRESETS) {
      const rawTokens = rawByTheme[preset.id]
      if (!rawTokens || typeof rawTokens !== 'object') continue
      const themeTokens: Partial<ThemeTokens> = {}
      for (const key of THEME_TOKEN_KEYS) {
        const value = (rawTokens as Record<string, unknown>)[key]
        if (typeof value === 'string') themeTokens[key] = value
      }
      if (Object.keys(themeTokens).length > 0) customTokensByTheme[preset.id] = themeTokens
    }
  }

  if (
    Object.keys(customTokensByTheme).length === 0 &&
    obj.customTokens &&
    typeof obj.customTokens === 'object'
  ) {
    const legacyTokens: Partial<ThemeTokens> = {}
    const rawTokens = obj.customTokens as Record<string, unknown>
    for (const key of THEME_TOKEN_KEYS) {
      const value = rawTokens[key]
      if (typeof value === 'string') legacyTokens[key] = value
    }
    if (Object.keys(legacyTokens).length > 0) customTokensByTheme[themeId] = legacyTokens
  }

  const customTokens = customTokensByTheme[themeId] ?? {}
  return { themeId, customTokens, customTokensByTheme }
}

export function getResolvedTokens(settings: AppearanceSettings): ThemeTokens {
  const preset = THEME_PRESETS.find((p) => p.id === settings.themeId) ?? THEME_PRESETS[0]
  return { ...preset.tokens, ...(settings.customTokens ?? {}) }
}

export function getThemeTone(settings: AppearanceSettings): ThemeTone {
  return (THEME_PRESETS.find((p) => p.id === settings.themeId) ?? THEME_PRESETS[0]).tone
}

export interface TaskGroup {
  id: string
  title: string
  accentClass?: string
  tasks: Task[]
}
