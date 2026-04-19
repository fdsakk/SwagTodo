import { memo } from 'react'
import { Flag } from 'lucide-react'
import { AnimatedCheckbox } from './animated-checkbox'
import { SubtaskProgressRing } from './subtask-progress-ring'
import type { Label, Project, Task } from '@renderer/types'
import { PRIORITY_META, formatDueDate, isTaskOverdue } from '@renderer/utils/task'
import { cn } from '@renderer/utils/cn'

interface TaskRowProps {
  task: Task
  project?: Project
  labels: Label[]
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
  const hasMeta = props.task.dueDate || props.project || props.labels.length > 0 || subTaskTotal > 0

  return (
    <li
      className={cn(
        'group flex cursor-pointer items-center gap-3 border-b border-app-border pl-2.5 pr-4 py-2.5 transition-colors hover:bg-app-hover',
        props.task.completed && 'opacity-40'
      )}
      onClick={() => props.onOpen(props.task.id)}
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

        {hasMeta && (
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-app-text-muted">
            {props.task.dueDate && (
              <span className={cn(overdue && 'text-red-400/80')}>
                {formatDueDate(props.task.dueDate)}
              </span>
            )}
            {props.task.dueDate && subTaskTotal > 0 && <span>·</span>}
            {props.labels.map((label) => (
              <span key={label.id}>#{label.name}</span>
            ))}
            {subTaskTotal > 0 && (
              <>
                <span>
                  {subTaskDone}/{subTaskTotal}
                </span>
              </>
            )}
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

      {subTaskTotal > 0 && (
        <SubtaskProgressRing
          completed={subTaskDone}
          total={subTaskTotal}
        />
      )}
    </li>
  )
}

export const TaskRow = memo(TaskRowBase)
