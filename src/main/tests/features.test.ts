import assert from "node:assert/strict"
import test from "node:test"
import type { AppState, Task } from "../../shared/types"
import {
  isStoredAttachmentName,
  orphanedAttachmentNames,
  storedAttachmentName
} from "../attachments"
import {
  backupFileName,
  backupsToPrune,
  buildExportPayload,
  hasBackupForDay,
  parseImportPayload,
  tasksToCsv
} from "../backup"
import { collectDueReminders, taskDueAtMs } from "../reminders"
import { isAppStatePatch, normalizeAppState } from "../storage/appState"
import { deserializeAppState, serializeAppState } from "../storage/sqlite"

const ID = "11111111-1111-4111-8111-111111111111"
const task = (o: Partial<Task> = {}): Task => ({
  id: ID,
  title: "Pay rent",
  priority: "p2",
  labels: [],
  completed: false,
  status: "todo",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  order: 1,
  subTasks: [],
  ...o
})

test("collectDueReminders fires once inside the window with lead time", () => {
  const t = task({ dueDate: "2026-11-06", dueTime: "15:00" })
  const due = taskDueAtMs(t) as number
  assert.equal(new Date(due).getHours(), 15)
  const lead = 10
  const at = due - lead * 60_000
  assert.equal(collectDueReminders([t], lead, at - 30_000, at).length, 1)
  assert.equal(collectDueReminders([t], lead, at, at + 30_000).length, 0)
  assert.equal(
    collectDueReminders([{ ...t, completed: true }], lead, at - 1, at).length,
    0
  )
  assert.equal(
    collectDueReminders([task({ dueDate: "2026-11-06" })], 0, 0, Date.now() * 2)
      .length,
    0
  )
})

test("backup naming, day detection and pruning", () => {
  const day = new Date(2026, 10, 6)
  assert.equal(backupFileName(day), "swag-todo-2026-11-06.db")
  assert.equal(
    backupFileName(day, "pre-import"),
    "swag-todo-2026-11-06-pre-import.db"
  )
  assert.ok(hasBackupForDay(["swag-todo-2026-11-06.db"], day))
  const names = [
    "swag-todo-2026-11-01.db",
    "swag-todo-2026-11-03.db",
    "notes.txt",
    "swag-todo-2026-11-02.db"
  ]
  assert.deepEqual(backupsToPrune(names, 2), ["swag-todo-2026-11-01.db"])
  assert.deepEqual(backupsToPrune(names, 0), [
    "swag-todo-2026-11-02.db",
    "swag-todo-2026-11-01.db"
  ])
})

test("export payload round-trips through import, legacy and raw shapes", () => {
  const state = normalizeAppState({
    tasks: [task()],
    projects: [],
    labels: [],
    sessions: [],
    timeBlocks: []
  })
  assert.deepEqual(parseImportPayload(buildExportPayload(state)), state)
  assert.deepEqual(
    parseImportPayload(JSON.stringify({ appState: state })),
    state
  )
  assert.deepEqual(parseImportPayload(JSON.stringify(state)), state)
  assert.equal(parseImportPayload("{nope"), null)
  assert.equal(parseImportPayload(JSON.stringify({ hello: 1 })), null)
})

test("tasksToCsv escapes cells and resolves names", () => {
  const state: AppState = {
    tasks: [
      task({ title: 'Say "hi", then\nleave', projectId: "p", labels: ["l"] })
    ],
    projects: [{ id: "p", name: "Home", color: "#fff", createdAt: "" }],
    labels: [{ id: "l", name: "chores", color: "#fff" }],
    sessions: [],
    timeBlocks: []
  }
  const [header, row] = tasksToCsv(state).split("\r\n")
  assert.ok(header.startsWith("id,title,description"))
  assert.ok(row.includes('"Say ""hi"", then\nleave"'))
  assert.ok(row.includes(",Home,chores,"))
})

test("attachment names are validated and orphans detected", () => {
  assert.equal(storedAttachmentName(ID, "Report.PDF"), `${ID}.pdf`)
  assert.equal(storedAttachmentName(ID, "noext"), ID)
  assert.ok(isStoredAttachmentName(`${ID}.pdf`))
  assert.ok(!isStoredAttachmentName("../etc/passwd"))
  assert.ok(!isStoredAttachmentName(`${ID}/../x`))
  const t = task({
    attachments: [
      { id: "a", name: "r.pdf", fileName: `${ID}.pdf`, size: 1, addedAt: "" }
    ]
  })
  const other = "22222222-2222-4222-8222-222222222222.png"
  assert.deepEqual(
    orphanedAttachmentNames([`${ID}.pdf`, other, "readme.txt"], [t]),
    [other]
  )
})

test("new task fields and preferences survive SQLite serialization", () => {
  const state = normalizeAppState({
    tasks: [
      task({
        dueDate: "2026-11-06",
        dueTime: "09:30",
        recurrence: { freq: "weekly", interval: 2, weekdays: [1, 5] },
        blockedBy: ["x"],
        attachments: [
          {
            id: "a",
            name: "r.pdf",
            fileName: `${ID}.pdf`,
            size: 10,
            addedAt: "2026-11-01T00:00:00.000Z"
          }
        ]
      })
    ],
    projects: [],
    labels: [],
    sessions: [],
    timeBlocks: [],
    preferences: { reminderLeadMinutes: 15, closeToTray: true }
  })
  const loaded = deserializeAppState(serializeAppState(state))
  assert.deepEqual(loaded.tasks[0], state.tasks[0])
  assert.equal(loaded.preferences?.reminderLeadMinutes, 15)
  assert.equal(loaded.preferences?.closeToTray, true)
  assert.equal(loaded.preferences?.pomodoroWorkMinutes, 25)
})

test("invalid new fields are dropped, invalid preferences patch rejected", () => {
  const state = normalizeAppState({
    tasks: [{ ...task(), dueTime: "25:99", recurrence: { freq: "hourly" } }],
    projects: [],
    labels: [],
    sessions: [],
    timeBlocks: []
  })
  assert.equal(state.tasks[0].dueTime, undefined)
  assert.equal(state.tasks[0].recurrence, undefined)
  assert.equal(isAppStatePatch({ preferences: { closeToTray: true } }), true)
  assert.equal(isAppStatePatch({ preferences: "nope" }), false)
})
