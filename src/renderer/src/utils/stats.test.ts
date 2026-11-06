import assert from "node:assert/strict"
import test from "node:test"
import type { Task, TaskSession } from "@renderer/types"
import { completionsPerDay, summarizeTasks, timePerProject } from "./stats"

const NOW = new Date(2026, 10, 6, 12, 0)
const iso = (d: number, h = 10) => new Date(2026, 10, d, h).toISOString()
const task = (o: Partial<Task>): Task => ({
  id: o.id ?? Math.random().toString(),
  title: "t",
  priority: "p4",
  labels: [],
  completed: false,
  status: "todo",
  createdAt: new Date(2026, 9, 20).toISOString(),
  updatedAt: iso(1),
  order: 0,
  subTasks: [],
  ...o
})

const tasks: Task[] = [
  task({ completed: true, status: "done", completedAt: iso(6) }),
  task({ completed: true, status: "done", completedAt: iso(5) }),
  task({ completed: true, status: "done", completedAt: iso(4) }),
  task({ completed: true, status: "done", completedAt: iso(1) }),
  task({ dueDate: "2026-11-01" }),
  task({ dueDate: "2026-11-10", createdAt: iso(5) })
]

test("completionsPerDay buckets by local day", () => {
  const days = completionsPerDay(tasks, 7, NOW)
  assert.equal(days.length, 7)
  assert.equal(days[6].date, "2026-11-06")
  // Window is Oct 31 .. Nov 6.
  assert.deepEqual(
    days.map((d) => d.count),
    [0, 1, 0, 0, 1, 1, 1]
  )
})

test("summarizeTasks computes streak, overdue and weekly counts", () => {
  const s = summarizeTasks(tasks, [], NOW)
  assert.equal(s.completedToday, 1)
  assert.equal(s.streak, 3)
  assert.equal(s.active, 2)
  assert.equal(s.overdue, 1)
  assert.equal(s.completedThisWeek, 4)
  assert.equal(s.createdThisWeek, 1)
})

test("timePerProject clips sessions to the window and sorts desc", () => {
  const sessions: TaskSession[] = [
    {
      id: "a",
      taskId: "t",
      projectId: "p1",
      startAt: iso(6, 9),
      endAt: iso(6, 10),
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "b",
      taskId: "t",
      projectId: "p2",
      startAt: iso(6, 9),
      endAt: iso(6, 11),
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "c",
      taskId: "t",
      projectId: "p1",
      startAt: iso(1, 9),
      endAt: iso(1, 10),
      createdAt: "",
      updatedAt: ""
    }
  ]
  const rows = timePerProject(
    sessions,
    [{ id: "p1", name: "One", color: "#000", createdAt: "" }],
    2,
    NOW
  )
  assert.deepEqual(
    rows.map((r) => [r.projectId, r.minutes, r.name]),
    [
      ["p2", 120, "Deleted"],
      ["p1", 60, "One"]
    ]
  )
})
