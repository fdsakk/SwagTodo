import type { CSSProperties } from 'react'
import type { Label, Task } from '@renderer/types'
import { CardBody, KANBAN_CARD_CLASSNAME } from './KanbanCard'

interface KanbanCardPreviewProps {
  task: Task
  labels: Label[]
  style?: CSSProperties
}

export function KanbanCardPreview({
  task,
  labels,
  style
}: KanbanCardPreviewProps): React.JSX.Element {
  return (
    <div className={KANBAN_CARD_CLASSNAME} style={style}>
      <CardBody task={task} labels={labels} />
    </div>
  )
}
