import { useMemo } from 'react'
import TaskList from '@renderer/components/TaskList'
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
    const todayTasks = tasks.filter((t) => isTaskDueToday(t) || isTaskOverdue(t))
    return [
      {
        id: 'overdue',
        title: 'Overdue',
        accentClass: 'text-zinc-200',
        tasks: todayTasks.filter(isTaskOverdue)
      },
      { id: 'today', title: 'Today', tasks: todayTasks.filter(isTaskDueToday) }
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
