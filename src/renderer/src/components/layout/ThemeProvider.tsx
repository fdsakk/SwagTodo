import { useEffect } from 'react'
import { getResolvedTokens, getThemeTone, THEME_TOKEN_KEYS, type ThemeTone } from '@renderer/types'
import { useDomainStore } from '@renderer/store'

const CHART_TONE_VARS: Record<ThemeTone, Record<string, string>> = {
  dark: {
    '--app-chart-grid': 'rgba(255,255,255,0.13)',
    '--app-chart-muted': 'var(--app-text-muted)',
    '--app-chart-band-therapeutic': 'rgba(16,185,129,0.10)',
    '--app-chart-band-crash': 'rgba(220,38,38,0.18)',
    '--app-chart-mec': 'rgba(16,185,129,0.92)',
    '--app-chart-mtc': 'rgba(217,119,6,0.92)',
    '--app-chart-now': 'var(--app-text-muted)'
  },
  light: {
    '--app-chart-grid': 'rgba(17,24,39,0.42)',
    '--app-chart-muted': 'rgba(17,24,39,0.92)',
    '--app-chart-band-therapeutic': 'rgba(4,120,87,0.30)',
    '--app-chart-band-crash': 'rgba(153,27,27,0.30)',
    '--app-chart-mec': '#047857',
    '--app-chart-mtc': '#92400e',
    '--app-chart-now': 'rgba(17,24,39,0.92)'
  }
}

export function ThemeProvider(): null {
  const appearance = useDomainStore((s) => s.appearance)

  useEffect(() => {
    const tokens = getResolvedTokens(appearance)
    const tone = getThemeTone(appearance)
    const rootElement = document.documentElement
    const root = document.documentElement.style
    for (const key of THEME_TOKEN_KEYS) {
      root.setProperty(key, tokens[key])
    }
    for (const [key, value] of Object.entries(CHART_TONE_VARS[tone])) {
      root.setProperty(key, value)
    }
    rootElement.dataset.themeTone = tone
    rootElement.classList.toggle('app-theme-light', tone === 'light')
    rootElement.classList.toggle('app-theme-dark', tone === 'dark')
  }, [appearance])

  return null
}
