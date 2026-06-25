import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import {
  exchangeCode,
  MissingCredentialsError,
  readCredentials,
  refreshAccessToken
} from "../google/client"

const CREDS = { clientId: "cid", clientSecret: "secret" }

const originalFetch = globalThis.fetch
const originalId = process.env.GOOGLE_CLIENT_ID
const originalSecret = process.env.GOOGLE_CLIENT_SECRET

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalId === undefined) delete process.env.GOOGLE_CLIENT_ID
  else process.env.GOOGLE_CLIENT_ID = originalId
  if (originalSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET
  else process.env.GOOGLE_CLIENT_SECRET = originalSecret
})

beforeEach(() => {
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.GOOGLE_CLIENT_SECRET
})

const stubFetch = (
  body: unknown,
  init: { ok?: boolean; status?: number } = {}
): { lastBody: URLSearchParams | null } => {
  const captured: { lastBody: URLSearchParams | null } = { lastBody: null }
  globalThis.fetch = (async (_url: string, opts?: RequestInit) => {
    captured.lastBody = new URLSearchParams(String(opts?.body ?? ""))
    return {
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: async () => body,
      text: async () => JSON.stringify(body)
    } as Response
  }) as typeof fetch
  return captured
}

test("readCredentials throws MissingCredentialsError when env is unset", () => {
  assert.throws(() => readCredentials(), MissingCredentialsError)
})

test("readCredentials returns env credentials when set", () => {
  process.env.GOOGLE_CLIENT_ID = "the-id"
  process.env.GOOGLE_CLIENT_SECRET = "the-secret"
  assert.deepEqual(readCredentials(), {
    clientId: "the-id",
    clientSecret: "the-secret"
  })
})

test("exchangeCode posts PKCE verifier and parses tokens", async () => {
  const captured = stubFetch({
    access_token: "at",
    refresh_token: "rt",
    expires_in: 1234
  })
  const tokens = await exchangeCode(CREDS, "code-1", "verifier-1", "http://cb")
  assert.deepEqual(tokens, {
    accessToken: "at",
    refreshToken: "rt",
    expiresInSec: 1234
  })
  assert.equal(captured.lastBody?.get("code_verifier"), "verifier-1")
  assert.equal(captured.lastBody?.get("grant_type"), "authorization_code")
})

test("exchangeCode rejects on HTTP error", async () => {
  stubFetch({ error: "invalid_grant" }, { ok: false, status: 400 })
  await assert.rejects(
    () => exchangeCode(CREDS, "c", "v", "http://cb"),
    /Token exchange failed: 400/
  )
})

test("refreshAccessToken defaults expires_in and keeps refresh token absent", async () => {
  stubFetch({ access_token: "fresh" })
  const tokens = await refreshAccessToken(CREDS, "rt")
  assert.equal(tokens.accessToken, "fresh")
  assert.equal(tokens.refreshToken, undefined)
  assert.equal(tokens.expiresInSec, 3600)
})

test("parsing a token response without access_token throws", async () => {
  stubFetch({ refresh_token: "only-refresh" })
  await assert.rejects(
    () => refreshAccessToken(CREDS, "rt"),
    /missing access_token/
  )
})
