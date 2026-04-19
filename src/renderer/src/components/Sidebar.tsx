import { useMemo } from 'react'
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Palette,
  Sun
} from 'lucide-react'
import useAppStore from '@renderer/store/useAppStore'
import { isTaskDueToday, isTaskInFuture, isTaskOverdue } from '@renderer/utils/task'
import { cn } from '@renderer/utils/cn'
import { UI_SCALE_OPTIONS, type UiScale } from '@renderer/types'
import { useShallow } from 'zustand/react/shallow'
import { NavItem } from './sidebar/NavItem'
import { ProjectList } from './sidebar/ProjectList'
import { SidebarFooter } from './sidebar/SidebarFooter'

interface SidebarProps {
  onOpenProjectPanel: () => void
  onOpenLabelModal: () => void
}

export default function Sidebar(props: SidebarProps): React.JSX.Element {
  const {
    tasks,
    projects,
    hasLabels,
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
      hasLabels: state.labels.length > 0,
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
    if (nextScale !== undefined) setUiScale(nextScale)
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

      <ProjectList
        projects={projects}
        selectedProjectId={selectedProjectId}
        isProjectView={selectedView === 'project'}
        collapsed={isSidebarCollapsed}
        onSelect={selectProject}
        onOpenCreatePanel={props.onOpenProjectPanel}
      />

      {!isSidebarCollapsed && (
        <SidebarFooter
          uiScale={uiScale}
          hasLabels={hasLabels}
          onScaleChange={handleScaleChange}
          onOpenLabelModal={props.onOpenLabelModal}
        />
      )}
    </aside>
  )
}
