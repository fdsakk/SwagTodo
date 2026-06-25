import assert from "node:assert/strict"
import test from "node:test"
import type { IpcMainInvokeEvent } from "electron"
import { DEFAULT_UI_SCALE } from "../../shared/defaults"
import type { AppState } from "../../shared/types"
import {
  getPersistedUiScale,
  type IpcGoogleSync,
  type IpcRegistrar,
  type IpcStorage,
  isZoomFactor,
  registerIpcHandlers
} from "../ipcHandlers"

const fixtureState = (): AppState => ({
  tasks: [],
  projects: [],
  labels: [],
  sessions: [],
  timeBlocks: [],
  medications: [],
  uiScale: 125,
  isSidebarCollapsed: false
})

const createHarness = () => {
  const handlers = new Map<
    string,
    (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown
  >()
  const calls: string[] = []
  const storage: IpcStorage = {
    loadState: () => fixtureState(),
    saveState: (nextState) => {
      calls.push(`save:${nextState.tasks.length}`)
    },
    savePartial: (patch) => {
      calls.push(`partial:${Object.keys(patch).join(",")}`)
    },
    loadUiScale: () => 125
  }
  const window = {
    zoom: 1,
    maximized: false,
    minimized: false,
    closed: false,
    fullScreen: false,
    webContents: {
      getZoomFactor: () => window.zoom,
      setZoomFactor: (factor: number) => {
        window.zoom = factor
      }
    },
    minimize: () => {
      window.minimized = true
    },
    isMaximized: () => window.maximized,
    maximize: () => {
      window.maximized = true
    },
    unmaximize: () => {
      window.maximized = false
    },
    close: () => {
      window.closed = true
    },
    isFullScreen: () => window.fullScreen
  }

  const googleSync: IpcGoogleSync = {
    status: () => ({ connected: false, encryptionAvailable: true }),
    connect: async () => {
      calls.push("google:connect")
      return {
        connected: true,
        email: "me@example.com",
        encryptionAvailable: true
      }
    },
    signout: async () => {
      calls.push("google:signout")
    },
    sync: async () => {
      calls.push("google:sync")
      return { upserted: 0, deleted: 0, skipped: 0 }
    },
    push: (eventId, op) => {
      calls.push(`google:push:${op}:${eventId}`)
    }
  }

  const ipcMain: IpcRegistrar = {
    handle: (channel, listener) => {
      handlers.set(channel, listener)
    }
  }

  registerIpcHandlers({
    ipcMain,
    getAppStorage: () => storage,
    getGoogleSync: () => googleSync,
    resolveSenderWindow: () => window
  })

  const invoke = async (
    channel: string,
    ...args: unknown[]
  ): Promise<unknown> => {
    const handler = handlers.get(channel)
    assert.ok(handler, `missing handler ${channel}`)
    return handler({} as IpcMainInvokeEvent, ...args)
  }

  return { calls, handlers, invoke, window }
}

test("ipc handlers register expected channels", () => {
  const { handlers } = createHarness()

  assert.deepEqual([...handlers.keys()].sort(), [
    "google:auth:signout",
    "google:auth:start",
    "google:auth:status",
    "google:push",
    "google:sync:run",
    "store:load",
    "store:save",
    "store:savePartial",
    "ui:getZoomFactor",
    "ui:setZoomFactor",
    "window:close",
    "window:getState",
    "window:minimize",
    "window:toggleMaximize"
  ])
})

test("google auth handlers delegate to the sync engine", async () => {
  const { calls, invoke } = createHarness()

  assert.deepEqual(await invoke("google:auth:status"), {
    connected: false,
    encryptionAvailable: true
  })
  await invoke("google:auth:start")
  await invoke("google:sync:run")
  await invoke("google:auth:signout")

  assert.deepEqual(calls, ["google:connect", "google:sync", "google:signout"])
})

test("google:push validates op and forwards to the sync engine", async () => {
  const { calls, invoke } = createHarness()

  await invoke("google:push", "evt-1", "patch")
  await assert.rejects(
    () => invoke("google:push", "evt-1", "bogus"),
    /Invalid google:push payload/
  )
  await assert.rejects(
    () => invoke("google:push", 42, "patch"),
    /Invalid google:push payload/
  )

  assert.deepEqual(calls, ["google:push:patch:evt-1"])
})

test("ipc storage handlers validate full and partial app state payloads", async () => {
  const { calls, invoke } = createHarness()

  await invoke("store:save", fixtureState())
  await invoke("store:savePartial", { uiScale: 150 })
  await assert.rejects(
    () => invoke("store:save", { tasks: "bad" }),
    /Invalid app state payload/
  )
  await assert.rejects(
    () => invoke("store:savePartial", { uiScale: 999 }),
    /Invalid app state/
  )

  assert.deepEqual(calls, ["save:0", "partial:uiScale"])
})

test("ipc window handlers clamp zoom and expose window state", async () => {
  const { invoke, window } = createHarness()

  assert.equal(isZoomFactor(1.25), true)
  assert.equal(isZoomFactor(2), false)
  await invoke("ui:setZoomFactor", 1.25)
  assert.equal(await invoke("ui:getZoomFactor"), 1.25)
  await assert.rejects(
    () => invoke("ui:setZoomFactor", 2),
    /Invalid zoom factor payload/
  )

  await invoke("window:minimize")
  await invoke("window:toggleMaximize")
  assert.equal(window.minimized, true)
  assert.equal(window.maximized, true)
  assert.deepEqual(await invoke("window:getState"), {
    isMaximized: true,
    isFullScreen: false
  })
})

test("getPersistedUiScale falls back when stored value is invalid", () => {
  assert.equal(getPersistedUiScale({ loadUiScale: () => 150 }), 150)
  assert.equal(
    getPersistedUiScale({ loadUiScale: () => 999 }),
    DEFAULT_UI_SCALE
  )
})
