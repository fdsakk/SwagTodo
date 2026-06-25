import type Database from "better-sqlite3"
import type {
  AppState,
  GoogleAuthStatus,
  GoogleSyncSummary
} from "../../shared/types"
import { GoogleAccountStore } from "./accountStore"
import {
  deleteEvent,
  getEvent,
  insertEvent,
  listEvents,
  type OAuthCredentials,
  PreconditionFailedError,
  patchEvent,
  readCredentials,
  refreshAccessToken,
  revokeToken,
  SyncTokenExpiredError
} from "./client"
import {
  reduceRemoteEvents,
  resolveConflict,
  toGoogleEventBody
} from "./eventMapper"
import { runOAuthFlow } from "./oauth"
import { type OutboxOp, OutboxStore } from "./outboxStore"

type Db = Database.Database

const PUSH_DEBOUNCE_MS = 1500

export interface SyncStorage {
  loadState(): AppState
  savePartial(patch: Partial<AppState>): void
}

/**
 * Owns the Google Calendar connection in the main process: OAuth lifecycle,
 * access-token refresh, and the pull sync loop (push lands in Phase 5). The
 * renderer never sees tokens — only auth status and sync summaries. Pulled
 * events are written through `storage.savePartial` (same path as local CRUD, so
 * the cache/delta layer stays consistent), then the renderer is notified.
 */
export class GoogleSync {
  private readonly accounts: GoogleAccountStore
  private readonly outbox: OutboxStore
  private readonly storage: SyncStorage
  private readonly notifyChanged: () => void
  private accessToken: string | null = null
  private accessTokenExpiresAt = 0
  private creds: OAuthCredentials | null = null
  private syncing = false
  private draining = false
  private pushTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    db: Db,
    storage: SyncStorage,
    notifyChanged: () => void = () => {}
  ) {
    this.accounts = new GoogleAccountStore(db)
    this.outbox = new OutboxStore(db)
    this.storage = storage
    this.notifyChanged = notifyChanged
  }

  private credentials(): OAuthCredentials {
    if (!this.creds) this.creds = readCredentials()
    return this.creds
  }

  status(): GoogleAuthStatus {
    const account = this.accounts.getAccount()
    return {
      connected: this.accounts.isConnected(),
      email: account?.email ?? undefined,
      lastSyncAt: account?.lastSyncAt ?? undefined,
      encryptionAvailable: this.accounts.isEncryptionAvailable()
    }
  }

  async connect(): Promise<GoogleAuthStatus> {
    if (!this.accounts.isEncryptionAvailable()) {
      throw new Error(
        "Secret encryption is unavailable on this system (no OS keyring). Connect aborted to avoid storing tokens in plaintext."
      )
    }
    const result = await runOAuthFlow(this.credentials())
    this.accounts.connect({
      email: result.email,
      refreshToken: result.refreshToken
    })
    this.accessToken = null
    this.accessTokenExpiresAt = 0
    // Initial full pull right after connecting.
    try {
      await this.sync()
    } catch (error) {
      console.error("[google] initial sync failed", error)
    }
    return this.status()
  }

  async signout(): Promise<void> {
    const refreshToken = this.accounts.getRefreshToken()
    if (refreshToken) {
      try {
        await revokeToken(refreshToken)
      } catch (error) {
        console.error("[google] token revoke failed (continuing)", error)
      }
    }
    this.accounts.disconnect()
    this.accessToken = null
    this.accessTokenExpiresAt = 0
  }

  /** Return a valid access token, refreshing when expired or unset. */
  protected async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt - 60_000) {
      return this.accessToken
    }
    const refreshToken = this.accounts.getRefreshToken()
    if (!refreshToken) throw new Error("Not connected to Google Calendar")
    const tokens = await refreshAccessToken(this.credentials(), refreshToken)
    this.accessToken = tokens.accessToken
    this.accessTokenExpiresAt = Date.now() + tokens.expiresInSec * 1000
    return this.accessToken
  }

  /** Push pending local mutations, then pull remote changes. */
  async sync(): Promise<GoogleSyncSummary> {
    if (this.syncing) return { upserted: 0, deleted: 0, skipped: 0 }
    if (!this.accounts.isConnected()) {
      throw new Error("Not connected to Google Calendar")
    }
    this.syncing = true
    try {
      await this.drainOutbox()
      return await this.pull()
    } finally {
      this.syncing = false
    }
  }

  /**
   * Enqueue a user-initiated mutation for push. Only invoked from the renderer's
   * domain actions on user CRUD — sync-origin writes bypass this, which is the
   * echo-loop guard. Schedules a debounced drain+pull.
   */
  push(eventId: string, op: OutboxOp): void {
    if (!this.accounts.isConnected()) return
    this.outbox.enqueue(eventId, op)
    if (this.pushTimer) clearTimeout(this.pushTimer)
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null
      void this.sync().catch((error) =>
        console.error("[google] debounced sync failed", error)
      )
    }, PUSH_DEBOUNCE_MS)
  }

  /** Drain the outbox: insert/patch/delete each pending op against Google. */
  private async drainOutbox(): Promise<void> {
    if (this.draining) return
    this.draining = true
    try {
      const account = this.accounts.getAccount()
      const calendarId = account?.googleCalendarId ?? "primary"
      let mutatedLocal = false

      for (const entry of this.outbox.list()) {
        try {
          const changed = await this.pushOne(
            entry.op,
            entry.eventId,
            calendarId
          )
          mutatedLocal = mutatedLocal || changed
          this.outbox.remove(entry.id)
        } catch (error) {
          console.error("[google] outbox push failed; will retry", {
            op: entry.op,
            eventId: entry.eventId,
            error
          })
          // Leave the entry queued for the next sync rather than dropping it.
        }
      }
      if (mutatedLocal) this.notifyChanged()
    } finally {
      this.draining = false
    }
  }

  /** Returns true if it wrote back to local state (new googleEventId/etag). */
  private async pushOne(
    op: OutboxOp,
    eventId: string,
    calendarId: string
  ): Promise<boolean> {
    const accessToken = await this.getAccessToken()
    const state = this.storage.loadState()
    const events = [...(state.calendarEvents ?? [])]
    const idx = events.findIndex((e) => e.id === eventId)
    const event = idx === -1 ? undefined : events[idx]

    if (op === "delete") {
      // The local row may already be gone; use its last-known googleEventId.
      const googleEventId = event?.googleEventId
      if (googleEventId)
        await deleteEvent(accessToken, calendarId, googleEventId)
      return false
    }

    if (!event) return false // created then deleted before push; nothing to send

    if (op === "insert" || !event.googleEventId) {
      const result = await insertEvent(
        accessToken,
        calendarId,
        toGoogleEventBody(event)
      )
      events[idx] = {
        ...event,
        googleEventId: result.id,
        etag: result.etag,
        syncStatus: "synced",
        updatedAt: result.updated ?? event.updatedAt
      }
      this.storage.savePartial({ calendarEvents: events })
      return true
    }

    // patch with If-Match; on 412 resolve last-write-wins.
    try {
      const result = await patchEvent(
        accessToken,
        calendarId,
        event.googleEventId,
        toGoogleEventBody(event),
        event.etag
      )
      events[idx] = {
        ...event,
        etag: result.etag,
        syncStatus: "synced",
        updatedAt: result.updated ?? event.updatedAt
      }
      this.storage.savePartial({ calendarEvents: events })
      return true
    } catch (error) {
      if (!(error instanceof PreconditionFailedError)) throw error
      return this.resolvePatchConflict(accessToken, calendarId, events, idx)
    }
  }

  private async resolvePatchConflict(
    accessToken: string,
    calendarId: string,
    events: AppState["calendarEvents"] & object,
    idx: number
  ): Promise<boolean> {
    const event = events[idx]
    const remote = await getEvent(accessToken, calendarId, event.googleEventId!)
    const remoteUpdated =
      remote && typeof remote === "object"
        ? (remote as { updated?: string }).updated
        : undefined

    if (resolveConflict(event.updatedAt, remoteUpdated) === "local") {
      // Local wins → re-patch without If-Match to force the write.
      const result = await patchEvent(
        accessToken,
        calendarId,
        event.googleEventId!,
        toGoogleEventBody(event)
      )
      events[idx] = {
        ...event,
        etag: result.etag,
        syncStatus: "synced",
        updatedAt: result.updated ?? event.updatedAt
      }
      this.storage.savePartial({ calendarEvents: events })
      return true
    }
    // Remote wins → the next pull will overwrite local; just clear pending.
    return false
  }

  private async pull(): Promise<GoogleSyncSummary> {
    const account = this.accounts.getAccount()
    const calendarId = account?.googleCalendarId ?? "primary"
    const accessToken = await this.getAccessToken()

    let rawItems: unknown[]
    let nextSyncToken: string | undefined
    try {
      ;({ rawItems, nextSyncToken } = await this.collectPages(
        accessToken,
        calendarId,
        account?.syncToken ?? undefined
      ))
    } catch (error) {
      if (error instanceof SyncTokenExpiredError) {
        // 410 GONE → drop the token and do a full resync.
        this.accounts.setSyncToken(null)
        ;({ rawItems, nextSyncToken } = await this.collectPages(
          accessToken,
          calendarId,
          undefined
        ))
      } else {
        throw error
      }
    }

    const summary = this.applyRemote(rawItems, calendarId)

    if (nextSyncToken) this.accounts.setSyncToken(nextSyncToken)
    this.accounts.setLastSyncAt(new Date().toISOString())
    if (summary.upserted + summary.deleted > 0) this.notifyChanged()
    return summary
  }

  private async collectPages(
    accessToken: string,
    calendarId: string,
    syncToken: string | undefined
  ): Promise<{ rawItems: unknown[]; nextSyncToken?: string }> {
    const rawItems: unknown[] = []
    let pageToken: string | undefined
    let nextSyncToken: string | undefined
    do {
      const page = await listEvents(accessToken, {
        calendarId,
        syncToken,
        pageToken
      })
      rawItems.push(...page.items)
      pageToken = page.nextPageToken
      nextSyncToken = page.nextSyncToken ?? nextSyncToken
    } while (pageToken)
    return { rawItems, nextSyncToken }
  }

  private applyRemote(
    rawItems: unknown[],
    calendarId: string
  ): GoogleSyncSummary {
    const state = this.storage.loadState()
    const { events, summary } = reduceRemoteEvents(
      state.calendarEvents ?? [],
      rawItems,
      calendarId
    )
    if (summary.upserted + summary.deleted > 0) {
      this.storage.savePartial({ calendarEvents: events })
    }
    return summary
  }
}

export const createGoogleSync = (
  db: Db,
  storage: SyncStorage,
  notifyChanged?: () => void
): GoogleSync => new GoogleSync(db, storage, notifyChanged)
