import { electronAPI } from "@electron-toolkit/preload"
import { contextBridge, ipcRenderer } from "electron"
import type {
  AppState,
  GoogleAuthStatus,
  GoogleSyncSummary,
  WindowState
} from "../shared/types"

const api = {
  storage: {
    loadState: (): Promise<AppState> => ipcRenderer.invoke("store:load"),
    saveState: (state: AppState): Promise<void> =>
      ipcRenderer.invoke("store:save", state),
    savePartial: (patch: Partial<AppState>): Promise<void> =>
      ipcRenderer.invoke("store:savePartial", patch)
  },
  ui: {
    getZoomFactor: (): Promise<number> =>
      ipcRenderer.invoke("ui:getZoomFactor"),
    setZoomFactor: (factor: number): Promise<void> =>
      ipcRenderer.invoke("ui:setZoomFactor", factor)
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke("window:minimize"),
    toggleMaximize: (): Promise<void> =>
      ipcRenderer.invoke("window:toggleMaximize"),
    close: (): Promise<void> => ipcRenderer.invoke("window:close"),
    getState: (): Promise<WindowState> => ipcRenderer.invoke("window:getState"),
    onStateChange: (listener: (state: WindowState) => void): (() => void) => {
      const handler = (_: unknown, state: WindowState): void => listener(state)
      ipcRenderer.on("window:state", handler)
      return () => ipcRenderer.removeListener("window:state", handler)
    },
    platform: process.platform
  },
  google: {
    authStatus: (): Promise<GoogleAuthStatus> =>
      ipcRenderer.invoke("google:auth:status"),
    authStart: (): Promise<GoogleAuthStatus> =>
      ipcRenderer.invoke("google:auth:start"),
    signout: (): Promise<void> => ipcRenderer.invoke("google:auth:signout"),
    syncNow: (): Promise<GoogleSyncSummary> =>
      ipcRenderer.invoke("google:sync:run"),
    push: (eventId: string, op: "insert" | "patch" | "delete"): Promise<void> =>
      ipcRenderer.invoke("google:push", eventId, op),
    onSyncChanged: (listener: () => void): (() => void) => {
      const handler = (): void => listener()
      ipcRenderer.on("google:sync:changed", handler)
      return () => ipcRenderer.removeListener("google:sync:changed", handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI)
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
