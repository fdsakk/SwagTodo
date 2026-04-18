import type { TaskSessionStats } from '@renderer/types'
import { formatDuration } from '@renderer/utils/sessions'

interface SessionStatsProps {
  stats: TaskSessionStats
}

export function SessionStats({ stats }: SessionStatsProps): React.JSX.Element {
  if (stats.count === 0) {
    return <div className="text-xs text-zinc-600">No completed sessions yet.</div>
  }
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
      <div>
        <span className="text-zinc-500">Count:</span>{' '}
        <span className="text-zinc-300">{stats.count}</span>
      </div>
      <div>
        <span className="text-zinc-500">Total:</span>{' '}
        <span className="text-zinc-300">{formatDuration(stats.totalMs)}</span>
      </div>
      {stats.lastEndAt && (
        <div>
          <span className="text-zinc-500">Last:</span>{' '}
          <span className="text-zinc-300">
            {new Date(stats.lastEndAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      )}
    </div>
  )
}
