import { app, shell, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DEFAULT_UI_SCALE, UI_SCALE_OPTIONS } from '../shared/defaults'
import type { UiScale } from '../shared/types'
import { isAppState, isAppStatePatch, isUiScale } from './storage/appState'
import { createSqliteAppStorage, type SqliteAppStorage } from './storage/sqlite'

const MIN_ZOOM_FACTOR = UI_SCALE_OPTIONS[0] / 100
const MAX_ZOOM_FACTOR = UI_SCALE_OPTIONS[UI_SCALE_OPTIONS.length - 1] / 100
const IS_MAC = process.platform === 'darwin'
const IS_WAYLAND = process.platform === 'linux' && process.env.XDG_SESSION_TYPE === 'wayland'
let appStorage: SqliteAppStorage | null = null

if (IS_WAYLAND) {
  const WAYLAND_CM_FEATURES =
    'WaylandColorManagement,WaylandColorManagementV1,WaylandColorManagementV2'
  const existing = app.commandLine.getSwitchValue('disable-features')
  app.commandLine.appendSwitch(
    'disable-features',
    existing ? `${existing},${WAYLAND_CM_FEATURES}` : WAYLAND_CM_FEATURES
  )
}

const isZoomFactor = (v: unknown): v is number =>
  typeof v === 'number' && v >= MIN_ZOOM_FACTOR && v <= MAX_ZOOM_FACTOR

const getAppStorage = (): SqliteAppStorage => {
  if (!appStorage) throw new Error('App storage is not initialized')
  return appStorage
}

const getPersistedUiScale = (): UiScale => {
  const s = getAppStorage().loadUiScale()
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
  ipcMain.handle('store:load', async () => getAppStorage().loadState())

  ipcMain.handle('store:save', async (_, nextState: unknown) => {
    if (!isAppState(nextState)) throw new Error('Invalid app state payload')
    getAppStorage().saveState(nextState)
  })

  ipcMain.handle('store:savePartial', async (_, patch: unknown) => {
    if (!isAppStatePatch(patch)) throw new Error('Invalid app state patch payload')
    getAppStorage().savePartial(patch)
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

  appStorage = createSqliteAppStorage(join(app.getPath('userData'), 'swag-todo.db'))
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!IS_MAC) app.quit()
})

app.on('before-quit', () => {
  appStorage?.close()
  appStorage = null
})
