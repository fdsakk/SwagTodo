import {
  CustomizeSection,
  DataSection,
  ThemeSection,
  WorkflowSection
} from "@renderer/components/settings"
import { useDomainStore } from "@renderer/store"
import { useShallow } from "zustand/react/shallow"

export default function SettingsPage(): React.JSX.Element {
  const {
    appearance,
    setThemeId,
    setCustomTokens,
    resetCustomTokens,
    uiScale,
    setUiScale,
    preferences,
    updatePreferences
  } = useDomainStore(
    useShallow((s) => ({
      appearance: s.appearance,
      setThemeId: s.setThemeId,
      setCustomTokens: s.setCustomTokens,
      resetCustomTokens: s.resetCustomTokens,
      uiScale: s.uiScale,
      setUiScale: s.setUiScale,
      preferences: s.preferences,
      updatePreferences: s.updatePreferences
    }))
  )

  return (
    <div className="px-6 pb-8 pt-5 max-w-5xl mx-auto">
      <h1 className="mb-6 text-lg font-semibold tracking-tight text-app-text">
        Settings
      </h1>
      <div className="space-y-8">
        <ThemeSection
          appearance={appearance}
          onSetThemeId={setThemeId}
          uiScale={uiScale}
          onSetUiScale={setUiScale}
        />
        <div className="h-px bg-app-border" />
        <CustomizeSection
          appearance={appearance}
          onSetCustomTokens={setCustomTokens}
          onResetCustomTokens={resetCustomTokens}
        />
        <div className="h-px bg-app-border" />
        <WorkflowSection
          onUpdate={updatePreferences}
          preferences={preferences}
        />
        <div className="h-px bg-app-border" />
        <DataSection onUpdate={updatePreferences} preferences={preferences} />
      </div>
    </div>
  )
}
