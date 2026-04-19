import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppState, SyncSettings, SyncStatus, WindowState } from '../shared/types'

interface RendererApi {
  storage: {
    loadState: () => Promise<AppState>
    saveState: (state: AppState) => Promise<void>
    savePartial: (patch: Partial<AppState>) => Promise<void>
  }
  ui: {
    getZoomFactor: () => Promise<number>
    setZoomFactor: (factor: number) => Promise<void>
  }
  sync: {
    turnOn: (
      params: Pick<SyncSettings, 'supabaseUrl' | 'supabaseAnonKey' | 'workspaceId'>
    ) => Promise<void>
    turnOff: () => Promise<void>
    getStatus: () => Promise<SyncStatus>
  }
  window: {
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<void>
    close: () => Promise<void>
    getState: () => Promise<WindowState>
    onStateChange: (listener: (state: WindowState) => void) => () => void
    platform: NodeJS.Platform
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RendererApi
  }
}
