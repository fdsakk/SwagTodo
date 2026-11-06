import { electronAPI } from "@electron-toolkit/preload"
import { contextBridge, ipcRenderer } from "electron"
import type { AppState, TaskAttachment, WindowState } from "../shared/types"

type FeatureResult<T> =
  | { ok: true; value: T }
  | { ok: false; canceled?: boolean; error?: string }

const subscribe = <T extends unknown[]>(
  channel: string,
  listener: (...args: T) => void
): (() => void) => {
  const handler = (_: unknown, ...args: unknown[]): void =>
    listener(...(args as T))
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api = {
  storage: {
    loadState: (): Promise<AppState> => ipcRenderer.invoke("store:load"),
    saveState: (state: AppState): Promise<void> =>
      ipcRenderer.invoke("store:save", state),
    savePartial: (patch: Partial<AppState>): Promise<void> =>
      ipcRenderer.invoke("store:savePartial", patch)
  },
  backup: {
    create: (): Promise<FeatureResult<string>> =>
      ipcRenderer.invoke("backup:create"),
    openFolder: (): Promise<void> => ipcRenderer.invoke("backup:openFolder"),
    exportJson: (): Promise<FeatureResult<string>> =>
      ipcRenderer.invoke("backup:exportJson"),
    exportCsv: (): Promise<FeatureResult<string>> =>
      ipcRenderer.invoke("backup:exportCsv"),
    importFile: (): Promise<FeatureResult<number>> =>
      ipcRenderer.invoke("backup:import")
  },
  attachments: {
    add: (): Promise<TaskAttachment[]> => ipcRenderer.invoke("attachments:add"),
    open: (fileName: string): Promise<void> =>
      ipcRenderer.invoke("attachments:open", fileName)
  },
  app: {
    notify: (title: string, body?: string): Promise<void> =>
      ipcRenderer.invoke("app:notify", { title, body }),
    onQuickAdd: (listener: () => void): (() => void) =>
      subscribe("app:quickAdd", listener),
    onOpenTask: (listener: (taskId: string) => void): (() => void) =>
      subscribe<[string]>("app:openTask", listener)
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
