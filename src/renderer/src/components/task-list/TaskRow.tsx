import { Fragment, memo } from 'react'
import { Flag } from 'lucide-react'
import { AnimatedCheckbox } from './animated-checkbox'
import { SubtaskProgressRing } from './subtask-progress-ring'
import type { Label, Project, Task } from '@renderer/types'
import { Item } from '@renderer/components/ui/item'
import { isTaskOverdue } from '@renderer/store'
import { PRIORITY_META, formatDueDate } from '@renderer/utils/task'
import { cn } from '@renderer/utils/cn'

interface TaskRowProps {
  task: Task
  project?: Project
  labels: Label[]
  showProjectContext?: boolean
  index: number
  onOpen: (taskId: string) => void
  onToggleComplete: (taskId: string) => void
}

function TaskRowBase(props: TaskRowProps): React.JSX.Element {
  const overdue = isTaskOverdue(props.task)
  const priorityMeta = PRIORITY_META[props.task.priority]
  const showFlag = props.task.priority !== 'p4'
  const subTaskTotal = props.task.subTasks.length
  const subTaskDone = subTaskTotal > 0 ? props.task.subTasks.filter((s) => s.completed).length : 0
  const projectContext = props.showProjectContext ? (props.project?.name ?? 'Inbox') : undefined
  const metaParts: React.JSX.Element[] = []

  if (props.task.dueDate) {
    metaParts.push(
      <span className={cn(overdue && 'text-red-400/80')} key="due-date">
        {formatDueDate(props.task.dueDate)}
      </span>
    )
  }

  if (projectContext) {
    metaParts.push(<span key="project">{projectContext}</span>)
  }

  for (const label of props.labels) {
    metaParts.push(<span key={`label-${label.id}`}>#{label.name}</span>)
  }

  if (subTaskTotal > 0) {
    metaParts.push(
      <span key="subtasks">
        {subTaskDone}/{subTaskTotal}
      </span>
    )
  }

  return (
    <li>
      <Item
        className={cn(
          'group flex cursor-pointer items-center gap-3.5 px-3.5 py-2.5',
          props.task.completed && 'opacity-40'
        )}
        onClick={() => props.onOpen(props.task.id)}
        variant="muted"
      >
        <div onClick={(e) => e.stopPropagation()}>
          <AnimatedCheckbox
            checked={props.task.completed}
            onCheckedChange={() => props.onToggleComplete(props.task.id)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate text-sm leading-snug text-app-text',
              props.task.completed && 'line-through text-app-text-muted'
            )}
          >
            {props.task.title}
          </div>

          {metaParts.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-app-text-muted">
              {metaParts.map((part, index) => (
                <Fragment key={index}>
                  {index > 0 && <span>·</span>}
                  {part}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {showFlag && (
          <Flag
            aria-label={priorityMeta.label}
            className="shrink-0"
            fill={priorityMeta.color}
            size={18}
            style={{ color: priorityMeta.color }}
          />
        )}

        {subTaskTotal > 0 && <SubtaskProgressRing completed={subTaskDone} total={subTaskTotal} />}
      </Item>
    </li>
  )
}

export const TaskRow = memo(TaskRowBase)
