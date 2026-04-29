import type { UiScale } from "./defaults"

export type Priority = "p1" | "p2" | "p3" | "p4"
export type TaskStatus = "todo" | "in_progress" | "done"
export type { UiScale } from "./defaults"

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: string
  projectId?: string
  labels: string[]
  completed: boolean
  status: TaskStatus
  completedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
  order: number
  subTasks: SubTask[]
}

export interface Project {
  id: string
  name: string
  color: string
  emoji?: string
  description?: string
  createdAt: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface TaskSession {
  id: string
  taskId: string
  projectId: string
  startAt: string
  endAt: string
  createdAt: string
  updatedAt: string
}

export interface TimeBlock {
  id: string
  label: string
  startAt: string
  endAt: string
  createdAt: string
}

export interface AppearanceSettings {
  themeId: string
  customTokens: Record<string, string>
  customTokensByTheme?: Record<string, Record<string, string>>
}

export interface MedicationLog {
  id: string
  medId: string
  medName: string
  dose: number
  takenAt: string
  createdAt: string
}

export interface AppState {
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
}

export interface WindowState {
  isMaximized: boolean
  isFullScreen: boolean
}
