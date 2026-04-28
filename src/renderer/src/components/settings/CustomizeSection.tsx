import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import {
  THEME_PRESETS,
  getResolvedTokens,
  type AppearanceSettings,
  type ThemeTokens
} from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import { Popover, PopoverPopup, PopoverTrigger } from '@renderer/components/ui/popover'

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

const TOKEN_GROUPS = [
  {
    id: 'layout',
    title: 'Layout',
    keys: ['--app-bg', '--app-sidebar', '--app-titlebar', '--app-content', '--app-card']
  },
  {
    id: 'text',
    title: 'Text',
    keys: ['--app-text', '--app-text-secondary', '--app-text-muted']
  },
  {
    id: 'interaction',
    title: 'Interaction',
    keys: [
      '--app-border',
      '--app-hover',
      '--app-active',
      '--app-accent',
      '--app-accent-text',
      '--app-scrollbar',
      '--app-scrollbar-hover'
    ]
  }
] as const satisfies ReadonlyArray<{
  id: string
  title: string
  keys: readonly (keyof ThemeTokens)[]
}>

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
  label: string
  hex: string
  onChange: (value: string) => void
}

function ColorPickerPopover({ label, hex, onChange }: ColorPickerPopoverProps): React.JSX.Element {
  const [draft, setDraft] = useState(hex)

  useEffect(() => {
    setDraft(hex)
  }, [hex])

  const commit = (raw: string): void => {
    const next = raw.startsWith('#') ? raw : `#${raw}`
    if (HEX_RE.test(next)) onChange(next.toLowerCase())
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Pick color for ${label}`}
        render={
          <button
            type="button"
            className="h-10 w-full rounded-md border border-app-border/80 transition-colors hover:border-app-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
            style={{ backgroundColor: hex }}
          />
        }
      />
      <PopoverPopup
        className="w-[244px] border-app-border bg-app-card p-3 shadow-lg"
        align="center"
      >
        <div className="space-y-3">
          <HexColorPicker
            color={hex}
            onChange={onChange}
            style={{ width: '100%' }}
            className="[&_.react-colorful__saturation]:rounded-t-md [&_.react-colorful__hue]:rounded-b-md"
          />
          <div className="flex items-center gap-2">
            <div
              className="size-7 shrink-0 rounded-md border border-app-border/70"
              style={{ backgroundColor: hex }}
            />
            <input
              className="h-8 flex-1 rounded-md border border-app-border bg-app-hover px-2 text-xs text-app-text-secondary placeholder:text-app-text-muted focus:border-app-accent focus:outline-none"
              maxLength={7}
              value={draft}
              placeholder="#000000"
              onChange={(e) => {
                const next = e.target.value
                setDraft(next)
                const val = next.startsWith('#') ? next : `#${next}`
                if (HEX_RE.test(val)) onChange(val.toLowerCase())
              }}
              onBlur={() => commit(draft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit(draft)
                }
              }}
            />
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  )
}

interface ColorTokenCardProps {
  label: string
  hex: string
  isCustom: boolean
  onChange: (value: string) => void
  onReset: () => void
}

function ColorTokenCard({
  label,
  hex,
  isCustom,
  onChange,
  onReset
}: ColorTokenCardProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-3">
      <ColorPickerPopover label={label} hex={hex} onChange={onChange} />
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-app-text">{label}</p>
          <p className="text-xs text-app-text-muted">{hex}</p>
        </div>
        <div className="flex items-center gap-2">
          {isCustom && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-app-border px-2 py-1 text-xs text-app-text-secondary hover:text-app-text transition-colors"
              aria-label={`Reset ${label}`}
            >
              Reset
            </button>
          )}
        </div>
      </div>
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
  const customTokens =
    appearance.customTokensByTheme[appearance.themeId] ?? appearance.customTokens ?? {}
  const customCount = Object.keys(customTokens).length
  const hasCustom = customCount > 0
  const activeThemeName =
    THEME_PRESETS.find((preset) => preset.id === appearance.themeId)?.name ?? 'Custom'

  const handleResetToken = (tokenKey: keyof ThemeTokens): void => {
    const next = { ...customTokens }
    delete next[tokenKey]
    onResetCustomTokens()
    if (Object.keys(next).length > 0) onSetCustomTokens(next)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-app-text">Customize Colors</h2>
          <p className="mt-0.5 text-xs text-app-text-muted">
            Theme: {activeThemeName} · Custom tokens: {customCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasCustom && (
            <button
              type="button"
              onClick={onResetCustomTokens}
              className="inline-flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-xs text-app-text-secondary transition-colors hover:text-app-text"
            >
              <RotateCcw className="size-3.5" />
              Reset all
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCustomize((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              showCustomize
                ? 'border-app-accent bg-app-accent/10 text-app-text'
                : 'border-app-border text-app-text-secondary hover:text-app-text'
            )}
          >
            {showCustomize ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {showCustomize ? 'Hide' : 'Customize'}
          </button>
        </div>
      </div>

      {showCustomize && (
        <div className="space-y-4">
          {TOKEN_GROUPS.map(({ id, title, keys }) => (
            <div key={id} className="space-y-2">
              <h3 className="text-xs font-semibold text-app-text-secondary">{title}</h3>
              <div className="grid gap-2 grid-cols-5 xl:grid-cols-7">
                {keys.map((key) => {
                  const hex = colorToHex(resolved[key])
                  const isCustom = Boolean(customTokens[key])
                  return (
                    <ColorTokenCard
                      key={key}
                      label={TOKEN_LABELS[key]}
                      hex={hex}
                      isCustom={isCustom}
                      onChange={(value) => onSetCustomTokens({ [key]: value })}
                      onReset={() => handleResetToken(key)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
