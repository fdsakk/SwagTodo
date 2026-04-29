import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent
} from '@dnd-kit/core'
import type { Label, Task, TaskStatus } from '@renderer/types'
import { useShallow } from 'zustand/react/shallow'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCardPreview } from './KanbanCardPreview'
import { COLUMNS, COLUMN_PREFIX, EMPTY_LABELS, byOrderAsc, resolveTaskLabels } from './types'
import { useDomainStore } from '@renderer/store'

type ColumnTaskIds = Record<TaskStatus, string[]>

const buildLabelMap = (labels: readonly Label[]): Map<string, Label> => {
  const map = new Map<string, Label>()
  for (const label of labels) map.set(label.id, label)
  return map
}

const buildColumns = (tasks: readonly Task[]): Record<TaskStatus, Task[]> => {
  const buckets: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] }
  for (const task of tasks) buckets[task.status].push(task)
  buckets.todo.sort(byOrderAsc)
  buckets.in_progress.sort(byOrderAsc)
  buckets.done.sort(byOrderAsc)
  return buckets
}

const buildTaskMap = (tasks: readonly Task[]): Map<string, Task> => {
  const map = new Map<string, Task>()
  for (const task of tasks) map.set(task.id, task)
  return map
}

const buildColumnTaskIds = (columns: Record<TaskStatus, readonly Task[]>): ColumnTaskIds => ({
  todo: columns.todo.map((task) => task.id),
  in_progress: columns.in_progress.map((task) => task.id),
  done: columns.done.map((task) => task.id)
})

const cloneColumnTaskIds = (columns: ColumnTaskIds): ColumnTaskIds => ({
  todo: [...columns.todo],
  in_progress: [...columns.in_progress],
  done: [...columns.done]
})

const areColumnTaskIdsEqual = (a: ColumnTaskIds, b: ColumnTaskIds): boolean =>
  COLUMNS.every((column) => {
    const left = a[column.key]
    const right = b[column.key]
    return left.length === right.length && left.every((id, index) => id === right[index])
  })

const findTaskStatus = (columns: ColumnTaskIds, taskId: string): TaskStatus | undefined => {
  for (const column of COLUMNS) {
    if (columns[column.key].includes(taskId)) return column.key
  }
  return undefined
}

const mapColumnIdsToTasks = (
  columnTaskIds: ColumnTaskIds,
  taskById: Map<string, Task>
): Record<TaskStatus, Task[]> => ({
  todo: columnTaskIds.todo.map((id) => taskById.get(id)).filter((task): task is Task => !!task),
  in_progress: columnTaskIds.in_progress
    .map((id) => taskById.get(id))
    .filter((task): task is Task => !!task),
  done: columnTaskIds.done.map((id) => taskById.get(id)).filter((task): task is Task => !!task)
})

const getProjectedColumns = ({
  activeId,
  overId,
  columns,
  taskById,
  translatedTop,
  overTop,
  overHeight
}: {
  activeId: string
  overId: string
  columns: ColumnTaskIds
  taskById: Map<string, Task>
  translatedTop?: number
  overTop?: number
  overHeight?: number
}): ColumnTaskIds | null => {
  if (activeId === overId) return columns

  const sourceStatus = findTaskStatus(columns, activeId) ?? taskById.get(activeId)?.status
  if (!sourceStatus) return null

  const isColumnDrop = overId.startsWith(COLUMN_PREFIX)
  const targetStatus = isColumnDrop
    ? (overId.slice(COLUMN_PREFIX.length) as TaskStatus)
    : (findTaskStatus(columns, overId) ?? taskById.get(overId)?.status)
  if (!targetStatus) return null

  const nextColumns = cloneColumnTaskIds(columns)
  const sourceIds = nextColumns[sourceStatus]
  const sourceIndex = sourceIds.indexOf(activeId)
  if (sourceIndex === -1) return null
  sourceIds.splice(sourceIndex, 1)

  const targetIds = nextColumns[targetStatus]
  let insertIndex = targetIds.length

  if (!isColumnDrop) {
    const overIndex = targetIds.indexOf(overId)
    if (overIndex >= 0) {
      const shouldInsertAfter =
        translatedTop != null && overTop != null && overHeight != null
          ? translatedTop > overTop + overHeight / 2
          : false
      insertIndex = overIndex + (shouldInsertAfter ? 1 : 0)
    }
  }

  targetIds.splice(insertIndex, 0, activeId)
  return nextColumns
}

interface KanbanBoardProps {
  projectId: string
  tasks: Task[]
  labels: Label[]
  onOpenTask: (taskId: string) => void
}

export function KanbanBoard(props: KanbanBoardProps): React.JSX.Element {
  const { addTask, applyKanbanOrder } = useDomainStore(
    useShallow((state) => ({
      addTask: state.addTask,
      applyKanbanOrder: state.applyKanbanOrder
    }))
  )
  const [addingColumn, setAddingColumn] = useState<TaskStatus | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeTaskSize, setActiveTaskSize] = useState<{ width: number; height: number } | null>(
    null
  )
  const [draftColumnTaskIds, setDraftColumnTaskIds] = useState<ColumnTaskIds | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const labelMap = useMemo(() => buildLabelMap(props.labels), [props.labels])
  const columns = useMemo(() => buildColumns(props.tasks), [props.tasks])
  const taskById = useMemo(() => buildTaskMap(props.tasks), [props.tasks])
  const committedColumnTaskIds = useMemo(() => buildColumnTaskIds(columns), [columns])
  const renderedColumns = useMemo<Record<TaskStatus, Task[]>>(() => {
    if (!draftColumnTaskIds) return columns
    return mapColumnIdsToTasks(draftColumnTaskIds, taskById)
  }, [columns, draftColumnTaskIds, taskById])

  const activeTask = activeTaskId ? taskById.get(activeTaskId) : undefined

  const onDragStart = useCallback(
    (event: DragStartEvent): void => {
      setActiveTaskId(String(event.active.id))
      setDraftColumnTaskIds(cloneColumnTaskIds(committedColumnTaskIds))
      const rect = event.active.rect.current.initial
      setActiveTaskSize(rect ? { width: rect.width, height: rect.height } : null)
    },
    [committedColumnTaskIds]
  )

  const onDragOver = useCallback(
    (event: DragOverEvent): void => {
      const overId = event.over ? String(event.over.id) : undefined
      if (!overId) return

      const activeId = String(event.active.id)
      setDraftColumnTaskIds((current) => {
        const baseColumns = current ?? committedColumnTaskIds
        const nextColumns = getProjectedColumns({
          activeId,
          overId,
          columns: baseColumns,
          taskById,
          translatedTop: event.active.rect.current.translated?.top,
          overTop: event.over?.rect.top,
          overHeight: event.over?.rect.height
        })

        if (!nextColumns || areColumnTaskIdsEqual(baseColumns, nextColumns)) return current
        return nextColumns
      })
    },
    [committedColumnTaskIds, taskById]
  )

  const onDragEnd = useCallback(
    (event: DragEndEvent): void => {
      setActiveTaskId(null)
      setActiveTaskSize(null)
      const activeId = String(event.active.id)
      const overId = event.over ? String(event.over.id) : undefined
      const baseColumns = draftColumnTaskIds ?? committedColumnTaskIds
      const nextColumns =
        overId != null
          ? (getProjectedColumns({
              activeId,
              overId,
              columns: baseColumns,
              taskById,
              translatedTop: event.active.rect.current.translated?.top,
              overTop: event.over?.rect.top,
              overHeight: event.over?.rect.height
            }) ?? baseColumns)
          : baseColumns

      setDraftColumnTaskIds(null)
      if (!overId || areColumnTaskIdsEqual(nextColumns, committedColumnTaskIds)) return

      applyKanbanOrder(props.projectId, nextColumns)
    },
    [applyKanbanOrder, committedColumnTaskIds, draftColumnTaskIds, props.projectId, taskById]
  )

  const onDragCancel = useCallback(() => {
    setActiveTaskId(null)
    setActiveTaskSize(null)
    setDraftColumnTaskIds(null)
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
      activeTaskSize
        ? {
            width: activeTaskSize.width,
            height: activeTaskSize.height,
            boxSizing: 'border-box'
          }
        : undefined,
    [activeTaskSize]
  )

  return (
    <div className="h-full overflow-y-auto px-4 pb-6">
      <DndContext
        collisionDetection={closestCorners}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
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
              tasks={renderedColumns[column.key]}
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
