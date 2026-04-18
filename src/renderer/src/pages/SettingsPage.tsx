import useAppStore from '@renderer/store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import { ThemeSection } from '@renderer/components/settings/ThemeSection'
import { CustomizeSection } from '@renderer/components/settings/CustomizeSection'
import { BackgroundSection } from '@renderer/components/settings/BackgroundSection'

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

  return (
    <div className="px-6 pb-8 pt-5 max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold tracking-tight text-app-text">Appearance</h1>
      <div className="space-y-8">
        <ThemeSection appearance={appearance} onSetThemeId={setThemeId} />
        <div className="h-px bg-app-border" />
        <CustomizeSection
          appearance={appearance}
          onSetCustomTokens={setCustomTokens}
          onResetCustomTokens={resetCustomTokens}
        />
        <div className="h-px bg-app-border" />
        <BackgroundSection appearance={appearance} onSetBackgroundId={setBackgroundId} />
      </div>
    </div>
  )
}
