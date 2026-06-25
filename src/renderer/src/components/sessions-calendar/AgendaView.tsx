import { formatHM } from "@renderer/utils/calendar"
import type { CalendarItem } from "@renderer/utils/calendarItems"
import { cn } from "@renderer/utils/cn"
import { useMemo } from "react"

interface AgendaViewProps {
  items: readonly CalendarItem[]
  now: Date
  onOpenItem: (item: CalendarItem) => void
}

const isOpenable = (item: CalendarItem): boolean =>
  Boolean(item.sessionId || item.eventId)

interface DayGroup {
  key: string
  date: Date
  items: CalendarItem[]
}

const dayKey = (ms: number): string => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const minutesOfDay = (ms: number): number => {
  const d = new Date(ms)
  return d.getHours() * 60 + d.getMinutes()
}

export function AgendaView({
  items,
  now,
  onOpenItem
}: AgendaViewProps): React.JSX.Element {
  const groups = useMemo(() => {
    const map = new Map<string, DayGroup>()
    for (const item of items) {
      const key = dayKey(item.startMs)
      const group = map.get(key)
      if (group) group.items.push(item)
      else
        map.set(key, {
          key,
          date: new Date(item.startMs),
          items: [item]
        })
    }
    return [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [items])

  if (groups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-app-text-muted">
        Nothing scheduled in this range.
      </div>
    )
  }

  const todayKey = dayKey(now.getTime())

  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {groups.map((group) => (
          <section key={group.key}>
            <h3
              className={cn(
                "mb-1.5 text-xs font-medium",
                group.key === todayKey
                  ? "text-app-text"
                  : "text-app-text-secondary"
              )}
            >
              {group.date.toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric"
              })}
            </h3>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={!isOpenable(item)}
                    onClick={() => onOpenItem(item)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border border-app-border bg-app-hover px-2.5 py-1.5 text-left text-[13px]",
                      isOpenable(item)
                        ? "hover:bg-app-active"
                        : "cursor-default"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: item.color ?? "#52525b" }}
                    />
                    <span className="w-24 shrink-0 text-[11px] tabular-nums text-app-text-muted">
                      {formatHM(minutesOfDay(item.startMs))}–
                      {formatHM(minutesOfDay(item.endMs))}
                    </span>
                    <span className="truncate text-app-text">{item.title}</span>
                    {item.subtitle && (
                      <span className="ml-auto truncate text-[11px] text-app-text-muted">
                        {item.subtitle}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
