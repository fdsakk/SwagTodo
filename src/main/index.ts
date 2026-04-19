import { app, shell, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ElectronStore from 'electron-store'
import { Client } from 'pg'
import icon from '../../resources/icon.png?asset'

type Priority = 'p1' | 'p2' | 'p3' | 'p4'
type TaskStatus = 'todo' | 'in_progress' | 'done'
type UiScale = 100 | 110 | 125 | 150 | 175
type SyncMode = 'local' | 'postgres'

const UI_SCALE_OPTIONS: readonly UiScale[] = [100, 110, 125, 150, 175] as const
const UI_SCALE_SET: ReadonlySet<number> = new Set(UI_SCALE_OPTIONS)
const DEFAULT_UI_SCALE: UiScale = 100
const MIN_ZOOM_FACTOR = UI_SCALE_OPTIONS[0] / 100
const MAX_ZOOM_FACTOR = UI_SCALE_OPTIONS[UI_SCALE_OPTIONS.length - 1] / 100
const IS_MAC = process.platform === 'darwin'
const IS_WAYLAND = process.platform === 'linux' && process.env.XDG_SESSION_TYPE === 'wayland'
const SYNC_TABLE = 'swagtodo_sync_state'

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

interface TimeBlock {
  id: string
  label: string
  startAt: string
  endAt: string
  createdAt: string
}

interface AppearanceSettings {
  themeId: string
  customTokens: Record<string, string>
  backgroundId: string
}

interface SyncSettings {
  mode: SyncMode
  postgresUrl: string
}

interface SyncStatus {
  mode: SyncMode
  connected: boolean
  lastSyncAt?: string
  lastError?: string
}

interface MedicationLog {
  id: string
  medId: string
  medName: string
  dose: number
  takenAt: string
  createdAt: string
}

interface AppState {
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
  sync?: SyncSettings
}

type SyncSlice = Pick<AppState, 'tasks' | 'projects' | 'labels' | 'sessions' | 'timeBlocks'>

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  mode: 'local',
  postgresUrl: ''
}

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
const isSyncMode = (v: unknown): v is SyncMode => v === 'local' || v === 'postgres'

const isZoomFactor = (v: unknown): v is number =>
  typeof v === 'number' && v >= MIN_ZOOM_FACTOR && v <= MAX_ZOOM_FACTOR

const isStringRecord = (v: unknown): v is Record<string, string> =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.values(v as object).every((x) => typeof x === 'string')

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
    if (a.backgroundId !== undefined && typeof a.backgroundId !== 'string') return false
  }
  if (d.sync !== undefined) {
    const s = d.sync as Partial<SyncSettings>
    if (!isSyncMode(s.mode)) return false
    if (s.postgresUrl !== undefined && typeof s.postgresUrl !== 'string') return false
  }
  return true
}

const normalizeSyncSettings = (raw: unknown): SyncSettings => {
  if (!raw || typeof raw !== 'object') return DEFAULT_SYNC_SETTINGS
  const sync = raw as Partial<SyncSettings>
  return {
    mode: sync.mode === 'postgres' ? 'postgres' : 'local',
    postgresUrl: typeof sync.postgresUrl === 'string' ? sync.postgresUrl : ''
  }
}

const normalizeAppState = (state: AppState): AppState => ({
  ...state,
  sync: normalizeSyncSettings(state.sync)
})

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

class PostgresSyncService {
  private client: Client | undefined
  private mode: SyncMode = 'local'
  private postgresUrl = ''
  private connected = false
  private lastSyncAt?: string
  private lastError?: string

  getStatus(): SyncStatus {
    return {
      mode: this.mode,
      connected: this.connected,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError
    }
  }

  private async closeClient(): Promise<void> {
    if (!this.client) return
    try {
      await this.client.end()
    } catch (err) {
      console.error('[sync] failed to close postgres client', err)
    }
    this.client = undefined
    this.connected = false
  }

  private async connect(postgresUrl: string): Promise<Client> {
    const nextUrl = postgresUrl.trim()
    if (!nextUrl) throw new Error('Postgres URL is required')
    if (this.client && this.connected && this.postgresUrl === nextUrl) return this.client
    await this.closeClient()

    const client = new Client({ connectionString: nextUrl })
    await client.connect()
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SYNC_TABLE} (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    this.client = client
    this.mode = 'postgres'
    this.postgresUrl = nextUrl
    this.connected = true
    this.lastError = undefined
    return client
  }

  private async readRemoteState(
    client: Client
  ): Promise<{ slice: SyncSlice; updatedAt: string } | null> {
    const result = await client.query<{ state: SyncSlice; updated_at: string }>(
      `SELECT state, updated_at::text FROM ${SYNC_TABLE} WHERE id = 1`
    )
    const row = result.rows[0]
    if (!row) return null
    return { slice: row.state, updatedAt: row.updated_at }
  }

  private async writeRemoteState(client: Client, slice: SyncSlice): Promise<string> {
    const result = await client.query<{ updated_at: string }>(
      `INSERT INTO ${SYNC_TABLE} (id, state, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id)
       DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
       RETURNING updated_at::text`,
      [JSON.stringify(slice)]
    )
    return result.rows[0].updated_at
  }

  private withRemoteSlice(state: AppState, slice: SyncSlice, postgresUrl: string): AppState {
    return {
      ...state,
      tasks: slice.tasks,
      projects: slice.projects,
      labels: slice.labels,
      sessions: slice.sessions,
      timeBlocks: slice.timeBlocks,
      sync: {
        mode: 'postgres',
        postgresUrl
      }
    }
  }

  async restoreFromState(state: AppState): Promise<void> {
    const sync = normalizeSyncSettings(state.sync)
    if (sync.mode !== 'postgres' || !sync.postgresUrl.trim()) {
      this.mode = 'local'
      this.postgresUrl = ''
      this.connected = false
      return
    }
    try {
      await this.connect(sync.postgresUrl)
    } catch (err) {
      this.mode = 'postgres'
      this.connected = false
      this.postgresUrl = sync.postgresUrl
      this.lastError = err instanceof Error ? err.message : String(err)
      console.error('[sync] restore failed', err)
    }
  }

  async turnOn(postgresUrl: string, localState: AppState): Promise<AppState> {
    const client = await this.connect(postgresUrl)
    const remote = await this.readRemoteState(client)
    if (remote && !isSyncSliceEmpty(remote.slice)) {
      this.lastSyncAt = remote.updatedAt
      return this.withRemoteSlice(localState, remote.slice, postgresUrl)
    }
    this.lastSyncAt = await this.writeRemoteState(client, toSyncSlice(localState))
    return {
      ...localState,
      sync: {
        mode: 'postgres',
        postgresUrl
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
        mode: 'local',
        postgresUrl: currentSync.postgresUrl
      }
    }
  }

  async pullLatestForLoad(state: AppState): Promise<AppState> {
    const sync = normalizeSyncSettings(state.sync)
    if (sync.mode !== 'postgres') {
      this.mode = 'local'
      return { ...state, sync: DEFAULT_SYNC_SETTINGS }
    }
    if (!sync.postgresUrl.trim()) return { ...state, sync: DEFAULT_SYNC_SETTINGS }

    try {
      const client = await this.connect(sync.postgresUrl)
      const remote = await this.readRemoteState(client)
      if (!remote) return { ...state, sync }
      this.lastSyncAt = remote.updatedAt
      if (isSyncSliceEmpty(remote.slice)) return { ...state, sync }
      return this.withRemoteSlice(state, remote.slice, sync.postgresUrl)
    } catch (err) {
      this.connected = false
      this.lastError = err instanceof Error ? err.message : String(err)
      console.error('[sync] pull failed', err)
      return { ...state, sync }
    }
  }

  async pushOnSave(state: AppState): Promise<void> {
    const sync = normalizeSyncSettings(state.sync)
    if (sync.mode !== 'postgres') {
      this.mode = 'local'
      await this.closeClient()
      return
    }
    if (!sync.postgresUrl.trim()) {
      this.lastError = 'Postgres URL is missing'
      return
    }
    try {
      const client = await this.connect(sync.postgresUrl)
      this.lastSyncAt = await this.writeRemoteState(client, toSyncSlice(state))
    } catch (err) {
      this.connected = false
      this.lastError = err instanceof Error ? err.message : String(err)
      console.error('[sync] push failed', err)
    }
  }
}

const postgresSync = new PostgresSyncService()

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
    const next = await postgresSync.pullLatestForLoad(current)
    appStore.set('appState', next)
    return next
  })

  ipcMain.handle('store:save', async (_, nextState: unknown) => {
    if (!isAppState(nextState)) throw new Error('Invalid app state payload')
    const normalized = normalizeAppState(nextState)
    appStore.set('appState', normalized)
    await postgresSync.pushOnSave(normalized)
  })

  ipcMain.handle('sync:turnOn', async (_, postgresUrl: unknown) => {
    if (typeof postgresUrl !== 'string' || !postgresUrl.trim()) {
      throw new Error('Postgres URL is required')
    }
    const current = normalizeAppState(appStore.get('appState'))
    const next = await postgresSync.turnOn(postgresUrl.trim(), current)
    appStore.set('appState', next)
  })

  ipcMain.handle('sync:turnOff', async () => {
    const current = normalizeAppState(appStore.get('appState'))
    const next = await postgresSync.turnOff(current)
    appStore.set('appState', next)
  })

  ipcMain.handle('sync:getStatus', () => postgresSync.getStatus())

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
  void postgresSync.restoreFromState(normalizeAppState(appStore.get('appState')))
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!IS_MAC) app.quit()
})
