import { formatHM, PX_PER_MIN, SLOT_MIN } from "@renderer/utils/calendar"
import { X } from "lucide-react"
import type { CSSProperties } from "react"
import { type CalendarEventDisplayBlock, columnStyle } from "./types"

interface EventBlockViewProps {
  block: CalendarEventDisplayBlock
  startMin: number
  endMin: number
  columnIndex?: number
  columnCount?: number
  onOpen: () => void
  onDelete: () => void
}

const DEFAULT_COLOR = "#6366f1"

export function EventBlockView({
  block,
  startMin,
  endMin,
  columnIndex = 0,
  columnCount = 1,
  onOpen,
  onDelete
}: EventBlockViewProps): React.JSX.Element {
  const top = startMin * PX_PER_MIN
  const height = Math.max(
    PX_PER_MIN * SLOT_MIN,
    (endMin - startMin) * PX_PER_MIN
  )
  const color = block.event.color ?? DEFAULT_COLOR
  const style: CSSProperties = {
    top,
    height,
    borderColor: color,
    background: `${color}50`,
    ...columnStyle(columnIndex, columnCount)
  }
  return (
    <button
      type="button"
      data-session-block
      className="group absolute z-[6] flex select-none flex-col overflow-hidden rounded-md border-l-2 bg-zinc-900/70 px-1.5 py-1 text-left text-[11px] text-zinc-100 shadow-sm hover:bg-zinc-900/85"
      style={style}
      onClick={onOpen}
    >
      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
        <span>
          {formatHM(startMin)}–{formatHM(endMin)}
        </span>
      </div>
      <div className="truncate text-[11px] font-medium text-zinc-100">
        {block.event.title}
      </div>
      {block.event.location && (
        <div className="truncate text-[10px] text-zinc-400">
          {block.event.location}
        </div>
      )}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Delete event"
        className="absolute right-1 top-1 z-50 flex h-5 w-5 items-center justify-center rounded border border-transparent text-app-text-secondary opacity-0 transition-all duration-200 hover:border-red-600 hover:bg-app-titlebar/80 group-hover:opacity-100"
      >
        <X size={10} />
      </span>
    </button>
  )
}
