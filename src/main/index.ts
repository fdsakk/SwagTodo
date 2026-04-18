import { app, shell, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ElectronStore from 'electron-store'
import icon from '../../resources/icon.png?asset'

type Priority = 'p1' | 'p2' | 'p3' | 'p4'
type TaskStatus = 'todo' | 'in_progress' | 'done'
type UiScale = 100 | 110 | 125 | 150 | 175

const UI_SCALE_OPTIONS: readonly UiScale[] = [100, 110, 125, 150, 175] as const
const UI_SCALE_SET: ReadonlySet<number> = new Set(UI_SCALE_OPTIONS)
const DEFAULT_UI_SCALE: UiScale = 100
const MIN_ZOOM_FACTOR = UI_SCALE_OPTIONS[0] / 100
const MAX_ZOOM_FACTOR = UI_SCALE_OPTIONS[UI_SCALE_OPTIONS.length - 1] / 100
const IS_MAC = process.platform === 'darwin'
const IS_WAYLAND = process.platform === 'linux' && process.env.XDG_SESSION_TYPE === 'wayland'

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

interface AppState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  sessions: TaskSession[]
  timeBlocks: TimeBlock[]
  uiScale?: UiScale
  isSidebarCollapsed?: boolean
  appearance?: AppearanceSettings
}

const defaultAppState: AppState = {
  tasks: [],
  projects: [],
  labels: [],
  sessions: [],
  timeBlocks: [],
  uiScale: DEFAULT_UI_SCALE
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
  if (d.uiScale !== undefined && !isUiScale(d.uiScale)) return false
  if (d.appearance !== undefined) {
    const a = d.appearance as Partial<AppearanceSettings>
    if (typeof a.themeId !== 'string') return false
    if (a.customTokens !== undefined && !isStringRecord(a.customTokens)) return false
    if (a.backgroundId !== undefined && typeof a.backgroundId !== 'string') return false
  }
  return true
}

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
    } catch {}
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
  ipcMain.handle('store:load', () => appStore.get('appState'))

  ipcMain.handle('store:save', (_, nextState: unknown) => {
    if (!isAppState(nextState)) throw new Error('Invalid app state payload')
    appStore.set('appState', nextState)
  })

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
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!IS_MAC) app.quit()
})
