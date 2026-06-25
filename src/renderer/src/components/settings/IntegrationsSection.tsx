import type { GoogleAuthStatus } from "@renderer/types"
import { AlertTriangle, Check, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export function IntegrationsSection(): React.JSX.Element {
  const [status, setStatus] = useState<GoogleAuthStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const api = window.api?.google
    if (!api) return
    try {
      setStatus(await api.authStatus())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void refresh()
    const off = window.api?.google?.onSyncChanged(() => void refresh())
    return off
  }, [refresh])

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null)
      setBusy(true)
      try {
        await action()
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(false)
      }
    },
    [refresh]
  )

  const connected = status?.connected ?? false

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-app-text">Integrations</h2>
        <p className="text-xs text-app-text-muted">
          Sync your calendar events two-way with Google Calendar.
        </p>
      </div>

      <div className="rounded-lg border border-app-border bg-app-hover p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-app-text">Google Calendar</div>
            <div className="truncate text-xs text-app-text-muted">
              {connected
                ? `Connected as ${status?.email ?? "unknown"}`
                : "Not connected"}
            </div>
            {connected && status?.lastSyncAt && (
              <div className="text-[11px] text-app-text-muted">
                Last synced {new Date(status.lastSyncAt).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {connected && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => window.api.google.syncNow())}
                className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs text-app-text-muted hover:bg-app-active hover:text-app-text disabled:opacity-50"
              >
                <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
                Sync now
              </button>
            )}
            {connected ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => window.api.google.signout())}
                className="h-7 rounded-md border border-app-border px-3 text-xs text-app-text hover:bg-app-active disabled:opacity-50"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => window.api.google.authStart())}
                className="flex h-7 items-center gap-1.5 rounded-md bg-app-active px-3 text-xs text-app-text hover:brightness-110 disabled:opacity-50"
              >
                {busy ? "Connecting…" : "Connect"}
              </button>
            )}
          </div>
        </div>

        {connected && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-green-400">
            <Check size={12} /> Two-way sync active
          </div>
        )}

        {status && !status.encryptionAvailable && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>
              OS secret encryption is unavailable (no keyring detected).
              Connecting is disabled to avoid storing tokens in plaintext.
              Install/enable a system keyring (e.g. gnome-keyring) and restart.
            </span>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
            {error}
          </div>
        )}
      </div>
    </section>
  )
}
