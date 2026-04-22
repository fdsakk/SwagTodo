import test from 'node:test'
import assert from 'node:assert/strict'
import { createStore } from 'zustand/vanilla'
import type { DomainState, DomainStore } from '../shared/types'
import { createHealthActions } from '../domain/actions/health'
import { createLabelActions } from '../domain/actions/labels'
import { createProjectActions } from '../domain/actions/projects'
import { createSessionActions } from '../domain/actions/sessions'
import { createSettingsActions } from '../domain/actions/settings'
import { createTaskActions } from '../domain/actions/tasks'
import { selectInboxCounts, selectVisibleTasks } from '../domain/selectors'
import { createInitialDomainState } from '../domain/state'

const createTask = (
  overrides: Partial<DomainState['tasks'][number]> = {}
): DomainState['tasks'][number] => ({
  id: overrides.id ?? 'task-1',
  title: overrides.title ?? 'Task',
  description: overrides.description,
  priority: overrides.priority ?? 'p2',
  dueDate: overrides.dueDate,
  projectId: overrides.projectId,
  labels: overrides.labels ?? [],
  completed: overrides.completed ?? false,
  status: overrides.status ?? 'todo',
  completedAt: overrides.completedAt,
  createdAt: overrides.createdAt ?? '2026-04-20T09:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-04-20T09:00:00.000Z',
  order: overrides.order ?? 1,
  subTasks: overrides.subTasks ?? []
})

const createDomainTestStore = (preloaded: Partial<DomainState> = {}) =>
  createStore<DomainStore>()((set, get) => ({
    ...createInitialDomainState(),
    ...preloaded,
    ...createSettingsActions(set),
    ...createTaskActions(set, get),
    ...createProjectActions(set),
    ...createLabelActions(set),
    ...createSessionActions(set, get),
    ...createHealthActions(set)
  }))

test('updateTask preserves task array reference on no-op patches', () => {
  const task = createTask()
  const store = createDomainTestStore({ tasks: [task] })
  const beforeTasks = store.getState().tasks

  store.getState().updateTask(task.id, { title: task.title })

  const afterTasks = store.getState().tasks
  assert.equal(afterTasks, beforeTasks)
  assert.equal(afterTasks[0], task)
})

test('toggleTaskComplete preserves task array reference for unknown task ids', () => {
  const task = createTask()
  const store = createDomainTestStore({ tasks: [task] })
  const beforeTasks = store.getState().tasks

  store.getState().toggleTaskComplete('missing-task')

  assert.equal(store.getState().tasks, beforeTasks)
})

test('toggleSubTask and deleteSubTask preserve references on no-op', () => {
  const task = createTask({
    subTasks: [{ id: 'sub-1', title: 'Child', completed: false }]
  })
  const store = createDomainTestStore({ tasks: [task] })
  const beforeTasks = store.getState().tasks

  store.getState().toggleSubTask(task.id, 'missing-subtask')
  assert.equal(store.getState().tasks, beforeTasks)

  store.getState().deleteSubTask(task.id, 'missing-subtask')
  assert.equal(store.getState().tasks, beforeTasks)
})

test('deleteTask removes only related sessions', () => {
  const taskA = createTask({ id: 'task-a', projectId: 'project-1' })
  const taskB = createTask({ id: 'task-b', projectId: 'project-1', order: 2 })
  const store = createDomainTestStore({
    tasks: [taskA, taskB],
    sessions: [
      {
        id: 'session-a',
        taskId: taskA.id,
        projectId: 'project-1',
        startAt: '2026-04-20T09:00:00.000Z',
        endAt: '2026-04-20T10:00:00.000Z',
        createdAt: '2026-04-20T10:00:00.000Z',
        updatedAt: '2026-04-20T10:00:00.000Z'
      },
      {
        id: 'session-b',
        taskId: taskB.id,
        projectId: 'project-1',
        startAt: '2026-04-20T11:00:00.000Z',
        endAt: '2026-04-20T12:00:00.000Z',
        createdAt: '2026-04-20T12:00:00.000Z',
        updatedAt: '2026-04-20T12:00:00.000Z'
      }
    ]
  })

  store.getState().deleteTask(taskA.id)

  assert.deepEqual(
    store.getState().tasks.map((task) => task.id),
    [taskB.id]
  )
  assert.deepEqual(
    store.getState().sessions.map((session) => session.id),
    ['session-b']
  )
})

test('deleteProject detaches project ids from tasks and removes project sessions', () => {
  const taskA = createTask({ id: 'task-a', projectId: 'project-1' })
  const taskB = createTask({ id: 'task-b', projectId: 'project-2', order: 2 })
  const store = createDomainTestStore({
    tasks: [taskA, taskB],
    projects: [
      {
        id: 'project-1',
        name: 'Project 1',
        color: '#111111',
        createdAt: '2026-04-20T09:00:00.000Z'
      },
      {
        id: 'project-2',
        name: 'Project 2',
        color: '#222222',
        createdAt: '2026-04-20T09:00:00.000Z'
      }
    ],
    sessions: [
      {
        id: 'session-a',
        taskId: taskA.id,
        projectId: 'project-1',
        startAt: '2026-04-20T09:00:00.000Z',
        endAt: '2026-04-20T10:00:00.000Z',
        createdAt: '2026-04-20T10:00:00.000Z',
        updatedAt: '2026-04-20T10:00:00.000Z'
      },
      {
        id: 'session-b',
        taskId: taskB.id,
        projectId: 'project-2',
        startAt: '2026-04-20T11:00:00.000Z',
        endAt: '2026-04-20T12:00:00.000Z',
        createdAt: '2026-04-20T12:00:00.000Z',
        updatedAt: '2026-04-20T12:00:00.000Z'
      }
    ]
  })

  store.getState().deleteProject('project-1')

  assert.equal(store.getState().projects.length, 1)
  assert.equal(store.getState().tasks[0].projectId, undefined)
  assert.equal(store.getState().tasks[1].projectId, 'project-2')
  assert.deepEqual(
    store.getState().sessions.map((session) => session.id),
    ['session-b']
  )
})

test('deleteLabel detaches labels from all tasks', () => {
  const taskA = createTask({ id: 'task-a', labels: ['label-1', 'label-2'] })
  const taskB = createTask({ id: 'task-b', labels: ['label-2'], order: 2 })
  const store = createDomainTestStore({
    tasks: [taskA, taskB],
    labels: [
      { id: 'label-1', name: 'Urgent', color: '#f00' },
      { id: 'label-2', name: 'Home', color: '#0f0' }
    ]
  })

  store.getState().deleteLabel('label-2')

  assert.deepEqual(
    store.getState().labels.map((label) => label.id),
    ['label-1']
  )
  assert.deepEqual(
    store.getState().tasks.map((task) => task.labels),
    [['label-1'], []]
  )
})

test('selectVisibleTasks keeps business ordering for priority, due date, and created date', () => {
  const tasks = [
    createTask({
      id: 'priority-low',
      priority: 'p4',
      order: 3,
      dueDate: '2026-04-25',
      createdAt: '2026-04-18T10:00:00.000Z'
    }),
    createTask({
      id: 'priority-high',
      priority: 'p1',
      order: 2,
      dueDate: '2026-04-24',
      createdAt: '2026-04-17T10:00:00.000Z'
    }),
    createTask({
      id: 'newest',
      priority: 'p2',
      order: 1,
      dueDate: undefined,
      createdAt: '2026-04-21T10:00:00.000Z'
    })
  ]

  const priority = selectVisibleTasks(
    { tasks },
    { searchQuery: '', sortMode: 'priority', showCompleted: false, selectedView: 'inbox' }
  )
  const dueDate = selectVisibleTasks(
    { tasks },
    { searchQuery: '', sortMode: 'due_date', showCompleted: false, selectedView: 'inbox' }
  )
  const createdAt = selectVisibleTasks(
    { tasks },
    { searchQuery: '', sortMode: 'created_at', showCompleted: false, selectedView: 'inbox' }
  )

  assert.deepEqual(
    priority.map((task) => task.id),
    ['priority-high', 'newest', 'priority-low']
  )
  assert.deepEqual(
    dueDate.map((task) => task.id),
    ['priority-high', 'priority-low', 'newest']
  )
  assert.deepEqual(
    createdAt.map((task) => task.id),
    ['newest', 'priority-low', 'priority-high']
  )
})

test('selectInboxCounts preserves inbox and today business rules', () => {
  const tasks = [
    createTask({ id: 'inbox', dueDate: undefined, projectId: undefined }),
    createTask({ id: 'future', dueDate: '2099-01-01', projectId: undefined, order: 2 }),
    createTask({ id: 'today', dueDate: new Date().toISOString().slice(0, 10), order: 3 }),
    createTask({
      id: 'done',
      dueDate: new Date().toISOString().slice(0, 10),
      completed: true,
      status: 'done',
      order: 4
    })
  ]

  assert.deepEqual(selectInboxCounts({ tasks }), { inboxCount: 2, todayCount: 1 })
})
