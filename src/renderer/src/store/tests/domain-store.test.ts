import assert from "node:assert/strict"
import test from "node:test"
import { createStore } from "zustand/vanilla"
import { createCalendarEventActions } from "../domain/actions/calendarEvents"
import { createHealthActions } from "../domain/actions/health"
import { createLabelActions } from "../domain/actions/labels"
import { createProjectActions } from "../domain/actions/projects"
import { createSessionActions } from "../domain/actions/sessions"
import { createSettingsActions } from "../domain/actions/settings"
import { createTaskActions } from "../domain/actions/tasks"
import {
  selectArchivedTaskGroups,
  selectInboxCounts,
  selectInboxTaskGroups,
  selectVisibleTasks
} from "../domain/selectors"
import { createInitialDomainState } from "../domain/state"
import type { DomainState, DomainStore } from "../shared/types"

const createTask = (
  overrides: Partial<DomainState["tasks"][number]> = {}
): DomainState["tasks"][number] => ({
  id: overrides.id ?? "task-1",
  title: overrides.title ?? "Task",
  description: overrides.description,
  priority: overrides.priority ?? "p2",
  dueDate: overrides.dueDate,
  projectId: overrides.projectId,
  labels: overrides.labels ?? [],
  completed: overrides.completed ?? false,
  status: overrides.status ?? "todo",
  completedAt: overrides.completedAt,
  archivedAt: overrides.archivedAt,
  createdAt: overrides.createdAt ?? "2026-04-20T09:00:00.000Z",
  updatedAt: overrides.updatedAt ?? "2026-04-20T09:00:00.000Z",
  order: overrides.order ?? 1,
  subTasks: overrides.subTasks ?? []
})

const createDomainTestStore = (preloaded: Partial<DomainState> = {}) =>
  createStore<DomainStore>()((set, get) => {
    const actions = {
      ...createSettingsActions(set),
      ...createTaskActions(set, get),
      ...createProjectActions(set),
      ...createLabelActions(set),
      ...createSessionActions(set, get),
      ...createCalendarEventActions(set, get),
      ...createHealthActions(set)
    }

    return {
      ...createInitialDomainState(),
      ...preloaded,
      ...actions,
      actions
    }
  })

test("updateTask preserves task array reference on no-op patches", () => {
  const task = createTask()
  const store = createDomainTestStore({ tasks: [task] })
  const beforeTasks = store.getState().tasks

  store.getState().updateTask(task.id, { title: task.title })

  const afterTasks = store.getState().tasks
  assert.equal(afterTasks, beforeTasks)
  assert.equal(afterTasks[0], task)
})

test("toggleTaskComplete preserves task array reference for unknown task ids", () => {
  const task = createTask()
  const store = createDomainTestStore({ tasks: [task] })
  const beforeTasks = store.getState().tasks

  store.getState().toggleTaskComplete("missing-task")

  assert.equal(store.getState().tasks, beforeTasks)
})

test("archiveTask hides tasks from active selectors and unarchive restores them", () => {
  const task = createTask()
  const store = createDomainTestStore({ tasks: [task] })
  const visibleInput = {
    searchQuery: "",
    sortMode: "priority" as const,
    showCompleted: false,
    selectedView: "inbox" as const
  }
  const inboxInput = {
    searchQuery: "",
    sortMode: "priority" as const,
    inboxStatusFilter: "all" as const,
    inboxProjectFilter: "all" as const,
    inboxPriorityFilter: "all" as const
  }

  store.getState().archiveTask(task.id)

  assert.equal(store.getState().tasks[0].archivedAt !== undefined, true)
  assert.deepEqual(selectVisibleTasks(store.getState(), visibleInput), [])
  assert.deepEqual(
    selectInboxTaskGroups(store.getState(), inboxInput)[0].tasks,
    []
  )
  assert.deepEqual(selectInboxCounts(store.getState()), {
    inboxCount: 0,
    todayCount: 0
  })
  assert.deepEqual(
    selectArchivedTaskGroups(store.getState(), {
      searchQuery: "",
      sortMode: "priority"
    })[0].tasks.map((archivedTask) => archivedTask.id),
    [task.id]
  )

  store.getState().unarchiveTask(task.id)

  assert.equal(store.getState().tasks[0].archivedAt, undefined)
  assert.deepEqual(
    selectVisibleTasks(store.getState(), visibleInput).map(
      (visibleTask) => visibleTask.id
    ),
    [task.id]
  )
})

test("toggleSubTask and deleteSubTask preserve references on no-op", () => {
  const task = createTask({
    subTasks: [{ id: "sub-1", title: "Child", completed: false }]
  })
  const store = createDomainTestStore({ tasks: [task] })
  const beforeTasks = store.getState().tasks

  store.getState().toggleSubTask(task.id, "missing-subtask")
  assert.equal(store.getState().tasks, beforeTasks)

  store.getState().deleteSubTask(task.id, "missing-subtask")
  assert.equal(store.getState().tasks, beforeTasks)
})

test("theme custom tokens survive switching away and back", () => {
  const store = createDomainTestStore()

  store.getState().setThemeId("retro")
  store.getState().setCustomTokens({ "--app-bg": "#111111" })
  store.getState().setThemeId("default")
  store.getState().setCustomTokens({ "--app-accent": "#222222" })
  store.getState().setThemeId("retro")

  assert.deepEqual(store.getState().appearance.customTokens, {
    "--app-bg": "#111111"
  })
  assert.deepEqual(store.getState().appearance.customTokensByTheme.retro, {
    "--app-bg": "#111111"
  })
  assert.deepEqual(store.getState().appearance.customTokensByTheme.default, {
    "--app-accent": "#222222"
  })
})

test("deleteTask removes only related sessions", () => {
  const taskA = createTask({ id: "task-a", projectId: "project-1" })
  const taskB = createTask({ id: "task-b", projectId: "project-1", order: 2 })
  const store = createDomainTestStore({
    tasks: [taskA, taskB],
    sessions: [
      {
        id: "session-a",
        taskId: taskA.id,
        projectId: "project-1",
        startAt: "2026-04-20T09:00:00.000Z",
        endAt: "2026-04-20T10:00:00.000Z",
        createdAt: "2026-04-20T10:00:00.000Z",
        updatedAt: "2026-04-20T10:00:00.000Z"
      },
      {
        id: "session-b",
        taskId: taskB.id,
        projectId: "project-1",
        startAt: "2026-04-20T11:00:00.000Z",
        endAt: "2026-04-20T12:00:00.000Z",
        createdAt: "2026-04-20T12:00:00.000Z",
        updatedAt: "2026-04-20T12:00:00.000Z"
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
    ["session-b"]
  )
})

test("deleteProject detaches project ids from tasks and removes project sessions", () => {
  const taskA = createTask({ id: "task-a", projectId: "project-1" })
  const taskB = createTask({ id: "task-b", projectId: "project-2", order: 2 })
  const store = createDomainTestStore({
    tasks: [taskA, taskB],
    projects: [
      {
        id: "project-1",
        name: "Project 1",
        color: "#111111",
        createdAt: "2026-04-20T09:00:00.000Z"
      },
      {
        id: "project-2",
        name: "Project 2",
        color: "#222222",
        createdAt: "2026-04-20T09:00:00.000Z"
      }
    ],
    sessions: [
      {
        id: "session-a",
        taskId: taskA.id,
        projectId: "project-1",
        startAt: "2026-04-20T09:00:00.000Z",
        endAt: "2026-04-20T10:00:00.000Z",
        createdAt: "2026-04-20T10:00:00.000Z",
        updatedAt: "2026-04-20T10:00:00.000Z"
      },
      {
        id: "session-b",
        taskId: taskB.id,
        projectId: "project-2",
        startAt: "2026-04-20T11:00:00.000Z",
        endAt: "2026-04-20T12:00:00.000Z",
        createdAt: "2026-04-20T12:00:00.000Z",
        updatedAt: "2026-04-20T12:00:00.000Z"
      }
    ]
  })

  store.getState().deleteProject("project-1")

  assert.equal(store.getState().projects.length, 1)
  assert.equal(store.getState().tasks[0].projectId, undefined)
  assert.equal(store.getState().tasks[1].projectId, "project-2")
  assert.deepEqual(
    store.getState().sessions.map((session) => session.id),
    ["session-b"]
  )
})

test("deleteLabel detaches labels from all tasks", () => {
  const taskA = createTask({ id: "task-a", labels: ["label-1", "label-2"] })
  const taskB = createTask({ id: "task-b", labels: ["label-2"], order: 2 })
  const store = createDomainTestStore({
    tasks: [taskA, taskB],
    labels: [
      { id: "label-1", name: "Urgent", color: "#f00" },
      { id: "label-2", name: "Home", color: "#0f0" }
    ]
  })

  store.getState().deleteLabel("label-2")

  assert.deepEqual(
    store.getState().labels.map((label) => label.id),
    ["label-1"]
  )
  assert.deepEqual(
    store.getState().tasks.map((task) => task.labels),
    [["label-1"], []]
  )
})

test("selectVisibleTasks keeps business ordering for priority, due date, and created date", () => {
  const tasks = [
    createTask({
      id: "priority-low",
      priority: "p4",
      order: 3,
      dueDate: "2026-04-25",
      createdAt: "2026-04-18T10:00:00.000Z"
    }),
    createTask({
      id: "priority-high",
      priority: "p1",
      order: 2,
      dueDate: "2026-04-24",
      createdAt: "2026-04-17T10:00:00.000Z"
    }),
    createTask({
      id: "newest",
      priority: "p2",
      order: 1,
      dueDate: undefined,
      createdAt: "2026-04-21T10:00:00.000Z"
    })
  ]

  const priority = selectVisibleTasks(
    { tasks },
    {
      searchQuery: "",
      sortMode: "priority",
      showCompleted: false,
      selectedView: "inbox"
    }
  )
  const dueDate = selectVisibleTasks(
    { tasks },
    {
      searchQuery: "",
      sortMode: "due_date",
      showCompleted: false,
      selectedView: "inbox"
    }
  )
  const createdAt = selectVisibleTasks(
    { tasks },
    {
      searchQuery: "",
      sortMode: "created_at",
      showCompleted: false,
      selectedView: "inbox"
    }
  )

  assert.deepEqual(
    priority.map((task) => task.id),
    ["priority-high", "newest", "priority-low"]
  )
  assert.deepEqual(
    dueDate.map((task) => task.id),
    ["priority-high", "priority-low", "newest"]
  )
  assert.deepEqual(
    createdAt.map((task) => task.id),
    ["newest", "priority-low", "priority-high"]
  )
})

test("selectInboxCounts preserves inbox and today business rules", () => {
  const tasks = [
    createTask({ id: "inbox", dueDate: undefined, projectId: undefined }),
    createTask({ id: "project-active", projectId: "project-1", order: 2 }),
    createTask({
      id: "future",
      dueDate: "2099-01-01",
      projectId: undefined,
      order: 3
    }),
    createTask({
      id: "today",
      dueDate: new Date().toISOString().slice(0, 10),
      order: 3
    }),
    createTask({
      id: "done",
      dueDate: new Date().toISOString().slice(0, 10),
      completed: true,
      status: "done",
      order: 5
    })
  ]

  assert.deepEqual(selectInboxCounts({ tasks }), {
    inboxCount: 4,
    todayCount: 1
  })
})

test("selectInboxTaskGroups groups all tasks by due date and keeps no date first", () => {
  const tasks = [
    createTask({ id: "no-date-project", projectId: "project-1" }),
    createTask({ id: "with-date-2", dueDate: "2026-04-23", order: 2 }),
    createTask({ id: "with-date-1", dueDate: "2026-04-22", order: 3 }),
    createTask({ id: "no-date-inbox", projectId: undefined, order: 4 })
  ]

  const groups = selectInboxTaskGroups(
    { tasks },
    {
      searchQuery: "",
      sortMode: "priority",
      inboxStatusFilter: "all",
      inboxProjectFilter: "all",
      inboxPriorityFilter: "all"
    }
  )

  assert.equal(groups[0].id, "no-date")
  assert.deepEqual(
    groups[0].tasks.map((task) => task.id),
    ["no-date-project", "no-date-inbox"]
  )
  assert.deepEqual(
    groups.slice(1).map((group) => group.id),
    ["date-2026-04-22", "date-2026-04-23"]
  )
})

test("selectInboxTaskGroups applies inbox filters for status, project, and priority", () => {
  const tasks = [
    createTask({
      id: "active-p1-project",
      priority: "p1",
      projectId: "project-1"
    }),
    createTask({
      id: "active-p2-inbox",
      priority: "p2",
      projectId: undefined,
      order: 2
    }),
    createTask({
      id: "done-p1-project",
      priority: "p1",
      projectId: "project-1",
      completed: true,
      status: "done",
      order: 3
    })
  ]

  const groups = selectInboxTaskGroups(
    { tasks },
    {
      searchQuery: "",
      sortMode: "priority",
      inboxStatusFilter: "active",
      inboxProjectFilter: "project-1",
      inboxPriorityFilter: "p1"
    }
  )

  assert.deepEqual(
    groups.flatMap((group) => group.tasks.map((task) => task.id)),
    ["active-p1-project"]
  )
})

test("addCalendarEvent assigns a uuid id and local_only status", () => {
  const store = createDomainTestStore()
  const result = store.getState().addCalendarEvent({
    title: "Lunch",
    startAt: "2026-05-01T12:00:00.000Z",
    endAt: "2026-05-01T13:00:00.000Z"
  })
  assert.ok(result.ok)
  const event = store.getState().calendarEvents[0]
  assert.match(
    event.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  )
  assert.equal(event.title, "Lunch")
  assert.equal(event.allDay, false)
  assert.equal(event.syncStatus, "local_only")
})

test("addCalendarEvent rejects an inverted time range", () => {
  const store = createDomainTestStore()
  const result = store.getState().addCalendarEvent({
    title: "Bad",
    startAt: "2026-05-01T13:00:00.000Z",
    endAt: "2026-05-01T12:00:00.000Z"
  })
  assert.equal(result.ok, false)
  assert.equal(store.getState().calendarEvents.length, 0)
})

test("updateCalendarEvent flips a synced event to pending", () => {
  const store = createDomainTestStore({
    calendarEvents: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Synced",
        startAt: "2026-05-01T12:00:00.000Z",
        endAt: "2026-05-01T13:00:00.000Z",
        allDay: false,
        googleEventId: "g-1",
        syncStatus: "synced",
        createdAt: "2026-05-01T10:00:00.000Z",
        updatedAt: "2026-05-01T10:00:00.000Z"
      }
    ]
  })
  store.getState().updateCalendarEvent("11111111-1111-4111-8111-111111111111", {
    title: "Renamed"
  })
  const event = store.getState().calendarEvents[0]
  assert.equal(event.title, "Renamed")
  assert.equal(event.syncStatus, "pending")
})

test("deleteCalendarEvent preserves array reference for unknown ids", () => {
  const store = createDomainTestStore()
  const before = store.getState().calendarEvents
  store.getState().deleteCalendarEvent("missing")
  assert.equal(store.getState().calendarEvents, before)
})

test("user CRUD enqueues a push to the main process (outbound sync trigger)", () => {
  const pushes: Array<[string, string]> = []
  // Stand in for the preload bridge so the echo-guard path is exercised.
  ;(globalThis as { window?: unknown }).window = {
    api: { google: { push: (id: string, op: string) => pushes.push([id, op]) } }
  }
  try {
    const store = createDomainTestStore()
    const created = store.getState().addCalendarEvent({
      title: "Event",
      startAt: "2026-05-01T12:00:00.000Z",
      endAt: "2026-05-01T13:00:00.000Z"
    })
    assert.ok(created.ok)
    const id = created.ok ? created.id : ""
    store.getState().updateCalendarEvent(id, { title: "Renamed" })
    store.getState().deleteCalendarEvent(id)
    assert.deepEqual(pushes, [
      [id, "insert"],
      [id, "patch"],
      [id, "delete"]
    ])
  } finally {
    ;(globalThis as { window?: unknown }).window = undefined
  }
})
