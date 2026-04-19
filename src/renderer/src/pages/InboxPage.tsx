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
    const inbox = tasks.filter((t) => !t.projectId)
    return [
      {
        id: 'overdue',
        title: 'Overdue',
        accentClass: 'text-app-text-secondary',
        tasks: inbox.filter(isTaskOverdue)
      },
      { id: 'no-date', title: 'No date', tasks: inbox.filter((t) => !t.dueDate) },
      { id: 'today', title: 'Today', tasks: inbox.filter(isTaskDueToday) },
      { id: 'future', title: 'Future', tasks: inbox.filter(isTaskInFuture) }
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
