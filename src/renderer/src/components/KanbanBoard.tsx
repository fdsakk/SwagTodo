import { memo, useCallback, useMemo, useState, type CSSProperties } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import useAppStore from '@renderer/store/useAppStore'
import type { Label, Task, TaskStatus } from '@renderer/types'
import { PRIORITY_META, formatDueDate } from '@renderer/utils/task'
import { cn } from '@renderer/utils/cn'
import { useShallow } from 'zustand/react/shallow'
import { SubtaskProgressRing } from '@renderer/components/subtask-progress-ring'

interface KanbanBoardProps {
  projectId: string
  tasks: Task[]
  labels: Label[]
  onOpenTask: (taskId: string) => void
}

const COLUMNS: readonly { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
] as const

const COLUMN_PREFIX = 'column-'

const byOrderAsc = (a: Task, b: Task): number => a.order - b.order

const resolveTaskLabels = (task: Task, labelMap: Map<string, Label>): Label[] => {
  if (task.labels.length === 0) return EMPTY_LABELS
  const out: Label[] = []
  for (let i = 0; i < task.labels.length; i++) {
    const l = labelMap.get(task.labels[i])
    if (l) out.push(l)
  }
  return out
}

const EMPTY_LABELS: Label[] = []

interface CardBodyProps {
  task: Task
  labels: Label[]
}

const CardBody = memo(function CardBody({ task, labels }: CardBodyProps): React.JSX.Element {
  const meta = PRIORITY_META[task.priority]
  const subTaskTotal = task.subTasks.length
  const subTaskDone = subTaskTotal > 0 ? task.subTasks.filter((s) => s.completed).length : 0
  const hasMeta = Boolean(task.dueDate) || labels.length > 0 || subTaskTotal > 0

  return (
    <>
      <div className="flex items-start items-center gap-2">
        <span className="size-2 shrink-0 rounded-full" style={{ background: meta.color }} />
        <p className="flex-1 text-sm text-zinc-200">{task.title}</p>
        {subTaskTotal > 0 && (
          <SubtaskProgressRing
            className="text-zinc-300 mr-0.5"
            completed={subTaskDone}
            total={subTaskTotal}
          />
        )}
      </div>
      {hasMeta && (
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 pl-3.5 text-xs text-zinc-500">
          {task.dueDate && <span>{formatDueDate(task.dueDate)}</span>}
          {labels.map((label) => (
            <span key={label.id}>#{label.name}</span>
          ))}
          {/*{task.dueDate && subTaskTotal > 0 && <span>·</span>}*/}
          {/*{subTaskTotal > 0 && (
            <span>
              {subTaskDone}/{subTaskTotal}
            </span>
          )}*/}
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

const SortableCard = memo(function SortableCard({
  task,
  labels,
  onOpen
}: SortableCardProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id
  })
  const style = useMemo<CSSProperties>(
    () => ({ transform: CSS.Transform.toString(transform), transition }),
    [transform, transition]
  )
  const handleClick = useCallback(() => onOpen(task.id), [onOpen, task.id])

  return (
    <div
      className={cn(
        'cursor-pointer rounded-md border border-white/[0.05] bg-white/[0.02] p-2 transition-colors hover:border-white/[0.1]',
        isDragging && 'opacity-50'
      )}
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <CardBody task={task} labels={labels} />
    </div>
  )
})

interface KanbanColumnProps {
  status: TaskStatus
  title: string
  tasks: Task[]
  labelMap: Map<string, Label>
  adding: boolean
  onToggleAdd: (status: TaskStatus) => void
  onAddTask: (status: TaskStatus, title: string) => void
  onOpenTask: (taskId: string) => void
}

const KanbanColumn = memo(function KanbanColumn({
  status,
  title,
  tasks,
  labelMap,
  adding,
  onToggleAdd,
  onAddTask,
  onOpenTask
}: KanbanColumnProps): React.JSX.Element {
  const { setNodeRef } = useDroppable({ id: `${COLUMN_PREFIX}${status}` })
  const [titleInput, setTitleInput] = useState('')

  const items = useMemo(() => tasks.map((t) => t.id), [tasks])

  const commit = useCallback(() => {
    const trimmed = titleInput.trim()
    if (!trimmed) return
    onAddTask(status, trimmed)
    setTitleInput('')
    onToggleAdd(status)
  }, [titleInput, onAddTask, status, onToggleAdd])

  const cancel = useCallback(() => {
    setTitleInput('')
    onToggleAdd(status)
  }, [onToggleAdd, status])

  const toggle = useCallback(() => onToggleAdd(status), [onToggleAdd, status])

  return (
    <div className="flex min-h-[360px] flex-col ">
      <div className="mb-2 flex h-8 items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-300">{title}</span>
          <span>{tasks.length}</span>
        </div>
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
          onClick={toggle}
          type="button"
        >
          <Plus size={14} />
        </button>
      </div>

      {adding && (
        <div className="mb-2 rounded-md border border-white/[0.06] bg-white/[0.02] p-2">
          <input
            autoFocus
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            onChange={(event) => setTitleInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit()
              else if (event.key === 'Escape') cancel()
            }}
            placeholder="Task title"
            value={titleInput}
          />
        </div>
      )}

      <div className="flex-1 space-y-2" ref={setNodeRef}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              labels={resolveTaskLabels(task, labelMap)}
              onOpen={onOpenTask}
              task={task}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
})

interface KanbanCardPreviewProps {
  task: Task
  labels: Label[]
  style?: CSSProperties
}

function KanbanCardPreview({ task, labels, style }: KanbanCardPreviewProps): React.JSX.Element {
  return (
    <div
      className="rounded-md border border-white/[0.1] bg-zinc-900/95 p-3 shadow-xl"
      style={style}
    >
      <CardBody task={task} labels={labels} />
    </div>
  )
}

export default function KanbanBoard(props: KanbanBoardProps): React.JSX.Element {
  const { addTask, applyKanbanOrder } = useAppStore(
    useShallow((state) => ({
      addTask: state.addTask,
      applyKanbanOrder: state.applyKanbanOrder
    }))
  )
  const [addingColumn, setAddingColumn] = useState<TaskStatus | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeTaskWidth, setActiveTaskWidth] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const labelMap = useMemo(() => {
    const m = new Map<string, Label>()
    for (let i = 0; i < props.labels.length; i++) m.set(props.labels[i].id, props.labels[i])
    return m
  }, [props.labels])

  const columns = useMemo<Record<TaskStatus, Task[]>>(() => {
    const buckets: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] }
    for (let i = 0; i < props.tasks.length; i++) {
      const t = props.tasks[i]
      buckets[t.status].push(t)
    }
    buckets.todo.sort(byOrderAsc)
    buckets.in_progress.sort(byOrderAsc)
    buckets.done.sort(byOrderAsc)
    return buckets
  }, [props.tasks])

  const taskById = useMemo(() => {
    const m = new Map<string, Task>()
    for (let i = 0; i < props.tasks.length; i++) m.set(props.tasks[i].id, props.tasks[i])
    return m
  }, [props.tasks])

  const activeTask = activeTaskId ? taskById.get(activeTaskId) : undefined

  const onDragStart = useCallback((event: DragStartEvent): void => {
    setActiveTaskId(String(event.active.id))
    setActiveTaskWidth(event.active.rect.current.initial?.width ?? null)
  }, [])

  const onDragEnd = useCallback(
    (event: DragEndEvent): void => {
      setActiveTaskId(null)
      setActiveTaskWidth(null)
      const activeId = String(event.active.id)
      const overId = event.over ? String(event.over.id) : undefined
      if (!overId || activeId === overId) return

      const active = taskById.get(activeId)
      if (!active) return
      const sourceStatus = active.status

      const isColumnDrop = overId.startsWith(COLUMN_PREFIX)
      const targetStatus: TaskStatus | undefined = isColumnDrop
        ? (overId.slice(COLUMN_PREFIX.length) as TaskStatus)
        : taskById.get(overId)?.status
      if (!targetStatus) return

      const nextColumns: Record<TaskStatus, string[]> = {
        todo: columns.todo.map((t) => t.id),
        in_progress: columns.in_progress.map((t) => t.id),
        done: columns.done.map((t) => t.id)
      }

      const sourceIndex = nextColumns[sourceStatus].indexOf(activeId)
      if (sourceIndex === -1) return

      if (sourceStatus === targetStatus) {
        const targetIndex = nextColumns[targetStatus].indexOf(overId)
        if (targetIndex === -1) return
        nextColumns[targetStatus] = arrayMove(nextColumns[targetStatus], sourceIndex, targetIndex)
      } else {
        nextColumns[sourceStatus].splice(sourceIndex, 1)
        const overIndex = isColumnDrop ? -1 : nextColumns[targetStatus].indexOf(overId)
        const insertIndex = overIndex < 0 ? nextColumns[targetStatus].length : overIndex
        nextColumns[targetStatus].splice(insertIndex, 0, activeId)
      }

      applyKanbanOrder(props.projectId, nextColumns)
    },
    [columns, taskById, applyKanbanOrder, props.projectId]
  )

  const onDragCancel = useCallback(() => {
    setActiveTaskId(null)
    setActiveTaskWidth(null)
  }, [])

  const handleAddTask = useCallback(
    (status: TaskStatus, title: string) => {
      addTask({ title, status, projectId: props.projectId })
    },
    [addTask, props.projectId]
  )

  const handleToggleAdd = useCallback((status: TaskStatus) => {
    setAddingColumn((current) => (current === status ? null : status))
  }, [])

  const activeTaskLabels = activeTask ? resolveTaskLabels(activeTask, labelMap) : EMPTY_LABELS
  const overlayStyle = useMemo<CSSProperties | undefined>(
    () =>
      activeTaskWidth != null ? { width: activeTaskWidth, boxSizing: 'border-box' } : undefined,
    [activeTaskWidth]
  )

  return (
    <div className="h-full overflow-y-auto px-4 pb-6">
      <DndContext
        collisionDetection={closestCorners}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        sensors={sensors}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((column) => (
            <KanbanColumn
              adding={addingColumn === column.key}
              key={column.key}
              labelMap={labelMap}
              onAddTask={handleAddTask}
              onOpenTask={props.onOpenTask}
              onToggleAdd={handleToggleAdd}
              status={column.key}
              tasks={columns[column.key]}
              title={column.label}
            />
          ))}
        </div>
        <DragOverlay adjustScale={false}>
          {activeTask ? (
            <KanbanCardPreview labels={activeTaskLabels} style={overlayStyle} task={activeTask} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
