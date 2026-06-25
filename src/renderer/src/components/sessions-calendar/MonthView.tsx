import type { CalendarItem } from "@renderer/utils/calendarItems"
import { cn } from "@renderer/utils/cn"
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek
} from "date-fns"
import { useMemo } from "react"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const MAX_CHIPS = 3

interface MonthViewProps {
  anchor: Date
  items: readonly CalendarItem[]
  onOpenItem: (item: CalendarItem) => void
  onPickDay: (day: Date) => void
}

const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export function MonthView({
  anchor,
  items,
  onOpenItem,
  onPickDay
}: MonthViewProps): React.JSX.Element {
  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(anchor))
    const gridEnd = endOfWeek(endOfMonth(anchor))
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [anchor])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const key = dayKey(new Date(item.startMs))
      const arr = map.get(key) ?? []
      arr.push(item)
      map.set(key, arr)
    }
    return map
  }, [items])

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-app-border">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="py-1.5 text-center text-[10px] uppercase tracking-wide text-app-text-muted"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const inMonth = isSameMonth(day, anchor)
          const today = isToday(day)
          const dayItems = itemsByDay.get(dayKey(day)) ?? []
          const overflow = dayItems.length - MAX_CHIPS
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onPickDay(day)}
              className={cn(
                "flex flex-col gap-0.5 border-b border-l border-app-border p-1 text-left align-top",
                !inMonth && "bg-black/[0.04] text-app-text-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center self-start rounded-full text-[11px]",
                  today
                    ? "bg-app-active text-app-text"
                    : inMonth
                      ? "text-app-text-secondary"
                      : "text-app-text-muted"
                )}
              >
                {day.getDate()}
              </span>
              <div className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
                {dayItems.slice(0, MAX_CHIPS).map((item) => (
                  <span
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenItem(item)
                    }}
                    className="flex items-center gap-1 truncate rounded px-1 text-[10px] text-app-text hover:bg-app-hover"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: item.color ?? "#52525b" }}
                    />
                    <span className="truncate">{item.title}</span>
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="px-1 text-[10px] text-app-text-muted">
                    +{overflow} more
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
