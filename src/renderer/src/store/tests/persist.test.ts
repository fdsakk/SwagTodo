import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_APPEARANCE, DEFAULT_PK_SETTINGS } from '@renderer/types'
import { hydrateDomainStore } from '../bootstrap'
import { persistedStorage, pickPersistedState, stateFromPersisted } from '../domain/persist'
import { createInitialDomainState } from '../domain/state'
import { useDomainStore } from '../domain/domainStore'

test('pickPersistedState returns only persisted domain fields', () => {
  const state = createInitialDomainState()
  const persisted = pickPersistedState(state)

  assert.deepEqual(Object.keys(persisted).sort(), [
    'appearance',
    'isSidebarCollapsed',
    'labels',
    'medications',
    'pkSettings',
    'projects',
    'sessions',
    'tasks',
    'timeBlocks',
    'uiScale'
  ])
})

test('stateFromPersisted normalizes incomplete persisted payloads', () => {
  const persisted = stateFromPersisted({
    tasks: [
      {
        id: 'task-1',
        title: 'Legacy',
        priority: 'p1',
        status: 'done',
        labels: ['label-1']
      }
    ],
    appearance: { themeId: 'missing-theme', customTokens: { '--app-bg': 12 } },
    uiScale: 999
  })

  assert.equal(persisted.tasks[0].completed, true)
  assert.equal(persisted.tasks[0].status, 'done')
  assert.deepEqual(persisted.pkSettings, DEFAULT_PK_SETTINGS)
  assert.deepEqual(persisted.appearance, DEFAULT_APPEARANCE)
  assert.equal(persisted.uiScale, createInitialDomainState().uiScale)
  assert.deepEqual(persisted.projects, [])
})

test('stateFromPersisted migrates legacy appearance custom tokens into active theme bucket', () => {
  const persisted = stateFromPersisted({
    appearance: {
      themeId: 'retro',
      customTokens: { '--app-bg': '#111111' }
    }
  })

  assert.deepEqual(persisted.appearance.customTokens, { '--app-bg': '#111111' })
  assert.deepEqual(persisted.appearance.customTokensByTheme.retro, { '--app-bg': '#111111' })
})

test('persistedStorage only saves changed persisted keys', async () => {
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
        platform: 'linux'
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

  await persistedStorage.removeItem('app-state')
  await persistedStorage.getItem('app-state')
  await persistedStorage.setItem('app-state', {
    state: {
      ...createInitialDomainState(),
      uiScale: 125
    },
    version: 1
  })

  assert.deepEqual(savedPatch, { uiScale: 125 })
})

test('hydrateDomainStore deduplicates in-flight rehydration', async () => {
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
