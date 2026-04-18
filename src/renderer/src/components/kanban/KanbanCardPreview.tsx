import type { CSSProperties } from 'react'
import type { Label, Task } from '@renderer/types'
import { CardBody } from './KanbanCard'

interface KanbanCardPreviewProps {
  task: Task
  labels: Label[]
  style?: CSSProperties
}

export function KanbanCardPreview({ task, labels, style }: KanbanCardPreviewProps): React.JSX.Element {
  return (
    <div
      className="rounded-md border border-white/[0.1] bg-zinc-900/95 p-3 shadow-xl"
      style={style}
    >
      <CardBody task={task} labels={labels} />
    </div>
  )
}
