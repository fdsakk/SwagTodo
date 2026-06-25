import { packColumns } from "@renderer/utils/overlapLayout"
import { useMemo } from "react"
import type { AllDayEventSpan } from "./types"

interface AllDayLaneProps {
  dayCount: number
  spans: readonly AllDayEventSpan[]
  onOpenEvent: (eventId: string) => void
}

const ROW_PX = 20
const DEFAULT_COLOR = "#6366f1"

/**
 * Fixed-height lane above the scrollable time grid for all-day / multi-day
 * events. Renders nothing when there are no spans, so the day/week grid keeps
 * its original look until all-day events exist. Columns line up with the grid
 * via the shared `56px repeat(days)` template. Overlapping spans are stacked
 * into rows by reusing the interval column packer on the day axis.
 */
export function AllDayLane({
  dayCount,
  spans,
  onOpenEvent
}: AllDayLaneProps): React.JSX.Element | null {
  const rowOf = useMemo(() => {
    const packed = packColumns(
      spans.map((s) => ({
        id: s.event.id,
        startMin: s.startDayIndex,
        endMin: s.startDayIndex + s.spanDays
      }))
    )
    return packed
  }, [spans])

  if (spans.length === 0) return null
  const rows = spans.reduce(
    (max, s) => Math.max(max, (rowOf.get(s.event.id)?.columnIndex ?? 0) + 1),
    1
  )

  return (
    <div
      className="grid border-b border-app-border"
      style={{
        gridTemplateColumns: `56px repeat(${dayCount}, minmax(0, 1fr))`
      }}
    >
      <div className="flex items-start justify-end pr-2 pt-1 text-[10px] text-app-text-muted">
        all-day
      </div>
      <div style={{ gridColumn: `2 / span ${dayCount}` }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`,
            gridAutoRows: `${ROW_PX}px`,
            minHeight: rows * ROW_PX + 4,
            padding: "2px 0"
          }}
        >
          {spans.map((span) => {
            const row = rowOf.get(span.event.id)?.columnIndex ?? 0
            const color = span.event.color ?? DEFAULT_COLOR
            return (
              <button
                type="button"
                key={span.event.id}
                onClick={() => onOpenEvent(span.event.id)}
                className="mx-0.5 truncate rounded px-1.5 text-left text-[10px] leading-[18px] text-zinc-100 hover:brightness-110"
                style={{
                  gridColumn: `${span.startDayIndex + 1} / span ${span.spanDays}`,
                  gridRow: row + 1,
                  background: `${color}90`
                }}
                title={span.event.title}
              >
                {span.event.title}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
