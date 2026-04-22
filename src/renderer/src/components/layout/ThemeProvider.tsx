import { useEffect } from 'react'
import { getResolvedTokens, THEME_TOKEN_KEYS } from '@renderer/types'
import { useDomainStore } from '@renderer/store'

export function ThemeProvider(): null {
  const appearance = useDomainStore((s) => s.appearance)

  useEffect(() => {
    const tokens = getResolvedTokens(appearance)
    const root = document.documentElement.style
    for (const key of THEME_TOKEN_KEYS) {
      root.setProperty(key, tokens[key])
    }
  }, [appearance])

  return null
}
