import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { X } from 'lucide-react'
import { PX_PER_MIN, SLOT_MIN, formatHM } from '@renderer/utils/calendar'
import type { SessionBlock } from './types'

interface SessionBlockViewProps {
  block: SessionBlock
  startMin: number
  endMin: number
  onMovePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onDelete: () => void
}

export function SessionBlockView({
  block,
  startMin,
  endMin,
  onMovePointerDown,
  onResizePointerDown,
  onDelete
}: SessionBlockViewProps): React.JSX.Element {
  const top = startMin * PX_PER_MIN
  const height = Math.max(PX_PER_MIN * SLOT_MIN, (endMin - startMin) * PX_PER_MIN)
  const color = block.project?.color ?? '#52525b'
  const title = block.task?.title ?? 'Deleted task'
  const projectName = block.project?.name
  const style: CSSProperties = {
    top,
    height,
    borderColor: color,
    background: `${color}50`
  }
  return (
    <div
      data-session-block
      className="group absolute left-1 right-1 z-[5] select-none overflow-hidden rounded-md border-l-2 bg-zinc-900/70 px-1.5 py-1 text-[11px] text-zinc-100 shadow-sm hover:bg-zinc-900/85"
      style={style}
      onPointerDown={onMovePointerDown}
    >
      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
        <span>
          {formatHM(startMin)}–{formatHM(endMin)}
        </span>
      </div>
      <div className="truncate text-[11px] font-medium text-zinc-100">{title}</div>
      {projectName && <div className="truncate text-[10px] text-zinc-400">{projectName}</div>}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Delete session"
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
