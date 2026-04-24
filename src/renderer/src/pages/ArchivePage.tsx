import { useMemo } from 'react'
import { TaskList } from '@renderer/components/task-list'
import { selectArchivedTaskGroups, useDomainStore, useUiStore } from '@renderer/store'
import { useShallow } from 'zustand/react/shallow'
import { useTaskComplete } from '@renderer/hooks/useTaskComplete'

export default function ArchivePage(): React.JSX.Element {
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

  const groupedTasks = useMemo(
    () => selectArchivedTaskGroups({ tasks }, visibleInput),
    [tasks, visibleInput]
  )

  return (
    <TaskList
      emptyStateDescription="Archived tasks will appear here."
      emptyStateTitle="Archive is empty"
      groups={groupedTasks}
      labels={labels}
      onDeleteTask={actions.deleteTask}
      onOpenTask={openEditPanel}
      onToggleComplete={toggleTaskComplete}
      onUnarchiveTask={actions.unarchiveTask}
      onUpdateTask={actions.updateTask}
      projects={projects}
      showProjectContext
    />
  )
}
