import { useState } from 'react'
import {
  THEME_TOKEN_KEYS,
  getResolvedTokens,
  type AppearanceSettings,
  type ThemeTokens
} from '@renderer/types'
import { cn } from '@renderer/utils/cn'

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

interface CustomizeSectionProps {
  appearance: AppearanceSettings
  onSetCustomTokens: (tokens: Partial<ThemeTokens>) => void
  onResetCustomTokens: () => void
}

export function CustomizeSection({
  appearance,
  onSetCustomTokens,
  onResetCustomTokens
}: CustomizeSectionProps): React.JSX.Element {
  const [showCustomize, setShowCustomize] = useState(false)
  const resolved = getResolvedTokens(appearance)
  const customTokens = appearance.customTokens ?? {}
  const hasCustom = Object.keys(customTokens).length > 0

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-app-text">Customize Colors</h2>
          <p className="mt-0.5 text-xs text-app-text-muted">Override individual tokens</p>
        </div>
        <div className="flex gap-1.5">
          {hasCustom && (
            <button
              type="button"
              onClick={onResetCustomTokens}
              className="rounded-lg border border-app-border px-2.5 py-1 text-xs text-app-text-muted hover:text-app-text-secondary transition-colors"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCustomize((v) => !v)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
              showCustomize
                ? 'border-app-accent bg-app-accent/10 text-app-text'
                : 'border-app-border text-app-text-muted hover:text-app-text-secondary'
            )}
          >
            {showCustomize ? 'Hide' : 'Fine-tune…'}
          </button>
        </div>
      </div>

      {showCustomize && (
        <div className="rounded-xl border border-app-border bg-app-card overflow-hidden">
          {THEME_TOKEN_KEYS.map((key, i) => (
            <div
              key={key}
              className={cn(
                'flex items-center gap-3 px-3 py-2',
                i !== 0 && 'border-t border-app-border'
              )}
            >
              <label className="w-28 text-xs font-medium text-app-text-secondary shrink-0">
                {TOKEN_LABELS[key]}
              </label>
              <input
                type="color"
                value={colorToHex(resolved[key])}
                onChange={(e) => onSetCustomTokens({ [key]: e.target.value })}
                className="h-6 w-8 cursor-pointer rounded-md border border-app-border bg-transparent p-0.5 shrink-0"
              />
              <span className="flex-1 font-mono text-[11px] text-app-text-muted truncate">
                {resolved[key]}
              </span>
              {customTokens[key] && (
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...customTokens }
                    delete next[key]
                    onResetCustomTokens()
                    if (Object.keys(next).length > 0) onSetCustomTokens(next)
                  }}
                  className="text-xs text-app-text-muted hover:text-app-text transition-colors shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
