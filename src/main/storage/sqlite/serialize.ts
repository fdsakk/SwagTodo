import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { AppState, Task } from '../../../shared/types'
import { defaultAppState, normalizeAppState } from '../appState'
import {
  LEGACY_STORE_FILES,
  SETTINGS_KEYS,
  type SqliteStateSnapshot,
  type StoredTaskAggregateRow
} from './types'

type LegacyElectronStore = { appState?: unknown }

export const parseSetting = <T>(
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

export const parseJsonArray = <T>(raw: string, fallback: T[], context: string): T[] => {
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch (error) {
    console.error(`[storage] failed to parse ${context}`, error)
    return fallback
  }
}

export const inflateTaskRows = (rows: StoredTaskAggregateRow[]): Task[] =>
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
    archivedAt: task.archived_at ?? undefined,
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

export const readLegacyElectronStore = (dbPath: string): AppState | null => {
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
      archived_at: task.archivedAt ?? null,
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
      archivedAt: task.archived_at ?? undefined,
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
  const nextTaskIds = new Set(next.tasks.map((t) => t.id))
  for (const t of prev.tasks) {
    if (!nextTaskIds.has(t.id)) changed.add(t.id)
  }
  return changed
}

export const changedIds = <T extends { id: string }>(prev: T[], next: T[]): boolean => {
  if (prev.length !== next.length) return true
  const prevMap = new Map(prev.map((r) => [r.id, JSON.stringify(r)]))
  return next.some((r) => prevMap.get(r.id) !== JSON.stringify(r))
}
