import { useMemo } from 'react'
import { TaskList } from '@renderer/components/task-list'
import useAppStore from '@renderer/store/useAppStore'
import {
  isTaskDueToday,
  isTaskInFuture,
  isTaskOverdue,
  useVisibleTasks
} from '@renderer/utils/task'
import type { TaskGroup } from '@renderer/types'
import { useShallow } from 'zustand/react/shallow'
import { useTaskComplete } from '@renderer/hooks/useTaskComplete'

export default function InboxPage(): React.JSX.Element {
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
    const noDate: typeof tasks = []
    const today: typeof tasks = []
    const future: typeof tasks = []

    for (const task of tasks) {
      if (task.projectId) continue
      if (isTaskOverdue(task)) overdue.push(task)
      else if (!task.dueDate) noDate.push(task)
      else if (isTaskDueToday(task)) today.push(task)
      else if (isTaskInFuture(task)) future.push(task)
    }

    return [
      {
        id: 'overdue',
        title: 'Overdue',
        accentClass: 'text-app-text-secondary',
        tasks: overdue
      },
      { id: 'no-date', title: 'No date', tasks: noDate },
      { id: 'today', title: 'Today', tasks: today },
      { id: 'future', title: 'Future', tasks: future }
    ]
  }, [tasks])

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
