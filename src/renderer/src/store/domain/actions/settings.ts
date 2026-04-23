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
      const nextCustomTokens = state.appearance.customTokensByTheme[themeId] ?? {}
      const hasCustomTokens = Object.keys(nextCustomTokens).length > 0
      if (state.appearance.themeId === themeId && !hasCustomTokens) return state

      return {
        appearance: {
          ...state.appearance,
          themeId,
          customTokens: nextCustomTokens
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

      if (!changed) return state

      return {
        appearance: {
          ...state.appearance,
          customTokens: nextTokens,
          customTokensByTheme: {
            ...state.appearance.customTokensByTheme,
            [state.appearance.themeId]: nextTokens
          }
        }
      }
    }),
  resetCustomTokens: () =>
    set((state) => {
      if (Object.keys(state.appearance.customTokens).length === 0) return state

      const nextByTheme = { ...state.appearance.customTokensByTheme }
      delete nextByTheme[state.appearance.themeId]

      return {
        appearance: {
          ...state.appearance,
          customTokens: {},
          customTokensByTheme: nextByTheme
        }
      }
    })
})
