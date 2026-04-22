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

export interface ThemePreset {
  id: ThemeId
  name: string
  tokens: ThemeTokens
}

export const THEME_PRESETS: ThemePreset[] = [
  // ── dark neutral ────────────────────────────────────────────────────────────
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
    id: 'nero',
    name: 'Black',
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
    id: 'concrete-dark',
    name: 'Concrete Dark',
    tokens: {
      '--app-bg': '#2a2826',
      '--app-sidebar': '#222020',
      '--app-titlebar': '#1a1918',
      '--app-content': '#2a2826',
      '--app-card': '#333130',
      '--app-text': '#e0dbd5',
      '--app-text-secondary': '#c2bbb3',
      '--app-text-muted': '#8a837c',
      '--app-border': 'rgba(224,219,213,0.13)',
      '--app-hover': 'rgba(224,219,213,0.05)',
      '--app-active': 'rgba(224,219,213,0.10)',
      '--app-accent': '#c4bdb6',
      '--app-accent-text': '#2a2826',
      '--app-scrollbar': '#484440',
      '--app-scrollbar-hover': '#5e5a56'
    }
  },
  // ── dark coloured ────────────────────────────────────────────────────────────
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
    tokens: {
      '--app-bg': '#a4a09a',
      '--app-sidebar': '#9c9892',
      '--app-titlebar': '#837e77',
      '--app-content': '#a7a4a0',
      '--app-card': '#b0aca6',
      '--app-text': '#1a1816',
      '--app-text-secondary': '#2c2a27',
      '--app-text-muted': '#625e56',
      '--app-border': 'rgba(26,24,22,0.24)',
      '--app-hover': 'rgba(26,24,22,0.08)',
      '--app-active': 'rgba(26,24,22,0.14)',
      '--app-accent': '#38342f',
      '--app-accent-text': '#ece8e2',
      '--app-scrollbar': '#827e78',
      '--app-scrollbar-hover': '#6a6660'
    }
  },
  {
    id: 'light',
    name: 'Light',
    tokens: {
      '--app-bg': '#f0f0f0',
      '--app-sidebar': '#e8e8e8',
      '--app-titlebar': '#dcdcdc',
      '--app-content': '#f0f0f0',
      '--app-card': '#e8e8e8',
      '--app-text': '#1a1a1a',
      '--app-text-secondary': '#3a3a3a',
      '--app-text-muted': '#6e6e6e',
      '--app-border': 'rgba(0,0,0,0.12)',
      '--app-hover': 'rgba(0,0,0,0.05)',
      '--app-active': 'rgba(0,0,0,0.09)',
      '--app-accent': '#1a1a1a',
      '--app-accent-text': '#f0f0f0',
      '--app-scrollbar': '#c8c8c8',
      '--app-scrollbar-hover': '#a8a8a8'
    }
  },
  {
    id: 'retro',
    name: 'Retro',
    tokens: {
      '--app-bg': '#e8e0d0',
      '--app-sidebar': '#d5cbb3',
      '--app-titlebar': '#c8bcaa',
      '--app-content': '#ddd3c0',
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
    id: 'retro-dark',
    name: 'Retro Dark',
    tokens: {
      '--app-bg': '#c8bca0',
      '--app-sidebar': '#bcb094',
      '--app-titlebar': '#ada080',
      '--app-content': '#c8bca0',
      '--app-card': '#d0c4a8',
      '--app-text': '#1a0f02',
      '--app-text-secondary': '#362818',
      '--app-text-muted': '#5a4c3a',
      '--app-border': 'rgba(26,15,2,0.22)',
      '--app-hover': 'rgba(26,15,2,0.08)',
      '--app-active': 'rgba(26,15,2,0.15)',
      '--app-accent': '#46321a',
      '--app-accent-text': '#ede4d4',
      '--app-scrollbar': '#98887a',
      '--app-scrollbar-hover': '#806e60'
    }
  }
]

export interface AppearanceSettings {
  themeId: ThemeId
  customTokens: Partial<ThemeTokens>
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  themeId: 'default',
  customTokens: {}
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
  const customTokens: Partial<ThemeTokens> = {}
  if (obj.customTokens && typeof obj.customTokens === 'object') {
    const raw = obj.customTokens as Record<string, unknown>
    for (const key of THEME_TOKEN_KEYS) {
      const v = raw[key]
      if (typeof v === 'string') customTokens[key] = v
    }
  }
  return { themeId, customTokens }
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
