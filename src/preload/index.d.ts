import { ElectronAPI } from "@electron-toolkit/preload"
import type { AppState, TaskAttachment, WindowState } from "../shared/types"

type FeatureResult<T> =
  | { ok: true; value: T }
  | { ok: false; canceled?: boolean; error?: string }

interface RendererApi {
  storage: {
    loadState: () => Promise<AppState>
    saveState: (state: AppState) => Promise<void>
    savePartial: (patch: Partial<AppState>) => Promise<void>
  }
  backup: {
    create: () => Promise<FeatureResult<string>>
    openFolder: () => Promise<void>
    exportJson: () => Promise<FeatureResult<string>>
    exportCsv: () => Promise<FeatureResult<string>>
    importFile: () => Promise<FeatureResult<number>>
  }
  attachments: {
    add: () => Promise<TaskAttachment[]>
    open: (fileName: string) => Promise<void>
  }
  app: {
    notify: (title: string, body?: string) => Promise<void>
    onQuickAdd: (listener: () => void) => () => void
    onOpenTask: (listener: (taskId: string) => void) => () => void
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
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RendererApi
  }
}
