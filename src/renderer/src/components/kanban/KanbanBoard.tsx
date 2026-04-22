import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Label, Task, TaskStatus } from '@renderer/types'
import { useShallow } from 'zustand/react/shallow'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCardPreview } from './KanbanCardPreview'
import { COLUMNS, COLUMN_PREFIX, EMPTY_LABELS, byOrderAsc, resolveTaskLabels } from './types'
import { useDomainStore } from '@renderer/store'

interface KanbanBoardProps {
  projectId: string
  tasks: Task[]
  labels: Label[]
  onOpenTask: (taskId: string) => void
}

export default function KanbanBoard(props: KanbanBoardProps): React.JSX.Element {
  const { addTask, applyKanbanOrder } = useDomainStore(
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
