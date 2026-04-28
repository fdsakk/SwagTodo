import { Fragment, memo, useEffect, useRef, useState } from 'react'
import { Flag } from 'lucide-react'
import { AnimatedCheckbox } from './animated-checkbox'
import { SubtaskProgressRing } from './subtask-progress-ring'
import { TaskContextMenu } from './task-context-menu'
import type { Label, Priority, Project, Task, TaskStatus } from '@renderer/types'
import { isTaskOverdue } from '@renderer/store'
import { PRIORITY_META, formatDueDate } from '@renderer/utils/task'
import { cn } from '@renderer/utils/cn'

interface TaskRowProps {
  task: Task
  project?: Project
  labels: Label[]
  showProjectContext?: boolean
  delayCompleteAnimation?: boolean
  index: number
  onOpen: (taskId: string) => void
  onToggleComplete: (taskId: string, options?: { delayMs?: number }) => void
  onArchive?: (taskId: string) => void
  onUnarchive?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onUpdate?: (
    taskId: string,
    updates: { priority?: Priority; dueDate?: string | undefined; status?: TaskStatus }
  ) => void
}

const COMPLETE_TOGGLE_DELAY_MS = 1500

function TaskRowBase(props: TaskRowProps): React.JSX.Element {
  const [isCompleting, setIsCompleting] = useState(false)
  const resetTimerRef = useRef<number | null>(null)
  const overdue = isTaskOverdue(props.task)
  const priorityMeta = PRIORITY_META[props.task.priority]
  const showFlag = props.task.priority !== 'p4'
  const subTaskTotal = props.task.subTasks.length
  const subTaskDone = subTaskTotal > 0 ? props.task.subTasks.filter((s) => s.completed).length : 0
  const projectContext = props.showProjectContext ? (props.project?.name ?? 'Inbox') : undefined
  const isVisuallyCompleted = props.task.completed || isCompleting
  const metaParts: React.JSX.Element[] = []

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
        resetTimerRef.current = null
      }
    }
  }, [])

  const handleToggleComplete = () => {
    if (isCompleting) return

    if (!props.task.completed && props.delayCompleteAnimation) {
      setIsCompleting(true)
      resetTimerRef.current = window.setTimeout(() => {
        setIsCompleting(false)
        resetTimerRef.current = null
      }, COMPLETE_TOGGLE_DELAY_MS)
      props.onToggleComplete(props.task.id, { delayMs: COMPLETE_TOGGLE_DELAY_MS })
      return
    }

    props.onToggleComplete(props.task.id)
  }

  const handleArchive = (taskId: string): void => props.onArchive?.(taskId)
  const handleUnarchive = (taskId: string): void => props.onUnarchive?.(taskId)
  const handleDelete = (taskId: string): void => props.onDelete?.(taskId)
  const handleSetPriority = (taskId: string, priority: Priority): void =>
    props.onUpdate?.(taskId, { priority })
  const handleSetStatus = (taskId: string, status: TaskStatus): void =>
    props.onUpdate?.(taskId, { status })
  const handleSetDueDate = (taskId: string, dueDate: string | undefined): void =>
    props.onUpdate?.(taskId, { dueDate })

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
    <TaskContextMenu
      task={props.task}
      onArchive={handleArchive}
      onDelete={handleDelete}
      onSetDueDate={handleSetDueDate}
      onSetPriority={handleSetPriority}
      onSetStatus={handleSetStatus}
      onUnarchive={handleUnarchive}
    >
      <li>
        <div
          className={cn(
            'group flex cursor-pointer items-center gap-3.5 rounded-lg border border-app-border bg-app-card px-3.5 py-2.5 transition-colors hover:bg-app-hover',
            isVisuallyCompleted && 'opacity-40'
          )}
          onClick={() => {
            if (isCompleting) return
            props.onOpen(props.task.id)
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AnimatedCheckbox
              checked={isVisuallyCompleted}
              onCheckedChange={handleToggleComplete}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={cn(
                'truncate text-sm leading-snug text-app-text',
                isVisuallyCompleted && 'line-through text-app-text-muted'
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
        </div>
      </li>
    </TaskContextMenu>
  )
}

export const TaskRow = memo(TaskRowBase)
