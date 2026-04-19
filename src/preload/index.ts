import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppState, SyncSettings, SyncStatus, WindowState } from '../shared/types'

const api = {
  storage: {
    loadState: (): Promise<AppState> => ipcRenderer.invoke('store:load'),
    saveState: (state: AppState): Promise<void> => ipcRenderer.invoke('store:save', state),
    savePartial: (patch: Partial<AppState>): Promise<void> =>
      ipcRenderer.invoke('store:savePartial', patch)
  },
  ui: {
    getZoomFactor: (): Promise<number> => ipcRenderer.invoke('ui:getZoomFactor'),
    setZoomFactor: (factor: number): Promise<void> => ipcRenderer.invoke('ui:setZoomFactor', factor)
  },
  sync: {
    turnOn: (
      params: Pick<SyncSettings, 'supabaseUrl' | 'supabaseAnonKey' | 'workspaceId'>
    ): Promise<void> => ipcRenderer.invoke('sync:turnOn', params),
    turnOff: (): Promise<void> => ipcRenderer.invoke('sync:turnOff'),
    getStatus: (): Promise<SyncStatus> => ipcRenderer.invoke('sync:getStatus')
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: (): Promise<void> => ipcRenderer.invoke('window:toggleMaximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    getState: (): Promise<WindowState> => ipcRenderer.invoke('window:getState'),
    onStateChange: (listener: (state: WindowState) => void): (() => void) => {
      const handler = (_: unknown, state: WindowState): void => listener(state)
      ipcRenderer.on('window:state', handler)
      return () => ipcRenderer.removeListener('window:state', handler)
    },
    platform: process.platform
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
