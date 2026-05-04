import { join } from "node:path"
import { electronApp, is, optimizer } from "@electron-toolkit/utils"
import {
  app,
  BrowserWindow,
  dialog,
  type IpcMainInvokeEvent,
  ipcMain,
  shell
} from "electron"
import icon from "../../resources/icon.png?asset"
import { registerIpcHandlers } from "./ipcHandlers"
import { createSqliteAppStorage, type SqliteAppStorage } from "./storage/sqlite"

const IS_MAC = process.platform === "darwin"
const IS_WAYLAND =
  process.platform === "linux" && process.env.XDG_SESSION_TYPE === "wayland"
let appStorage: SqliteAppStorage | null = null
let appStoragePath: string | null = null
let hasShownProcessErrorDialog = false

if (IS_WAYLAND) {
  const WAYLAND_CM_FEATURES =
    "WaylandColorManagement,WaylandColorManagementV1,WaylandColorManagementV2"
  const existing = app.commandLine.getSwitchValue("disable-features")
  app.commandLine.appendSwitch(
    "disable-features",
    existing ? `${existing},${WAYLAND_CM_FEATURES}` : WAYLAND_CM_FEATURES
  )
}

const getAppStorage = (): SqliteAppStorage => {
  if (!appStorage) {
    if (!appStoragePath) throw new Error("App storage path is not initialized")
    appStorage = createSqliteAppStorage(appStoragePath)
  }
  return appStorage
}

const formatProcessError = (value: unknown): string => {
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`
  }

  if (typeof value === "string") return value

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const reportProcessError = (
  kind: "uncaughtException" | "unhandledRejection",
  error: unknown
): void => {
  const detail = formatProcessError(error)
  console.error(`[main] ${kind}`, detail)

  if (!app.isReady() || hasShownProcessErrorDialog) return
  hasShownProcessErrorDialog = true
  dialog.showErrorBox("Swag Todo error", `${kind}\n\n${detail}`)
  hasShownProcessErrorDialog = false
}

function installGlobalErrorHandlers(): void {
  process.on("uncaughtException", (error) => {
    reportProcessError("uncaughtException", error)
  })

  process.on("unhandledRejection", (reason) => {
    reportProcessError("unhandledRejection", reason)
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    transparent: IS_MAC,
    backgroundColor: IS_MAC ? "#00000000" : "#070708",
    ...(IS_MAC
      ? { titleBarStyle: "hiddenInset", trafficLightPosition: { x: 16, y: 14 } }
      : { titleBarStyle: "hidden" }),
    icon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const emitWindowState = (): void => {
    if (mainWindow.isDestroyed()) return
    mainWindow.webContents.send("window:state", {
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen()
    })
  }

  mainWindow.on("maximize", emitWindowState)
  mainWindow.on("unmaximize", emitWindowState)
  mainWindow.on("enter-full-screen", emitWindowState)
  mainWindow.on("leave-full-screen", emitWindowState)
  mainWindow.setMenuBarVisibility(false)

  const showWindow = (): void => {
    if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) mainWindow.show()
  }

  mainWindow.once("ready-to-show", showWindow)
  mainWindow.webContents.once("dom-ready", showWindow)

  const ALLOWED_PROTOCOLS = new Set(["https:", "http:"])
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const { protocol } = new URL(url)
      if (ALLOWED_PROTOCOLS.has(protocol)) void shell.openExternal(url)
    } catch (err) {
      console.error("[window] invalid external url", { url, err })
    }
    return { action: "deny" }
  })

  mainWindow.webContents.on(
    "did-fail-load",
    (_, errorCode, errorDescription) => {
      console.error("[renderer] did-fail-load", { errorCode, errorDescription })
    }
  )

  const rendererUrl = process.env.ELECTRON_RENDERER_URL
  if (is.dev && rendererUrl) {
    void mainWindow.loadURL(rendererUrl)
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron.app")

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  appStoragePath = join(app.getPath("userData"), "swag-todo.db")
  registerIpcHandlers({
    ipcMain,
    getAppStorage,
    resolveSenderWindow: (event: IpcMainInvokeEvent) =>
      BrowserWindow.fromWebContents(event.sender)
  })
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

installGlobalErrorHandlers()

app.on("window-all-closed", () => {
  if (!IS_MAC) app.quit()
})

app.on("before-quit", () => {
  appStorage?.close()
  appStorage = null
})
