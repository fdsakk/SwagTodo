import type Database from "better-sqlite3"
import { safeStorage } from "electron"

type Db = Database.Database

const ACCOUNT_ID = "default"

export interface StoredAccount {
  email: string | null
  googleCalendarId: string | null
  syncToken: string | null
  lastSyncAt: string | null
}

type AccountRow = {
  id: string
  email: string | null
  encrypted_refresh_token: Buffer | null
  google_calendar_id: string | null
  sync_token: string | null
  last_sync_at: string | null
}

/**
 * Single-account store for the connected Google Calendar. The refresh token is
 * encrypted with Electron's `safeStorage` (OS keyring where available) and
 * never crosses the IPC boundary to the renderer.
 */
export class GoogleAccountStore {
  private readonly db: Db

  constructor(db: Db) {
    this.db = db
  }

  isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  private row(): AccountRow | undefined {
    return this.db
      .prepare<[string], AccountRow>(
        "SELECT * FROM calendar_accounts WHERE id = ?"
      )
      .get(ACCOUNT_ID)
  }

  getAccount(): StoredAccount | null {
    const row = this.row()
    if (!row) return null
    return {
      email: row.email,
      googleCalendarId: row.google_calendar_id,
      syncToken: row.sync_token,
      lastSyncAt: row.last_sync_at
    }
  }

  isConnected(): boolean {
    return Boolean(this.row()?.encrypted_refresh_token)
  }

  getRefreshToken(): string | null {
    const row = this.row()
    if (!row?.encrypted_refresh_token) return null
    try {
      return safeStorage.decryptString(row.encrypted_refresh_token)
    } catch (error) {
      console.error("[google] failed to decrypt refresh token", error)
      return null
    }
  }

  /** Persist a freshly-obtained connection, encrypting the refresh token. */
  connect(input: {
    email: string
    refreshToken: string
    googleCalendarId?: string
  }): void {
    const encrypted = safeStorage.encryptString(input.refreshToken)
    this.db
      .prepare(
        `INSERT OR REPLACE INTO calendar_accounts
           (id, email, encrypted_refresh_token, google_calendar_id, sync_token, last_sync_at)
         VALUES (@id, @email, @token, @calendarId, NULL, NULL)`
      )
      .run({
        id: ACCOUNT_ID,
        email: input.email,
        token: encrypted,
        calendarId: input.googleCalendarId ?? "primary"
      })
  }

  setSyncToken(syncToken: string | null): void {
    this.db
      .prepare("UPDATE calendar_accounts SET sync_token = ? WHERE id = ?")
      .run(syncToken, ACCOUNT_ID)
  }

  setLastSyncAt(iso: string): void {
    this.db
      .prepare("UPDATE calendar_accounts SET last_sync_at = ? WHERE id = ?")
      .run(iso, ACCOUNT_ID)
  }

  disconnect(): void {
    this.db
      .prepare("DELETE FROM calendar_accounts WHERE id = ?")
      .run(ACCOUNT_ID)
  }
}
