import type Database from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"

type Db = Database.Database

export type OutboxOp = "insert" | "patch" | "delete"

export interface OutboxEntry {
  id: string
  eventId: string
  op: OutboxOp
  createdAt: string
}

type OutboxRow = {
  id: string
  event_id: string
  op: string
  payload: string | null
  created_at: string
}

export type OutboxCollapse =
  | { action: "drop" } // existing ops for this event are cleared, nothing queued
  | { action: "keep" } // existing ops already cover it, no new row
  | { action: "queue"; replaceSameOp: boolean } // enqueue (optionally replacing same-op dupes)

/**
 * Pure decision for how a new op folds into the pending ops already queued for
 * the same event. Extracted so the collapse rules are testable without SQLite.
 *
 * - delete after a pending insert → drop both (never-synced event removed).
 * - delete otherwise → clear pending + queue the delete.
 * - patch after a pending insert → keep the insert (it captures latest state).
 * - same-op duplicate → replace the existing one.
 */
export const decideCollapse = (
  existingOps: readonly OutboxOp[],
  op: OutboxOp
): OutboxCollapse => {
  const hasInsert = existingOps.includes("insert")
  if (op === "delete") {
    return hasInsert
      ? { action: "drop" }
      : { action: "queue", replaceSameOp: false }
  }
  if (op === "patch" && hasInsert) return { action: "keep" }
  return { action: "queue", replaceSameOp: true }
}

/**
 * Durable queue of local mutations awaiting push to Google. Lives in SQLite
 * (not the persisted Zustand state) so sync-origin writes can never round-trip
 * back into it — only user CRUD enqueues here.
 */
export class OutboxStore {
  private readonly db: Db

  constructor(db: Db) {
    this.db = db
  }

  /** Enqueue an op for an event, collapsing redundant earlier ops for it. */
  enqueue(eventId: string, op: OutboxOp): void {
    const existingOps = this.db
      .prepare<[string], { op: string }>(
        "SELECT op FROM calendar_outbox WHERE event_id = ?"
      )
      .all(eventId)
      .map((r) => r.op as OutboxOp)

    const decision = decideCollapse(existingOps, op)

    if (decision.action === "drop") {
      this.db
        .prepare("DELETE FROM calendar_outbox WHERE event_id = ?")
        .run(eventId)
      return
    }
    if (decision.action === "keep") return

    if (op === "delete") {
      // Clear any pending patches/inserts the delete supersedes.
      this.db
        .prepare("DELETE FROM calendar_outbox WHERE event_id = ?")
        .run(eventId)
    } else if (decision.replaceSameOp) {
      this.db
        .prepare("DELETE FROM calendar_outbox WHERE event_id = ? AND op = ?")
        .run(eventId, op)
    }

    this.db
      .prepare(
        `INSERT INTO calendar_outbox (id, event_id, op, payload, created_at)
         VALUES (@id, @eventId, @op, NULL, @createdAt)`
      )
      .run({
        id: uuidv4(),
        eventId,
        op,
        createdAt: new Date().toISOString()
      })
  }

  list(): OutboxEntry[] {
    return this.db
      .prepare<[], OutboxRow>(
        "SELECT * FROM calendar_outbox ORDER BY created_at ASC"
      )
      .all()
      .map((r) => ({
        id: r.id,
        eventId: r.event_id,
        op: r.op as OutboxOp,
        createdAt: r.created_at
      }))
  }

  remove(id: string): void {
    this.db.prepare("DELETE FROM calendar_outbox WHERE id = ?").run(id)
  }
}
