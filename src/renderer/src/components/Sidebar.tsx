import { useMemo } from 'react'
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Hash,
  Inbox,
  Palette,
  Plus,
  Sun,
  ZoomIn
} from 'lucide-react'
import useAppStore from '@renderer/store/useAppStore'
import { isTaskDueToday, isTaskInFuture, isTaskOverdue } from '@renderer/utils/task'
import { cn } from '@renderer/utils/cn'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { UI_SCALE_OPTIONS, type UiScale } from '@renderer/types'
import { useShallow } from 'zustand/react/shallow'

interface SidebarProps {
  onOpenProjectPanel: () => void
  onOpenLabelModal: () => void
}

function NavItem({
  icon,
  label,
  count,
  active,
  collapsed,
  onClick
}: {
  icon: React.ReactNode
  label: string
  count?: number
  active?: boolean
  collapsed: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      className={cn(
        'flex h-8 w-full items-center rounded-md px-2 text-sm transition-colors',
        active
          ? 'bg-app-active text-app-text'
          : 'text-app-text-secondary hover:bg-app-hover hover:text-app-text',
        collapsed && 'justify-center px-0'
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      {!collapsed && (
        <>
          <span className="ml-2.5 flex-1 text-left">{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span className="text-xs text-zinc-500">{count}</span>
          )}
        </>
      )}
    </button>
  )
}

export default function Sidebar(props: SidebarProps): React.JSX.Element {
  const {
    tasks,
    projects,
    labels,
    selectedView,
    selectedProjectId,
    isSidebarCollapsed,
    uiScale,
    selectInbox,
    selectToday,
    selectActivity,
    selectSessions,
    selectSettings,
    selectProject,
    setUiScale,
    toggleSidebar
  } = useAppStore(
    useShallow((state) => ({
      tasks: state.tasks,
      projects: state.projects,
      labels: state.labels,
      selectedView: state.selectedView,
      selectedProjectId: state.selectedProjectId,
      isSidebarCollapsed: state.isSidebarCollapsed,
      uiScale: state.uiScale,
      selectInbox: state.selectInbox,
      selectToday: state.selectToday,
      selectActivity: state.selectActivity,
      selectSessions: state.selectSessions,
      selectSettings: state.selectSettings,
      selectProject: state.selectProject,
      setUiScale: state.setUiScale,
      toggleSidebar: state.toggleSidebar
    }))
  )

  const inboxCount = useMemo(
    () =>
      tasks.filter(
        (task) => !task.projectId && !task.completed && (!task.dueDate || isTaskInFuture(task))
      ).length,
    [tasks]
  )

  const todayCount = useMemo(
    () =>
      tasks.filter((task) => !task.completed && (isTaskDueToday(task) || isTaskOverdue(task)))
        .length,
    [tasks]
  )

  const handleScaleChange = (value: string): void => {
    const nextScale = UI_SCALE_OPTIONS.find((scale): scale is UiScale => String(scale) === value)
    if (nextScale !== undefined) {
      setUiScale(nextScale)
    }
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-app-sidebar transition-all duration-200 overflow-hidden',
        isSidebarCollapsed ? 'w-[56px]' : 'w-[220px]'
      )}
    >
      <div
        className={cn(
          'flex h-12 items-center px-2',
          isSidebarCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isSidebarCollapsed && (
          <span className="text-xs font-medium text-app-text-muted">Tasks</span>
        )}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-app-text-secondary hover:bg-app-hover hover:text-app-text"
          onClick={toggleSidebar}
          type="button"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="space-y-0.5 px-2">
        <NavItem
          active={selectedView === 'inbox'}
          collapsed={isSidebarCollapsed}
          count={inboxCount}
          icon={<Inbox size={14} />}
          label="Inbox"
          onClick={selectInbox}
        />
        <NavItem
          active={selectedView === 'today'}
          collapsed={isSidebarCollapsed}
          count={todayCount}
          icon={<Sun size={14} />}
          label="Today"
          onClick={selectToday}
        />
        <NavItem
          active={selectedView === 'activity'}
          collapsed={isSidebarCollapsed}
          icon={<Activity size={14} />}
          label="Activity"
          onClick={selectActivity}
        />
        <NavItem
          active={selectedView === 'sessions'}
          collapsed={isSidebarCollapsed}
          icon={<Calendar size={14} />}
          label="Sessions"
          onClick={selectSessions}
        />
        <NavItem
          active={selectedView === 'settings'}
          collapsed={isSidebarCollapsed}
          icon={<Palette size={14} />}
          label="Appearance"
          onClick={selectSettings}
        />
      </div>

      <div className="mt-6 flex-1 overflow-x-hidden overflow-y-auto px-2">
        {!isSidebarCollapsed && (
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-medium text-app-text-muted">Projects</span>
            <button
              className="flex h-5 w-5 items-center justify-center rounded text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
              onClick={props.onOpenProjectPanel}
              type="button"
            >
              <Plus size={12} />
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {projects.map((project) => {
            const active = selectedView === 'project' && selectedProjectId === project.id
            return (
              <button
                className={cn(
                  'flex h-8 w-full items-center rounded-md px-2 text-sm transition-colors',
                  active
                    ? 'bg-app-active text-app-text'
                    : 'text-app-text-secondary hover:bg-app-hover hover:text-app-text',
                  isSidebarCollapsed && 'justify-center px-0'
                )}
                key={project.id}
                onClick={() => selectProject(project.id)}
                type="button"
              >
                <span className="flex h-4 w-4 items-center justify-center text-xs">
                  {project.emoji || '#'}
                </span>
                {!isSidebarCollapsed && (
                  <span className="ml-2 flex-1 truncate text-left">{project.name}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {!isSidebarCollapsed && (
        <div className="px-2 py-2 space-y-0.5 overflow-hidden">
          <div className="flex h-8 w-full items-center rounded-md px-2 text-sm text-app-text-secondary gap-2 whitespace-nowrap">
            <span className="flex h-4 w-4 items-center justify-center">
              <ZoomIn size={13} />
            </span>
            <span className="text-left text-[0.8rem] ">UI scale</span>
            <Select onValueChange={handleScaleChange} value={String(uiScale)}>
              <SelectTrigger className="h-6 w-20 border-app-border pl-4 pr-2 bg-app-hover text-[0.8rem] text-app-text-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UI_SCALE_OPTIONS.map((scale) => (
                  <SelectItem className="text-[0.8rem]" key={scale} value={String(scale)}>
                    {scale}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {labels.length > 0 && (
            <button
              className="flex h-8 w-full items-center rounded-md px-2 text-sm text-app-text-secondary hover:bg-app-hover hover:text-app-text"
              onClick={props.onOpenLabelModal}
              type="button"
            >
              <span className="flex h-4 w-4 items-center justify-center">
                <Hash size={14} />
              </span>
              <span className="ml-2.5">Manage labels</span>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
