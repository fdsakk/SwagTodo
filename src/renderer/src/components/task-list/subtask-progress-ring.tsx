import { memo } from 'react'
import { cn } from '@renderer/utils/cn'

interface SubtaskProgressRingProps {
  completed: number
  total: number
  size?: number
  strokeWidth?: number
  className?: string
}

function SubtaskProgressRingBase({
  completed,
  total,
  size = 18,
  strokeWidth = 2.5,
  className
}: SubtaskProgressRingProps): React.JSX.Element | null {
  if (total <= 0) return null
  const ratio = Math.max(0, Math.min(1, completed / total))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ratio)

  // white until ~40%, then fade to green
  const greenStart = 0.2
  const t = ratio < greenStart ? 0 : (ratio - greenStart) / (1 - greenStart)
  const sat = Math.round(t * 60)
  const lit = Math.round(85 - t * 33)
  const progressColor = `hsl(145, ${sat}%, ${lit}%)`

  return (
    <div
      aria-label={`${completed} of ${total} subtasks done`}
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      role="img"
      title={`${completed}/${total} subtasks`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeOpacity={1}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 200ms ease, stroke 200ms ease' }}
        />
      </svg>
    </div>
  )
}

export const SubtaskProgressRing = memo(SubtaskProgressRingBase)
