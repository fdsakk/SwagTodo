import assert from "node:assert/strict"
import test from "node:test"
import { createStore } from "zustand/vanilla"
import { createLabelActions } from "../domain/actions/labels"
import { createProjectActions } from "../domain/actions/projects"
import { createSessionActions } from "../domain/actions/sessions"
import { createSettingsActions } from "../domain/actions/settings"
import { createTaskActions } from "../domain/actions/tasks"
import {
  selectUpcomingTaskGroups,
  selectVisibleTasks
} from "../domain/selectors"
import { createInitialDomainState } from "../domain/state"
import type { DomainState, DomainStore } from "../shared/types"

type Task = DomainState["tasks"][number]
const task = (o: Partial<Task> = {}): Task => ({
  id: o.id ?? "t1",
  title: "Task",
  priority: "p3",
  labels: [],
  completed: false,
  status: "todo",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  order: 1,
  subTasks: [],
  ...o
})

const makeStore = (preloaded: Partial<DomainState> = {}) =>
  createStore<DomainStore>()((set, get) => {
    const actions = {
      ...createSettingsActions(set),
      ...createTaskActions(set, get),
      ...createProjectActions(set),
      ...createLabelActions(set),
      ...createSessionActions(set, get)
    } as DomainStore["actions"]
    return { ...createInitialDomainState(), ...preloaded, ...actions, actions }
  })

test("completing a recurring task keeps history and spawns next occurrence", () => {
  const store = makeStore({
    tasks: [
      task({
        dueDate: "2999-01-01",
        dueTime: "08:00",
        recurrence: { freq: "daily", interval: 1 },
        subTasks: [{ id: "s", title: "step", completed: true }]
      })
    ]
  })
  store.getState().toggleTaskComplete("t1")
  const [done, next] = store.getState().tasks
  assert.equal(done.completed, true)
  assert.equal(done.recurrence, undefined)
  assert.equal(next.completed, false)
  assert.equal(next.dueDate, "2999-01-02")
  assert.equal(next.dueTime, "08:00")
  assert.deepEqual(next.recurrence, { freq: "daily", interval: 1 })
  assert.equal(next.subTasks[0].completed, false)
  assert.ok(next.order > done.order)

  // Un-completing the old instance must not spawn another one.
  store.getState().toggleTaskComplete("t1")
  store.getState().toggleTaskComplete("t1")
  assert.equal(store.getState().tasks.length, 2)
})

test("kanban move to done also spawns the next occurrence", () => {
  const store = makeStore({
    tasks: [
      task({
        projectId: "p",
        dueDate: "2999-01-01",
        recurrence: { freq: "weekly", interval: 1 }
      })
    ]
  })
  store
    .getState()
    .applyKanbanOrder("p", { todo: [], in_progress: [], done: ["t1"] })
  assert.equal(store.getState().tasks.length, 2)
  assert.equal(store.getState().tasks[1].dueDate, "2999-01-08")
})

test("deleteTasks returns a snapshot that restoreTasks puts back in place", () => {
  const store = makeStore({
    tasks: [task({ id: "a" }), task({ id: "b" }), task({ id: "c" })],
    sessions: [
      {
        id: "s1",
        taskId: "b",
        projectId: "p",
        startAt: "",
        endAt: "",
        createdAt: "",
        updatedAt: ""
      },
      {
        id: "s2",
        taskId: "c",
        projectId: "p",
        startAt: "",
        endAt: "",
        createdAt: "",
        updatedAt: ""
      }
    ]
  })
  const snapshot = store.getState().deleteTasks(["a", "b"])
  assert.deepEqual(
    store.getState().tasks.map((t) => t.id),
    ["c"]
  )
  assert.deepEqual(
    store.getState().sessions.map((s) => s.id),
    ["s2"]
  )
  store.getState().restoreTasks(snapshot)
  assert.deepEqual(
    store.getState().tasks.map((t) => t.id),
    ["a", "b", "c"]
  )
  assert.deepEqual(
    store
      .getState()
      .sessions.map((s) => s.id)
      .sort(),
    ["s1", "s2"]
  )
  // Restoring twice is a no-op.
  const before = store.getState().tasks
  store.getState().restoreTasks(snapshot)
  assert.equal(store.getState().tasks, before)
})

test("bulk actions update only the selected tasks", () => {
  const store = makeStore({
    tasks: [task({ id: "a" }), task({ id: "b" }), task({ id: "c" })]
  })
  store.getState().updateTasks(["a", "c"], { priority: "p1", projectId: "p" })
  store.getState().setTasksCompleted(["b", "c"], true)
  store.getState().archiveTasks(["a"])
  const byId = Object.fromEntries(store.getState().tasks.map((t) => [t.id, t]))
  assert.equal(byId.a.priority, "p1")
  assert.equal(byId.b.priority, "p3")
  assert.equal(byId.c.projectId, "p")
  assert.equal(byId.b.completed, true)
  assert.ok(byId.a.archivedAt)
  store.getState().unarchiveTasks(["a"])
  assert.equal(store.getState().tasks[0].archivedAt, undefined)
})

test("dueTime is cleared with the date; blockedBy ignores self references", () => {
  const store = makeStore({
    tasks: [task({ dueDate: "2026-11-06", dueTime: "10:00" })]
  })
  store.getState().updateTask("t1", { blockedBy: ["t1", "x"] })
  assert.deepEqual(store.getState().tasks[0].blockedBy, ["x"])
  store.getState().updateTask("t1", { dueDate: undefined })
  assert.equal(store.getState().tasks[0].dueTime, undefined)
  store.getState().updateTask("t1", { dueTime: "09:00" })
  assert.equal(store.getState().tasks[0].dueTime, undefined)
})

test("attachments add/remove and preferences update", () => {
  const store = makeStore({ tasks: [task()] })
  const a = { id: "a1", name: "r.pdf", fileName: "x.pdf", size: 1, addedAt: "" }
  store.getState().addAttachments("t1", [a])
  assert.deepEqual(store.getState().tasks[0].attachments, [a])
  store.getState().removeAttachment("t1", "a1")
  assert.equal(store.getState().tasks[0].attachments, undefined)

  const prefs = store.getState().preferences
  store.getState().updatePreferences({ closeToTray: prefs.closeToTray })
  assert.equal(store.getState().preferences, prefs)
  store.getState().updatePreferences({ closeToTray: !prefs.closeToTray })
  assert.equal(store.getState().preferences.closeToTray, !prefs.closeToTray)
})

test("search matches descriptions and subtasks; manual sort uses order", () => {
  const tasks = [
    task({ id: "a", title: "Alpha", order: 3 }),
    task({ id: "b", title: "Beta", description: "contains NEEDLE", order: 1 }),
    task({
      id: "c",
      title: "Gamma",
      subTasks: [{ id: "s", title: "needle inside", completed: false }],
      order: 2
    })
  ]
  const input = {
    searchQuery: "",
    sortMode: "manual" as const,
    showCompleted: true,
    selectedView: "inbox" as const
  }
  assert.deepEqual(
    selectVisibleTasks({ tasks }, input).map((t) => t.id),
    ["b", "c", "a"]
  )
  assert.deepEqual(
    selectVisibleTasks({ tasks }, { ...input, searchQuery: "needle" }).map(
      (t) => t.id
    ),
    ["b", "c"]
  )
})

test("upcoming groups overdue and the next seven days", () => {
  const today = new Date(2026, 10, 6)
  const tasks = [
    task({ id: "old", dueDate: "2026-11-01" }),
    task({ id: "tod", dueDate: "2026-11-06" }),
    task({ id: "wk", dueDate: "2026-11-12" }),
    task({ id: "far", dueDate: "2026-11-20" }),
    task({ id: "done", dueDate: "2026-11-06", completed: true, status: "done" })
  ]
  const groups = selectUpcomingTaskGroups(
    { tasks },
    { searchQuery: "", sortMode: "due_date" },
    today
  )
  assert.equal(groups.length, 8)
  assert.deepEqual(
    groups[0].tasks.map((t) => t.id),
    ["old"]
  )
  assert.deepEqual(
    groups[1].tasks.map((t) => t.id),
    ["tod"]
  )
  assert.equal(groups[1].id, "2026-11-06")
  assert.deepEqual(
    groups[7].tasks.map((t) => t.id),
    ["wk"]
  )
})

test("completed tasks older than 14 days are auto-archived without touching updatedAt", () => {
  const now = new Date("2026-11-20T12:00:00.000Z")
  const store = makeStore({
    tasks: [
      task({
        id: "old",
        completed: true,
        status: "done",
        completedAt: "2026-11-06T12:00:00.000Z"
      }),
      task({
        id: "recent",
        completed: true,
        status: "done",
        completedAt: "2026-11-06T12:00:01.000Z"
      }),
      task({ id: "open" }),
      task({
        id: "already",
        completed: true,
        status: "done",
        completedAt: "2026-01-01T00:00:00.000Z",
        archivedAt: "2026-02-01T00:00:00.000Z"
      })
    ]
  })
  assert.equal(store.getState().archiveStaleCompletedTasks(now), 1)
  const byId = Object.fromEntries(store.getState().tasks.map((t) => [t.id, t]))
  assert.equal(byId.old.archivedAt, now.toISOString())
  assert.equal(byId.old.updatedAt, "2026-11-01T10:00:00.000Z")
  assert.equal(byId.recent.archivedAt, undefined)
  assert.equal(byId.open.archivedAt, undefined)
  assert.equal(byId.already.archivedAt, "2026-02-01T00:00:00.000Z")

  // Nothing left to archive: state reference is preserved.
  const before = store.getState().tasks
  assert.equal(store.getState().archiveStaleCompletedTasks(now), 0)
  assert.equal(store.getState().tasks, before)
})
