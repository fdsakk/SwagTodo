import type { IpcMainInvokeEvent } from "electron"
import {
  DEFAULT_UI_SCALE,
  UI_SCALE_OPTIONS,
  type UiScale
} from "../shared/defaults"
import type {
  AppState,
  GoogleAuthStatus,
  GoogleSyncSummary
} from "../shared/types"
import { isAppState, isAppStatePatch, isUiScale } from "./storage/appState"

const MIN_ZOOM_FACTOR = UI_SCALE_OPTIONS[0] / 100
const MAX_ZOOM_FACTOR = UI_SCALE_OPTIONS[UI_SCALE_OPTIONS.length - 1] / 100

export interface IpcRegistrar {
  handle(
    channel: string,
    listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown
  ): void
}

export interface IpcStorage {
  loadState(): AppState
  saveState(nextState: AppState): void
  savePartial(patch: Partial<AppState>): void
  loadUiScale(): unknown
}

export interface IpcGoogleSync {
  status(): GoogleAuthStatus
  connect(): Promise<GoogleAuthStatus>
  signout(): Promise<void>
  sync(): Promise<GoogleSyncSummary>
  push(eventId: string, op: "insert" | "patch" | "delete"): void
}

const isOutboxOp = (v: unknown): v is "insert" | "patch" | "delete" =>
  v === "insert" || v === "patch" || v === "delete"

interface SenderWindow {
  webContents: {
    getZoomFactor(): number
    setZoomFactor(factor: number): void
  }
  minimize(): void
  isMaximized(): boolean
  maximize(): void
  unmaximize(): void
  close(): void
  isFullScreen(): boolean
}

interface RegisterIpcHandlersArgs {
  ipcMain: IpcRegistrar
  getAppStorage: () => IpcStorage
  getGoogleSync: () => IpcGoogleSync
  resolveSenderWindow: (event: IpcMainInvokeEvent) => SenderWindow | null
}

export const isZoomFactor = (v: unknown): v is number =>
  typeof v === "number" && v >= MIN_ZOOM_FACTOR && v <= MAX_ZOOM_FACTOR

export const getPersistedUiScale = (
  storage: Pick<IpcStorage, "loadUiScale">
): UiScale => {
  const s = storage.loadUiScale()
  return isUiScale(s) ? s : DEFAULT_UI_SCALE
}

const senderWindow = (
  event: IpcMainInvokeEvent,
  resolveSenderWindow: RegisterIpcHandlersArgs["resolveSenderWindow"]
): SenderWindow => {
  const w = resolveSenderWindow(event)
  if (!w) throw new Error("Unable to resolve sender window")
  return w
}

export function registerIpcHandlers({
  ipcMain,
  getAppStorage,
  getGoogleSync,
  resolveSenderWindow
}: RegisterIpcHandlersArgs): void {
  ipcMain.handle("store:load", async () => getAppStorage().loadState())

  ipcMain.handle("store:save", async (_, nextState: unknown) => {
    if (!isAppState(nextState)) throw new Error("Invalid app state payload")
    getAppStorage().saveState(nextState)
  })

  ipcMain.handle("store:savePartial", async (_, patch: unknown) => {
    if (!isAppStatePatch(patch))
      throw new Error("Invalid app state patch payload")
    getAppStorage().savePartial(patch)
  })

  ipcMain.handle("ui:getZoomFactor", (event) =>
    senderWindow(event, resolveSenderWindow).webContents.getZoomFactor()
  )

  ipcMain.handle("ui:setZoomFactor", (event, nextZoomFactor: unknown) => {
    if (!isZoomFactor(nextZoomFactor))
      throw new Error("Invalid zoom factor payload")
    senderWindow(event, resolveSenderWindow).webContents.setZoomFactor(
      nextZoomFactor
    )
  })

  ipcMain.handle("window:minimize", (event) => {
    senderWindow(event, resolveSenderWindow).minimize()
  })

  ipcMain.handle("window:toggleMaximize", (event) => {
    const w = senderWindow(event, resolveSenderWindow)
    w.isMaximized() ? w.unmaximize() : w.maximize()
  })

  ipcMain.handle("window:close", (event) => {
    senderWindow(event, resolveSenderWindow).close()
  })

  ipcMain.handle("window:getState", (event) => {
    const w = resolveSenderWindow(event)
    return w
      ? { isMaximized: w.isMaximized(), isFullScreen: w.isFullScreen() }
      : { isMaximized: false, isFullScreen: false }
  })

  ipcMain.handle("google:auth:status", () => getGoogleSync().status())
  ipcMain.handle("google:auth:start", () => getGoogleSync().connect())
  ipcMain.handle("google:auth:signout", () => getGoogleSync().signout())
  ipcMain.handle("google:sync:run", () => getGoogleSync().sync())
  ipcMain.handle("google:push", (_, eventId: unknown, op: unknown) => {
    if (typeof eventId !== "string" || !isOutboxOp(op)) {
      throw new Error("Invalid google:push payload")
    }
    getGoogleSync().push(eventId, op)
  })
}
