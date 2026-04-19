import { PX_PER_MIN, SLOT_MIN, formatHM } from '@renderer/utils/calendar'

interface DraftGhostProps {
  startMin: number
  endMin: number
  label: string
}

export function DraftGhost({ startMin, endMin, label }: DraftGhostProps): React.JSX.Element {
  const top = startMin * PX_PER_MIN
  const height = Math.max(PX_PER_MIN * SLOT_MIN, (endMin - startMin) * PX_PER_MIN)
  return (
    <div
      className="pointer-events-none absolute left-1 right-1 z-[6] rounded-md border border-dashed border-app-border bg-app-hover px-1.5 py-1 text-[10px] text-app-text-secondary"
      style={{ top, height }}
    >
      <div>{label}</div>
      <div className="text-app-text-muted">
        {formatHM(startMin)}–{formatHM(endMin)}
      </div>
    </div>
  )
}
