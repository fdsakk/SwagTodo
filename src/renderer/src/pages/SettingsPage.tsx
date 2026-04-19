import { useCallback, useEffect, useState } from 'react'
import useAppStore from '@renderer/store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import { ThemeSection } from '@renderer/components/settings/ThemeSection'
import { CustomizeSection } from '@renderer/components/settings/CustomizeSection'
import { BackgroundSection } from '@renderer/components/settings/BackgroundSection'
import { SyncSection } from '@renderer/components/settings/SyncSection'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { UI_SCALE_OPTIONS, type UiScale } from '@renderer/types'

interface SyncStatusState {
  connected: boolean
  lastSyncAt?: string
  lastError?: string
}

export default function SettingsPage(): React.JSX.Element {
  const {
    appearance,
    sync,
    setThemeId,
    setCustomTokens,
    resetCustomTokens,
    setBackgroundId,
    uiScale,
    setUiScale,
    setSyncSupabaseUrl,
    setSyncSupabaseAnonKey,
    setSyncWorkspaceId,
    refreshFromStorage
  } = useAppStore(
    useShallow((s) => ({
      appearance: s.appearance,
      sync: s.sync,
      setThemeId: s.setThemeId,
      setCustomTokens: s.setCustomTokens,
      resetCustomTokens: s.resetCustomTokens,
      setBackgroundId: s.setBackgroundId,
      uiScale: s.uiScale,
      setUiScale: s.setUiScale,
      setSyncSupabaseUrl: s.setSyncSupabaseUrl,
      setSyncSupabaseAnonKey: s.setSyncSupabaseAnonKey,
      setSyncWorkspaceId: s.setSyncWorkspaceId,
      refreshFromStorage: s.refreshFromStorage
    }))
  )
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>({ connected: false })

  const refreshSyncStatus = useCallback(async (): Promise<void> => {
    if (!window.api?.sync) return
    try {
      const status = await window.api.sync.getStatus()
      setSyncStatus({
        connected: status.connected,
        lastSyncAt: status.lastSyncAt,
        lastError: status.lastError
      })
    } catch (err) {
      setSyncStatus((prev) => ({
        ...prev,
        connected: false,
        lastError: err instanceof Error ? err.message : String(err)
      }))
    }
  }, [])

  useEffect(() => {
    void refreshSyncStatus()
  }, [refreshSyncStatus])

  const handleToggleSync = async (): Promise<void> => {
    if (!window.api?.sync) return
    const isEnabled = sync.mode === 'supabase'
    const supabaseUrl = sync.supabaseUrl.trim()
    const supabaseAnonKey = sync.supabaseAnonKey.trim()
    const workspaceId = sync.workspaceId.trim()
    if (!isEnabled && (!supabaseUrl || !supabaseAnonKey || !workspaceId)) return
    setSyncLoading(true)
    try {
      if (isEnabled) {
        await window.api.sync.turnOff()
      } else {
        await window.api.sync.turnOn({ supabaseUrl, supabaseAnonKey, workspaceId })
      }
      await refreshFromStorage()
      await refreshSyncStatus()
    } catch (err) {
      setSyncStatus((prev) => ({
        ...prev,
        connected: false,
        lastError: err instanceof Error ? err.message : String(err)
      }))
    } finally {
      setSyncLoading(false)
    }
  }

  const handleScaleChange = (value: string): void => {
    const nextScale = UI_SCALE_OPTIONS.find((scale): scale is UiScale => String(scale) === value)
    if (nextScale !== undefined) setUiScale(nextScale)
  }

  return (
    <div className="px-6 pb-8 pt-5 max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold tracking-tight text-app-text">Settings</h1>
      <div className="space-y-8">
        <SyncSection
          supabaseUrl={sync.supabaseUrl}
          supabaseAnonKey={sync.supabaseAnonKey}
          workspaceId={sync.workspaceId}
          mode={sync.mode}
          loading={syncLoading}
          status={syncStatus}
          onSupabaseUrlChange={setSyncSupabaseUrl}
          onSupabaseAnonKeyChange={setSyncSupabaseAnonKey}
          onWorkspaceIdChange={setSyncWorkspaceId}
          onToggleSync={handleToggleSync}
        />
        <div className="h-px bg-app-border" />
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-app-text">UI scale</h2>
            <p className="mt-0.5 text-xs text-app-text-muted">Adjust app zoom level</p>
          </div>
          <Select onValueChange={handleScaleChange} value={String(uiScale)}>
            <SelectTrigger className="h-9 w-28 border-app-border bg-app-card px-3 text-sm text-app-text">
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
        </section>
        <div className="h-px bg-app-border" />
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
