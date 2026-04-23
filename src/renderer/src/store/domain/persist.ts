import { type PersistStorage } from 'zustand/middleware'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_PK_SETTINGS,
  normalizeAppearance,
  type AppState,
  type PkSettings
} from '@renderer/types'
import { normalizeStoredTask } from '../shared/normalize'
import type { DomainState, PersistedDomainState } from '../shared/types'
import { isUiScale } from '../shared/utils'
import { createInitialDomainState } from './state'

const defaultPersistedState = pickPersistedState(createInitialDomainState())

export const PERSISTED_KEYS = Object.keys(defaultPersistedState) as (keyof PersistedDomainState)[]

const normalizePkSettings = (raw: unknown): PkSettings => {
  const defaults = DEFAULT_PK_SETTINGS
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>
    return {
      peakScale: typeof record.peakScale === 'number' ? record.peakScale : defaults.peakScale,
      tMaxOffsetH:
        typeof record.tMaxOffsetH === 'number' ? record.tMaxOffsetH : defaults.tMaxOffsetH,
      keMultiplier:
        typeof record.keMultiplier === 'number' ? record.keMultiplier : defaults.keMultiplier,
      mec: typeof record.mec === 'number' ? record.mec : defaults.mec,
      mtc: typeof record.mtc === 'number' ? record.mtc : defaults.mtc,
      crashThreshold:
        typeof record.crashThreshold === 'number' ? record.crashThreshold : defaults.crashThreshold
    }
  }
  return defaults
}

export const stateFromPersisted = (persisted: unknown): PersistedDomainState => {
  const data =
    persisted && typeof persisted === 'object'
      ? (persisted as Partial<AppState> & { appearance?: unknown })
      : {}

  return {
    ...defaultPersistedState,
    tasks: Array.isArray(data.tasks) ? data.tasks.map((task) => normalizeStoredTask(task)) : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    labels: Array.isArray(data.labels) ? data.labels : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    timeBlocks: Array.isArray(data.timeBlocks) ? data.timeBlocks : [],
    medications: Array.isArray(data.medications) ? data.medications : [],
    pkSettings: normalizePkSettings(data.pkSettings),
    uiScale: isUiScale(data.uiScale) ? data.uiScale : defaultPersistedState.uiScale,
    isSidebarCollapsed:
      typeof data.isSidebarCollapsed === 'boolean'
        ? data.isSidebarCollapsed
        : defaultPersistedState.isSidebarCollapsed,
    appearance: normalizeAppearance(data.appearance ?? DEFAULT_APPEARANCE)
  }
}

export function pickPersistedState(state: DomainState): PersistedDomainState {
  const {
    tasks,
    projects,
    labels,
    sessions,
    timeBlocks,
    medications,
    pkSettings,
    uiScale,
    isSidebarCollapsed,
    appearance
  } = state
  return {
    tasks,
    projects,
    labels,
    sessions,
    timeBlocks,
    medications,
    pkSettings,
    uiScale,
    isSidebarCollapsed,
    appearance
  }
}

type PersistedJson = Map<keyof PersistedDomainState, string>

let lastPersistedJson: PersistedJson | undefined

const buildPersistedJson = (state: PersistedDomainState): PersistedJson =>
  new Map(PERSISTED_KEYS.map((k) => [k, JSON.stringify(state[k])]))

export const persistedStorage: PersistStorage<PersistedDomainState> = {
  getItem: async () => {
    if (!window.api?.storage) return null
    const loaded = stateFromPersisted(await window.api.storage.loadState())
    lastPersistedJson = buildPersistedJson(loaded)
    return { state: loaded, version: 1 }
  },
  setItem: async (_, value) => {
    if (!window.api?.storage) return

    const nextState = value.state
    const nextJson = buildPersistedJson(nextState)
    const patch = {} as Partial<PersistedDomainState>

    for (const key of PERSISTED_KEYS) {
      if (!lastPersistedJson || lastPersistedJson.get(key) !== nextJson.get(key)) {
        patch[key] = nextState[key] as never
      }
    }

    if (Object.keys(patch).length === 0) return
    await window.api.storage.savePartial(patch)
    lastPersistedJson = nextJson
  },
  removeItem: async () => {
    lastPersistedJson = undefined
  }
}
