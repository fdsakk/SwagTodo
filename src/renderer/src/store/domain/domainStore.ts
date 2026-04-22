import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DomainStore } from '../shared/types'
import { createHealthActions } from './actions/health'
import { createLabelActions } from './actions/labels'
import { createProjectActions } from './actions/projects'
import { createSessionActions } from './actions/sessions'
import { createSettingsActions } from './actions/settings'
import { createTaskActions } from './actions/tasks'
import { persistedStorage, pickPersistedState } from './persist'
import { createInitialDomainState } from './state'

export const useDomainStore = create<DomainStore>()(
  persist(
    (set, get): DomainStore => ({
      ...createInitialDomainState(),
      ...createSettingsActions(set),
      ...createTaskActions(set, get),
      ...createProjectActions(set),
      ...createLabelActions(set),
      ...createSessionActions(set, get),
      ...createHealthActions(set)
    }),
    {
      name: 'app-state',
      version: 1,
      storage: persistedStorage,
      partialize: pickPersistedState,
      skipHydration: true
    }
  )
)
