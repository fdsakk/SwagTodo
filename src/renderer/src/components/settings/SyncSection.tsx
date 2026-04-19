import { v4 as uuidv4 } from 'uuid'

interface SyncSectionStatus {
  connected: boolean
  lastSyncAt?: string
  lastError?: string
}

interface SyncSectionProps {
  supabaseUrl: string
  supabaseAnonKey: string
  workspaceId: string
  mode: 'local' | 'supabase'
  loading: boolean
  status: SyncSectionStatus
  onSupabaseUrlChange: (value: string) => void
  onSupabaseAnonKeyChange: (value: string) => void
  onWorkspaceIdChange: (value: string) => void
  onToggleSync: () => void
}

const formatSyncAt = (value?: string): string => {
  if (!value) return 'never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'never'
  return date.toLocaleString()
}

export function SyncSection({
  supabaseUrl,
  supabaseAnonKey,
  workspaceId,
  mode,
  loading,
  status,
  onSupabaseUrlChange,
  onSupabaseAnonKeyChange,
  onWorkspaceIdChange,
  onToggleSync
}: SyncSectionProps): React.JSX.Element {
  const isEnabled = mode === 'supabase'
  const urlOk = supabaseUrl.trim().length > 0
  const keyOk = supabaseAnonKey.trim().length > 0
  const wsOk = workspaceId.trim().length > 0
  const disabled = loading || (!isEnabled && (!urlOk || !keyOk || !wsOk))

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-app-text">Sync</h2>
        <p className="mt-0.5 text-xs text-app-text-muted">
          Connect Supabase to keep tasks in sync across devices.
        </p>
      </div>

      <div className="rounded-xl border border-app-border bg-app-card p-3 space-y-3">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="supabase-url" className="text-xs font-medium text-app-text-secondary">
              Supabase URL
            </label>
            <input
              id="supabase-url"
              type="text"
              value={supabaseUrl}
              onChange={(event) => onSupabaseUrlChange(event.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="h-9 w-full rounded-lg border border-app-border bg-app-bg px-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:ring-1 focus:ring-app-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="supabase-anon" className="text-xs font-medium text-app-text-secondary">
              Supabase anon key
            </label>
            <input
              id="supabase-anon"
              type="password"
              value={supabaseAnonKey}
              onChange={(event) => onSupabaseAnonKeyChange(event.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR..."
              className="h-9 w-full rounded-lg border border-app-border bg-app-bg px-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:ring-1 focus:ring-app-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="workspace-id" className="text-xs font-medium text-app-text-secondary">
              Workspace ID
            </label>
            <div className="flex items-center gap-2">
              <input
                id="workspace-id"
                type="text"
                value={workspaceId}
                onChange={(event) => onWorkspaceIdChange(event.target.value)}
                placeholder="default"
                className="h-9 flex-1 rounded-lg border border-app-border bg-app-bg px-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:ring-1 focus:ring-app-accent"
              />
              <button
                type="button"
                onClick={() => onWorkspaceIdChange(uuidv4())}
                disabled={loading}
                className="h-9 shrink-0 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text transition-colors enabled:hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate
              </button>
              <button
                type="button"
                onClick={onToggleSync}
                disabled={disabled}
                className="h-9 shrink-0 rounded-lg border border-app-border px-3 text-xs font-medium text-app-text transition-colors enabled:hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Working...' : isEnabled ? 'Turn off sync' : 'Turn on sync'}
              </button>
            </div>
            <p className="text-[11px] text-app-text-muted">
              Tip: avoid using <span className="text-app-text-secondary">default</span> on shared/public
              projects. For real security, enable Supabase Auth + RLS policies.
            </p>
          </div>
        </div>

        <div className="text-xs text-app-text-muted space-y-1">
          <p>
            Mode:{' '}
            <span className="text-app-text-secondary">{isEnabled ? 'supabase' : 'local'}</span>
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
