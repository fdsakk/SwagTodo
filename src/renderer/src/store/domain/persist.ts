import { toastManager } from "@renderer/components/ui/toast-manager"
import {
  type AppState,
  DEFAULT_APPEARANCE,
  DEFAULT_PK_SETTINGS,
  normalizeAppearance,
  type PkSettings
} from "@renderer/types"
import { z } from "zod"
import type { PersistStorage } from "zustand/middleware"
import {
  calendarEventSchema,
  labelSchema,
  medicationSchema,
  projectSchema,
  sessionSchema,
  taskSchema,
  timeBlockSchema
} from "../../../../shared/stateSchema"
import { normalizeStoredTask } from "../shared/normalize"
import type { DomainState, PersistedDomainState } from "../shared/types"
import { isUiScale } from "../shared/utils"
import { createInitialDomainState } from "./state"

const defaultPersistedState = pickPersistedState(createInitialDomainState())

export const PERSISTED_KEYS = Object.keys(
  defaultPersistedState
) as (keyof PersistedDomainState)[]

const normalizePkSettings = (raw: unknown): PkSettings => {
  const defaults = DEFAULT_PK_SETTINGS
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>
    return {
      peakScale:
        typeof record.peakScale === "number"
          ? record.peakScale
          : defaults.peakScale,
      tMaxOffsetH:
        typeof record.tMaxOffsetH === "number"
          ? record.tMaxOffsetH
          : defaults.tMaxOffsetH,
      keMultiplier:
        typeof record.keMultiplier === "number"
          ? record.keMultiplier
          : defaults.keMultiplier,
      mec: typeof record.mec === "number" ? record.mec : defaults.mec,
      mtc: typeof record.mtc === "number" ? record.mtc : defaults.mtc,
      crashThreshold:
        typeof record.crashThreshold === "number"
          ? record.crashThreshold
          : defaults.crashThreshold
    }
  }
  return defaults
}

const persistedDomainSchema = z
  .object({
    tasks: z
      .array(taskSchema.or(z.unknown().transform(normalizeStoredTask)))
      .catch([]),
    projects: z.array(projectSchema).catch([]),
    labels: z.array(labelSchema).catch([]),
    sessions: z.array(sessionSchema).catch([]),
    timeBlocks: z.array(timeBlockSchema).catch([]),
    calendarEvents: z.array(calendarEventSchema).catch([]),
    medications: z.array(medicationSchema).catch([]),
    pkSettings: z.unknown().optional(),
    uiScale: z
      .number()
      .refine(isUiScale)
      .optional()
      .catch(defaultPersistedState.uiScale),
    isSidebarCollapsed: z
      .boolean()
      .optional()
      .catch(defaultPersistedState.isSidebarCollapsed),
    appearance: z.unknown().optional()
  })
  .passthrough()

export const stateFromPersisted = (
  persisted: unknown
): PersistedDomainState => {
  const data = persistedDomainSchema.parse(
    persisted && typeof persisted === "object"
      ? (persisted as Partial<AppState> & { appearance?: unknown })
      : {}
  )

  return {
    ...defaultPersistedState,
    tasks: data.tasks,
    projects: data.projects,
    labels: data.labels,
    sessions: data.sessions,
    timeBlocks: data.timeBlocks,
    calendarEvents: data.calendarEvents,
    medications: data.medications,
    pkSettings: normalizePkSettings(data.pkSettings),
    uiScale: data.uiScale ?? defaultPersistedState.uiScale,
    isSidebarCollapsed:
      data.isSidebarCollapsed ?? defaultPersistedState.isSidebarCollapsed,
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
    calendarEvents,
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
    calendarEvents,
    medications,
    pkSettings,
    uiScale,
    isSidebarCollapsed,
    appearance
  }
}

type PersistedJson = Map<keyof PersistedDomainState, string>
type PersistenceErrorReporter = (error: unknown) => void | Promise<void>

let lastPersistedJson: PersistedJson | undefined
let persistenceErrorReporter: PersistenceErrorReporter = (error) => {
  toastManager.add({
    id: "storage-save-failed",
    type: "error",
    title: "Changes were not saved",
    description: getPersistenceErrorMessage(error),
    priority: "high"
  })
}

const getPersistenceErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  return "SQLite save failed. Your latest change will be retried on the next update."
}

const buildPersistedJson = (state: PersistedDomainState): PersistedJson =>
  new Map(PERSISTED_KEYS.map((k) => [k, JSON.stringify(state[k])]))

export const setPersistenceErrorReporter = (
  reporter: PersistenceErrorReporter
): (() => void) => {
  const previous = persistenceErrorReporter
  persistenceErrorReporter = reporter
  return () => {
    persistenceErrorReporter = previous
  }
}

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
      if (
        !lastPersistedJson ||
        lastPersistedJson.get(key) !== nextJson.get(key)
      ) {
        patch[key] = nextState[key] as never
      }
    }

    if (Object.keys(patch).length === 0) return
    try {
      await window.api.storage.savePartial(patch)
    } catch (error) {
      void persistenceErrorReporter(error)
      return
    }
    lastPersistedJson = nextJson
  },
  removeItem: async () => {
    lastPersistedJson = undefined
  }
}
