import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'
import type { AppState, Label, Task } from '../../shared/types'
import { DEFAULT_UI_SCALE } from '../../shared/defaults'
import { defaultAppState, mergeAppState, normalizeAppState } from './appState'

type SqliteDatabase = Database.Database

type StoredTaskRow = {
  id: string
  title: string
  description: string | null
  priority: Task['priority']
  due_date: string | null
  project_id: string | null
  completed: number
  status: Task['status']
  completed_at: string | null
  created_at: string
  updated_at: string
  sort_order: number
  position: number
}

type StoredSubTaskRow = {
  task_id: string
  id: string
  title: string
  completed: number
  position: number
}

type StoredTaskLabelRow = {
  task_id: string
  label_id: string
  position: number
}

type StoredProjectRow = {
  id: string
  name: string
  color: string
  emoji: string | null
  description: string | null
  created_at: string
  position: number
}

type StoredLabelRow = Label & { position: number }

type StoredSessionRow = {
  id: string
  task_id: string
  project_id: string
  start_at: string
  end_at: string
  created_at: string
  updated_at: string
  position: number
}

type StoredTimeBlockRow = {
  id: string
  label: string
  start_at: string
  end_at: string
  created_at: string
  position: number
}

type StoredMedicationRow = {
  id: string
  med_id: string
  med_name: string
  dose: number
  taken_at: string
  created_at: string
  position: number
}

type StoredSettingRow = { key: string; value: string }

type LegacyElectronStore = { appState?: unknown }

type StoredTaskAggregateRow = StoredTaskRow & {
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

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  due_date TEXT,
  project_id TEXT,
  completed INTEGER NOT NULL,
  status TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sort_order REAL NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS task_subtasks (
  task_id TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (task_id, id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  created_at TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS task_labels (
  task_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (task_id, label_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS time_blocks (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  med_id TEXT NOT NULL,
  med_name TEXT NOT NULL,
  dose REAL NOT NULL,
  taken_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_id ON task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
`

const SETTINGS_KEYS = ['pkSettings', 'uiScale', 'isSidebarCollapsed', 'appearance'] as const
const LEGACY_STORE_FILES = ['todoist-clone.json', 'config.json'] as const

const parseSetting = <T>(
  rows: Map<string, string>,
  key: (typeof SETTINGS_KEYS)[number]
): T | undefined => {
  const raw = rows.get(key)
  if (raw === undefined) return undefined
  try {
    return JSON.parse(raw) as T
  } catch (error) {
    console.error('[storage] failed to parse SQLite setting', { key, error })
    return undefined
  }
}

const parseJsonArray = <T>(raw: string, fallback: T[], context: string): T[] => {
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch (error) {
    console.error(`[storage] failed to parse ${context}`, error)
    return fallback
  }
}

const inflateTaskRows = (rows: StoredTaskAggregateRow[]): Task[] =>
  rows.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    priority: task.priority,
    dueDate: task.due_date ?? undefined,
    projectId: task.project_id ?? undefined,
    labels: parseJsonArray<string>(task.labels_json, [], `task labels for ${task.id}`),
    completed: Boolean(task.completed),
    status: task.status,
    completedAt: task.completed_at ?? undefined,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    order: task.sort_order,
    subTasks: parseJsonArray<Task['subTasks'][number]>(
      task.subtasks_json,
      [],
      `task subtasks for ${task.id}`
    )
  }))

export const parseLegacyElectronStore = (raw: string): AppState | null => {
  try {
    const parsed = JSON.parse(raw) as LegacyElectronStore
    if (!parsed || typeof parsed !== 'object' || !('appState' in parsed)) return null
    return normalizeAppState(parsed.appState)
  } catch (error) {
    console.error('[storage] failed to parse legacy electron-store payload', error)
    return null
  }
}

const readLegacyElectronStore = (dbPath: string): AppState | null => {
  const userDataDir = dirname(dbPath)

  for (const fileName of LEGACY_STORE_FILES) {
    const filePath = join(userDataDir, fileName)
    if (!existsSync(filePath)) continue

    let raw = ''
    try {
      raw = readFileSync(filePath, 'utf8')
    } catch (error) {
      console.error('[storage] failed to read legacy electron-store file', { filePath, error })
      continue
    }

    const state = parseLegacyElectronStore(raw)
    if (!state) continue

    console.info('[storage] migrated legacy electron-store data', { from: filePath, to: dbPath })
    return state
  }

  return null
}

export const serializeAppState = (state: AppState): SqliteStateSnapshot => {
  const normalized = normalizeAppState(state)
  const snapshot: SqliteStateSnapshot = {
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

  normalized.tasks.forEach((task, position) => {
    snapshot.tasks.push({
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      priority: task.priority,
      due_date: task.dueDate ?? null,
      project_id: task.projectId ?? null,
      completed: task.completed ? 1 : 0,
      status: task.status,
      completed_at: task.completedAt ?? null,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      sort_order: task.order,
      position
    })

    task.subTasks.forEach((subTask, subTaskPosition) => {
      snapshot.taskSubtasks.push({
        task_id: task.id,
        id: subTask.id,
        title: subTask.title,
        completed: subTask.completed ? 1 : 0,
        position: subTaskPosition
      })
    })

    task.labels.forEach((labelId, labelPosition) => {
      snapshot.taskLabels.push({
        task_id: task.id,
        label_id: labelId,
        position: labelPosition
      })
    })
  })

  normalized.projects.forEach((project, position) => {
    snapshot.projects.push({
      id: project.id,
      name: project.name,
      color: project.color,
      emoji: project.emoji ?? null,
      description: project.description ?? null,
      created_at: project.createdAt,
      position
    })
  })

  normalized.labels.forEach((label, position) => {
    snapshot.labels.push({ ...label, position })
  })

  normalized.sessions.forEach((session, position) => {
    snapshot.sessions.push({
      id: session.id,
      task_id: session.taskId,
      project_id: session.projectId,
      start_at: session.startAt,
      end_at: session.endAt,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
      position
    })
  })

  normalized.timeBlocks.forEach((timeBlock, position) => {
    snapshot.timeBlocks.push({
      id: timeBlock.id,
      label: timeBlock.label,
      start_at: timeBlock.startAt,
      end_at: timeBlock.endAt,
      created_at: timeBlock.createdAt,
      position
    })
  })

  normalized.medications?.forEach((medication, position) => {
    snapshot.medications.push({
      id: medication.id,
      med_id: medication.medId,
      med_name: medication.medName,
      dose: medication.dose,
      taken_at: medication.takenAt,
      created_at: medication.createdAt,
      position
    })
  })

  SETTINGS_KEYS.forEach((key) => {
    const value = normalized[key]
    if (value === undefined) return
    snapshot.settings.push({ key, value: JSON.stringify(value) })
  })

  return snapshot
}

export const deserializeAppState = (snapshot: SqliteStateSnapshot): AppState => {
  const subTasksByTaskId = new Map<string, Task['subTasks']>()
  snapshot.taskSubtasks.forEach((subTask) => {
    const list = subTasksByTaskId.get(subTask.task_id) ?? []
    list.push({
      id: subTask.id,
      title: subTask.title,
      completed: Boolean(subTask.completed)
    })
    subTasksByTaskId.set(subTask.task_id, list)
  })

  const labelsByTaskId = new Map<string, string[]>()
  snapshot.taskLabels.forEach((label) => {
    const list = labelsByTaskId.get(label.task_id) ?? []
    list.push(label.label_id)
    labelsByTaskId.set(label.task_id, list)
  })

  const settings = new Map<string, string>(
    snapshot.settings.map((row): [string, string] => [row.key, row.value])
  )

  return normalizeAppState({
    ...defaultAppState,
    tasks: snapshot.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? undefined,
      priority: task.priority,
      dueDate: task.due_date ?? undefined,
      projectId: task.project_id ?? undefined,
      labels: labelsByTaskId.get(task.id) ?? [],
      completed: Boolean(task.completed),
      status: task.status,
      completedAt: task.completed_at ?? undefined,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      order: task.sort_order,
      subTasks: subTasksByTaskId.get(task.id) ?? []
    })),
    projects: snapshot.projects.map((project) => ({
      id: project.id,
      name: project.name,
      color: project.color,
      emoji: project.emoji ?? undefined,
      description: project.description ?? undefined,
      createdAt: project.created_at
    })),
    labels: snapshot.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color
    })),
    sessions: snapshot.sessions.map((session) => ({
      id: session.id,
      taskId: session.task_id,
      projectId: session.project_id,
      startAt: session.start_at,
      endAt: session.end_at,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    })),
    timeBlocks: snapshot.timeBlocks.map((timeBlock) => ({
      id: timeBlock.id,
      label: timeBlock.label,
      startAt: timeBlock.start_at,
      endAt: timeBlock.end_at,
      createdAt: timeBlock.created_at
    })),
    medications: snapshot.medications.map((medication) => ({
      id: medication.id,
      medId: medication.med_id,
      medName: medication.med_name,
      dose: medication.dose,
      takenAt: medication.taken_at,
      createdAt: medication.created_at
    })),
    pkSettings: parseSetting(settings, 'pkSettings'),
    uiScale: parseSetting(settings, 'uiScale'),
    isSidebarCollapsed: parseSetting(settings, 'isSidebarCollapsed'),
    appearance: parseSetting(settings, 'appearance')
  })
}

const buildChildJson = (
  rows: Array<{ task_id: string }>,
  stringify: (r: unknown) => string
): Map<string, string> => {
  const m = new Map<string, string>()
  for (const row of rows) {
    m.set(row.task_id, (m.get(row.task_id) ?? '') + stringify(row))
  }
  return m
}

// Returns the set of task IDs whose row data or child rows changed between two snapshots.
export const changedTaskIds = (
  prev: SqliteStateSnapshot,
  next: SqliteStateSnapshot
): Set<string> => {
  const prevTaskJson = new Map(prev.tasks.map((t) => [t.id, JSON.stringify(t)]))
  const prevSubJson = buildChildJson(prev.taskSubtasks, JSON.stringify)
  const prevLblJson = buildChildJson(prev.taskLabels, JSON.stringify)
  const nextSubJson = buildChildJson(next.taskSubtasks, JSON.stringify)
  const nextLblJson = buildChildJson(next.taskLabels, JSON.stringify)

  const changed = new Set<string>()
  for (const t of next.tasks) {
    if (
      prevTaskJson.get(t.id) !== JSON.stringify(t) ||
      (prevSubJson.get(t.id) ?? '') !== (nextSubJson.get(t.id) ?? '') ||
      (prevLblJson.get(t.id) ?? '') !== (nextLblJson.get(t.id) ?? '')
    ) {
      changed.add(t.id)
    }
  }
  // Include removed task IDs so their children get cleaned up if FK cascade fails
  const nextTaskIds = new Set(next.tasks.map((t) => t.id))
  for (const t of prev.tasks) {
    if (!nextTaskIds.has(t.id)) changed.add(t.id)
  }
  return changed
}

const changedIds = <T extends { id: string }>(prev: T[], next: T[]): boolean => {
  if (prev.length !== next.length) return true
  const prevMap = new Map(prev.map((r) => [r.id, JSON.stringify(r)]))
  return next.some((r) => prevMap.get(r.id) !== JSON.stringify(r))
}

const EMPTY_SNAPSHOT: SqliteStateSnapshot = {
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

export class SqliteAppStorage {
  private readonly db: SqliteDatabase
  private readonly writeDeltaTx: (prev: SqliteStateSnapshot, next: SqliteStateSnapshot) => void
  private cachedState: AppState = defaultAppState
  private cachedSnapshot: SqliteStateSnapshot = EMPTY_SNAPSHOT

  constructor(path: string) {
    const isNewDatabase = !existsSync(path)
    this.db = new Database(path)
    this.db.exec(SCHEMA)

    const selectTasks = this.db.prepare<[], StoredTaskAggregateRow>(`
      SELECT
        tasks.*,
        COALESCE((
          SELECT json_group_array(
            json_object(
              'id', ordered_subtasks.id,
              'title', ordered_subtasks.title,
              'completed', ordered_subtasks.completed
            )
          )
          FROM (
            SELECT id, title, completed
            FROM task_subtasks
            WHERE task_id = tasks.id
            ORDER BY position ASC
          ) AS ordered_subtasks
        ), '[]') AS subtasks_json,
        COALESCE((
          SELECT json_group_array(ordered_labels.label_id)
          FROM (
            SELECT label_id
            FROM task_labels
            WHERE task_id = tasks.id
            ORDER BY position ASC
          ) AS ordered_labels
        ), '[]') AS labels_json
      FROM tasks
      ORDER BY position ASC
    `)
    const selectProjects = this.db.prepare<[], StoredProjectRow>(
      'SELECT * FROM projects ORDER BY position ASC'
    )
    const selectLabels = this.db.prepare<[], StoredLabelRow>(
      'SELECT * FROM labels ORDER BY position ASC'
    )
    const selectSessions = this.db.prepare<[], StoredSessionRow>(
      'SELECT * FROM sessions ORDER BY position ASC'
    )
    const selectTimeBlocks = this.db.prepare<[], StoredTimeBlockRow>(
      'SELECT * FROM time_blocks ORDER BY position ASC'
    )
    const selectMedications = this.db.prepare<[], StoredMedicationRow>(
      'SELECT * FROM medications ORDER BY position ASC'
    )
    const selectSettings = this.db.prepare<[], StoredSettingRow>('SELECT * FROM settings')

    const readStateFromDb = (): AppState => {
      const settings = new Map<string, string>(
        selectSettings.all().map((row): [string, string] => [row.key, row.value])
      )

      return normalizeAppState({
        ...defaultAppState,
        tasks: inflateTaskRows(selectTasks.all()),
        projects: selectProjects.all().map((project) => ({
          id: project.id,
          name: project.name,
          color: project.color,
          emoji: project.emoji ?? undefined,
          description: project.description ?? undefined,
          createdAt: project.created_at
        })),
        labels: selectLabels.all().map((label) => ({
          id: label.id,
          name: label.name,
          color: label.color
        })),
        sessions: selectSessions.all().map((session) => ({
          id: session.id,
          taskId: session.task_id,
          projectId: session.project_id,
          startAt: session.start_at,
          endAt: session.end_at,
          createdAt: session.created_at,
          updatedAt: session.updated_at
        })),
        timeBlocks: selectTimeBlocks.all().map((timeBlock) => ({
          id: timeBlock.id,
          label: timeBlock.label,
          startAt: timeBlock.start_at,
          endAt: timeBlock.end_at,
          createdAt: timeBlock.created_at
        })),
        medications: selectMedications.all().map((medication) => ({
          id: medication.id,
          medId: medication.med_id,
          medName: medication.med_name,
          dose: medication.dose,
          takenAt: medication.taken_at,
          createdAt: medication.created_at
        })),
        pkSettings: parseSetting(settings, 'pkSettings'),
        uiScale: parseSetting(settings, 'uiScale'),
        isSidebarCollapsed: parseSetting(settings, 'isSidebarCollapsed'),
        appearance: parseSetting(settings, 'appearance')
      })
    }

    // ── upsert / delta-delete statements ──────────────────────────────────────
    const upsertTask = this.db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, title, description, priority, due_date, project_id, completed, status,
        completed_at, created_at, updated_at, sort_order, position
      ) VALUES (
        @id, @title, @description, @priority, @due_date, @project_id, @completed, @status,
        @completed_at, @created_at, @updated_at, @sort_order, @position
      )
    `)
    const deleteTasksNotIn = this.db.prepare(
      `DELETE FROM tasks WHERE id NOT IN (SELECT value FROM json_each(?))`
    )
    const deleteSubtasksForTask = this.db.prepare('DELETE FROM task_subtasks WHERE task_id = ?')
    const insertSubTask = this.db.prepare(`
      INSERT INTO task_subtasks (task_id, id, title, completed, position)
      VALUES (@task_id, @id, @title, @completed, @position)
    `)
    const deleteLabelsForTask = this.db.prepare('DELETE FROM task_labels WHERE task_id = ?')
    const insertTaskLabel = this.db.prepare(`
      INSERT INTO task_labels (task_id, label_id, position)
      VALUES (@task_id, @label_id, @position)
    `)
    const upsertProject = this.db.prepare(`
      INSERT OR REPLACE INTO projects (id, name, color, emoji, description, created_at, position)
      VALUES (@id, @name, @color, @emoji, @description, @created_at, @position)
    `)
    const deleteProjectsNotIn = this.db.prepare(
      `DELETE FROM projects WHERE id NOT IN (SELECT value FROM json_each(?))`
    )
    const upsertLabel = this.db.prepare(`
      INSERT OR REPLACE INTO labels (id, name, color, position)
      VALUES (@id, @name, @color, @position)
    `)
    const deleteLabelsNotIn = this.db.prepare(
      `DELETE FROM labels WHERE id NOT IN (SELECT value FROM json_each(?))`
    )
    const upsertSession = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (id, task_id, project_id, start_at, end_at, created_at, updated_at, position)
      VALUES (@id, @task_id, @project_id, @start_at, @end_at, @created_at, @updated_at, @position)
    `)
    const deleteSessionsNotIn = this.db.prepare(
      `DELETE FROM sessions WHERE id NOT IN (SELECT value FROM json_each(?))`
    )
    const upsertTimeBlock = this.db.prepare(`
      INSERT OR REPLACE INTO time_blocks (id, label, start_at, end_at, created_at, position)
      VALUES (@id, @label, @start_at, @end_at, @created_at, @position)
    `)
    const deleteTimeBlocksNotIn = this.db.prepare(
      `DELETE FROM time_blocks WHERE id NOT IN (SELECT value FROM json_each(?))`
    )
    const upsertMedication = this.db.prepare(`
      INSERT OR REPLACE INTO medications (id, med_id, med_name, dose, taken_at, created_at, position)
      VALUES (@id, @med_id, @med_name, @dose, @taken_at, @created_at, @position)
    `)
    const deleteMedicationsNotIn = this.db.prepare(
      `DELETE FROM medications WHERE id NOT IN (SELECT value FROM json_each(?))`
    )
    const upsertSetting = this.db.prepare(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (@key, @value)`
    )

    this.writeDeltaTx = this.db.transaction(
      (prev: SqliteStateSnapshot, next: SqliteStateSnapshot) => {
        const taskIds = JSON.stringify(next.tasks.map((t) => t.id))
        const changed = changedTaskIds(prev, next)
        for (const t of next.tasks) {
          if (changed.has(t.id)) upsertTask.run(t)
        }
        deleteTasksNotIn.run(next.tasks.length ? taskIds : '[]')
        for (const taskId of changed) {
          deleteSubtasksForTask.run(taskId)
          deleteLabelsForTask.run(taskId)
        }
        for (const row of next.taskSubtasks) {
          if (changed.has(row.task_id)) insertSubTask.run(row)
        }
        for (const row of next.taskLabels) {
          if (changed.has(row.task_id)) insertTaskLabel.run(row)
        }

        if (changedIds(prev.projects, next.projects)) {
          for (const row of next.projects) upsertProject.run(row)
          deleteProjectsNotIn.run(
            next.projects.length ? JSON.stringify(next.projects.map((p) => p.id)) : '[]'
          )
        }

        if (changedIds(prev.labels, next.labels)) {
          for (const row of next.labels) upsertLabel.run(row)
          deleteLabelsNotIn.run(
            next.labels.length ? JSON.stringify(next.labels.map((l) => l.id)) : '[]'
          )
        }

        if (changedIds(prev.sessions, next.sessions)) {
          for (const row of next.sessions) upsertSession.run(row)
          deleteSessionsNotIn.run(
            next.sessions.length ? JSON.stringify(next.sessions.map((s) => s.id)) : '[]'
          )
        }

        if (changedIds(prev.timeBlocks, next.timeBlocks)) {
          for (const row of next.timeBlocks) upsertTimeBlock.run(row)
          deleteTimeBlocksNotIn.run(
            next.timeBlocks.length ? JSON.stringify(next.timeBlocks.map((b) => b.id)) : '[]'
          )
        }

        if (changedIds(prev.medications, next.medications)) {
          for (const row of next.medications) upsertMedication.run(row)
          deleteMedicationsNotIn.run(
            next.medications.length ? JSON.stringify(next.medications.map((m) => m.id)) : '[]'
          )
        }

        for (const row of next.settings) upsertSetting.run(row)
      }
    )

    const migratedState = isNewDatabase ? readLegacyElectronStore(path) : null
    this.cachedState = migratedState ?? readStateFromDb()
    this.cachedSnapshot = serializeAppState(this.cachedState)
    if (migratedState) this.writeDeltaTx(EMPTY_SNAPSHOT, this.cachedSnapshot)
  }

  loadState(): AppState {
    return this.cachedState
  }

  loadUiScale(): AppState['uiScale'] {
    return this.cachedState.uiScale ?? DEFAULT_UI_SCALE
  }

  saveState(nextState: AppState): void {
    this.writeState(nextState)
  }

  savePartial(patch: Partial<AppState>): void {
    this.writeState(mergeAppState(this.cachedState, patch))
  }

  close(): void {
    this.db.close()
  }

  private writeState(state: AppState): void {
    const normalized = normalizeAppState(state)
    const next = serializeAppState(normalized)
    this.writeDeltaTx(this.cachedSnapshot, next)
    this.cachedState = normalized
    this.cachedSnapshot = next
  }
}

export const createSqliteAppStorage = (path: string): SqliteAppStorage => new SqliteAppStorage(path)
