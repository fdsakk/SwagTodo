import { TaskList } from "@renderer/components/task-list"
import { useTaskComplete } from "@renderer/hooks/useTaskComplete"
import { useUndoableTaskActions } from "@renderer/hooks/useUndoableTaskActions"
import {
  selectTodayTaskGroups,
  useDomainStore,
  useUiStore
} from "@renderer/store"
import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

export default function TodayPage(): React.JSX.Element {
  const { projects, labels, actions } = useDomainStore(
    useShallow((state) => ({
      projects: state.projects,
      labels: state.labels,
      actions: state.actions
    }))
  )
  const openEditPanel = useUiStore((state) => state.openEditPanel)
  const visibleInput = useUiStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      sortMode: state.sortMode,
      showCompleted: state.showCompleted,
      selectedView: state.selectedView
    }))
  )
  const toggleTaskComplete = useTaskComplete()
  const undoable = useUndoableTaskActions()

  const tasks = useDomainStore((state) => state.tasks)
  const groupedTasks = useMemo(
    () => selectTodayTaskGroups({ tasks }, visibleInput),
    [tasks, visibleInput]
  )

  return (
    <TaskList
      emptyStateDescription="No tasks are due today."
      emptyStateTitle="You're all caught up"
      groups={groupedTasks}
      labels={labels}
      onArchiveTask={undoable.archiveTask}
      onDeleteTask={undoable.deleteTask}
      onOpenTask={openEditPanel}
      onToggleComplete={toggleTaskComplete}
      onUpdateTask={actions.updateTask}
      projects={projects}
    />
  )
}
