interface SyncSectionStatus {
  connected: boolean
  lastSyncAt?: string
  lastError?: string
}

interface SyncSectionProps {
  postgresUrl: string
  mode: 'local' | 'postgres'
  loading: boolean
  status: SyncSectionStatus
  onPostgresUrlChange: (value: string) => void
  onToggleSync: () => void
}

const formatSyncAt = (value?: string): string => {
  if (!value) return 'never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'never'
  return date.toLocaleString()
}

export function SyncSection({
  postgresUrl,
  mode,
  loading,
  status,
  onPostgresUrlChange,
  onToggleSync
}: SyncSectionProps): React.JSX.Element {
  const trimmed = postgresUrl.trim()
  const isEnabled = mode === 'postgres'
  const disabled = loading || (!isEnabled && trimmed.length === 0)

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-app-text">Sync</h2>
        <p className="mt-0.5 text-xs text-app-text-muted">
          Connect PostgreSQL to keep tasks in sync across devices.
        </p>
      </div>

      <div className="rounded-xl border border-app-border bg-app-card p-3 space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="postgres-url" className="text-xs font-medium text-app-text-secondary">
            PostgreSQL URL
          </label>
          <div className="flex items-center gap-2">
            <input
              id="postgres-url"
              type="text"
              value={postgresUrl}
              onChange={(event) => onPostgresUrlChange(event.target.value)}
              placeholder="postgres://user:pass@host:5432/dbname"
              className="h-9 flex-1 rounded-lg border border-app-border bg-app-bg px-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:ring-1 focus:ring-app-accent"
            />
            <button
              type="button"
              onClick={onToggleSync}
              disabled={disabled}
              className="h-9 shrink-0 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text transition-colors enabled:hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Working...' : isEnabled ? 'Turn off sync' : 'Turn on sync'}
            </button>
          </div>
        </div>

        <div className="text-xs text-app-text-muted space-y-1">
          <p>
            Mode:{' '}
            <span className="text-app-text-secondary">{isEnabled ? 'postgres' : 'local'}</span>
          </p>
          <p>
            Connection:{' '}
            <span className="text-app-text-secondary">
              {status.connected ? 'connected' : 'disconnected'}
            </span>
          </p>
          <p>
            Last sync:{' '}
            <span className="text-app-text-secondary">{formatSyncAt(status.lastSyncAt)}</span>
          </p>
          {status.lastError && <p className="text-red-400">Error: {status.lastError}</p>}
        </div>
      </div>
    </section>
  )
}
