import { formatHM, PX_PER_MIN, SLOT_MIN } from "@renderer/utils/calendar"
import { X } from "lucide-react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { columnStyle, type TimeBlockDisplayBlock } from "./types"

interface TimeBlockViewProps {
  tb: TimeBlockDisplayBlock
  startMin: number
  endMin: number
  columnIndex?: number
  columnCount?: number
  onMovePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onDelete: () => void
}

export function TimeBlockView({
  tb,
  startMin,
  endMin,
  columnIndex = 0,
  columnCount = 1,
  onMovePointerDown,
  onResizePointerDown,
  onDelete
}: TimeBlockViewProps): React.JSX.Element {
  const top = startMin * PX_PER_MIN
  const height = Math.max(
    PX_PER_MIN * SLOT_MIN,
    (endMin - startMin) * PX_PER_MIN
  )
  return (
    <div
      data-session-block
      className="group absolute z-[4] select-none overflow-hidden rounded-md border border-zinc-600/50 bg-zinc-700/40 px-1.5 py-1 text-[11px] text-zinc-400 shadow-sm hover:bg-zinc-700/60"
      style={{ top, height, ...columnStyle(columnIndex, columnCount) }}
      onPointerDown={onMovePointerDown}
    >
      <div className="flex items-center gap-1 text-[10px] text-app-text-muted">
        <span>
          {formatHM(startMin)}–{formatHM(endMin)}
        </span>
      </div>
      <div className="truncate text-[11px] font-medium text-zinc-300">
        {tb.block.label}
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Delete block"
        className="absolute right-1 top-1 z-50 flex h-5 w-5 items-center justify-center rounded border border-transparent text-app-text-secondary opacity-0 transition-all duration-200 hover:border-red-600 hover:bg-app-titlebar/80 group-hover:opacity-100"
      >
        <X size={10} />
      </button>
      <div
        onPointerDown={onResizePointerDown}
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize bg-app-hover hover:bg-app-active"
      />
    </div>
  )
}
