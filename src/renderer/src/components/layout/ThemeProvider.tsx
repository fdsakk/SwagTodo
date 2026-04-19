import { useEffect } from 'react'
import useAppStore from '@renderer/store/useAppStore'
import { getResolvedTokens, THEME_TOKEN_KEYS } from '@renderer/types'

export function ThemeProvider(): null {
  const appearance = useAppStore((s) => s.appearance)

  useEffect(() => {
    const tokens = getResolvedTokens(appearance)
    const root = document.documentElement.style
    for (const key of THEME_TOKEN_KEYS) {
      root.setProperty(key, tokens[key])
    }
  }, [appearance])

  return null
}
