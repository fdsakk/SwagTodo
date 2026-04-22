import { useMemo } from 'react'
import { TaskList } from '@renderer/components/task-list'
import { selectInboxTaskGroups, useDomainStore, useUiStore } from '@renderer/store'
import { useVisibleTasks } from '@renderer/utils/task'
import { useShallow } from 'zustand/react/shallow'
import { useTaskComplete } from '@renderer/hooks/useTaskComplete'

export default function InboxPage(): React.JSX.Element {
  const { projects, labels } = useDomainStore(
    useShallow((state) => ({
      projects: state.projects,
      labels: state.labels
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

  const tasks = useVisibleTasks()
  const groupedTasks = useMemo(
    () => selectInboxTaskGroups({ tasks }, visibleInput),
    [tasks, visibleInput]
  )

  return (
    <TaskList
      emptyStateDescription="Use the + button above to create your first inbox task."
      emptyStateTitle="Inbox is empty"
      groups={groupedTasks}
      labels={labels}
      onOpenTask={openEditPanel}
      onToggleComplete={toggleTaskComplete}
      projects={projects}
    />
  )
}
