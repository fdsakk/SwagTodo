import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@renderer/components/ui/badge"
import { useDomainStore, useUiStore } from "@renderer/store"
import type {
  Label,
  Priority,
  Project,
  Task,
  TaskGroup,
  TaskStatus
} from "@renderer/types"
import { cn } from "@renderer/utils/cn"
import { useCallback, useMemo, useRef } from "react"
import { useShallow } from "zustand/react/shallow"
import { TaskRow } from "./TaskRow"

const GROUP_PREFIX = "group:"

interface TaskListProps {
  groups: TaskGroup[]
  projects: Project[]
  labels: Label[]
  showProjectContext?: boolean
  delayCompleteAnimation?: boolean
  /** Show groups without tasks (as drop targets). */
  showEmptyGroups?: boolean
  emptyStateTitle: string
  emptyStateDescription: string
  onToggleComplete: (taskId: string, options?: { delayMs?: number }) => void
  onOpenTask: (taskId: string) => void
  onArchiveTask?: (taskId: string) => void
  onUnarchiveTask?: (taskId: string) => void
  onDeleteTask?: (taskId: string) => void
  /** Cross-group drop (e.g. move a task to another day). */
  onMoveToGroup?: (taskId: string, groupId: string) => void
  onUpdateTask?: (
    taskId: string,
    updates: {
      priority?: Priority
      dueDate?: string | undefined
      status?: TaskStatus
    }
  ) => void
}

/** Orders for `ids` (already in the new order) after moving `movedId`. */
const ordersAfterMove = (
  ids: string[],
  movedId: string,
  orderById: Map<string, number>
): Record<string, number> => {
  const index = ids.indexOf(movedId)
  const prev = index > 0 ? orderById.get(ids[index - 1]) : undefined
  const next =
    index < ids.length - 1 ? orderById.get(ids[index + 1]) : undefined
  if (prev !== undefined && next !== undefined && prev < next) {
    return { [movedId]: (prev + next) / 2 }
  }
  if (prev !== undefined && next === undefined) return { [movedId]: prev + 1 }
  if (next !== undefined && prev === undefined) return { [movedId]: next - 1 }
  // Ties or inverted neighbours: renumber the whole group.
  return Object.fromEntries(ids.map((id, i) => [id, i + 1]))
}

function SortableItem({
  id,
  enabled,
  children
}: {
  id: string
  enabled: boolean
  children: React.ReactNode
}): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !enabled })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 opacity-70")}
      {...(enabled ? attributes : {})}
      {...(enabled ? listeners : {})}
      tabIndex={-1}
    >
      {children}
    </li>
  )
}

function DroppableGroup({
  id,
  enabled,
  children
}: {
  id: string
  enabled: boolean
  children: React.ReactNode
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: `${GROUP_PREFIX}${id}`,
    disabled: !enabled
  })
  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-lg transition-colors",
        isOver && "bg-app-hover/60"
      )}
      ref={setNodeRef}
    >
      {children}
    </section>
  )
}

export function TaskList(props: TaskListProps): React.JSX.Element {
  const hasTasks = props.groups.some((group) => group.tasks.length > 0)
  const allTasks = useDomainStore((state) => state.tasks)
  const sortMode = useUiStore((state) => state.sortMode)
  const { selectedTaskIds, selectionAnchorId } = useUiStore(
    useShallow((state) => ({
      selectedTaskIds: state.selectedTaskIds,
      selectionAnchorId: state.selectionAnchorId
    }))
  )
  const manualSort = sortMode === "manual"
  const dndEnabled = manualSort || Boolean(props.onMoveToGroup)

  const projectById = useMemo(
    () => new Map(props.projects.map((project) => [project.id, project])),
    [props.projects]
  )
  const labelById = useMemo(
    () => new Map(props.labels.map((label) => [label.id, label])),
    [props.labels]
  )
  const incompleteIds = useMemo(
    () => new Set(allTasks.filter((t) => !t.completed).map((t) => t.id)),
    [allTasks]
  )
  const selectedSet = useMemo(() => new Set(selectedTaskIds), [selectedTaskIds])

  // Latest values for stable callbacks.
  const flatIdsRef = useRef<string[]>([])
  flatIdsRef.current = props.groups.flatMap((group) =>
    group.tasks.map((task) => task.id)
  )
  const anchorRef = useRef(selectionAnchorId)
  anchorRef.current = selectionAnchorId
  const onOpenTaskRef = useRef(props.onOpenTask)
  onOpenTaskRef.current = props.onOpenTask

  const handleRowClick = useCallback(
    (taskId: string, event?: React.MouseEvent) => {
      const ui = useUiStore.getState()
      if (event && (event.metaKey || event.ctrlKey)) {
        ui.toggleTaskSelection(taskId)
        return
      }
      if (event?.shiftKey) {
        const ids = flatIdsRef.current
        const anchor = anchorRef.current ?? ui.selectedTaskIds.at(-1)
        const from = anchor ? ids.indexOf(anchor) : -1
        const to = ids.indexOf(taskId)
        if (from === -1 || to === -1) {
          ui.setSelectedTaskIds([taskId], taskId)
          return
        }
        const [start, end] = from < to ? [from, to] : [to, from]
        ui.setSelectedTaskIds(ids.slice(start, end + 1), anchor)
        return
      }
      ui.clearSelection()
      onOpenTaskRef.current(taskId)
    },
    []
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id)
      const overId = event.over ? String(event.over.id) : null
      if (!overId || overId === activeId) return

      const groupOf = (taskId: string): TaskGroup | undefined =>
        props.groups.find((g) => g.tasks.some((t) => t.id === taskId))
      const source = groupOf(activeId)
      const target = overId.startsWith(GROUP_PREFIX)
        ? props.groups.find((g) => `${GROUP_PREFIX}${g.id}` === overId)
        : groupOf(overId)
      if (!source || !target) return

      if (source.id !== target.id) {
        props.onMoveToGroup?.(activeId, target.id)
        return
      }
      if (!manualSort || overId.startsWith(GROUP_PREFIX)) return

      const ids = source.tasks.map((t) => t.id)
      const moved = arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId))
      const orderById = new Map(source.tasks.map((t: Task) => [t.id, t.order]))
      useDomainStore
        .getState()
        .setTaskOrders(ordersAfterMove(moved, activeId, orderById))
    },
    [manualSort, props.groups, props.onMoveToGroup]
  )

  if (!hasTasks && !props.showEmptyGroups) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm text-app-text-secondary">
          {props.emptyStateTitle}
        </p>
        <p className="mt-1 text-xs text-app-text-muted">
          {props.emptyStateDescription}
        </p>
      </div>
    )
  }

  let rowIndex = 0

  const content = (
    <div className="flex flex-col gap-6">
      {props.groups.map((group) =>
        group.tasks.length > 0 || props.showEmptyGroups ? (
          <DroppableGroup
            enabled={Boolean(props.onMoveToGroup)}
            id={group.id}
            key={group.id}
          >
            <Badge
              className={cn("w-fit p-2.5 rounded-md", group.accentClass)}
              size="default"
              variant="outline"
            >
              {group.title}
              {props.showEmptyGroups && (
                <span className="ml-1.5 text-app-text-muted">
                  {group.tasks.length}
                </span>
              )}
            </Badge>
            <SortableContext
              items={group.tasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex min-h-2 flex-col gap-2">
                {group.tasks.map((task) => {
                  const index = rowIndex++
                  return (
                    <SortableItem
                      enabled={dndEnabled}
                      id={task.id}
                      key={task.id}
                    >
                      <TaskRow
                        blocked={
                          !task.completed &&
                          (task.blockedBy ?? []).some((id) =>
                            incompleteIds.has(id)
                          )
                        }
                        delayCompleteAnimation={props.delayCompleteAnimation}
                        index={index}
                        labelById={labelById}
                        onArchive={props.onArchiveTask}
                        onDelete={props.onDeleteTask}
                        onOpen={handleRowClick}
                        onToggleComplete={props.onToggleComplete}
                        onUnarchive={props.onUnarchiveTask}
                        onUpdate={props.onUpdateTask}
                        project={
                          task.projectId
                            ? projectById.get(task.projectId)
                            : undefined
                        }
                        selected={selectedSet.has(task.id)}
                        showProjectContext={props.showProjectContext}
                        task={task}
                      />
                    </SortableItem>
                  )
                })}
              </ul>
            </SortableContext>
          </DroppableGroup>
        ) : null
      )}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto px-4 pb-20">
      {dndEnabled ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          {content}
        </DndContext>
      ) : (
        content
      )}
    </div>
  )
}
