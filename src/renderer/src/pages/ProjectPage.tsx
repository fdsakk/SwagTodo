import { useMemo } from 'react'
import { Pencil } from 'lucide-react'
import useAppStore from '@renderer/store/useAppStore'
import KanbanBoard from '@renderer/components/KanbanBoard'
import TaskList from '@renderer/components/TaskList'
import { useVisibleTasks } from '@renderer/utils/task'
import type { Project, TaskGroup } from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import { useShallow } from 'zustand/react/shallow'
import { useTaskComplete } from '@renderer/hooks/useTaskComplete'

interface ProjectPageProps {
  onEditProject: (project: Project) => void
}

export default function ProjectPage(props: ProjectPageProps): React.JSX.Element {
  const {
    projects,
    labels,
    selectedProjectId,
    projectTab,
    setProjectTab,
    openEditPanel
  } = useAppStore(
    useShallow((state) => ({
      projects: state.projects,
      labels: state.labels,
      selectedProjectId: state.selectedProjectId,
      projectTab: state.projectTab,
      setProjectTab: state.setProjectTab,
      openEditPanel: state.openEditPanel
    }))
  )
  const toggleTaskComplete = useTaskComplete()

  const project = projects.find((p) => p.id === selectedProjectId)
  const tasks = useVisibleTasks()

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === selectedProjectId),
    [tasks, selectedProjectId]
  )

  const groupedTasks = useMemo<TaskGroup[]>(
    () => [
      { id: 'todo', title: 'To Do', tasks: projectTasks.filter((t) => t.status === 'todo') },
      {
        id: 'in-progress',
        title: 'In Progress',
        tasks: projectTasks.filter((t) => t.status === 'in_progress')
      },
      { id: 'done', title: 'Done', tasks: projectTasks.filter((t) => t.status === 'done') }
    ],
    [projectTasks]
  )

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Select a project from the sidebar.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between px-6">
        <h2 className="text-base font-semibold text-zinc-100">
          {project.emoji || '#'} {project.name}
        </h2>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-white/[0.03] p-0.5">
            <button
              className={cn(
                'h-6 rounded px-3 text-sm transition-colors',
                projectTab === 'list'
                  ? 'bg-white/[0.08] text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
              onClick={() => setProjectTab('list')}
              type="button"
            >
              List
            </button>
            <button
              className={cn(
                'h-6 rounded px-3 text-sm transition-colors',
                projectTab === 'kanban'
                  ? 'bg-white/[0.08] text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
              onClick={() => setProjectTab('kanban')}
              type="button"
            >
              Board
            </button>
          </div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
            onClick={() => props.onEditProject(project)}
            title="Edit project"
            type="button"
          >
            <Pencil size={15} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {projectTab === 'list' ? (
          <TaskList
            emptyStateDescription="Use the + button above to add tasks."
            emptyStateTitle="No tasks"
            groups={groupedTasks}
            labels={labels}
            onOpenTask={openEditPanel}
            onToggleComplete={toggleTaskComplete}
            projects={projects}
          />
        ) : (
          <KanbanBoard
            labels={labels}
            onOpenTask={openEditPanel}
            projectId={project.id}
            tasks={projectTasks}
          />
        )}
      </div>
    </div>
  )
}
