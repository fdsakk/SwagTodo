import type { Project } from '@renderer/types'
import { cn } from '@renderer/utils/cn'

interface ProjectListProps {
  projects: Project[]
  selectedProjectId: string | undefined
  isProjectView: boolean
  collapsed: boolean
  onSelect: (projectId: string) => void
  onOpenCreatePanel: () => void
}

export function ProjectList({
  projects,
  selectedProjectId,
  isProjectView,
  collapsed,
  onSelect,
  onOpenCreatePanel
}: ProjectListProps): React.JSX.Element {
  return (
    <div className="mt-6 flex-1 overflow-x-hidden overflow-y-auto px-2">
      {!collapsed && (
        <div className="mb-1 flex items-center justify-between px-2 py-1">
          <span className="text-[11px] font-medium text-app-text-muted">Projects</span>
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
            onClick={onOpenCreatePanel}
            type="button"
          >
            <span className="text-xs leading-none">+</span>
          </button>
        </div>
      )}
      <div className="space-y-0.5">
        {projects.map((project) => {
          const active = isProjectView && selectedProjectId === project.id
          return (
            <button
              className={cn(
                'flex h-8 w-full items-center rounded-md px-2 text-sm transition-colors',
                active
                  ? 'bg-app-active text-app-text'
                  : 'text-app-text-secondary hover:bg-app-hover hover:text-app-text',
                collapsed && 'justify-center px-0'
              )}
              key={project.id}
              onClick={() => onSelect(project.id)}
              type="button"
            >
              <span className="flex h-4 w-4 items-center justify-center text-xs">
                {project.emoji || '#'}
              </span>
              {!collapsed && (
                <span className="ml-2 flex-1 truncate text-left">{project.name}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
