import { Tabs, TabsList, TabsTab } from "@renderer/components/ui/tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type DayCount = 1 | 3 | 5 | 7
export const DAY_OPTIONS: readonly DayCount[] = [1, 3, 5, 7] as const

export type ViewMode =
  | { kind: "days"; count: DayCount }
  | { kind: "month" }
  | { kind: "agenda" }

const isDays = (mode: ViewMode): mode is { kind: "days"; count: DayCount } =>
  mode.kind === "days"

const tabValue = (mode: ViewMode): string =>
  isDays(mode) ? String(mode.count) : mode.kind

const TAB_OPTIONS = [
  ...DAY_OPTIONS.map((opt) => ({
    value: String(opt),
    label: `${opt} ${opt === 1 ? "day" : "days"}`
  })),
  { value: "month", label: "Month" },
  { value: "agenda", label: "Agenda" }
] as const

const fromTabValue = (value: string): ViewMode => {
  if (value === "month") return { kind: "month" }
  if (value === "agenda") return { kind: "agenda" }
  return { kind: "days", count: Number(value) as DayCount }
}

interface SessionsToolbarProps {
  mode: ViewMode
  rangeLabel: string
  onShiftRange: (direction: -1 | 1) => void
  onGoToday: () => void
  onModeChange: (mode: ViewMode) => void
}

export function SessionsToolbar({
  mode,
  rangeLabel,
  onShiftRange,
  onGoToday,
  onModeChange
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
        value={tabValue(mode)}
        onValueChange={(v) => onModeChange(fromTabValue(v))}
      >
        <TabsList>
          {TAB_OPTIONS.map((opt) => (
            <TabsTab key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
