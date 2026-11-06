import type { UiScale } from "./defaults"

export type Priority = "p1" | "p2" | "p3" | "p4"
export type TaskStatus = "todo" | "in_progress" | "done"
export type { UiScale } from "./defaults"

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly"

export interface Recurrence {
  freq: RecurrenceFreq
  /** Repeat every N units (>= 1). */
  interval: number
  /** Weekly only: 0 = Sunday … 6 = Saturday. */
  weekdays?: number[]
  /** Next date counts from completion day instead of the due date. */
  fromCompletion?: boolean
}

export interface TaskAttachment {
  id: string
  /** Original file name shown to the user. */
  name: string
  /** Stored file name inside the app attachments folder. */
  fileName: string
  size: number
  addedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: string
  /** Local wall-clock time "HH:mm"; only meaningful with dueDate. */
  dueTime?: string
  recurrence?: Recurrence
  /** Ids of tasks that must be completed first. */
  blockedBy?: string[]
  attachments?: TaskAttachment[]
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

export type SavedViewStatus = "all" | "active" | "done"

export interface SavedView {
  id: string
  name: string
  query: string
  status: SavedViewStatus
  /** "all" | "no_project" | project id */
  projectId: string
  /** "all" | Priority */
  priority: string
}

export interface AppPreferences {
  notificationsEnabled: boolean
  reminderLeadMinutes: number
  closeToTray: boolean
  autoBackup: boolean
  backupKeep: number
  /** Electron accelerator, empty string disables it. */
  quickAddShortcut: string
  pomodoroWorkMinutes: number
  pomodoroBreakMinutes: number
  savedViews: SavedView[]
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
  preferences?: AppPreferences
}

export interface WindowState {
  isMaximized: boolean
  isFullScreen: boolean
}
