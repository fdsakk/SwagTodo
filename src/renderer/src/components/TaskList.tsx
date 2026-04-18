import type { Label, Project, TaskGroup } from '@renderer/types'
import TaskRow from '@renderer/components/TaskRow'

interface TaskListProps {
  groups: TaskGroup[]
  projects: Project[]
  labels: Label[]
  emptyStateTitle: string
  emptyStateDescription: string
  onToggleComplete: (taskId: string) => void
  onOpenTask: (taskId: string) => void
}

export default function TaskList(props: TaskListProps): React.JSX.Element {
  const hasTasks = props.groups.some((group) => group.tasks.length > 0)

  if (!hasTasks) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm text-app-text-secondary">{props.emptyStateTitle}</p>
        <p className="mt-1 text-xs text-app-text-muted">{props.emptyStateDescription}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 pb-6">
      <div className="space-y-6">
        {props.groups.map((group, groupIndex) =>
          group.tasks.length > 0 ? (
            <section key={group.id}>
              <h3 className="mb-1 px-2 text-xs font-medium text-app-text-muted">{group.title}</h3>
              <ul>
                {group.tasks.map((task, taskIndex) => {
                  const index =
                    taskIndex +
                    props.groups
                      .slice(0, groupIndex)
                      .reduce((sum, currentGroup) => sum + currentGroup.tasks.length, 0)
                  return (
                    <TaskRow
                      index={index}
                      key={task.id}
                      labels={props.labels.filter((label) => task.labels.includes(label.id))}
                      onOpen={props.onOpenTask}
                      onToggleComplete={props.onToggleComplete}
                      project={props.projects.find((project) => project.id === task.projectId)}
                      task={task}
                    />
                  )
                })}
              </ul>
            </section>
          ) : null
        )}
      </div>
    </div>
  )
}
