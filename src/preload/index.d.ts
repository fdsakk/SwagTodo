import { ElectronAPI } from "@electron-toolkit/preload"
import type {
  AppState,
  GoogleAuthStatus,
  GoogleSyncSummary,
  WindowState
} from "../shared/types"

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
  window: {
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<void>
    close: () => Promise<void>
    getState: () => Promise<WindowState>
    onStateChange: (listener: (state: WindowState) => void) => () => void
    platform: NodeJS.Platform
  }
  google: {
    authStatus: () => Promise<GoogleAuthStatus>
    authStart: () => Promise<GoogleAuthStatus>
    signout: () => Promise<void>
    syncNow: () => Promise<GoogleSyncSummary>
    push: (eventId: string, op: "insert" | "patch" | "delete") => Promise<void>
    onSyncChanged: (listener: () => void) => () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RendererApi
  }
}
