import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  THEME_TOKEN_KEYS,
  getResolvedTokens,
  type AppearanceSettings,
  type ThemeTokens
} from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'

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

const HEX_RE = /^#([0-9a-fA-F]{6})$/

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

interface ColorPickerPopoverProps {
  hex: string
  label: string
  onChange: (value: string) => void
}

function ColorPickerPopover({ hex, label, onChange }: ColorPickerPopoverProps): React.JSX.Element {
  const [draft, setDraft] = useState(hex)

  useEffect(() => {
    setDraft(hex)
  }, [hex])

  const commitDraft = (raw: string): void => {
    const val = raw.startsWith('#') ? raw : `#${raw}`
    if (HEX_RE.test(val)) onChange(val.toLowerCase())
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group relative h-14 w-full rounded-lg border border-app-border/60 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent transition-transform active:scale-95"
          style={{ backgroundColor: hex }}
          aria-label={`Pick color for ${label}`}
        >
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              Edit
            </span>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 border-app-border bg-app-card shadow-xl"
        align="center"
        sideOffset={8}
      >
        <div className="flex flex-col gap-0">
          {/* react-colorful picker — override its CSS vars to match app theme */}
          <div className="p-3 [&_.react-colorful]:w-full [&_.react-colorful]:rounded-none [&_.react-colorful__saturation]:rounded-t-md [&_.react-colorful__last-control]:rounded-b-none [&_.react-colorful__hue]:rounded-none [&_.react-colorful__pointer]:w-4 [&_.react-colorful__pointer]:h-4 [&_.react-colorful__pointer]:border-2 [&_.react-colorful__pointer]:border-white [&_.react-colorful__pointer]:shadow-md">
            <HexColorPicker
              color={hex}
              onChange={onChange}
              style={{ width: '200px' }}
            />
          </div>

          {/* Hex input + current swatch */}
          <div className="flex items-center gap-2 border-t border-app-border px-3 py-2">
            <div
              className="h-6 w-6 shrink-0 rounded border border-app-border/60"
              style={{ backgroundColor: hex }}
            />
            <input
              className="h-7 flex-1 rounded-md border border-app-border bg-app-hover px-2 font-mono text-xs text-app-text-secondary placeholder:text-app-text-muted focus:border-app-accent focus:outline-none transition-colors"
              maxLength={7}
              value={draft}
              placeholder="#000000"
              onChange={(e) => {
                setDraft(e.target.value)
                const val = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
                if (HEX_RE.test(val)) onChange(val.toLowerCase())
              }}
              onBlur={() => commitDraft(draft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitDraft(draft)
                }
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface ColorSwatchProps {
  tokenKey: keyof ThemeTokens
  label: string
  hex: string
  isCustom: boolean
  onChange: (value: string) => void
  onReset: () => void
}

function ColorSwatch({ label, hex, isCustom, onChange, onReset }: ColorSwatchProps): React.JSX.Element {
  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-app-border bg-app-bg p-3 hover:border-app-accent/40 transition-colors">
      <ColorPickerPopover hex={hex} label={label} onChange={onChange} />

      {isCustom && (
        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-app-accent ring-1 ring-app-bg pointer-events-none" />
      )}

      <div className="flex items-center justify-between gap-1 min-w-0">
        <span className="text-xs font-medium text-app-text-secondary truncate">{label}</span>
        {isCustom && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 text-[10px] text-app-text-muted hover:text-app-text transition-colors leading-none"
            aria-label={`Reset ${label}`}
          >
            Reset
          </button>
        )}
      </div>

      <span className="font-mono text-[10px] text-app-text-muted leading-none">{hex}</span>
    </div>
  )
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
              Reset all
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
        <div className="grid grid-cols-3 gap-2">
          {THEME_TOKEN_KEYS.map((key) => {
            const hex = colorToHex(resolved[key])
            const isCustom = Boolean(customTokens[key])
            return (
              <ColorSwatch
                key={key}
                tokenKey={key}
                label={TOKEN_LABELS[key]}
                hex={hex}
                isCustom={isCustom}
                onChange={(val) => onSetCustomTokens({ [key]: val })}
                onReset={() => {
                  const next = { ...customTokens }
                  delete next[key]
                  onResetCustomTokens()
                  if (Object.keys(next).length > 0) onSetCustomTokens(next)
                }}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
