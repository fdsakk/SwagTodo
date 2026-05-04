import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@renderer/components/ui/sidebar"
import type { Project } from "@renderer/types"
import { cn } from "@renderer/utils/cn"

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
  onSelect
}: ProjectListProps): React.JSX.Element {
  return (
    <SidebarGroupContent className="overflow-x-hidden overflow-y-auto">
      <SidebarMenu className="gap-0.5">
        {projects.map((project) => {
          const active = isProjectView && selectedProjectId === project.id
          return (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton
                className={cn(
                  "h-8 px-2 text-sm transition-colors duration-150",
                  active
                    ? "bg-app-active text-app-text data-[active=true]:bg-app-active data-[active=true]:text-app-text"
                    : "text-app-text-secondary hover:bg-app-hover hover:!text-app-text",
                  collapsed && "justify-center px-0"
                )}
                isActive={active}
                onClick={() => onSelect(project.id)}
                tooltip={collapsed ? project.name : undefined}
              >
                <span className="flex h-4 w-4 items-center justify-center text-xs">
                  {project.emoji || "#"}
                </span>
                {!collapsed && (
                  <span className="flex-1 truncate text-left">
                    {project.name}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  )
}
