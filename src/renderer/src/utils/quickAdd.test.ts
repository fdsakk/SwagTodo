import assert from "node:assert/strict"
import test from "node:test"
import type { Label, Project } from "@renderer/types"
import { parseQuickAdd } from "./quickAdd"

const NOW = new Date(2026, 10, 6, 10, 0) // Friday
const projects: Project[] = [
  { id: "p-work", name: "Work Stuff", color: "#fff", createdAt: "" },
  { id: "p-home", name: "Dom", color: "#fff", createdAt: "" }
]
const labels: Label[] = [{ id: "l-urgent", name: "urgent", color: "#f00" }]
const parse = (text: string) =>
  parseQuickAdd(text, { projects, labels, now: NOW })

test("parses English date, time, priority, label and project", () => {
  const r = parse("Call Anna tomorrow at 3pm p1 #urgent #new @work")
  assert.equal(r.title, "Call Anna")
  assert.equal(r.dueDate, "2026-11-07")
  assert.equal(r.dueTime, "15:00")
  assert.equal(r.priority, "p1")
  assert.deepEqual(r.labelIds, ["l-urgent"])
  assert.deepEqual(r.newLabels, ["new"])
  assert.equal(r.projectId, "p-work")
})

test("parses Polish dates and times", () => {
  assert.deepEqual(
    (({ title, dueDate, dueTime }) => ({ title, dueDate, dueTime }))(
      parse("Zadzwoń do mamy jutro o 18")
    ),
    { title: "Zadzwoń do mamy", dueDate: "2026-11-07", dueTime: "18:00" }
  )
  assert.equal(parse("Raport w poniedziałek").dueDate, "2026-11-09")
  assert.equal(parse("Raport w pon").dueDate, "2026-11-09")
  assert.equal(parse("Coś pojutrze").dueDate, "2026-11-08")
  assert.equal(parse("Coś za 3 dni").dueDate, "2026-11-09")
  assert.equal(parse("Coś za tydzień").dueDate, "2026-11-13")
  assert.equal(parse("Zakupy dziś 9:30 @dom").projectId, "p-home")
})

test("parses explicit dates and rolls past day.month into next year", () => {
  assert.equal(parse("Pay 2026-12-01").dueDate, "2026-12-01")
  assert.equal(parse("Pay 20.11").dueDate, "2026-11-20")
  assert.equal(parse("Pay 1.02").dueDate, "2027-02-01")
  assert.equal(parse("Pay on 24/12").dueDate, "2026-12-24")
})

test("parses recurrence and derives first due date", () => {
  const daily = parse("Water plants every day")
  assert.equal(daily.title, "Water plants")
  assert.deepEqual(daily.recurrence, { freq: "daily", interval: 1 })
  assert.equal(daily.dueDate, "2026-11-06")

  const weekly = parse("Gym every mon and wed 7:00")
  assert.deepEqual(weekly.recurrence, {
    freq: "weekly",
    interval: 1,
    weekdays: [1, 3]
  })
  assert.equal(weekly.dueDate, "2026-11-09")
  assert.equal(weekly.dueTime, "07:00")

  assert.deepEqual(parse("Rachunki co 2 tygodnie").recurrence, {
    freq: "weekly",
    interval: 2
  })
  assert.deepEqual(
    parse("Standup w dni robocze").recurrence?.weekdays,
    [1, 2, 3, 4, 5]
  )
  assert.deepEqual(parse("Czynsz co miesiąc").recurrence, {
    freq: "monthly",
    interval: 1
  })
})

test("keeps ordinary words and unknown projects in the title", () => {
  const r = parse("Think about the sat exam @unknown")
  assert.equal(r.title, "Think about the sat exam @unknown")
  assert.equal(r.dueDate, undefined)
  assert.equal(r.projectId, undefined)
})
