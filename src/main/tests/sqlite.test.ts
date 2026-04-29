import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_UI_SCALE } from '../../shared/defaults'
import type { AppState } from '../../shared/types'
import { normalizeAppState } from '../storage/appState'
import {
  changedTaskChildIds,
  changedTaskIds,
  deserializeAppState,
  parseLegacyElectronStore,
  serializeAppState
} from '../storage/sqlite'

const createFixtureState = (): AppState => ({
  tasks: [
    {
      id: 'task-1',
      title: 'Ship sqlite',
      description: 'replace electron-store',
      priority: 'p1',
      dueDate: '2026-04-24',
      projectId: 'project-1',
      labels: ['label-2', 'label-1'],
      completed: false,
      status: 'in_progress',
      createdAt: '2026-04-23T10:00:00.000Z',
      updatedAt: '2026-04-23T11:00:00.000Z',
      order: 7,
      subTasks: [
        { id: 'sub-1', title: 'Schema', completed: true },
        { id: 'sub-2', title: 'IPC', completed: false }
      ]
    }
  ],
  projects: [
    {
      id: 'project-1',
      name: 'Swag Todo',
      color: '#111111',
      emoji: '🔥',
      description: 'Core app',
      createdAt: '2026-04-20T10:00:00.000Z'
    }
  ],
  labels: [
    { id: 'label-1', name: 'Backend', color: '#ff0000' },
    { id: 'label-2', name: 'Local-first', color: '#00ff00' }
  ],
  sessions: [
    {
      id: 'session-1',
      taskId: 'task-1',
      projectId: 'project-1',
      startAt: '2026-04-23T12:00:00.000Z',
      endAt: '2026-04-23T13:00:00.000Z',
      createdAt: '2026-04-23T13:00:00.000Z',
      updatedAt: '2026-04-23T13:00:00.000Z'
    }
  ],
  timeBlocks: [
    {
      id: 'block-1',
      label: 'Deep work',
      startAt: '2026-04-23T09:00:00.000Z',
      endAt: '2026-04-23T10:00:00.000Z',
      createdAt: '2026-04-23T08:00:00.000Z'
    }
  ],
  medications: [
    {
      id: 'med-log-1',
      medId: 'med-1',
      medName: 'Coffee',
      dose: 100,
      takenAt: '2026-04-23T07:00:00.000Z',
      createdAt: '2026-04-23T07:00:00.000Z'
    }
  ],
  pkSettings: { peakScale: 1.4, crashThreshold: -0.03 },
  uiScale: 125,
  isSidebarCollapsed: true,
  appearance: {
    themeId: 'retro',
    customTokens: { '--app-bg': '#101010' },
    customTokensByTheme: {
      retro: { '--app-bg': '#101010' },
      default: { '--app-accent': '#222222' }
    }
  }
})

test('deserializeAppState returns normalized defaults for an empty snapshot', () => {
  const state = deserializeAppState({
    tasks: [],
    taskSubtasks: [],
    taskLabels: [],
    projects: [],
    labels: [],
    sessions: [],
    timeBlocks: [],
    medications: [],
    settings: []
  })

  assert.deepEqual(state.tasks, [])
  assert.deepEqual(state.projects, [])
  assert.deepEqual(state.labels, [])
  assert.equal(state.uiScale, DEFAULT_UI_SCALE)
  assert.equal(state.isSidebarCollapsed, false)
})

test('sqlite serialization round-trips full app state', () => {
  const initial = createFixtureState()
  const loaded = deserializeAppState(serializeAppState(initial))

  assert.deepEqual(loaded, normalizeAppState(initial))
})

test('normalizeAppState preserves numeric SQLite subtask completion values', () => {
  const state = normalizeAppState({
    tasks: [
      {
        id: 'task-1',
        title: 'Task with numeric child completion',
        priority: 'p2',
        labels: [],
        completed: 0,
        status: 'todo',
        createdAt: '2026-04-23T10:00:00.000Z',
        updatedAt: '2026-04-23T10:00:00.000Z',
        order: 1,
        subTasks: [{ id: 'sub-1', title: 'Done child', completed: 1 }]
      }
    ]
  })

  assert.equal(state.tasks[0]?.completed, false)
  assert.equal(state.tasks[0]?.subTasks[0]?.completed, true)
})

test('sqlite serialization preserves ordering for tasks, labels, and subtasks', () => {
  const snapshot = serializeAppState(createFixtureState())

  assert.deepEqual(
    snapshot.taskLabels.map((row) => row.label_id),
    ['label-2', 'label-1']
  )
  assert.deepEqual(
    snapshot.taskSubtasks.map((row) => row.id),
    ['sub-1', 'sub-2']
  )
  assert.equal(snapshot.tasks[0]?.sort_order, 7)
  assert.equal(snapshot.projects[0]?.created_at, '2026-04-20T10:00:00.000Z')
})

test('legacy electron-store payload can be parsed and normalized for migration', () => {
  const legacyPayload = JSON.stringify({ appState: createFixtureState() })

  assert.deepEqual(parseLegacyElectronStore(legacyPayload), normalizeAppState(createFixtureState()))
  assert.equal(parseLegacyElectronStore(JSON.stringify({ nope: true })), null)
  assert.equal(parseLegacyElectronStore('{broken json'), null)
})

test('changedTaskIds detects no changes for identical snapshots', () => {
  const snapshot = serializeAppState(createFixtureState())
  const changed = changedTaskIds(snapshot, snapshot)
  assert.equal(changed.size, 0)
})

test('changedTaskIds detects updated task title', () => {
  const base = createFixtureState()
  const modified: AppState = {
    ...base,
    tasks: base.tasks.map((t) => (t.id === 'task-1' ? { ...t, title: 'Updated title' } : t))
  }
  const prev = serializeAppState(base)
  const next = serializeAppState(modified)
  const changed = changedTaskIds(prev, next)
  assert.ok(changed.has('task-1'))
  assert.equal(changed.size, 1)
  assert.equal(changedTaskChildIds(prev, next).size, 0)
})

test('changedTaskIds detects subtask change without row change', () => {
  const base = createFixtureState()
  const modified: AppState = {
    ...base,
    tasks: base.tasks.map((t) =>
      t.id === 'task-1'
        ? { ...t, subTasks: [{ id: 'sub-1', title: 'Schema done', completed: true }] }
        : t
    )
  }
  const prev = serializeAppState(base)
  const next = serializeAppState(modified)
  const changed = changedTaskIds(prev, next)
  assert.ok(changed.has('task-1'))
  assert.ok(changedTaskChildIds(prev, next).has('task-1'))
})

test('changedTaskIds detects label order change', () => {
  const base = createFixtureState()
  const modified: AppState = {
    ...base,
    tasks: base.tasks.map((t) => (t.id === 'task-1' ? { ...t, labels: ['label-1', 'label-2'] } : t))
  }
  const prev = serializeAppState(base)
  const next = serializeAppState(modified)
  const changed = changedTaskIds(prev, next)
  assert.ok(changed.has('task-1'))
  assert.ok(changedTaskChildIds(prev, next).has('task-1'))
})

test('changedTaskIds marks removed task id as changed', () => {
  const base = createFixtureState()
  const modified: AppState = { ...base, tasks: [] }
  const prev = serializeAppState(base)
  const next = serializeAppState(modified)
  const changed = changedTaskIds(prev, next)
  assert.ok(changed.has('task-1'))
})

test('delta write: updating one task does not affect unchanged sibling', () => {
  const task2 = {
    id: 'task-2',
    title: 'Second task',
    priority: 'p3' as const,
    labels: [],
    completed: false,
    status: 'todo' as const,
    createdAt: '2026-04-23T10:00:00.000Z',
    updatedAt: '2026-04-23T10:00:00.000Z',
    order: 2,
    subTasks: []
  }
  const base: AppState = {
    ...createFixtureState(),
    tasks: [...createFixtureState().tasks, task2]
  }
  const modified: AppState = {
    ...base,
    tasks: base.tasks.map((t) => (t.id === 'task-1' ? { ...t, title: 'Changed' } : t))
  }
  const prev = serializeAppState(base)
  const next = serializeAppState(modified)
  const changed = changedTaskIds(prev, next)
  assert.ok(changed.has('task-1'))
  assert.ok(!changed.has('task-2'))
})

test('settings: uiScale and appearance serialize to settings rows', () => {
  const snapshot = serializeAppState(createFixtureState())
  const uiScaleRow = snapshot.settings.find((s) => s.key === 'uiScale')
  const appearanceRow = snapshot.settings.find((s) => s.key === 'appearance')
  assert.ok(uiScaleRow)
  assert.equal(JSON.parse(uiScaleRow.value), 125)
  assert.ok(appearanceRow)
  assert.equal(JSON.parse(appearanceRow.value).themeId, 'retro')
  assert.equal(JSON.parse(appearanceRow.value).customTokensByTheme.retro['--app-bg'], '#101010')
})
