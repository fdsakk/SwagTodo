import type { Label, Task } from '../../../shared/types'

export type StoredTaskRow = {
  id: string
  title: string
  description: string | null
  priority: Task['priority']
  due_date: string | null
  project_id: string | null
  completed: number
  status: Task['status']
  completed_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  sort_order: number
  position: number
}

export type StoredSubTaskRow = {
  task_id: string
  id: string
  title: string
  completed: number
  position: number
}

export type StoredTaskLabelRow = {
  task_id: string
  label_id: string
  position: number
}

export type StoredProjectRow = {
  id: string
  name: string
  color: string
  emoji: string | null
  description: string | null
  created_at: string
  position: number
}

export type StoredLabelRow = Label & { position: number }

export type StoredSessionRow = {
  id: string
  task_id: string
  project_id: string
  start_at: string
  end_at: string
  created_at: string
  updated_at: string
  position: number
}

export type StoredTimeBlockRow = {
  id: string
  label: string
  start_at: string
  end_at: string
  created_at: string
  position: number
}

export type StoredMedicationRow = {
  id: string
  med_id: string
  med_name: string
  dose: number
  taken_at: string
  created_at: string
  position: number
}

export type StoredSettingRow = { key: string; value: string }

export type StoredTaskAggregateRow = StoredTaskRow & {
  subtasks_json: string
  labels_json: string
}

export interface SqliteStateSnapshot {
  tasks: StoredTaskRow[]
  taskSubtasks: StoredSubTaskRow[]
  taskLabels: StoredTaskLabelRow[]
  projects: StoredProjectRow[]
  labels: StoredLabelRow[]
  sessions: StoredSessionRow[]
  timeBlocks: StoredTimeBlockRow[]
  medications: StoredMedicationRow[]
  settings: StoredSettingRow[]
}

export const SETTINGS_KEYS = ['pkSettings', 'uiScale', 'isSidebarCollapsed', 'appearance'] as const

export const LEGACY_STORE_FILES = ['todoist-clone.json', 'config.json'] as const

export const EMPTY_SNAPSHOT: SqliteStateSnapshot = {
  tasks: [],
  taskSubtasks: [],
  taskLabels: [],
  projects: [],
  labels: [],
  sessions: [],
  timeBlocks: [],
  medications: [],
  settings: []
}
