import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Tabs, TabsList, TabsTab } from '@renderer/components/ui/tabs'

export type DayCount = 1 | 3 | 5 | 7
export const DAY_OPTIONS: readonly DayCount[] = [1, 3, 5, 7] as const

interface SessionsToolbarProps {
  dayCount: DayCount
  rangeLabel: string
  onShiftRange: (direction: -1 | 1) => void
  onGoToday: () => void
  onDayCountChange: (count: DayCount) => void
}

export function SessionsToolbar({
  dayCount,
  rangeLabel,
  onShiftRange,
  onGoToday,
  onDayCountChange
}: SessionsToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onShiftRange(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-app-text-muted hover:bg-app-hover hover:text-app-text"
          title="Previous range"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={onGoToday}
          className="h-7 rounded-md px-2 text-xs text-app-text-muted hover:bg-app-hover hover:text-app-text"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onShiftRange(1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-app-text-muted hover:bg-app-hover hover:text-app-text"
          title="Next range"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <span className="text-sm text-app-text-secondary">{rangeLabel}</span>
      <Tabs
        className="ml-auto"
        value={String(dayCount)}
        onValueChange={(v) => onDayCountChange(Number(v) as DayCount)}
      >
        <TabsList>
          {DAY_OPTIONS.map((opt) => (
            <TabsTab key={opt} value={String(opt)}>
              {opt} {opt === 1 ? 'day' : 'days'}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
