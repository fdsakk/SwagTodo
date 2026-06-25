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

export type CalendarEventSyncStatus = "synced" | "pending" | "local_only"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  color?: string
  startAt: string
  endAt: string
  allDay: boolean
  /** Raw RRULE string without the "RRULE:" prefix. Undefined = single event. */
  rrule?: string
  /** For an overridden recurring instance: the local id of the master event. */
  recurrenceId?: string
  // Google sync bookkeeping — undefined while the event is purely local.
  googleCalendarId?: string
  /** Google's event id (NOT our `id`, which is always a uuid). */
  googleEventId?: string
  etag?: string
  syncStatus?: CalendarEventSyncStatus
  /** Soft-delete tombstone for outbound sync. */
  deletedAt?: string
  createdAt: string
  updatedAt: string
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
  calendarEvents?: CalendarEvent[]
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

export interface GoogleAuthStatus {
  connected: boolean
  email?: string
  lastSyncAt?: string
  /** False when OS-level secret encryption is unavailable (e.g. no keyring). */
  encryptionAvailable: boolean
}

export interface GoogleSyncSummary {
  upserted: number
  deleted: number
  skipped: number
}
