const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"

export const CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email"

export interface OAuthCredentials {
  clientId: string
  clientSecret: string
}

export class MissingCredentialsError extends Error {
  constructor() {
    super(
      "Google OAuth credentials are not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    )
    this.name = "MissingCredentialsError"
  }
}

/** Read Desktop-app OAuth credentials from the environment. */
export const readCredentials = (): OAuthCredentials => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new MissingCredentialsError()
  return { clientId, clientSecret }
}

export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  expiresInSec: number
}

const parseTokenResponse = (raw: unknown): TokenResponse => {
  const data = raw as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }
  if (!data.access_token) {
    throw new Error("Token response missing access_token")
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresInSec: typeof data.expires_in === "number" ? data.expires_in : 3600
  }
}

/** Exchange an authorization code (with PKCE verifier) for tokens. */
export const exchangeCode = async (
  creds: OAuthCredentials,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> => {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    })
  })
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`)
  }
  return parseTokenResponse(await res.json())
}

/** Trade a stored refresh token for a fresh access token. */
export const refreshAccessToken = async (
  creds: OAuthCredentials,
  refreshToken: string
): Promise<TokenResponse> => {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  })
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`)
  }
  return parseTokenResponse(await res.json())
}

export const revokeToken = async (token: string): Promise<void> => {
  await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token })
  })
}

export const fetchUserEmail = async (accessToken: string): Promise<string> => {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) {
    throw new Error(`Userinfo failed: ${res.status}`)
  }
  const data = (await res.json()) as { email?: string }
  return data.email ?? "unknown"
}

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars"

export class SyncTokenExpiredError extends Error {
  constructor() {
    super("Sync token expired (HTTP 410); full resync required")
    this.name = "SyncTokenExpiredError"
  }
}

export interface ListEventsParams {
  calendarId: string
  syncToken?: string
  pageToken?: string
}

export interface RawEventsPage {
  items: unknown[]
  nextPageToken?: string
  nextSyncToken?: string
}

/** One page of events.list. Throws SyncTokenExpiredError on HTTP 410. */
export const listEvents = async (
  accessToken: string,
  params: ListEventsParams
): Promise<RawEventsPage> => {
  const url = new URL(
    `${CALENDAR_API}/${encodeURIComponent(params.calendarId)}/events`
  )
  url.searchParams.set("singleEvents", "false")
  url.searchParams.set("showDeleted", "true")
  url.searchParams.set("maxResults", "250")
  if (params.syncToken) url.searchParams.set("syncToken", params.syncToken)
  if (params.pageToken) url.searchParams.set("pageToken", params.pageToken)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (res.status === 410) throw new SyncTokenExpiredError()
  if (!res.ok) {
    throw new Error(`events.list failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as RawEventsPage
  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextPageToken: data.nextPageToken,
    nextSyncToken: data.nextSyncToken
  }
}

export class PreconditionFailedError extends Error {
  constructor() {
    super("Remote event changed since last sync (HTTP 412)")
    this.name = "PreconditionFailedError"
  }
}

export interface UpsertedEvent {
  id: string
  etag?: string
  updated?: string
}

const eventsUrl = (calendarId: string, eventId?: string): string => {
  const base = `${CALENDAR_API}/${encodeURIComponent(calendarId)}/events`
  return eventId ? `${base}/${encodeURIComponent(eventId)}` : base
}

export const insertEvent = async (
  accessToken: string,
  calendarId: string,
  body: unknown
): Promise<UpsertedEvent> => {
  const res = await fetch(eventsUrl(calendarId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    throw new Error(`events.insert failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as UpsertedEvent
  return { id: data.id, etag: data.etag, updated: data.updated }
}

/** Patch a remote event. With `etag` sends If-Match; 412 → PreconditionFailedError. */
export const patchEvent = async (
  accessToken: string,
  calendarId: string,
  eventId: string,
  body: unknown,
  etag?: string
): Promise<UpsertedEvent> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  }
  if (etag) headers["If-Match"] = etag
  const res = await fetch(eventsUrl(calendarId, eventId), {
    method: "PATCH",
    headers,
    body: JSON.stringify(body)
  })
  if (res.status === 412) throw new PreconditionFailedError()
  if (!res.ok) {
    throw new Error(`events.patch failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as UpsertedEvent
  return { id: data.id, etag: data.etag, updated: data.updated }
}

export const deleteEvent = async (
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> => {
  const res = await fetch(eventsUrl(calendarId, eventId), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  // 410 (already gone) is fine — the event is deleted either way.
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new Error(`events.delete failed: ${res.status} ${await res.text()}`)
  }
}

/** Fetch a single remote event (used for 412 last-write-wins comparison). */
export const getEvent = async (
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<unknown | null> => {
  const res = await fetch(eventsUrl(calendarId, eventId), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (res.status === 404 || res.status === 410) return null
  if (!res.ok) {
    throw new Error(`events.get failed: ${res.status}`)
  }
  return res.json()
}
