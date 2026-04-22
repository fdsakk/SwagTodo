import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { UiState, UiStore } from '../shared/types'
import { createUiActions } from './actions'
import { createInitialUiState } from './state'

const UI_STORE_PERSIST_KEY = 'ui-store'

type PersistedUiFilters = Pick<
  UiState,
  'inboxStatusFilter' | 'inboxProjectFilter' | 'inboxPriorityFilter'
>

const localUiStorage: StateStorage = {
  getItem: (name) => (typeof window === 'undefined' ? null : window.localStorage.getItem(name)),
  setItem: (name, value) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(name, value)
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(name)
  }
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      ...createInitialUiState(),
      ...createUiActions(set, get)
    }),
    {
      name: UI_STORE_PERSIST_KEY,
      storage: createJSONStorage(() => localUiStorage),
      partialize: (state): PersistedUiFilters => ({
        inboxStatusFilter: state.inboxStatusFilter,
        inboxProjectFilter: state.inboxProjectFilter,
        inboxPriorityFilter: state.inboxPriorityFilter
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<PersistedUiFilters>)
      })
    }
  )
)
