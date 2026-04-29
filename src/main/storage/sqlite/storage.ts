import { existsSync } from 'node:fs'
import Database from 'better-sqlite3'
import type { AppState } from '../../../shared/types'
import { DEFAULT_UI_SCALE } from '../../../shared/defaults'
import { defaultAppState, mergeAppState, normalizeAppState } from '../appState'
import { SCHEMA } from './schema'
import {
  EMPTY_SNAPSHOT,
  type SqliteStateSnapshot,
  type StoredLabelRow,
  type StoredMedicationRow,
  type StoredProjectRow,
  type StoredSessionRow,
  type StoredSettingRow,
  type StoredTaskAggregateRow,
  type StoredTimeBlockRow
} from './types'
import {
  changedIds,
  changedTaskChildIds,
  changedTaskIds,
  inflateTaskRows,
  parseSetting,
  readLegacyElectronStore,
  serializeAppState
} from './serialize'

type SqliteDatabase = Database.Database

export class SqliteAppStorage {
  private readonly db: SqliteDatabase
  private readonly writeDeltaTx: (prev: SqliteStateSnapshot, next: SqliteStateSnapshot) => void
  private cachedState: AppState = defaultAppState
  private cachedSnapshot: SqliteStateSnapshot = EMPTY_SNAPSHOT

  constructor(path: string) {
    const isNewDatabase = !existsSync(path)
    this.db = new Database(path)
    this.db.exec(SCHEMA)
    const taskColumns = this.db
      .prepare<[], { name: string }>('PRAGMA table_info(tasks)')
      .all()
      .map((column) => column.name)
    if (!taskColumns.includes('archived_at')) {
      this.db.exec('ALTER TABLE tasks ADD COLUMN archived_at TEXT')
    }

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

    const upsertTask = this.db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, title, description, priority, due_date, project_id, completed, status,
        completed_at, archived_at, created_at, updated_at, sort_order, position
      ) VALUES (
        @id, @title, @description, @priority, @due_date, @project_id, @completed, @status,
        @completed_at, @archived_at, @created_at, @updated_at, @sort_order, @position
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

    const idsJson = <T extends { id: string }>(rows: T[]): string =>
      rows.length ? JSON.stringify(rows.map((r) => r.id)) : '[]'

    this.writeDeltaTx = this.db.transaction(
      (prev: SqliteStateSnapshot, next: SqliteStateSnapshot) => {
        const taskIds = JSON.stringify(next.tasks.map((t) => t.id))
        const changed = changedTaskIds(prev, next)
        const changedChildren = changedTaskChildIds(prev, next)
        for (const t of next.tasks) {
          if (changed.has(t.id)) upsertTask.run(t)
        }
        deleteTasksNotIn.run(next.tasks.length ? taskIds : '[]')
        for (const taskId of changedChildren) {
          deleteSubtasksForTask.run(taskId)
          deleteLabelsForTask.run(taskId)
        }
        for (const row of next.taskSubtasks) {
          if (changedChildren.has(row.task_id)) insertSubTask.run(row)
        }
        for (const row of next.taskLabels) {
          if (changedChildren.has(row.task_id)) insertTaskLabel.run(row)
        }

        if (changedIds(prev.projects, next.projects)) {
          for (const row of next.projects) upsertProject.run(row)
          deleteProjectsNotIn.run(idsJson(next.projects))
        }

        if (changedIds(prev.labels, next.labels)) {
          for (const row of next.labels) upsertLabel.run(row)
          deleteLabelsNotIn.run(idsJson(next.labels))
        }

        if (changedIds(prev.sessions, next.sessions)) {
          for (const row of next.sessions) upsertSession.run(row)
          deleteSessionsNotIn.run(idsJson(next.sessions))
        }

        if (changedIds(prev.timeBlocks, next.timeBlocks)) {
          for (const row of next.timeBlocks) upsertTimeBlock.run(row)
          deleteTimeBlocksNotIn.run(idsJson(next.timeBlocks))
        }

        if (changedIds(prev.medications, next.medications)) {
          for (const row of next.medications) upsertMedication.run(row)
          deleteMedicationsNotIn.run(idsJson(next.medications))
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
