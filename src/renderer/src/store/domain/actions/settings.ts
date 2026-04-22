import type { DomainActions, DomainStoreSet } from '../../shared/types'

type SettingsActions = Pick<
  DomainActions,
  'setUiScale' | 'toggleSidebar' | 'setThemeId' | 'setCustomTokens' | 'resetCustomTokens'
>

export const createSettingsActions = (set: DomainStoreSet): SettingsActions => ({
  setUiScale: (uiScale) => set((state) => (state.uiScale === uiScale ? state : { uiScale })),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setThemeId: (themeId) =>
    set((state) => {
      const hasCustomTokens = Object.keys(state.appearance.customTokens).length > 0
      if (state.appearance.themeId === themeId && !hasCustomTokens) return state

      return {
        appearance: {
          ...state.appearance,
          themeId,
          customTokens: {}
        }
      }
    }),
  setCustomTokens: (tokens) =>
    set((state) => {
      const nextTokens = { ...state.appearance.customTokens }
      let changed = false

      for (const [key, value] of Object.entries(tokens)) {
        if (nextTokens[key as keyof typeof nextTokens] === value) continue
        changed = true
        nextTokens[key as keyof typeof nextTokens] = value
      }

      return changed ? { appearance: { ...state.appearance, customTokens: nextTokens } } : state
    }),
  resetCustomTokens: () =>
    set((state) =>
      Object.keys(state.appearance.customTokens).length > 0
        ? { appearance: { ...state.appearance, customTokens: {} } }
        : state
    )
})
