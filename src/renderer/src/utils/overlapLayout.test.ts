import assert from "node:assert/strict"
import test from "node:test"
import { type LayoutInput, packColumns } from "./overlapLayout"

const block = (id: string, startMin: number, endMin: number): LayoutInput => ({
  id,
  startMin,
  endMin
})

test("non-overlapping blocks each get full width", () => {
  const out = packColumns([block("a", 0, 60), block("b", 60, 120)])
  assert.deepEqual(out.get("a"), { columnIndex: 0, columnCount: 1 })
  assert.deepEqual(out.get("b"), { columnIndex: 0, columnCount: 1 })
})

test("two overlapping blocks split into two columns", () => {
  const out = packColumns([block("a", 0, 90), block("b", 30, 120)])
  assert.equal(out.get("a")?.columnCount, 2)
  assert.equal(out.get("b")?.columnCount, 2)
  assert.notEqual(out.get("a")?.columnIndex, out.get("b")?.columnIndex)
})

test("touching blocks (end === start) do not overlap", () => {
  const out = packColumns([block("a", 0, 60), block("b", 60, 120)])
  assert.equal(out.get("a")?.columnCount, 1)
  assert.equal(out.get("b")?.columnCount, 1)
})

test("a third block reuses a freed column within the cluster", () => {
  // a:0-30 and b:0-60 overlap (2 cols). c:40-90 overlaps b but not a,
  // so it reuses a's column. Whole cluster shares columnCount = 2.
  const out = packColumns([
    block("a", 0, 30),
    block("b", 0, 60),
    block("c", 40, 90)
  ])
  assert.equal(out.get("a")?.columnCount, 2)
  assert.equal(out.get("b")?.columnCount, 2)
  assert.equal(out.get("c")?.columnCount, 2)
  assert.equal(out.get("a")?.columnIndex, out.get("c")?.columnIndex)
})

test("separate clusters are packed independently", () => {
  const out = packColumns([
    block("a", 0, 90),
    block("b", 30, 120),
    block("c", 200, 260)
  ])
  assert.equal(out.get("a")?.columnCount, 2)
  assert.equal(out.get("b")?.columnCount, 2)
  assert.equal(out.get("c")?.columnCount, 1)
})

test("three mutually overlapping blocks need three columns", () => {
  const out = packColumns([
    block("a", 0, 90),
    block("b", 10, 100),
    block("c", 20, 110)
  ])
  for (const id of ["a", "b", "c"]) {
    assert.equal(out.get(id)?.columnCount, 3)
  }
  const cols = ["a", "b", "c"].map((id) => out.get(id)?.columnIndex)
  assert.deepEqual([...cols].sort(), [0, 1, 2])
})

test("empty input returns empty map", () => {
  assert.equal(packColumns([]).size, 0)
})
