import { TaskList } from "@renderer/components/task-list"
import { useTaskComplete } from "@renderer/hooks/useTaskComplete"
import { useUndoableTaskActions } from "@renderer/hooks/useUndoableTaskActions"
import {
  selectUpcomingTaskGroups,
  useDomainStore,
  useUiStore
} from "@renderer/store"
import { format, parseISO } from "date-fns"
import { useCallback, useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

export default function UpcomingPage(): React.JSX.Element {
  const { tasks, projects, labels, actions } = useDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      projects: state.projects,
      labels: state.labels,
      actions: state.actions
    }))
  )
  const openEditPanel = useUiStore((state) => state.openEditPanel)
  const visibleInput = useUiStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      sortMode: state.sortMode
    }))
  )
  const toggleTaskComplete = useTaskComplete()
  const undoable = useUndoableTaskActions()

  // Recompute day buckets when the date changes, not only when tasks do.
  const dayKey = format(new Date(), "yyyy-MM-dd")
  const groups = useMemo(
    () => selectUpcomingTaskGroups({ tasks }, visibleInput, parseISO(dayKey)),
    [tasks, visibleInput, dayKey]
  )

  const handleMoveToGroup = useCallback(
    (taskId: string, groupId: string) => {
      if (groupId === "overdue") return
      actions.updateTask(taskId, { dueDate: groupId })
    },
    [actions]
  )

  return (
    <TaskList
      emptyStateDescription="Tasks due in the next 7 days show up here."
      emptyStateTitle="Nothing scheduled"
      groups={groups.filter((g) => g.id !== "overdue" || g.tasks.length > 0)}
      labels={labels}
      onArchiveTask={undoable.archiveTask}
      onDeleteTask={undoable.deleteTask}
      onMoveToGroup={handleMoveToGroup}
      onOpenTask={openEditPanel}
      onToggleComplete={toggleTaskComplete}
      onUpdateTask={actions.updateTask}
      projects={projects}
      showEmptyGroups
      showProjectContext
    />
  )
}
