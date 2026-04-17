import { ElectronAPI } from '@electron-toolkit/preload'

type Priority = 'p1' | 'p2' | 'p3' | 'p4'
type TaskStatus = 'todo' | 'in_progress' | 'done'
type UiScale = 100 | 110 | 125 | 150 | 175

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

interface AppState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  sessions: TaskSession[]
  uiScale?: UiScale
  isSidebarCollapsed?: boolean
}

interface WindowState {
  isMaximized: boolean
  isFullScreen: boolean
}

interface RendererApi {
  storage: {
    loadState: () => Promise<AppState>
    saveState: (state: AppState) => Promise<void>
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
