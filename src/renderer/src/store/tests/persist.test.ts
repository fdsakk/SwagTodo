import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_APPEARANCE, DEFAULT_PK_SETTINGS } from "@renderer/types"
import { hydrateDomainStore } from "../bootstrap"
import { useDomainStore } from "../domain/domainStore"
import {
  persistedStorage,
  pickPersistedState,
  setPersistenceErrorReporter,
  stateFromPersisted
} from "../domain/persist"
import { createInitialDomainState } from "../domain/state"

test("pickPersistedState returns only persisted domain fields", () => {
  const state = createInitialDomainState()
  const persisted = pickPersistedState(state)

  assert.deepEqual(Object.keys(persisted).sort(), [
    "appearance",
    "isSidebarCollapsed",
    "labels",
    "medications",
    "pkSettings",
    "projects",
    "sessions",
    "tasks",
    "timeBlocks",
    "uiScale"
  ])
})

test("stateFromPersisted normalizes incomplete persisted payloads", () => {
  const persisted = stateFromPersisted({
    tasks: [
      {
        id: "task-1",
        title: "Legacy",
        priority: "p1",
        status: "done",
        labels: ["label-1"]
      }
    ],
    appearance: { themeId: "missing-theme", customTokens: { "--app-bg": 12 } },
    uiScale: 999
  })

  assert.equal(persisted.tasks[0].completed, true)
  assert.equal(persisted.tasks[0].status, "done")
  assert.deepEqual(persisted.pkSettings, DEFAULT_PK_SETTINGS)
  assert.deepEqual(persisted.appearance, DEFAULT_APPEARANCE)
  assert.equal(persisted.uiScale, createInitialDomainState().uiScale)
  assert.deepEqual(persisted.projects, [])
})

test("stateFromPersisted migrates legacy appearance custom tokens into active theme bucket", () => {
  const persisted = stateFromPersisted({
    appearance: {
      themeId: "retro",
      customTokens: { "--app-bg": "#111111" }
    }
  })

  assert.deepEqual(persisted.appearance.customTokens, { "--app-bg": "#111111" })
  assert.deepEqual(persisted.appearance.customTokensByTheme.retro, {
    "--app-bg": "#111111"
  })
})

test("persistedStorage only saves changed persisted keys", async () => {
  let savedPatch: Record<string, unknown> | undefined
  ;(globalThis as { window?: Window }).window = {
    api: {
      ui: {
        getZoomFactor: async () => 1,
        setZoomFactor: async () => {}
      },
      window: {
        minimize: async () => {},
        toggleMaximize: async () => {},
        close: async () => {},
        getState: async () => ({ isFullScreen: false, isMaximized: false }),
        onStateChange: () => () => {},
        platform: "linux"
      },
      storage: {
        loadState: async () => ({
          uiScale: 100,
          tasks: [],
          projects: [],
          labels: [],
          sessions: [],
          timeBlocks: [],
          medications: []
        }),
        saveState: async () => {},
        savePartial: async (patch: Record<string, unknown>) => {
          savedPatch = patch
        }
      }
    }
  } as unknown as Window

  await persistedStorage.removeItem("app-state")
  await persistedStorage.getItem("app-state")
  await persistedStorage.setItem("app-state", {
    state: {
      ...createInitialDomainState(),
      uiScale: 125
    },
    version: 1
  })

  assert.deepEqual(savedPatch, { uiScale: 125 })
})

test("persistedStorage keeps failed SQLite patches pending for retry", async () => {
  const reportedErrors: string[] = []
  const restoreReporter = setPersistenceErrorReporter((error) => {
    reportedErrors.push(error instanceof Error ? error.message : String(error))
  })
  const savedPatches: Record<string, unknown>[] = []
  let shouldFail = true

  ;(globalThis as { window?: Window }).window = {
    api: {
      ui: {
        getZoomFactor: async () => 1,
        setZoomFactor: async () => {}
      },
      window: {
        minimize: async () => {},
        toggleMaximize: async () => {},
        close: async () => {},
        getState: async () => ({ isFullScreen: false, isMaximized: false }),
        onStateChange: () => () => {},
        platform: "linux"
      },
      storage: {
        loadState: async () => ({
          uiScale: 100,
          tasks: [],
          projects: [],
          labels: [],
          sessions: [],
          timeBlocks: [],
          medications: []
        }),
        saveState: async () => {},
        savePartial: async (patch: Record<string, unknown>) => {
          savedPatches.push(patch)
          if (shouldFail) throw new Error("sqlite busy")
        }
      }
    }
  } as unknown as Window

  await persistedStorage.removeItem("app-state")
  await persistedStorage.getItem("app-state")
  const nextValue = {
    state: {
      ...createInitialDomainState(),
      uiScale: 125 as const
    },
    version: 1 as const
  }

  await persistedStorage.setItem("app-state", nextValue)
  await persistedStorage.setItem("app-state", nextValue)

  assert.deepEqual(savedPatches, [{ uiScale: 125 }, { uiScale: 125 }])
  assert.deepEqual(reportedErrors, ["sqlite busy", "sqlite busy"])

  shouldFail = false
  await persistedStorage.setItem("app-state", nextValue)
  await persistedStorage.setItem("app-state", nextValue)

  assert.deepEqual(savedPatches, [
    { uiScale: 125 },
    { uiScale: 125 },
    { uiScale: 125 }
  ])
  restoreReporter()
})

test("persistedStorage reloads state after SQLite savePartial patches backing state", async () => {
  let backingState: Record<string, unknown> = {
    uiScale: 100,
    tasks: [],
    projects: [],
    labels: [],
    sessions: [],
    timeBlocks: [],
    medications: []
  }
  const savedPatches: Record<string, unknown>[] = []

  ;(globalThis as { window?: Window }).window = {
    api: {
      ui: {
        getZoomFactor: async () => 1,
        setZoomFactor: async () => {}
      },
      window: {
        minimize: async () => {},
        toggleMaximize: async () => {},
        close: async () => {},
        getState: async () => ({ isFullScreen: false, isMaximized: false }),
        onStateChange: () => () => {},
        platform: "linux"
      },
      storage: {
        loadState: async () => backingState,
        saveState: async () => {},
        savePartial: async (patch: Record<string, unknown>) => {
          savedPatches.push(patch)
          backingState = { ...backingState, ...patch }
        }
      }
    }
  } as unknown as Window

  await persistedStorage.removeItem("app-state")
  const loaded = await persistedStorage.getItem("app-state")
  assert.equal(loaded?.state.uiScale, 100)

  const task = {
    id: "task-1",
    title: "Persist me",
    priority: "p2" as const,
    labels: [],
    completed: false,
    status: "todo" as const,
    createdAt: "2026-04-29T10:00:00.000Z",
    updatedAt: "2026-04-29T10:00:00.000Z",
    order: 1,
    subTasks: []
  }

  await persistedStorage.setItem("app-state", {
    state: {
      ...createInitialDomainState(),
      tasks: [task],
      uiScale: 125
    },
    version: 1
  })

  assert.deepEqual(savedPatches, [{ tasks: [task], uiScale: 125 }])

  await persistedStorage.removeItem("app-state")
  const reloaded = await persistedStorage.getItem("app-state")

  assert.equal(reloaded?.state.uiScale, 125)
  assert.equal(reloaded?.state.tasks.length, 1)
  assert.equal(reloaded?.state.tasks[0]?.id, task.id)
  assert.equal(reloaded?.state.tasks[0]?.title, task.title)
})

test("domain store hydrates, mutates, saves partial patch, and reloads backing state", async () => {
  const task = {
    id: "task-1",
    title: "Before",
    priority: "p2" as const,
    labels: [],
    completed: false,
    status: "todo" as const,
    createdAt: "2026-04-29T10:00:00.000Z",
    updatedAt: "2026-04-29T10:00:00.000Z",
    order: 1,
    subTasks: []
  }
  let backingState: Record<string, unknown> = {
    ...createInitialDomainState(),
    tasks: [task]
  }
  const savedPatches: Record<string, unknown>[] = []

  ;(globalThis as { window?: Window }).window = {
    api: {
      ui: {
        getZoomFactor: async () => 1,
        setZoomFactor: async () => {}
      },
      window: {
        minimize: async () => {},
        toggleMaximize: async () => {},
        close: async () => {},
        getState: async () => ({ isFullScreen: false, isMaximized: false }),
        onStateChange: () => () => {},
        platform: "linux"
      },
      storage: {
        loadState: async () => backingState,
        saveState: async () => {},
        savePartial: async (patch: Record<string, unknown>) => {
          savedPatches.push(patch)
          backingState = { ...backingState, ...patch }
        }
      }
    }
  } as unknown as Window

  await persistedStorage.removeItem("app-state")
  await useDomainStore.persist.rehydrate()
  assert.equal(useDomainStore.getState().tasks[0]?.title, "Before")

  useDomainStore.getState().updateTask(task.id, { title: "After" })
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.equal(savedPatches.length, 1)
  assert.equal((savedPatches[0].tasks as (typeof task)[])[0]?.title, "After")

  await persistedStorage.removeItem("app-state")
  await useDomainStore.persist.rehydrate()
  assert.equal(useDomainStore.getState().tasks[0]?.title, "After")
})

test("hydrateDomainStore deduplicates in-flight rehydration", async () => {
  const originalHasHydrated = useDomainStore.persist.hasHydrated
  const originalRehydrate = useDomainStore.persist.rehydrate

  let callCount = 0
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })

  useDomainStore.persist.hasHydrated = () => false
  useDomainStore.persist.rehydrate = () => {
    callCount += 1
    return pending
  }

  const first = hydrateDomainStore()
  const second = hydrateDomainStore()
  release()
  await Promise.all([first, second])

  assert.equal(callCount, 1)

  useDomainStore.persist.hasHydrated = originalHasHydrated
  useDomainStore.persist.rehydrate = originalRehydrate
})
