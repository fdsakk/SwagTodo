import { app, shell, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ElectronStore from 'electron-store'
import icon from '../../resources/icon.png?asset'
import { DEFAULT_UI_SCALE, UI_SCALE_OPTIONS } from '../shared/defaults'
import { type AppState, type AppearanceSettings, type Task, type UiScale } from '../shared/types'

const UI_SCALE_SET: ReadonlySet<number> = new Set(UI_SCALE_OPTIONS)
const MIN_ZOOM_FACTOR = UI_SCALE_OPTIONS[0] / 100
const MAX_ZOOM_FACTOR = UI_SCALE_OPTIONS[UI_SCALE_OPTIONS.length - 1] / 100
const IS_MAC = process.platform === 'darwin'
const IS_WAYLAND = process.platform === 'linux' && process.env.XDG_SESSION_TYPE === 'wayland'

const defaultAppState: AppState = {
  tasks: [],
  projects: [],
  labels: [],
  sessions: [],
  timeBlocks: [],
  medications: [],
  uiScale: DEFAULT_UI_SCALE,
  isSidebarCollapsed: false
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
  'appearance'
])

const normalizeAppearance = (raw: unknown): AppearanceSettings | undefined => {
  if (!raw || typeof raw !== 'object') return undefined
  const appearance = raw as Partial<AppearanceSettings>
  if (typeof appearance.themeId !== 'string') return undefined
  if (appearance.customTokens !== undefined && !isStringRecord(appearance.customTokens)) {
    return undefined
  }
  return {
    themeId: appearance.themeId,
    customTokens: appearance.customTokens ?? {}
  }
}

const normalizeTask = (task: Task): Task => {
  const completed = task.status === 'done' || task.completed
  return {
    ...task,
    completed,
    status: completed ? 'done' : task.status === 'in_progress' ? 'in_progress' : 'todo',
    completedAt: completed ? (task.completedAt ?? task.updatedAt) : undefined
  }
}

const normalizeAppState = (state: unknown): AppState => {
  const data = state && typeof state === 'object' ? (state as Partial<AppState>) : {}
  const next: AppState = {
    tasks: Array.isArray(data.tasks) ? data.tasks.map((task) => normalizeTask(task)) : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    labels: Array.isArray(data.labels) ? data.labels : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    timeBlocks: Array.isArray(data.timeBlocks) ? data.timeBlocks : [],
    medications: Array.isArray(data.medications) ? data.medications : [],
    uiScale: isUiScale(data.uiScale) ? data.uiScale : DEFAULT_UI_SCALE,
    isSidebarCollapsed:
      typeof data.isSidebarCollapsed === 'boolean' ? data.isSidebarCollapsed : false
  }

  if ('pkSettings' in data) next.pkSettings = data.pkSettings

  const appearance = normalizeAppearance(data.appearance)
  if (appearance) next.appearance = appearance

  return next
}

const isAppState = (v: unknown): v is AppState => {
  if (!v || typeof v !== 'object') return false
  const d = v as Partial<AppState>
  if (
    !Array.isArray(d.tasks) ||
    !Array.isArray(d.projects) ||
    !Array.isArray(d.labels) ||
    !Array.isArray(d.sessions) ||
    !Array.isArray(d.timeBlocks)
  ) {
    return false
  }
  if (d.medications !== undefined && !Array.isArray(d.medications)) return false
  if (d.uiScale !== undefined && !isUiScale(d.uiScale)) return false
  if (d.isSidebarCollapsed !== undefined && typeof d.isSidebarCollapsed !== 'boolean') {
    return false
  }
  if (d.appearance !== undefined && !normalizeAppearance(d.appearance)) return false
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
  ) {
    return false
  }
  if ('uiScale' in patch && patch.uiScale !== undefined && !isUiScale(patch.uiScale)) return false
  if (
    'isSidebarCollapsed' in patch &&
    patch.isSidebarCollapsed !== undefined &&
    typeof patch.isSidebarCollapsed !== 'boolean'
  ) {
    return false
  }
  if (
    'appearance' in patch &&
    patch.appearance !== undefined &&
    !normalizeAppearance(patch.appearance)
  ) {
    return false
  }
  return true
}

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
  if ('isSidebarCollapsed' in patch) {
    next = { ...next, isSidebarCollapsed: patch.isSidebarCollapsed }
  }
  if ('appearance' in patch) next = { ...next, appearance: patch.appearance }
  return normalizeAppState(next)
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
    appStore.set('appState', current)
    return current
  })

  ipcMain.handle('store:save', async (_, nextState: unknown) => {
    if (!isAppState(nextState)) throw new Error('Invalid app state payload')
    appStore.set('appState', normalizeAppState(nextState))
  })

  ipcMain.handle('store:savePartial', async (_, patch: unknown) => {
    if (!isAppStatePatch(patch)) throw new Error('Invalid app state patch payload')
    const current = normalizeAppState(appStore.get('appState'))
    appStore.set('appState', mergeAppState(current, patch))
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

  appStore.set('appState', normalizeAppState(appStore.get('appState')))
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!IS_MAC) app.quit()
})
