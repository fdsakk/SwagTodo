import { app, shell, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ElectronStore from 'electron-store'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import icon from '../../resources/icon.png?asset'
import {
  DEFAULT_SYNC_SETTINGS,
  DEFAULT_UI_SCALE,
  DEFAULT_WORKSPACE_ID,
  UI_SCALE_OPTIONS
} from '../shared/defaults'
import {
  type AppState,
  type AppearanceSettings,
  type Priority,
  type SyncMode,
  type SyncSettings,
  type SyncStatus,
  type Task,
  type TaskStatus,
  type UiScale
} from '../shared/types'

const UI_SCALE_SET: ReadonlySet<number> = new Set(UI_SCALE_OPTIONS)
const MIN_ZOOM_FACTOR = UI_SCALE_OPTIONS[0] / 100
const MAX_ZOOM_FACTOR = UI_SCALE_OPTIONS[UI_SCALE_OPTIONS.length - 1] / 100
const IS_MAC = process.platform === 'darwin'
const IS_WAYLAND = process.platform === 'linux' && process.env.XDG_SESSION_TYPE === 'wayland'
const REMOTE_PUSH_DEBOUNCE_MS = 800

const TABLES = {
  projects: 'swagtodo_projects',
  labels: 'swagtodo_labels',
  tasks: 'swagtodo_tasks',
  subtasks: 'swagtodo_subtasks',
  taskLabels: 'swagtodo_task_labels',
  sessions: 'swagtodo_sessions',
  timeBlocks: 'swagtodo_time_blocks'
} as const

type SyncSlice = Pick<AppState, 'tasks' | 'projects' | 'labels' | 'sessions' | 'timeBlocks'>

const defaultAppState: AppState = {
  tasks: [],
  projects: [],
  labels: [],
  sessions: [],
  timeBlocks: [],
  uiScale: DEFAULT_UI_SCALE,
  sync: DEFAULT_SYNC_SETTINGS
}

const StoreCtor =
  (ElectronStore as unknown as { default?: typeof ElectronStore }).default ?? ElectronStore

const appStore = new StoreCtor<{ appState: AppState }>({
  name: 'todoist-clone',
  defaults: { appState: defaultAppState }
})

if (IS_WAYLAND) {
  const WAYLAND_CM_FEATURES =
    'WaylandColorManagement,WaylandColorManagementV1,WaylandColorManagementV2'
  const existing = app.commandLine.getSwitchValue('disable-features')
  app.commandLine.appendSwitch(
    'disable-features',
    existing ? `${existing},${WAYLAND_CM_FEATURES}` : WAYLAND_CM_FEATURES
  )
}

const isUiScale = (v: unknown): v is UiScale => typeof v === 'number' && UI_SCALE_SET.has(v)
const isSyncMode = (v: unknown): v is SyncMode => v === 'local' || v === 'supabase'

const isZoomFactor = (v: unknown): v is number =>
  typeof v === 'number' && v >= MIN_ZOOM_FACTOR && v <= MAX_ZOOM_FACTOR

const isStringRecord = (v: unknown): v is Record<string, string> =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.values(v as object).every((x) => typeof x === 'string')

const APP_STATE_KEYS: ReadonlySet<string> = new Set([
  'tasks',
  'projects',
  'labels',
  'sessions',
  'timeBlocks',
  'medications',
  'pkSettings',
  'uiScale',
  'isSidebarCollapsed',
  'appearance',
  'sync'
])

const isAppState = (v: unknown): v is AppState => {
  if (!v || typeof v !== 'object') return false
  const d = v as Partial<AppState>
  if (
    !Array.isArray(d.tasks) ||
    !Array.isArray(d.projects) ||
    !Array.isArray(d.labels) ||
    !Array.isArray(d.sessions) ||
    !Array.isArray(d.timeBlocks)
  )
    return false
  if (d.medications !== undefined && !Array.isArray(d.medications)) return false
  if (d.uiScale !== undefined && !isUiScale(d.uiScale)) return false
  if (d.appearance !== undefined) {
    const a = d.appearance as Partial<AppearanceSettings>
    if (typeof a.themeId !== 'string') return false
    if (a.customTokens !== undefined && !isStringRecord(a.customTokens)) return false
  }
  if (d.sync !== undefined) {
    const s = d.sync as Partial<SyncSettings>
    if (!isSyncMode(s.mode)) return false
    if (s.supabaseUrl !== undefined && typeof s.supabaseUrl !== 'string') return false
    if (s.supabaseAnonKey !== undefined && typeof s.supabaseAnonKey !== 'string') return false
    if (s.workspaceId !== undefined && typeof s.workspaceId !== 'string') return false
  }
  return true
}

const isAppStatePatch = (v: unknown): v is Partial<AppState> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const patch = v as Record<string, unknown>
  for (const key of Object.keys(patch)) {
    if (!APP_STATE_KEYS.has(key)) return false
  }
  if ('tasks' in patch && !Array.isArray(patch.tasks)) return false
  if ('projects' in patch && !Array.isArray(patch.projects)) return false
  if ('labels' in patch && !Array.isArray(patch.labels)) return false
  if ('sessions' in patch && !Array.isArray(patch.sessions)) return false
  if ('timeBlocks' in patch && !Array.isArray(patch.timeBlocks)) return false
  if (
    'medications' in patch &&
    patch.medications !== undefined &&
    !Array.isArray(patch.medications)
  )
    return false
  if ('uiScale' in patch && patch.uiScale !== undefined && !isUiScale(patch.uiScale)) return false
  if (
    'isSidebarCollapsed' in patch &&
    patch.isSidebarCollapsed !== undefined &&
    typeof patch.isSidebarCollapsed !== 'boolean'
  )
    return false
  if ('appearance' in patch && patch.appearance !== undefined) {
    const a = patch.appearance as Partial<AppearanceSettings>
    if (typeof a.themeId !== 'string') return false
    if (a.customTokens !== undefined && !isStringRecord(a.customTokens)) return false
  }
  if ('sync' in patch && patch.sync !== undefined) {
    const s = patch.sync as Partial<SyncSettings>
    if (!isSyncMode(s.mode)) return false
    if (s.supabaseUrl !== undefined && typeof s.supabaseUrl !== 'string') return false
    if (s.supabaseAnonKey !== undefined && typeof s.supabaseAnonKey !== 'string') return false
    if (s.workspaceId !== undefined && typeof s.workspaceId !== 'string') return false
  }
  return true
}

const normalizeSyncSettings = (raw: unknown): SyncSettings => {
  if (!raw || typeof raw !== 'object') return DEFAULT_SYNC_SETTINGS
  const sync = raw as Partial<SyncSettings>
  return {
    mode: sync.mode === 'supabase' ? 'supabase' : 'local',
    supabaseUrl: typeof sync.supabaseUrl === 'string' ? sync.supabaseUrl : '',
    supabaseAnonKey: typeof sync.supabaseAnonKey === 'string' ? sync.supabaseAnonKey : '',
    workspaceId:
      typeof sync.workspaceId === 'string' && sync.workspaceId.trim()
        ? sync.workspaceId.trim()
        : DEFAULT_WORKSPACE_ID
  }
}

const normalizeAppState = (state: AppState): AppState => ({
  ...state,
  sync: normalizeSyncSettings(state.sync)
})

const mergeAppState = (current: AppState, patch: Partial<AppState>): AppState => {
  let next = current
  if (patch.tasks !== undefined) next = { ...next, tasks: patch.tasks }
  if (patch.projects !== undefined) next = { ...next, projects: patch.projects }
  if (patch.labels !== undefined) next = { ...next, labels: patch.labels }
  if (patch.sessions !== undefined) next = { ...next, sessions: patch.sessions }
  if (patch.timeBlocks !== undefined) next = { ...next, timeBlocks: patch.timeBlocks }
  if ('medications' in patch) next = { ...next, medications: patch.medications }
  if ('pkSettings' in patch) next = { ...next, pkSettings: patch.pkSettings }
  if (patch.uiScale !== undefined) next = { ...next, uiScale: patch.uiScale }
  if ('isSidebarCollapsed' in patch)
    next = { ...next, isSidebarCollapsed: patch.isSidebarCollapsed }
  if ('appearance' in patch) next = { ...next, appearance: patch.appearance }
  if ('sync' in patch) next = { ...next, sync: normalizeSyncSettings(patch.sync) }
  return normalizeAppState(next)
}

const toSyncSlice = (state: AppState): SyncSlice => ({
  tasks: state.tasks,
  projects: state.projects,
  labels: state.labels,
  sessions: state.sessions,
  timeBlocks: state.timeBlocks
})

const isSyncSliceEmpty = (slice: SyncSlice): boolean =>
  slice.tasks.length === 0 &&
  slice.projects.length === 0 &&
  slice.labels.length === 0 &&
  slice.sessions.length === 0 &&
  slice.timeBlocks.length === 0

type SupabaseConnectParams = Pick<SyncSettings, 'supabaseUrl' | 'supabaseAnonKey' | 'workspaceId'>

type SyncPayload = SupabaseConnectParams

const isSyncPayload = (v: unknown): v is SyncPayload => {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.supabaseUrl === 'string' &&
    typeof o.supabaseAnonKey === 'string' &&
    typeof o.workspaceId === 'string'
  )
}

type ProjectRow = {
  workspace_id: string
  id: string
  name: string
  color: string
  emoji: string | null
  description: string | null
  created_at: string
}

type LabelRow = {
  workspace_id: string
  id: string
  name: string
  color: string
}

type TaskRow = {
  workspace_id: string
  id: string
  title: string
  description: string | null
  priority: Priority
  due_date: string | null
  project_id: string | null
  completed: boolean
  status: TaskStatus
  created_at: string
  updated_at: string
  sort_order: number
}

type SubTaskRow = {
  workspace_id: string
  id: string
  task_id: string
  title: string
  completed: boolean
  sort_order: number
}

type TaskLabelRow = {
  workspace_id: string
  task_id: string
  label_id: string
}

type SessionRow = {
  workspace_id: string
  id: string
  task_id: string
  project_id: string
  start_at: string
  end_at: string
  created_at: string
  updated_at: string
}

type TimeBlockRow = {
  workspace_id: string
  id: string
  label: string
  start_at: string
  end_at: string
  created_at: string
}

const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size) as T[])
  return out
}

const sortStrings = (values: readonly string[]): string[] =>
  values.slice().sort((a, b) => a.localeCompare(b))

const normalizeSupabaseUrl = (raw: string): string => {
  const trimmed = raw.trim()
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error('Invalid Supabase URL')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Supabase URL must use http(s)')
  }
  return url.origin
}

const MAX_FILTER_CHUNK = 500

type RemoteTaskLabelKey = { task_id: string; label_id: string }

type SyncDelta = {
  upsertProjects: ProjectRow[]
  deleteProjectIds: string[]
  upsertLabels: LabelRow[]
  deleteLabelIds: string[]
  upsertTasks: TaskRow[]
  deleteTaskIds: string[]
  upsertSubTasks: SubTaskRow[]
  deleteSubTaskIds: string[]
  upsertTaskLabels: TaskLabelRow[]
  deleteTaskLabelKeys: RemoteTaskLabelKey[]
  upsertSessions: SessionRow[]
  deleteSessionIds: string[]
  upsertTimeBlocks: TimeBlockRow[]
  deleteTimeBlockIds: string[]
}

class SupabaseSyncService {
  private client: SupabaseClient | undefined
  private mode: SyncMode = 'local'
  private params: SupabaseConnectParams | undefined
  private connected = false
  private lastSyncAt?: string
  private lastError?: string
  private shadow?: SyncSlice

  private pushTimer: ReturnType<typeof setTimeout> | undefined
  private pendingPush: AppState | undefined
  private pushInFlight = false
  private flushAfterInFlight = false

  getStatus(): SyncStatus {
    return {
      mode: this.mode,
      connected: this.connected,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError
    }
  }

  private async closeClient(): Promise<void> {
    this.client = undefined
    this.connected = false
    this.shadow = undefined

    if (this.pushTimer) clearTimeout(this.pushTimer)
    this.pushTimer = undefined
    this.pendingPush = undefined
    this.pushInFlight = false
    this.flushAfterInFlight = false
  }

  private async ping(client: SupabaseClient, workspaceId: string): Promise<void> {
    const { error } = await client
      .from(TABLES.tasks)
      .select('id')
      .eq('workspace_id', workspaceId)
      .limit(1)
    if (error) throw new Error(error.message)
  }

  private async connect(params: SupabaseConnectParams): Promise<SupabaseClient> {
    const supabaseUrl = normalizeSupabaseUrl(params.supabaseUrl)
    const supabaseAnonKey = params.supabaseAnonKey.trim()
    const workspaceId = params.workspaceId.trim() || DEFAULT_WORKSPACE_ID

    if (!supabaseUrl) throw new Error('Supabase URL is required')
    if (!supabaseAnonKey) throw new Error('Supabase anon key is required')

    if (
      this.client &&
      this.connected &&
      this.params &&
      this.params.supabaseUrl === supabaseUrl &&
      this.params.supabaseAnonKey === supabaseAnonKey &&
      this.params.workspaceId === workspaceId
    ) {
      return this.client
    }

    await this.closeClient()
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })

    await this.ping(client, workspaceId)

    this.client = client
    this.mode = 'supabase'
    this.params = { supabaseUrl, supabaseAnonKey, workspaceId }
    this.connected = true
    this.lastError = undefined
    return client
  }

  private emptySlice(): SyncSlice {
    return { tasks: [], projects: [], labels: [], sessions: [], timeBlocks: [] }
  }

  private computeDelta(prev: SyncSlice, next: SyncSlice, workspaceId: string): SyncDelta {
    const prevProjects = new Map(prev.projects.map((p) => [p.id, p] as const))
    const nextProjects = new Map(next.projects.map((p) => [p.id, p] as const))

    const prevLabels = new Map(prev.labels.map((l) => [l.id, l] as const))
    const nextLabels = new Map(next.labels.map((l) => [l.id, l] as const))

    const prevTasks = new Map(prev.tasks.map((t) => [t.id, t] as const))
    const nextTasks = new Map(next.tasks.map((t) => [t.id, t] as const))

    const prevSessions = new Map(prev.sessions.map((s) => [s.id, s] as const))
    const nextSessions = new Map(next.sessions.map((s) => [s.id, s] as const))

    const prevTimeBlocks = new Map(prev.timeBlocks.map((b) => [b.id, b] as const))
    const nextTimeBlocks = new Map(next.timeBlocks.map((b) => [b.id, b] as const))

    const upsertProjects: ProjectRow[] = []
    const deleteProjectIds: string[] = []
    for (const [id, p] of nextProjects) {
      const prev = prevProjects.get(id)
      if (
        !prev ||
        prev.name !== p.name ||
        prev.color !== p.color ||
        prev.emoji !== p.emoji ||
        prev.description !== p.description ||
        prev.createdAt !== p.createdAt
      ) {
        upsertProjects.push({
          workspace_id: workspaceId,
          id: p.id,
          name: p.name,
          color: p.color,
          emoji: p.emoji ?? null,
          description: p.description ?? null,
          created_at: p.createdAt
        })
      }
    }
    for (const id of prevProjects.keys()) if (!nextProjects.has(id)) deleteProjectIds.push(id)

    const upsertLabels: LabelRow[] = []
    const deleteLabelIds: string[] = []
    for (const [id, l] of nextLabels) {
      const prev = prevLabels.get(id)
      if (!prev || prev.name !== l.name || prev.color !== l.color) {
        upsertLabels.push({ workspace_id: workspaceId, id: l.id, name: l.name, color: l.color })
      }
    }
    for (const id of prevLabels.keys()) if (!nextLabels.has(id)) deleteLabelIds.push(id)

    const upsertTasks: TaskRow[] = []
    const deleteTaskIds: string[] = []
    for (const [id, t] of nextTasks) {
      const prev = prevTasks.get(id)
      if (
        !prev ||
        prev.updatedAt !== t.updatedAt ||
        prev.title !== t.title ||
        prev.description !== t.description ||
        prev.priority !== t.priority ||
        prev.dueDate !== t.dueDate ||
        prev.projectId !== t.projectId ||
        prev.completed !== t.completed ||
        prev.status !== t.status ||
        prev.createdAt !== t.createdAt ||
        prev.order !== t.order
      ) {
        upsertTasks.push({
          workspace_id: workspaceId,
          id: t.id,
          title: t.title,
          description: t.description ?? null,
          priority: t.priority,
          due_date: t.dueDate ?? null,
          project_id: t.projectId ?? null,
          completed: t.completed,
          status: t.status,
          created_at: t.createdAt,
          updated_at: t.updatedAt,
          sort_order: t.order
        })
      }
    }
    for (const id of prevTasks.keys()) if (!nextTasks.has(id)) deleteTaskIds.push(id)

    const upsertSessions: SessionRow[] = []
    const deleteSessionIds: string[] = []
    for (const [id, s] of nextSessions) {
      const prev = prevSessions.get(id)
      if (
        !prev ||
        prev.updatedAt !== s.updatedAt ||
        prev.taskId !== s.taskId ||
        prev.projectId !== s.projectId ||
        prev.startAt !== s.startAt ||
        prev.endAt !== s.endAt ||
        prev.createdAt !== s.createdAt
      ) {
        upsertSessions.push({
          workspace_id: workspaceId,
          id: s.id,
          task_id: s.taskId,
          project_id: s.projectId,
          start_at: s.startAt,
          end_at: s.endAt,
          created_at: s.createdAt,
          updated_at: s.updatedAt
        })
      }
    }
    for (const id of prevSessions.keys()) if (!nextSessions.has(id)) deleteSessionIds.push(id)

    const upsertTimeBlocks: TimeBlockRow[] = []
    const deleteTimeBlockIds: string[] = []
    for (const [id, b] of nextTimeBlocks) {
      const prev = prevTimeBlocks.get(id)
      if (
        !prev ||
        prev.label !== b.label ||
        prev.startAt !== b.startAt ||
        prev.endAt !== b.endAt ||
        prev.createdAt !== b.createdAt
      ) {
        upsertTimeBlocks.push({
          workspace_id: workspaceId,
          id: b.id,
          label: b.label,
          start_at: b.startAt,
          end_at: b.endAt,
          created_at: b.createdAt
        })
      }
    }
    for (const id of prevTimeBlocks.keys()) if (!nextTimeBlocks.has(id)) deleteTimeBlockIds.push(id)

    const prevSubTasks = new Map<string, SubTaskRow>()
    for (const task of prev.tasks) {
      for (let i = 0; i < task.subTasks.length; i++) {
        const st = task.subTasks[i]
        prevSubTasks.set(st.id, {
          workspace_id: workspaceId,
          id: st.id,
          task_id: task.id,
          title: st.title,
          completed: st.completed,
          sort_order: i
        })
      }
    }

    const nextSubTasks = new Map<string, SubTaskRow>()
    for (const task of next.tasks) {
      for (let i = 0; i < task.subTasks.length; i++) {
        const st = task.subTasks[i]
        nextSubTasks.set(st.id, {
          workspace_id: workspaceId,
          id: st.id,
          task_id: task.id,
          title: st.title,
          completed: st.completed,
          sort_order: i
        })
      }
    }

    const upsertSubTasks: SubTaskRow[] = []
    const deleteSubTaskIds: string[] = []
    for (const [id, row] of nextSubTasks) {
      const prev = prevSubTasks.get(id)
      if (
        !prev ||
        prev.task_id !== row.task_id ||
        prev.title !== row.title ||
        prev.completed !== row.completed ||
        prev.sort_order !== row.sort_order
      ) {
        upsertSubTasks.push(row)
      }
    }
    for (const id of prevSubTasks.keys()) if (!nextSubTasks.has(id)) deleteSubTaskIds.push(id)

    const prevLabelKeys = new Set<string>()
    for (const task of prev.tasks) {
      const ids = sortStrings(task.labels)
      for (let i = 0; i < ids.length; i++) prevLabelKeys.add(`${task.id}\u0000${ids[i]}`)
    }
    const nextLabelKeys = new Set<string>()
    for (const task of next.tasks) {
      const ids = sortStrings(task.labels)
      for (let i = 0; i < ids.length; i++) nextLabelKeys.add(`${task.id}\u0000${ids[i]}`)
    }

    const upsertTaskLabels: TaskLabelRow[] = []
    const deleteTaskLabelKeys: RemoteTaskLabelKey[] = []
    for (const key of nextLabelKeys) {
      if (prevLabelKeys.has(key)) continue
      const [taskId, labelId] = key.split('\u0000')
      upsertTaskLabels.push({ workspace_id: workspaceId, task_id: taskId, label_id: labelId })
    }
    for (const key of prevLabelKeys) {
      if (nextLabelKeys.has(key)) continue
      const [taskId, labelId] = key.split('\u0000')
      deleteTaskLabelKeys.push({ task_id: taskId, label_id: labelId })
    }

    return {
      upsertProjects,
      deleteProjectIds,
      upsertLabels,
      deleteLabelIds,
      upsertTasks,
      deleteTaskIds,
      upsertSubTasks,
      deleteSubTaskIds,
      upsertTaskLabels,
      deleteTaskLabelKeys,
      upsertSessions,
      deleteSessionIds,
      upsertTimeBlocks,
      deleteTimeBlockIds
    }
  }

  private isNoopDelta(delta: SyncDelta): boolean {
    return (
      delta.upsertProjects.length === 0 &&
      delta.deleteProjectIds.length === 0 &&
      delta.upsertLabels.length === 0 &&
      delta.deleteLabelIds.length === 0 &&
      delta.upsertTasks.length === 0 &&
      delta.deleteTaskIds.length === 0 &&
      delta.upsertSubTasks.length === 0 &&
      delta.deleteSubTaskIds.length === 0 &&
      delta.upsertTaskLabels.length === 0 &&
      delta.deleteTaskLabelKeys.length === 0 &&
      delta.upsertSessions.length === 0 &&
      delta.deleteSessionIds.length === 0 &&
      delta.upsertTimeBlocks.length === 0 &&
      delta.deleteTimeBlockIds.length === 0
    )
  }

  private async upsertRows<T extends object>(
    client: SupabaseClient,
    table: string,
    rows: readonly T[],
    onConflict: string
  ): Promise<void> {
    if (rows.length === 0) return
    for (const part of chunk(rows, 500)) {
      const { error } = await client.from(table).upsert(part, { onConflict })
      if (error) throw new Error(error.message)
    }
  }

  private async deleteByIds(
    client: SupabaseClient,
    table: string,
    workspaceId: string,
    ids: readonly string[]
  ): Promise<void> {
    if (ids.length === 0) return
    for (const part of chunk(ids, MAX_FILTER_CHUNK)) {
      const { error } = await client
        .from(table)
        .delete()
        .eq('workspace_id', workspaceId)
        .in('id', part)
      if (error) throw new Error(error.message)
    }
  }

  private async deleteTaskLabels(
    client: SupabaseClient,
    workspaceId: string,
    keys: readonly RemoteTaskLabelKey[]
  ): Promise<void> {
    if (keys.length === 0) return
    const byTask = new Map<string, string[]>()
    for (const k of keys) {
      const list = byTask.get(k.task_id)
      if (list) list.push(k.label_id)
      else byTask.set(k.task_id, [k.label_id])
    }
    for (const [taskId, labelIds] of byTask) {
      for (const part of chunk(labelIds, MAX_FILTER_CHUNK)) {
        const { error } = await client
          .from(TABLES.taskLabels)
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('task_id', taskId)
          .in('label_id', part)
        if (error) throw new Error(error.message)
      }
    }
  }

  private async applyDelta(
    client: SupabaseClient,
    workspaceId: string,
    delta: SyncDelta
  ): Promise<string> {
    await this.upsertRows(client, TABLES.projects, delta.upsertProjects, 'workspace_id,id')
    await this.upsertRows(client, TABLES.labels, delta.upsertLabels, 'workspace_id,id')
    await this.upsertRows(client, TABLES.tasks, delta.upsertTasks, 'workspace_id,id')
    await this.upsertRows(client, TABLES.sessions, delta.upsertSessions, 'workspace_id,id')
    await this.upsertRows(client, TABLES.timeBlocks, delta.upsertTimeBlocks, 'workspace_id,id')
    await this.upsertRows(client, TABLES.subtasks, delta.upsertSubTasks, 'workspace_id,id')
    await this.upsertRows(
      client,
      TABLES.taskLabels,
      delta.upsertTaskLabels,
      'workspace_id,task_id,label_id'
    )

    await this.deleteTaskLabels(client, workspaceId, delta.deleteTaskLabelKeys)
    await this.deleteByIds(client, TABLES.subtasks, workspaceId, delta.deleteSubTaskIds)
    await this.deleteByIds(client, TABLES.tasks, workspaceId, delta.deleteTaskIds)
    await this.deleteByIds(client, TABLES.sessions, workspaceId, delta.deleteSessionIds)
    await this.deleteByIds(client, TABLES.timeBlocks, workspaceId, delta.deleteTimeBlockIds)
    await this.deleteByIds(client, TABLES.labels, workspaceId, delta.deleteLabelIds)
    await this.deleteByIds(client, TABLES.projects, workspaceId, delta.deleteProjectIds)

    return new Date().toISOString()
  }

  private withRemoteSlice(
    state: AppState,
    slice: SyncSlice,
    params: SupabaseConnectParams
  ): AppState {
    return {
      ...state,
      tasks: slice.tasks,
      projects: slice.projects,
      labels: slice.labels,
      sessions: slice.sessions,
      timeBlocks: slice.timeBlocks,
      sync: {
        mode: 'supabase',
        supabaseUrl: params.supabaseUrl,
        supabaseAnonKey: params.supabaseAnonKey,
        workspaceId: params.workspaceId
      }
    }
  }

  private async readRemoteSlice(
    client: SupabaseClient,
    workspaceId: string
  ): Promise<{ slice: SyncSlice; lastSyncAt: string } | null> {
    const [
      projectsRes,
      labelsRes,
      tasksRes,
      subtasksRes,
      taskLabelsRes,
      sessionsRes,
      timeBlocksRes
    ] = await Promise.all([
      client.from(TABLES.projects).select('*').eq('workspace_id', workspaceId),
      client.from(TABLES.labels).select('*').eq('workspace_id', workspaceId),
      client.from(TABLES.tasks).select('*').eq('workspace_id', workspaceId),
      client.from(TABLES.subtasks).select('*').eq('workspace_id', workspaceId),
      client.from(TABLES.taskLabels).select('*').eq('workspace_id', workspaceId),
      client.from(TABLES.sessions).select('*').eq('workspace_id', workspaceId),
      client.from(TABLES.timeBlocks).select('*').eq('workspace_id', workspaceId)
    ])

    if (projectsRes.error) throw new Error(projectsRes.error.message)
    if (labelsRes.error) throw new Error(labelsRes.error.message)
    if (tasksRes.error) throw new Error(tasksRes.error.message)
    if (subtasksRes.error) throw new Error(subtasksRes.error.message)
    if (taskLabelsRes.error) throw new Error(taskLabelsRes.error.message)
    if (sessionsRes.error) throw new Error(sessionsRes.error.message)
    if (timeBlocksRes.error) throw new Error(timeBlocksRes.error.message)

    const projects = (projectsRes.data ?? []) as ProjectRow[]
    const labels = (labelsRes.data ?? []) as LabelRow[]
    const tasks = (tasksRes.data ?? []) as TaskRow[]
    const subtasks = (subtasksRes.data ?? []) as SubTaskRow[]
    const taskLabels = (taskLabelsRes.data ?? []) as TaskLabelRow[]
    const sessions = (sessionsRes.data ?? []) as SessionRow[]
    const timeBlocks = (timeBlocksRes.data ?? []) as TimeBlockRow[]

    if (
      projects.length === 0 &&
      labels.length === 0 &&
      tasks.length === 0 &&
      subtasks.length === 0 &&
      taskLabels.length === 0 &&
      sessions.length === 0 &&
      timeBlocks.length === 0
    )
      return null

    const subTasksByTask = new Map<string, SubTaskRow[]>()
    for (const row of subtasks) {
      const list = subTasksByTask.get(row.task_id)
      if (list) list.push(row)
      else subTasksByTask.set(row.task_id, [row])
    }

    const labelIdsByTask = new Map<string, string[]>()
    for (const row of taskLabels) {
      const list = labelIdsByTask.get(row.task_id)
      if (list) list.push(row.label_id)
      else labelIdsByTask.set(row.task_id, [row.label_id])
    }

    const slice: SyncSlice = {
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        emoji: p.emoji ?? undefined,
        description: p.description ?? undefined,
        createdAt: p.created_at
      })),
      labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
      tasks: tasks.map((t) => {
        const subs = (subTasksByTask.get(t.id) ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
        return {
          id: t.id,
          title: t.title,
          description: t.description ?? undefined,
          priority: t.priority,
          dueDate: t.due_date ?? undefined,
          projectId: t.project_id ?? undefined,
          labels: sortStrings(labelIdsByTask.get(t.id) ?? []),
          completed: t.completed,
          status: t.status,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          order: t.sort_order,
          subTasks: subs.map((s) => ({ id: s.id, title: s.title, completed: s.completed }))
        } satisfies Task
      }),
      sessions: sessions.map((row) => ({
        id: row.id,
        taskId: row.task_id,
        projectId: row.project_id,
        startAt: row.start_at,
        endAt: row.end_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      timeBlocks: timeBlocks.map((row) => ({
        id: row.id,
        label: row.label,
        startAt: row.start_at,
        endAt: row.end_at,
        createdAt: row.created_at
      }))
    }

    const syncCandidates: string[] = []
    for (const t of tasks) syncCandidates.push(t.updated_at)
    for (const row of sessions) syncCandidates.push(row.updated_at)
    const lastSyncAt = syncCandidates.sort().at(-1) ?? new Date().toISOString()
    return { slice, lastSyncAt }
  }

  private async writeRemoteSlice(
    client: SupabaseClient,
    workspaceId: string,
    slice: SyncSlice
  ): Promise<string> {
    const prev = this.shadow ?? this.emptySlice()
    const delta = this.computeDelta(prev, slice, workspaceId)
    if (this.isNoopDelta(delta)) return this.lastSyncAt ?? new Date().toISOString()
    const nextAt = await this.applyDelta(client, workspaceId, delta)
    this.shadow = slice
    return nextAt
  }

  async restoreFromState(state: AppState): Promise<void> {
    const sync = normalizeSyncSettings(state.sync)
    if (sync.mode !== 'supabase') {
      this.mode = 'local'
      await this.closeClient()
      return
    }
    try {
      await this.connect(sync)
    } catch (err) {
      this.mode = 'supabase'
      this.connected = false
      this.lastError = err instanceof Error ? err.message : String(err)
      console.error('[sync] restore failed', err)
    }
  }

  async turnOn(params: SupabaseConnectParams, localState: AppState): Promise<AppState> {
    const client = await this.connect(params)
    const workspaceId = params.workspaceId.trim() || DEFAULT_WORKSPACE_ID
    const remote = await this.readRemoteSlice(client, workspaceId)
    if (remote && !isSyncSliceEmpty(remote.slice)) {
      this.lastSyncAt = remote.lastSyncAt
      this.shadow = remote.slice
      return this.withRemoteSlice(localState, remote.slice, {
        supabaseUrl: params.supabaseUrl.trim(),
        supabaseAnonKey: params.supabaseAnonKey.trim(),
        workspaceId
      })
    }

    const slice = toSyncSlice(localState)
    this.lastSyncAt = await this.writeRemoteSlice(client, workspaceId, slice)
    return {
      ...localState,
      sync: {
        mode: 'supabase',
        supabaseUrl: params.supabaseUrl.trim(),
        supabaseAnonKey: params.supabaseAnonKey.trim(),
        workspaceId
      }
    }
  }

  async turnOff(currentState: AppState): Promise<AppState> {
    const currentSync = normalizeSyncSettings(currentState.sync)
    await this.closeClient()
    this.mode = 'local'
    this.lastError = undefined
    return {
      ...currentState,
      sync: {
        ...currentSync,
        mode: 'local'
      }
    }
  }

  async pullLatestForLoad(state: AppState): Promise<AppState> {
    const sync = normalizeSyncSettings(state.sync)
    if (sync.mode !== 'supabase') {
      this.mode = 'local'
      await this.closeClient()
      return { ...state, sync }
    }
    if (!sync.supabaseUrl.trim() || !sync.supabaseAnonKey.trim()) return { ...state, sync }

    try {
      const client = await this.connect(sync)
      const remote = await this.readRemoteSlice(client, sync.workspaceId)
      if (!remote) return { ...state, sync }
      this.lastSyncAt = remote.lastSyncAt
      if (isSyncSliceEmpty(remote.slice)) return { ...state, sync }
      this.shadow = remote.slice
      return this.withRemoteSlice(state, remote.slice, sync)
    } catch (err) {
      this.connected = false
      this.lastError = err instanceof Error ? err.message : String(err)
      console.error('[sync] pull failed', err)
      return { ...state, sync }
    }
  }

  pushOnSave(state: AppState): void {
    this.pendingPush = state
    if (this.pushTimer) clearTimeout(this.pushTimer)
    this.pushTimer = setTimeout(() => {
      this.pushTimer = undefined
      void this.flushPendingPush()
    }, REMOTE_PUSH_DEBOUNCE_MS)
  }

  private async flushPendingPush(): Promise<void> {
    if (this.pushInFlight) {
      this.flushAfterInFlight = true
      return
    }

    const state = this.pendingPush
    if (!state) return
    this.pendingPush = undefined

    const sync = normalizeSyncSettings(state.sync)
    if (sync.mode !== 'supabase') {
      this.mode = 'local'
      await this.closeClient()
      return
    }
    if (!sync.supabaseUrl.trim() || !sync.supabaseAnonKey.trim()) {
      this.lastError = 'Supabase config is missing'
      return
    }

    this.pushInFlight = true
    try {
      const client = await this.connect(sync)
      this.lastSyncAt = await this.writeRemoteSlice(client, sync.workspaceId, toSyncSlice(state))
    } catch (err) {
      this.connected = false
      this.lastError = err instanceof Error ? err.message : String(err)
      console.error('[sync] push failed', err)
    } finally {
      this.pushInFlight = false
      if (this.flushAfterInFlight) {
        this.flushAfterInFlight = false
        void this.flushPendingPush()
      }
    }
  }
}

const supabaseSync = new SupabaseSyncService()

const getPersistedUiScale = (): UiScale => {
  const s = appStore.get('appState').uiScale
  return isUiScale(s) ? s : DEFAULT_UI_SCALE
}

const senderWindow = (event: IpcMainInvokeEvent): BrowserWindow => {
  const w = BrowserWindow.fromWebContents(event.sender)
  if (!w) throw new Error('Unable to resolve sender window')
  return w
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    backgroundColor: '#00000000',
    ...(IS_MAC
      ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 16, y: 14 } }
      : { titleBarStyle: 'hidden' }),
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const emitWindowState = (): void => {
    if (mainWindow.isDestroyed()) return
    mainWindow.webContents.send('window:state', {
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen()
    })
  }

  mainWindow.on('maximize', emitWindowState)
  mainWindow.on('unmaximize', emitWindowState)
  mainWindow.on('enter-full-screen', emitWindowState)
  mainWindow.on('leave-full-screen', emitWindowState)
  mainWindow.setMenuBarVisibility(false)

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(getPersistedUiScale() / 100)
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  const ALLOWED_PROTOCOLS = new Set(['https:', 'http:'])
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const { protocol } = new URL(url)
      if (ALLOWED_PROTOCOLS.has(protocol)) void shell.openExternal(url)
    } catch (err) {
      console.error('[window] invalid external url', { url, err })
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('[renderer] did-fail-load', { errorCode, errorDescription })
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (is.dev && rendererUrl) {
    void mainWindow.loadURL(rendererUrl)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle('store:load', async () => {
    const current = normalizeAppState(appStore.get('appState'))
    const next = await supabaseSync.pullLatestForLoad(current)
    appStore.set('appState', next)
    return next
  })

  ipcMain.handle('store:save', async (_, nextState: unknown) => {
    if (!isAppState(nextState)) throw new Error('Invalid app state payload')
    const normalized = normalizeAppState(nextState)
    appStore.set('appState', normalized)
    supabaseSync.pushOnSave(normalized)
  })

  ipcMain.handle('store:savePartial', async (_, patch: unknown) => {
    if (!isAppStatePatch(patch)) throw new Error('Invalid app state patch payload')
    const current = normalizeAppState(appStore.get('appState'))
    const next = mergeAppState(current, patch)
    appStore.set('appState', next)
    supabaseSync.pushOnSave(next)
  })

  ipcMain.handle('sync:turnOn', async (_, payload: unknown) => {
    if (!isSyncPayload(payload)) throw new Error('Invalid Supabase sync payload')
    if (!payload.supabaseUrl.trim()) throw new Error('Supabase URL is required')
    if (!payload.supabaseAnonKey.trim()) throw new Error('Supabase anon key is required')
    const current = normalizeAppState(appStore.get('appState'))
    const next = await supabaseSync.turnOn(
      {
        supabaseUrl: payload.supabaseUrl,
        supabaseAnonKey: payload.supabaseAnonKey,
        workspaceId: payload.workspaceId
      },
      current
    )
    appStore.set('appState', next)
  })

  ipcMain.handle('sync:turnOff', async () => {
    const current = normalizeAppState(appStore.get('appState'))
    const next = await supabaseSync.turnOff(current)
    appStore.set('appState', next)
  })

  ipcMain.handle('sync:getStatus', () => supabaseSync.getStatus())

  ipcMain.handle('ui:getZoomFactor', (event) => senderWindow(event).webContents.getZoomFactor())

  ipcMain.handle('ui:setZoomFactor', (event, nextZoomFactor: unknown) => {
    if (!isZoomFactor(nextZoomFactor)) throw new Error('Invalid zoom factor payload')
    senderWindow(event).webContents.setZoomFactor(nextZoomFactor)
  })

  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window:toggleMaximize', (event) => {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (!w) return
    w.isMaximized() ? w.unmaximize() : w.maximize()
  })

  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window:getState', (event) => {
    const w = BrowserWindow.fromWebContents(event.sender)
    return w
      ? { isMaximized: w.isMaximized(), isFullScreen: w.isFullScreen() }
      : { isMaximized: false, isFullScreen: false }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  void supabaseSync.restoreFromState(normalizeAppState(appStore.get('appState')))
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!IS_MAC) app.quit()
})
