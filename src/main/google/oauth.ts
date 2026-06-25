import { createHash, randomBytes } from "node:crypto"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { shell } from "electron"
import {
  CALENDAR_SCOPE,
  exchangeCode,
  fetchUserEmail,
  type OAuthCredentials,
  readCredentials
} from "./client"

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const RESPONSE_HTML =
  "<!doctype html><meta charset=utf-8><title>SwagTodo</title>" +
  "<body style='font-family:system-ui;background:#070708;color:#e4e4e7;display:flex;height:100vh;align-items:center;justify-content:center;margin:0'>" +
  "<p>Connected to Google Calendar. You can close this tab.</p>"

const base64Url = (buf: Buffer): string =>
  buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

const pkcePair = (): { verifier: string; challenge: string } => {
  const verifier = base64Url(randomBytes(32))
  const challenge = base64Url(createHash("sha256").update(verifier).digest())
  return { verifier, challenge }
}

export interface ConnectResult {
  email: string
  refreshToken: string
}

/**
 * Run the Google "Desktop app" OAuth flow: spin up a transient loopback server,
 * open the consent screen in the user's browser, capture the redirect, and
 * exchange the code (with PKCE) for tokens. Resolves with the email + refresh
 * token; the caller persists them.
 */
export const runOAuthFlow = (
  creds: OAuthCredentials = readCredentials()
): Promise<ConnectResult> =>
  new Promise<ConnectResult>((resolve, reject) => {
    const { verifier, challenge } = pkcePair()
    const state = base64Url(randomBytes(16))
    let settled = false

    const server = createServer((req, res) => {
      const finish = (status: number, fail?: Error): void => {
        res.statusCode = status
        res.setHeader("Content-Type", "text/html; charset=utf-8")
        res.end(RESPONSE_HTML)
        server.close()
        if (settled) return
        settled = true
        if (fail) reject(fail)
      }

      try {
        const url = new URL(req.url ?? "", `http://127.0.0.1`)
        if (url.pathname !== "/callback") {
          res.statusCode = 404
          res.end()
          return
        }
        const error = url.searchParams.get("error")
        if (error) return finish(400, new Error(`OAuth denied: ${error}`))
        if (url.searchParams.get("state") !== state) {
          return finish(400, new Error("OAuth state mismatch"))
        }
        const code = url.searchParams.get("code")
        if (!code) return finish(400, new Error("OAuth missing code"))

        const redirectUri = `http://127.0.0.1:${port}/callback`
        void (async () => {
          try {
            const tokens = await exchangeCode(
              creds,
              code,
              verifier,
              redirectUri
            )
            if (!tokens.refreshToken) {
              throw new Error(
                "No refresh token returned (revoke prior access and retry with prompt=consent)"
              )
            }
            const email = await fetchUserEmail(tokens.accessToken)
            finish(200)
            if (settled) return
            settled = true
            resolve({ email, refreshToken: tokens.refreshToken })
          } catch (err) {
            finish(500, err instanceof Error ? err : new Error(String(err)))
          }
        })()
      } catch (err) {
        finish(500, err instanceof Error ? err : new Error(String(err)))
      }
    })

    let port = 0
    server.on("error", (err) => {
      if (settled) return
      settled = true
      reject(err)
    })
    server.listen(0, "127.0.0.1", () => {
      port = (server.address() as AddressInfo).port
      const redirectUri = `http://127.0.0.1:${port}/callback`
      const authUrl = new URL(AUTH_ENDPOINT)
      authUrl.searchParams.set("client_id", creds.clientId)
      authUrl.searchParams.set("redirect_uri", redirectUri)
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("scope", CALENDAR_SCOPE)
      authUrl.searchParams.set("code_challenge", challenge)
      authUrl.searchParams.set("code_challenge_method", "S256")
      authUrl.searchParams.set("state", state)
      authUrl.searchParams.set("access_type", "offline")
      authUrl.searchParams.set("prompt", "consent")
      void shell.openExternal(authUrl.toString())
    })

    // Abandon the flow if the user never completes consent.
    setTimeout(
      () => {
        if (settled) return
        settled = true
        server.close()
        reject(new Error("OAuth timed out"))
      },
      5 * 60 * 1000
    )
  })
