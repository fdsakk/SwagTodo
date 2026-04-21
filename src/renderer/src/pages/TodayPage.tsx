import { useMemo } from 'react'
import { TaskList } from '@renderer/components/task-list'
import useAppStore from '@renderer/store/useAppStore'
import { isTaskDueToday, isTaskOverdue, useVisibleTasks } from '@renderer/utils/task'
import type { TaskGroup } from '@renderer/types'
import { useShallow } from 'zustand/react/shallow'
import { useTaskComplete } from '@renderer/hooks/useTaskComplete'

export default function TodayPage(): React.JSX.Element {
  const { projects, labels, openEditPanel } = useAppStore(
    useShallow((state) => ({
      projects: state.projects,
      labels: state.labels,
      openEditPanel: state.openEditPanel
    }))
  )
  const toggleTaskComplete = useTaskComplete()

  const tasks = useVisibleTasks()

  const groupedTasks = useMemo<TaskGroup[]>(() => {
    const overdue: typeof tasks = []
    const today: typeof tasks = []

    for (const task of tasks) {
      if (isTaskOverdue(task)) overdue.push(task)
      else if (isTaskDueToday(task)) today.push(task)
    }

    return [
      {
        id: 'overdue',
        title: 'Overdue',
        accentClass: 'text-app-text-secondary',
        tasks: overdue
      },
      { id: 'today', title: 'Today', tasks: today }
    ]
  }, [tasks])

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
