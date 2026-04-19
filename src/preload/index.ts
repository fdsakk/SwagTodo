import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type Priority = 'p1' | 'p2' | 'p3' | 'p4'
type TaskStatus = 'todo' | 'in_progress' | 'done'
type UiScale = 100 | 110 | 125 | 150 | 175
type SyncMode = 'local' | 'supabase'

interface SubTask {
  id: string
  title: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: string
  projectId?: string
  labels: string[]
  completed: boolean
  status: TaskStatus
  createdAt: string
  updatedAt: string
  order: number
  subTasks: SubTask[]
}

interface Project {
  id: string
  name: string
  color: string
  emoji?: string
  description?: string
  createdAt: string
}

interface Label {
  id: string
  name: string
  color: string
}

interface TaskSession {
  id: string
  taskId: string
  projectId: string
  startAt: string
  endAt: string
  createdAt: string
  updatedAt: string
}

interface TimeBlock {
  id: string
  label: string
  startAt: string
  endAt: string
  createdAt: string
}

interface AppearanceSettings {
  themeId: string
  customTokens: Record<string, string>
  backgroundId: string
}

interface SyncSettings {
  mode: SyncMode
  supabaseUrl: string
  supabaseAnonKey: string
  workspaceId: string
}

interface SyncStatus {
  mode: SyncMode
  connected: boolean
  lastSyncAt?: string
  lastError?: string
}

interface MedicationLog {
  id: string
  medId: string
  medName: string
  dose: number
  takenAt: string
  createdAt: string
}

interface AppState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  sessions: TaskSession[]
  timeBlocks: TimeBlock[]
  medications?: MedicationLog[]
  pkSettings?: unknown
  uiScale?: UiScale
  isSidebarCollapsed?: boolean
  appearance?: AppearanceSettings
  sync?: SyncSettings
}

interface WindowState {
  isMaximized: boolean
  isFullScreen: boolean
}

const api = {
  storage: {
    loadState: (): Promise<AppState> => ipcRenderer.invoke('store:load'),
    saveState: (state: AppState): Promise<void> => ipcRenderer.invoke('store:save', state)
  },
  ui: {
    getZoomFactor: (): Promise<number> => ipcRenderer.invoke('ui:getZoomFactor'),
    setZoomFactor: (factor: number): Promise<void> => ipcRenderer.invoke('ui:setZoomFactor', factor)
  },
  sync: {
    turnOn: (params: Pick<SyncSettings, 'supabaseUrl' | 'supabaseAnonKey' | 'workspaceId'>): Promise<void> =>
      ipcRenderer.invoke('sync:turnOn', params),
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
