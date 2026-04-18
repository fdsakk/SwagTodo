import type { PointerEvent as ReactPointerEvent } from 'react'
import { X } from 'lucide-react'
import { PX_PER_MIN, SLOT_MIN, formatHM } from '@renderer/utils/calendar'
import type { TimeBlockDisplayBlock } from './types'

interface TimeBlockViewProps {
  tb: TimeBlockDisplayBlock
  startMin: number
  endMin: number
  onMovePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onDelete: () => void
}

export function TimeBlockView({
  tb,
  startMin,
  endMin,
  onMovePointerDown,
  onResizePointerDown,
  onDelete
}: TimeBlockViewProps): React.JSX.Element {
  const top = startMin * PX_PER_MIN
  const height = Math.max(PX_PER_MIN * SLOT_MIN, (endMin - startMin) * PX_PER_MIN)
  return (
    <div
      data-session-block
      className="group absolute left-1 right-1 z-[4] select-none overflow-hidden rounded-md border border-zinc-600/50 bg-zinc-700/40 px-1.5 py-1 text-[11px] text-zinc-400 shadow-sm hover:bg-zinc-700/60"
      style={{ top, height }}
      onPointerDown={onMovePointerDown}
    >
      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
        <span>{formatHM(startMin)}–{formatHM(endMin)}</span>
      </div>
      <div className="truncate text-[11px] font-medium text-zinc-300">{tb.block.label}</div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Delete block"
        className="rounded absolute right-1 top-1 z-50 flex h-5 w-5 items-center justify-center text-zinc-400 opacity-0 duration-200 hover:border border-red-600 hover:bg-app-titlebar/80 group-hover:opacity-100 transition-all"
      >
        <X size={10} />
      </button>
      <div
        onPointerDown={onResizePointerDown}
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize bg-white/[0.04] hover:bg-white/[0.1]"
      />
    </div>
  )
}
