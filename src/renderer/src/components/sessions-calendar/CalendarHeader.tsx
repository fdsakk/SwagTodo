import { cn } from '@renderer/utils/cn'
import { isSameDay } from '@renderer/utils/calendar'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface CalendarHeaderProps {
  days: Date[]
  now: Date
}

export function CalendarHeader({ days, now }: CalendarHeaderProps): React.JSX.Element {
  return (
    <div
      className="grid border-b border-app-border"
      style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
    >
      <div />
      {days.map((d) => {
        const today = isSameDay(d, now)
        return (
          <div
            key={d.toISOString()}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-2 text-xs',
              today ? 'text-app-text' : 'text-app-text-secondary'
            )}
          >
            <span className="text-[10px] uppercase tracking-wide text-app-text-muted">
              {WEEKDAYS[d.getDay()]}
            </span>
            <span
              className={cn(
                'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm mb-0.5',
                today ? 'bg-app-active text-app-text' : 'text-app-text-secondary'
              )}
            >
              {d.getDate()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
