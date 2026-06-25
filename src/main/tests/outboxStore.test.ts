import assert from "node:assert/strict"
import test from "node:test"
import { decideCollapse, type OutboxOp } from "../google/outboxStore"

// decideCollapse is the pure folding rule behind OutboxStore.enqueue. It's
// tested directly so the collapse logic needs no native SQLite.

test("first op for an event is queued", () => {
  assert.deepEqual(decideCollapse([], "insert"), {
    action: "queue",
    replaceSameOp: true
  })
})

test("patch after a pending insert keeps the insert", () => {
  assert.deepEqual(decideCollapse(["insert"], "patch"), { action: "keep" })
})

test("delete after a pending insert drops both (never-synced event)", () => {
  assert.deepEqual(decideCollapse(["insert"], "delete"), { action: "drop" })
})

test("delete of a synced event (no pending insert) is queued", () => {
  assert.deepEqual(decideCollapse(["patch"], "delete"), {
    action: "queue",
    replaceSameOp: false
  })
  assert.deepEqual(decideCollapse([], "delete"), {
    action: "queue",
    replaceSameOp: false
  })
})

test("duplicate patch replaces the existing same-op entry", () => {
  assert.deepEqual(decideCollapse(["patch"], "patch"), {
    action: "queue",
    replaceSameOp: true
  })
})

test("the op union stays exhaustive", () => {
  const ops: OutboxOp[] = ["insert", "patch", "delete"]
  for (const op of ops) {
    const decision = decideCollapse([], op)
    assert.ok(["queue", "drop", "keep"].includes(decision.action))
  }
})
