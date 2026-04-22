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
  size = 20,
  strokeWidth = 3,
  className
}: SubtaskProgressRingProps): React.JSX.Element | null {
  if (total <= 0) return null
  const ratio = Math.max(0, Math.min(1, completed / total))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ratio)
  const progressTone =
    ratio >= 1 ? 'text-green-400' : ratio >= 0.5 ? 'text-app-text' : 'text-app-text-secondary'

  return (
    <div
      aria-label={`${completed} of ${total} subtasks done`}
      className={cn('inline-flex items-center justify-center', progressTone, className)}
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
          strokeOpacity={0.18}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
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
