import type { TaskSessionStats } from "@renderer/types"
import { formatDuration } from "@renderer/utils/sessions"

interface SessionStatsProps {
  stats: TaskSessionStats
}

export function SessionStats({ stats }: SessionStatsProps): React.JSX.Element {
  if (stats.count === 0) {
    return (
      <div className="text-xs text-app-text-muted">
        No completed sessions yet.
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-app-text-secondary">
      <div>
        <span className="text-app-text-muted">Count:</span>{" "}
        <span className="text-app-text">{stats.count}</span>
      </div>
      <div>
        <span className="text-app-text-muted">Total:</span>{" "}
        <span className="text-app-text">{formatDuration(stats.totalMs)}</span>
      </div>
      {stats.lastEndAt && (
        <div>
          <span className="text-app-text-muted">Last:</span>{" "}
          <span className="text-app-text">
            {new Date(stats.lastEndAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>
      )}
    </div>
  )
}
