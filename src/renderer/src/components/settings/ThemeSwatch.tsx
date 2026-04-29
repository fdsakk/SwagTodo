import { THEME_PRESETS, type ThemeId } from "@renderer/types"

interface ThemeSwatchProps {
  themeId: ThemeId
}

export function ThemeSwatch({ themeId }: ThemeSwatchProps): React.JSX.Element {
  const preset = THEME_PRESETS.find((p) => p.id === themeId)!
  const t = preset.tokens
  return (
    <div
      className="flex h-16 w-full overflow-hidden"
      style={{ background: t["--app-bg"] }}
    >
      <div
        className="w-7 h-full flex flex-col gap-1 p-1 pt-1.5"
        style={{ background: t["--app-sidebar"] }}
      >
        <div
          className="h-1 w-3/4 rounded-full mx-auto"
          style={{ background: t["--app-accent"] }}
        />
        <div
          className="h-1 w-2/3 rounded-full mx-auto opacity-50"
          style={{ background: t["--app-text"] }}
        />
        <div
          className="h-1 w-2/3 rounded-full mx-auto opacity-30"
          style={{ background: t["--app-text"] }}
        />
      </div>
      <div className="flex-1 flex flex-col gap-1 p-1.5">
        <div
          className="h-1.5 w-full rounded-sm opacity-70"
          style={{ background: t["--app-titlebar"] }}
        />
        <div className="flex gap-1 flex-1">
          <div
            className="flex-1 rounded-md p-1"
            style={{ background: t["--app-card"] }}
          >
            <div
              className="h-1 w-1/3 rounded-full"
              style={{ background: t["--app-text"], opacity: 0.4 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
