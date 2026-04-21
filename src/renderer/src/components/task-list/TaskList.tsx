import { useMemo } from 'react'
import type { Label, Project, TaskGroup } from '@renderer/types'
import { TaskRow } from './TaskRow'

interface TaskListProps {
  groups: TaskGroup[]
  projects: Project[]
  labels: Label[]
  emptyStateTitle: string
  emptyStateDescription: string
  onToggleComplete: (taskId: string) => void
  onOpenTask: (taskId: string) => void
}

export function TaskList(props: TaskListProps): React.JSX.Element {
  const hasTasks = props.groups.some((group) => group.tasks.length > 0)
  const projectById = useMemo(
    () => new Map(props.projects.map((project) => [project.id, project])),
    [props.projects]
  )
  const labelById = useMemo(
    () => new Map(props.labels.map((label) => [label.id, label])),
    [props.labels]
  )

  if (!hasTasks) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm text-app-text-secondary">{props.emptyStateTitle}</p>
        <p className="mt-1 text-xs text-app-text-muted">{props.emptyStateDescription}</p>
      </div>
    )
  }

  let rowIndex = 0

  return (
    <div className="h-full overflow-y-auto px-4 pb-6">
      <div className="space-y-6">
        {props.groups.map((group) =>
          group.tasks.length > 0 ? (
            <section key={group.id}>
              <h3 className="mb-1 px-2 text-xs font-medium text-app-text-muted">{group.title}</h3>
              <ul>
                {group.tasks.map((task) => {
                  const index = rowIndex++
                  const labels = task.labels
                    .map((labelId) => labelById.get(labelId))
                    .filter((label): label is Label => Boolean(label))
                  return (
                    <TaskRow
                      index={index}
                      key={task.id}
                      labels={labels}
                      onOpen={props.onOpenTask}
                      onToggleComplete={props.onToggleComplete}
                      project={task.projectId ? projectById.get(task.projectId) : undefined}
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
