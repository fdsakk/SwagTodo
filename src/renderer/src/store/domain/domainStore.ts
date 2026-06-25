import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DomainStore } from "../shared/types"
import { createCalendarEventActions } from "./actions/calendarEvents"
import { createHealthActions } from "./actions/health"
import { createLabelActions } from "./actions/labels"
import { createProjectActions } from "./actions/projects"
import { createSessionActions } from "./actions/sessions"
import { createSettingsActions } from "./actions/settings"
import { createTaskActions } from "./actions/tasks"
import { persistedStorage, pickPersistedState } from "./persist"
import { createInitialDomainState } from "./state"

export const useDomainStore = create<DomainStore>()(
  persist(
    (set, get): DomainStore => {
      const actions = {
        ...createSettingsActions(set),
        ...createTaskActions(set, get),
        ...createProjectActions(set),
        ...createLabelActions(set),
        ...createSessionActions(set, get),
        ...createCalendarEventActions(set, get),
        ...createHealthActions(set)
      }

      return {
        ...createInitialDomainState(),
        ...actions,
        actions
      }
    },
    {
      name: "app-state",
      version: 1,
      storage: persistedStorage,
      partialize: pickPersistedState,
      skipHydration: typeof window === "undefined",
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error("[store] domain rehydrate failed", error)
        useDomainStore.setState({ hydrated: true })
      }
    }
  )
)
