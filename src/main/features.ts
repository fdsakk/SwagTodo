import { randomUUID } from "node:crypto"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync
} from "node:fs"
import { basename, extname, join } from "node:path"
import {
  app,
  type BrowserWindow,
  dialog,
  globalShortcut,
  type IpcMain,
  Menu,
  Notification,
  nativeImage,
  shell,
  Tray
} from "electron"
import { DEFAULT_PREFERENCES } from "../shared/defaults"
import type { AppPreferences, AppState, TaskAttachment } from "../shared/types"
import {
  isStoredAttachmentName,
  orphanedAttachmentNames,
  storedAttachmentName
} from "./attachments"
import {
  backupFileName,
  backupsToPrune,
  buildExportPayload,
  hasBackupForDay,
  isBackupFile,
  parseImportPayload,
  tasksToCsv
} from "./backup"
import { collectDueReminders } from "./reminders"
import { createSqliteAppStorage, type SqliteAppStorage } from "./storage/sqlite"

const REMINDER_TICK_MS = 30_000
const BACKUP_CHECK_MS = 60 * 60_000

export type FeatureResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { value: T }))
  | { ok: false; canceled?: boolean; error?: string }

interface FeatureDeps {
  ipcMain: IpcMain
  getAppStorage: () => SqliteAppStorage
  getMainWindow: () => BrowserWindow | null
  userDataDir: string
  iconPath: string
}

export interface FeatureHandle {
  onStateSaved: () => void
  /** True when the close should hide to tray instead of quitting. */
  shouldHideOnClose: () => boolean
  markQuitting: () => void
  dispose: () => void
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export function setupFeatures(deps: FeatureDeps): FeatureHandle {
  const backupsDir = join(deps.userDataDir, "backups")
  const attachmentsDir = join(deps.userDataDir, "attachments")
  const notified = new Set<string>()
  let lastReminderCheck = Date.now()
  let tray: Tray | null = null
  let registeredShortcut = ""
  let quitting = false

  const preferences = (): AppPreferences =>
    deps.getAppStorage().loadState().preferences ?? DEFAULT_PREFERENCES

  const showWindow = (): BrowserWindow | null => {
    const win = deps.getMainWindow()
    if (!win || win.isDestroyed()) return null
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
    return win
  }

  const sendToRenderer = (channel: string, ...args: unknown[]): void => {
    const win = showWindow()
    if (!win) return
    if (win.webContents.isLoading()) {
      win.webContents.once("did-finish-load", () =>
        win.webContents.send(channel, ...args)
      )
    } else {
      win.webContents.send(channel, ...args)
    }
  }

  // ---------- backups ----------
  const listBackups = (): string[] => {
    if (!existsSync(backupsDir)) return []
    return readdirSync(backupsDir).filter(isBackupFile)
  }

  const createBackup = async (suffix?: string): Promise<string> => {
    mkdirSync(backupsDir, { recursive: true })
    const target = join(backupsDir, backupFileName(new Date(), suffix))
    if (existsSync(target)) unlinkSync(target)
    await deps.getAppStorage().backupTo(target)
    for (const name of backupsToPrune(
      listBackups(),
      preferences().backupKeep
    )) {
      rmSync(join(backupsDir, name), { force: true })
    }
    return target
  }

  const autoBackup = async (): Promise<void> => {
    if (!preferences().autoBackup) return
    if (hasBackupForDay(listBackups(), new Date())) return
    try {
      await createBackup()
    } catch (error) {
      console.error("[backup] automatic backup failed", error)
    }
  }

  const readStateFromDbFile = (path: string): AppState => {
    const tmp = join(deps.userDataDir, `import-${randomUUID()}.db`)
    copyFileSync(path, tmp)
    try {
      const storage = createSqliteAppStorage(tmp)
      const state = storage.loadState()
      storage.close()
      return state
    } finally {
      for (const suffix of ["", "-wal", "-shm"])
        rmSync(`${tmp}${suffix}`, { force: true })
    }
  }

  // ---------- attachments ----------
  const collectAttachmentGarbage = (): void => {
    if (!existsSync(attachmentsDir)) return
    const orphans = orphanedAttachmentNames(
      readdirSync(attachmentsDir),
      deps.getAppStorage().loadState().tasks
    )
    for (const name of orphans)
      rmSync(join(attachmentsDir, name), { force: true })
  }

  // ---------- reminders ----------
  const checkReminders = (): void => {
    const now = Date.now()
    const from = lastReminderCheck
    lastReminderCheck = now
    const prefs = preferences()
    if (!prefs.notificationsEnabled || !Notification.isSupported()) return
    const due = collectDueReminders(
      deps.getAppStorage().loadState().tasks,
      prefs.reminderLeadMinutes,
      from,
      now
    )
    for (const reminder of due) {
      if (notified.has(reminder.key)) continue
      notified.add(reminder.key)
      const time = new Date(reminder.dueAtMs).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
      const notification = new Notification({
        title: reminder.title,
        body:
          prefs.reminderLeadMinutes > 0
            ? `Due at ${time} (in ${prefs.reminderLeadMinutes} min)`
            : `Due now · ${time}`,
        icon: deps.iconPath
      })
      notification.on("click", () =>
        sendToRenderer("app:openTask", reminder.taskId)
      )
      notification.show()
    }
  }

  // ---------- tray + global shortcut ----------
  const createTray = (): void => {
    try {
      const image = nativeImage
        .createFromPath(deps.iconPath)
        .resize({ width: 22, height: 22 })
      tray = new Tray(image)
      tray.setToolTip("Swag Todo")
      tray.setContextMenu(
        Menu.buildFromTemplate([
          { label: "Show Swag Todo", click: () => showWindow() },
          {
            label: "Quick add task…",
            click: () => sendToRenderer("app:quickAdd")
          },
          { type: "separator" },
          {
            label: "Quit",
            click: () => {
              quitting = true
              app.quit()
            }
          }
        ])
      )
      tray.on("click", () => showWindow())
    } catch (error) {
      console.error("[tray] unavailable", error)
      tray = null
    }
  }

  const syncShortcut = (): void => {
    const accelerator = preferences().quickAddShortcut.trim()
    if (accelerator === registeredShortcut) return
    if (registeredShortcut) globalShortcut.unregister(registeredShortcut)
    registeredShortcut = ""
    if (!accelerator) return
    try {
      if (
        globalShortcut.register(accelerator, () =>
          sendToRenderer("app:quickAdd")
        )
      )
        registeredShortcut = accelerator
      else console.warn("[shortcut] already taken", accelerator)
    } catch (error) {
      console.warn("[shortcut] invalid accelerator", accelerator, error)
    }
  }

  // ---------- IPC ----------
  const { ipcMain } = deps

  ipcMain.handle("backup:create", async (): Promise<FeatureResult<string>> => {
    try {
      return { ok: true, value: await createBackup() }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  })

  ipcMain.handle("backup:openFolder", async () => {
    mkdirSync(backupsDir, { recursive: true })
    await shell.openPath(backupsDir)
  })

  const saveExport = async (
    defaultName: string,
    filters: Electron.FileFilter[],
    content: () => string
  ): Promise<FeatureResult<string>> => {
    const win = deps.getMainWindow()
    const options = { defaultPath: defaultName, filters }
    const result = win
      ? await dialog.showSaveDialog(win, options)
      : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath)
      return { ok: false, canceled: true }
    try {
      writeFileSync(result.filePath, content(), "utf8")
      return { ok: true, value: result.filePath }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  }

  ipcMain.handle("backup:exportJson", () =>
    saveExport(
      `swag-todo-export-${new Date().toISOString().slice(0, 10)}.json`,
      [{ name: "JSON", extensions: ["json"] }],
      () => buildExportPayload(deps.getAppStorage().loadState())
    )
  )

  ipcMain.handle("backup:exportCsv", () =>
    saveExport(
      `swag-todo-tasks-${new Date().toISOString().slice(0, 10)}.csv`,
      [{ name: "CSV", extensions: ["csv"] }],
      () => `﻿${tasksToCsv(deps.getAppStorage().loadState())}`
    )
  )

  ipcMain.handle("backup:import", async (): Promise<FeatureResult<number>> => {
    const win = deps.getMainWindow()
    const options: Electron.OpenDialogOptions = {
      properties: ["openFile"],
      filters: [
        { name: "Swag Todo export or backup", extensions: ["json", "db"] }
      ]
    }
    const picked = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    const path = picked.filePaths[0]
    if (picked.canceled || !path) return { ok: false, canceled: true }

    try {
      const state =
        extname(path).toLowerCase() === ".db"
          ? readStateFromDbFile(path)
          : parseImportPayload(readFileSync(path, "utf8"))
      if (!state) return { ok: false, error: "File is not a Swag Todo export." }

      await createBackup("pre-import")
      deps.getAppStorage().saveState(state)
      handle.onStateSaved()
      return { ok: true, value: state.tasks.length }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  })

  ipcMain.handle("attachments:add", async (): Promise<TaskAttachment[]> => {
    const win = deps.getMainWindow()
    const options: Electron.OpenDialogOptions = {
      properties: ["openFile", "multiSelections"]
    }
    const picked = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    if (picked.canceled) return []

    mkdirSync(attachmentsDir, { recursive: true })
    const added: TaskAttachment[] = []
    for (const source of picked.filePaths) {
      const id = randomUUID()
      const name = basename(source)
      const fileName = storedAttachmentName(id, name)
      copyFileSync(source, join(attachmentsDir, fileName))
      added.push({
        id,
        name,
        fileName,
        size: statSync(source).size,
        addedAt: new Date().toISOString()
      })
    }
    return added
  })

  ipcMain.handle("attachments:open", async (_, fileName: unknown) => {
    if (!isStoredAttachmentName(fileName)) throw new Error("Invalid attachment")
    const path = join(attachmentsDir, fileName)
    if (!existsSync(path)) throw new Error("Attachment file is missing")
    const error = await shell.openPath(path)
    if (error) throw new Error(error)
  })

  ipcMain.handle("app:notify", (_, payload: unknown) => {
    if (!payload || typeof payload !== "object") return
    const { title, body } = payload as { title?: unknown; body?: unknown }
    if (typeof title !== "string" || !Notification.isSupported()) return
    if (!preferences().notificationsEnabled) return
    new Notification({
      title: title.slice(0, 200),
      body: typeof body === "string" ? body.slice(0, 500) : undefined,
      icon: deps.iconPath
    }).show()
  })

  // ---------- lifecycle ----------
  createTray()
  syncShortcut()
  void autoBackup().then(collectAttachmentGarbage)
  const reminderTimer = setInterval(checkReminders, REMINDER_TICK_MS)
  const backupTimer = setInterval(() => void autoBackup(), BACKUP_CHECK_MS)

  const handle: FeatureHandle = {
    onStateSaved: () => syncShortcut(),
    shouldHideOnClose: () =>
      !quitting && tray !== null && preferences().closeToTray,
    markQuitting: () => {
      quitting = true
    },
    dispose: () => {
      clearInterval(reminderTimer)
      clearInterval(backupTimer)
      globalShortcut.unregisterAll()
      tray?.destroy()
      tray = null
    }
  }
  return handle
}
