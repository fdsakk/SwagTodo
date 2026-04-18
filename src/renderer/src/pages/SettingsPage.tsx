import { useState } from 'react'
import useAppStore from '@renderer/store/useAppStore'
import {
  THEME_PRESETS,
  THEME_TOKEN_KEYS,
  getResolvedTokens,
  type ThemeId,
  type ThemeTokens
} from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import { useShallow } from 'zustand/react/shallow'

const TOKEN_LABELS: Record<keyof ThemeTokens, string> = {
  '--app-bg': 'Background',
  '--app-sidebar': 'Sidebar',
  '--app-titlebar': 'Title Bar',
  '--app-content': 'Content',
  '--app-card': 'Card',
  '--app-text': 'Text',
  '--app-text-secondary': 'Text Secondary',
  '--app-text-muted': 'Text Muted',
  '--app-border': 'Border',
  '--app-hover': 'Hover',
  '--app-active': 'Active',
  '--app-accent': 'Accent',
  '--app-accent-text': 'Accent Text',
  '--app-scrollbar': 'Scrollbar',
  '--app-scrollbar-hover': 'Scrollbar Hover'
}

const BACKGROUND_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'waves', label: 'Waves' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'particles', label: 'Particles' },
  { id: 'grid', label: 'Grid' }
]

function ThemeSwatch({ themeId }: { themeId: ThemeId }): React.JSX.Element {
  const preset = THEME_PRESETS.find((p) => p.id === themeId)!
  const t = preset.tokens
  return (
    <div
      className="flex h-14 w-full overflow-hidden rounded-md border border-app-border"
      style={{ background: t['--app-bg'] }}
    >
      <div className="w-6 h-full" style={{ background: t['--app-sidebar'] }} />
      <div className="flex-1 flex flex-col p-1.5 gap-1">
        <div className="h-1.5 w-full rounded-sm" style={{ background: t['--app-titlebar'] }} />
        <div className="flex gap-1 flex-1">
          <div className="flex-1 rounded-sm" style={{ background: t['--app-card'] }} />
          <div className="flex-1 rounded-sm" style={{ background: t['--app-card'] }} />
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage(): React.JSX.Element {
  const { appearance, setThemeId, setCustomTokens, resetCustomTokens, setBackgroundId } =
    useAppStore(
      useShallow((s) => ({
        appearance: s.appearance,
        setThemeId: s.setThemeId,
        setCustomTokens: s.setCustomTokens,
        resetCustomTokens: s.resetCustomTokens,
        setBackgroundId: s.setBackgroundId
      }))
    )

  const [showCustomize, setShowCustomize] = useState(false)
  const resolved = getResolvedTokens(appearance)
  const customTokens = appearance.customTokens ?? {}
  const hasCustom = Object.keys(customTokens).length > 0

  return (
    <div className="mx-auto max-w-xl space-y-8 p-6">
      <h1 className="text-lg font-medium text-app-text">Appearance</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-app-text-secondary">Theme</h2>
        <div className="grid grid-cols-3 gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setThemeId(preset.id)}
              className={cn(
                'flex flex-col gap-1.5 rounded-lg border p-2 text-xs transition-colors',
                appearance.themeId === preset.id
                  ? 'border-app-accent bg-app-active text-app-text'
                  : 'border-app-border bg-app-hover text-app-text-secondary hover:bg-app-active'
              )}
            >
              <ThemeSwatch themeId={preset.id} />
              <span className="text-center">{preset.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-app-text-secondary">Customize Colors</h2>
          <div className="flex gap-2">
            {hasCustom && (
              <button
                type="button"
                onClick={resetCustomTokens}
                className="rounded-md border border-app-border px-2.5 py-1 text-xs text-app-text-muted hover:text-app-text-secondary transition-colors"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCustomize((v) => !v)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs transition-colors',
                showCustomize
                  ? 'border-app-accent text-app-text'
                  : 'border-app-border text-app-text-muted hover:text-app-text-secondary'
              )}
            >
              {showCustomize ? 'Hide' : 'Fine-tune…'}
            </button>
          </div>
        </div>

        {showCustomize && (
          <div className="space-y-1 rounded-lg border border-app-border bg-app-card p-3">
            {THEME_TOKEN_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-3 py-1">
                <label className="w-32 text-xs text-app-text-muted">{TOKEN_LABELS[key]}</label>
                <div className="relative">
                  <input
                    type="color"
                    value={colorToHex(resolved[key])}
                    onChange={(e) => setCustomTokens({ [key]: e.target.value })}
                    className="h-7 w-9 cursor-pointer rounded border border-app-border bg-transparent p-0.5"
                  />
                </div>
                <span className="flex-1 font-mono text-[10px] text-app-text-muted">
                  {resolved[key]}
                </span>
                {customTokens[key] && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...customTokens }
                      delete next[key]
                      resetCustomTokens()
                      if (Object.keys(next).length > 0) setCustomTokens(next)
                    }}
                    className="text-[10px] text-app-text-muted hover:text-app-text-secondary"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-app-text-secondary">Background</h2>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_OPTIONS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => setBackgroundId(bg.id)}
              className={cn(
                'flex h-20 items-center justify-center rounded-lg border text-xs transition-colors',
                appearance.backgroundId === bg.id
                  ? 'border-app-accent bg-app-active text-app-text'
                  : 'border-app-border bg-app-hover text-app-text-muted hover:bg-app-active'
              )}
            >
              {bg.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-app-text-muted">
          Animated backgrounds coming soon. Select to pre-configure.
        </p>
      </section>
    </div>
  )
}

function colorToHex(value: string): string {
  if (value.startsWith('#')) return value.slice(0, 7)
  if (value.startsWith('rgba') || value.startsWith('rgb')) {
    const m = value.match(/[\d.]+/g)
    if (!m || m.length < 3) return '#000000'
    const r = Math.round(Number(m[0]))
    const g = Math.round(Number(m[1]))
    const b = Math.round(Number(m[2]))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  return '#000000'
}
