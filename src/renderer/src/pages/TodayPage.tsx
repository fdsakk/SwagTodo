import { useMemo } from 'react'
import { TaskList } from '@renderer/components/task-list'
import { selectTodayTaskGroups, useDomainStore, useUiStore } from '@renderer/store'
import { useVisibleTasks } from '@renderer/utils/task'
import { useShallow } from 'zustand/react/shallow'
import { useTaskComplete } from '@renderer/hooks/useTaskComplete'

export default function TodayPage(): React.JSX.Element {
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
    () => selectTodayTaskGroups({ tasks }, visibleInput),
    [tasks, visibleInput]
  )

  return (
    <TaskList
      emptyStateDescription="No tasks are due today."
      emptyStateTitle="You're all caught up"
      groups={groupedTasks}
      labels={labels}
      onOpenTask={openEditPanel}
      onToggleComplete={toggleTaskComplete}
      projects={projects}
    />
  )
}
