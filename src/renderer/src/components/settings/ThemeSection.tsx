import { THEME_PRESETS, type AppearanceSettings, type ThemeId } from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import { ThemeSwatch } from './ThemeSwatch'

interface ThemeSectionProps {
  appearance: AppearanceSettings
  onSetThemeId: (id: ThemeId) => void
}

export function ThemeSection({ appearance, onSetThemeId }: ThemeSectionProps): React.JSX.Element {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-app-text">Theme</h2>
        <p className="mt-0.5 text-xs text-app-text-muted">Choose a color scheme</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
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
