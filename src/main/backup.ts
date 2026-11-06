import type { AppState, Task } from "../shared/types"
import { normalizeAppState } from "./storage/appState"

export const BACKUP_PREFIX = "swag-todo-"
export const BACKUP_EXT = ".db"
export const EXPORT_FORMAT = "swag-todo-export"

const pad = (n: number): string => String(n).padStart(2, "0")

export const backupDayStamp = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** e.g. swag-todo-2026-11-06.db, or swag-todo-2026-11-06-pre-import.db */
export const backupFileName = (date: Date, suffix?: string): string =>
  `${BACKUP_PREFIX}${backupDayStamp(date)}${suffix ? `-${suffix}` : ""}${BACKUP_EXT}`

const BACKUP_RE = /^swag-todo-\d{4}-\d{2}-\d{2}(?:-[a-z0-9-]+)?\.db$/

export const isBackupFile = (name: string): boolean => BACKUP_RE.test(name)

/** Names to delete so only the newest `keep` backups remain. */
export const backupsToPrune = (
  names: readonly string[],
  keep: number
): string[] =>
  names.filter(isBackupFile).sort().reverse().slice(Math.max(1, keep))

export const hasBackupForDay = (
  names: readonly string[],
  date: Date
): boolean => names.includes(backupFileName(date))

export const buildExportPayload = (
  state: AppState,
  exportedAt: Date = new Date()
): string =>
  JSON.stringify(
    {
      format: EXPORT_FORMAT,
      version: 1,
      exportedAt: exportedAt.toISOString(),
      state
    },
    null,
    2
  )

/**
 * Accepts our export envelope, a raw AppState, or a legacy electron-store
 * `{ appState }` payload. Returns null when nothing usable is found.
 */
export const parseImportPayload = (raw: string): AppState | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") return null
  const record = parsed as Record<string, unknown>
  const candidate =
    record.format === EXPORT_FORMAT
      ? record.state
      : "appState" in record
        ? record.appState
        : record
  if (!candidate || typeof candidate !== "object") return null
  if (!Array.isArray((candidate as { tasks?: unknown }).tasks)) return null
  return normalizeAppState(candidate)
}

const csvCell = (value: string | number | undefined): string => {
  const text = value === undefined ? "" : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const CSV_HEADER = [
  "id",
  "title",
  "description",
  "status",
  "priority",
  "due_date",
  "due_time",
  "project",
  "labels",
  "subtasks_done",
  "subtasks_total",
  "created_at",
  "completed_at",
  "archived_at"
]

export const tasksToCsv = (state: AppState): string => {
  const projects = new Map(state.projects.map((p) => [p.id, p.name]))
  const labels = new Map(state.labels.map((l) => [l.id, l.name]))
  const row = (task: Task): string =>
    [
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.dueDate,
      task.dueTime,
      task.projectId ? projects.get(task.projectId) : undefined,
      task.labels
        .map((id) => labels.get(id))
        .filter(Boolean)
        .join("; "),
      task.subTasks.filter((s) => s.completed).length,
      task.subTasks.length,
      task.createdAt,
      task.completedAt,
      task.archivedAt
    ]
      .map(csvCell)
      .join(",")
  return `${[CSV_HEADER.join(","), ...state.tasks.map(row)].join("\r\n")}\r\n`
}
