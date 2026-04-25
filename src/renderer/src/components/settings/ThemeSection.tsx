import {
  THEME_PRESETS,
  UI_SCALE_OPTIONS,
  type AppearanceSettings,
  type ThemeId,
  type UiScale
} from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { ThemeSwatch } from './ThemeSwatch'

interface ThemeSectionProps {
  appearance: AppearanceSettings
  onSetThemeId: (id: ThemeId) => void
  uiScale: UiScale
  onSetUiScale: (scale: UiScale) => void
}

export function ThemeSection({
  appearance,
  onSetThemeId,
  uiScale,
  onSetUiScale
}: ThemeSectionProps): React.JSX.Element {
  const handleScaleChange = (value: string): void => {
    const next = UI_SCALE_OPTIONS.find((s): s is UiScale => String(s) === value)
    if (next !== undefined) onSetUiScale(next)
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-app-text">Theme</h2>
          <p className="mt-0.5 text-xs text-app-text-muted">Choose a color scheme</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-app-text-muted">UI scale</span>
          <Select onValueChange={handleScaleChange} value={String(uiScale)}>
            <SelectTrigger className="h-7 w-24 border-app-border bg-app-card px-2.5 text-xs text-app-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UI_SCALE_OPTIONS.map((scale) => (
                <SelectItem key={scale} value={String(scale)}>
                  {scale}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSetThemeId(preset.id)}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-xl border transition-all',
              appearance.themeId === preset.id
                ? 'border-app-accent ring-1 ring-app-accent'
                : 'border-app-border hover:border-app-accent/50'
            )}
          >
            <ThemeSwatch themeId={preset.id} />
            <div
              className={cn(
                'px-2 py-1.5 text-center text-xs font-medium transition-colors',
                appearance.themeId === preset.id
                  ? 'bg-app-accent/10 text-app-text'
                  : 'text-app-text-secondary'
              )}
            >
              {preset.name}
            </div>
            {appearance.themeId === preset.id && (
              <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-app-accent shadow-sm" />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
