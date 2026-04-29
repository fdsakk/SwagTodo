import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SubtaskProgressRing } from "@renderer/components/task-list/subtask-progress-ring"
import { TaskContextMenu } from "@renderer/components/task-list/task-context-menu"
import { useDomainStore } from "@renderer/store"
import type { Label, Priority, Task, TaskStatus } from "@renderer/types"
import { cn } from "@renderer/utils/cn"
import { formatDueDate, PRIORITY_META } from "@renderer/utils/task"
import { type CSSProperties, memo, useCallback, useMemo } from "react"

export const KANBAN_CARD_CLASSNAME =
  "cursor-pointer rounded-md border border-app-border bg-app-hover p-2 transition-colors hover:border-app-active"

interface CardBodyProps {
  task: Task
  labels: Label[]
}

export const CardBody = memo(function CardBody({
  task,
  labels
}: CardBodyProps): React.JSX.Element {
  const meta = PRIORITY_META[task.priority]
  const subTaskTotal = task.subTasks.length
  const subTaskDone =
    subTaskTotal > 0 ? task.subTasks.filter((s) => s.completed).length : 0
  const hasMeta = Boolean(task.dueDate) || labels.length > 0 || subTaskTotal > 0

  return (
    <>
      <div className="flex items-start items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: meta.color }}
        />
        <p className="flex-1 text-sm text-app-text">{task.title}</p>
        {subTaskTotal > 0 && (
          <SubtaskProgressRing
            className=""
            completed={subTaskDone}
            total={subTaskTotal}
          />
        )}
      </div>
      {hasMeta && (
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 pl-3.5 text-xs text-app-text-muted">
          {task.dueDate && <span>{formatDueDate(task.dueDate)}</span>}
          {labels.map((label) => (
            <span key={label.id}>#{label.name}</span>
          ))}
        </div>
      )}
    </>
  )
})

interface SortableCardProps {
  task: Task
  labels: Label[]
  onOpen: (taskId: string) => void
}

export const SortableCard = memo(function SortableCard({
  task,
  labels,
  onOpen
}: SortableCardProps): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id
  })
  const style = useMemo<CSSProperties>(
    () => ({ transform: CSS.Transform.toString(transform), transition }),
    [transform, transition]
  )
  const handleClick = useCallback(() => onOpen(task.id), [onOpen, task.id])
  const { archiveTask, unarchiveTask, deleteTask, updateTask } = useDomainStore(
    (state) => state.actions
  )
  const handleSetPriority = useCallback(
    (taskId: string, priority: Priority) => updateTask(taskId, { priority }),
    [updateTask]
  )
  const handleSetStatus = useCallback(
    (taskId: string, status: TaskStatus) => updateTask(taskId, { status }),
    [updateTask]
  )
  const handleSetDueDate = useCallback(
    (taskId: string, dueDate: string | undefined) =>
      updateTask(taskId, { dueDate }),
    [updateTask]
  )

  return (
    <TaskContextMenu
      task={task}
      onArchive={archiveTask}
      onDelete={deleteTask}
      onSetDueDate={handleSetDueDate}
      onSetPriority={handleSetPriority}
      onSetStatus={handleSetStatus}
      onUnarchive={unarchiveTask}
    >
      <div
        className={cn(KANBAN_CARD_CLASSNAME, isDragging && "opacity-50")}
        ref={setNodeRef}
        style={style}
        onClick={handleClick}
        {...attributes}
        {...listeners}
      >
        <CardBody task={task} labels={labels} />
      </div>
    </TaskContextMenu>
  )
})
