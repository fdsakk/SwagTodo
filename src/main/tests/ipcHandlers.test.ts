import test from 'node:test'
import assert from 'node:assert/strict'
import type { IpcMainInvokeEvent } from 'electron'
import { DEFAULT_UI_SCALE } from '../../shared/defaults'
import type { AppState } from '../../shared/types'
import {
  getPersistedUiScale,
  isZoomFactor,
  registerIpcHandlers,
  type IpcRegistrar,
  type IpcStorage
} from '../ipcHandlers'

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
  const handlers = new Map<string, (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown>()
  const calls: string[] = []
  const storage: IpcStorage = {
    loadState: () => fixtureState(),
    saveState: (nextState) => {
      calls.push(`save:${nextState.tasks.length}`)
    },
    savePartial: (patch) => {
      calls.push(`partial:${Object.keys(patch).join(',')}`)
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

  const ipcMain: IpcRegistrar = {
    handle: (channel, listener) => {
      handlers.set(channel, listener)
    }
  }

  registerIpcHandlers({
    ipcMain,
    getAppStorage: () => storage,
    resolveSenderWindow: () => window
  })

  const invoke = async (channel: string, ...args: unknown[]): Promise<unknown> => {
    const handler = handlers.get(channel)
    assert.ok(handler, `missing handler ${channel}`)
    return handler({} as IpcMainInvokeEvent, ...args)
  }

  return { calls, handlers, invoke, window }
}

test('ipc handlers register expected channels', () => {
  const { handlers } = createHarness()

  assert.deepEqual([...handlers.keys()].sort(), [
    'store:load',
    'store:save',
    'store:savePartial',
    'ui:getZoomFactor',
    'ui:setZoomFactor',
    'window:close',
    'window:getState',
    'window:minimize',
    'window:toggleMaximize'
  ])
})

test('ipc storage handlers validate full and partial app state payloads', async () => {
  const { calls, invoke } = createHarness()

  await invoke('store:save', fixtureState())
  await invoke('store:savePartial', { uiScale: 150 })
  await assert.rejects(() => invoke('store:save', { tasks: 'bad' }), /Invalid app state payload/)
  await assert.rejects(() => invoke('store:savePartial', { uiScale: 999 }), /Invalid app state/)

  assert.deepEqual(calls, ['save:0', 'partial:uiScale'])
})

test('ipc window handlers clamp zoom and expose window state', async () => {
  const { invoke, window } = createHarness()

  assert.equal(isZoomFactor(1.25), true)
  assert.equal(isZoomFactor(2), false)
  await invoke('ui:setZoomFactor', 1.25)
  assert.equal(await invoke('ui:getZoomFactor'), 1.25)
  await assert.rejects(() => invoke('ui:setZoomFactor', 2), /Invalid zoom factor payload/)

  await invoke('window:minimize')
  await invoke('window:toggleMaximize')
  assert.equal(window.minimized, true)
  assert.equal(window.maximized, true)
  assert.deepEqual(await invoke('window:getState'), { isMaximized: true, isFullScreen: false })
})

test('getPersistedUiScale falls back when stored value is invalid', () => {
  assert.equal(getPersistedUiScale({ loadUiScale: () => 150 }), 150)
  assert.equal(getPersistedUiScale({ loadUiScale: () => 999 }), DEFAULT_UI_SCALE)
})
