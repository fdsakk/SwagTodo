import { useEffect, useMemo } from 'react'
import { Pencil } from 'lucide-react'
import { KanbanBoard } from '@renderer/components/kanban'
import { TaskList } from '@renderer/components/task-list'
import type { Project } from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import { useShallow } from 'zustand/react/shallow'
import { useTaskComplete } from '@renderer/hooks/useTaskComplete'
import {
  selectProjectById,
  selectProjectTaskGroups,
  selectTasksForProject,
  useDomainStore,
  useUiStore
} from '@renderer/store'

interface ProjectPageProps {
  onEditProject: (project: Project) => void
}

export default function ProjectPage(props: ProjectPageProps): React.JSX.Element {
  const { tasks, projects, labels } = useDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      projects: state.projects,
      labels: state.labels
    }))
  )
  const {
    selectedProjectId,
    projectTab,
    setProjectTab,
    openEditPanel,
    selectInbox,
    searchQuery,
    sortMode,
    showCompleted,
    selectedView
  } = useUiStore(
    useShallow((state) => ({
      selectedProjectId: state.selectedProjectId,
      projectTab: state.projectTab,
      setProjectTab: state.setProjectTab,
      openEditPanel: state.openEditPanel,
      selectInbox: state.selectInbox,
      searchQuery: state.searchQuery,
      sortMode: state.sortMode,
      showCompleted: state.showCompleted,
      selectedView: state.selectedView
    }))
  )
  const toggleTaskComplete = useTaskComplete()

  const project = useDomainStore((state) => selectProjectById(state, selectedProjectId))

  const projectTasks = useMemo(
    () =>
      selectTasksForProject({ tasks }, selectedProjectId, {
        searchQuery,
        sortMode,
        showCompleted,
        selectedView
      }),
    [tasks, searchQuery, selectedProjectId, selectedView, showCompleted, sortMode]
  )

  useEffect(() => {
    if (selectedProjectId && !project) selectInbox()
  }, [project, selectInbox, selectedProjectId])

  const groupedTasks = useMemo(
    () =>
      selectedProjectId
        ? selectProjectTaskGroups({ tasks }, selectedProjectId, {
            searchQuery,
            sortMode,
            showCompleted,
            selectedView
          })
        : [],
    [tasks, searchQuery, selectedProjectId, selectedView, showCompleted, sortMode]
  )

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-app-text-muted">
        Select a project from the sidebar.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between px-6">
        <h2 className="text-base font-semibold text-app-text">
          {project.emoji || '#'} {project.name}
        </h2>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-app-hover p-0.5">
            <button
              className={cn(
                'h-6 rounded px-3 text-sm transition-colors',
                projectTab === 'list'
                  ? 'bg-app-active text-app-text'
                  : 'text-app-text-muted hover:text-app-text-secondary'
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
                  ? 'bg-app-active text-app-text'
                  : 'text-app-text-muted hover:text-app-text-secondary'
              )}
              onClick={() => setProjectTab('kanban')}
              type="button"
            >
              Board
            </button>
          </div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
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
