import { useMemo } from 'react'
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Pill,
  Settings,
  Sun
} from 'lucide-react'
import useAppStore from '@renderer/store/useAppStore'
import { isTaskDueToday, isTaskInFuture, isTaskOverdue } from '@renderer/utils/task'
import { cn } from '@renderer/utils/cn'
import { useShallow } from 'zustand/react/shallow'
import { NavItem } from '@renderer/components/sidebar/NavItem'
import { ProjectList } from '@renderer/components/sidebar/ProjectList'
import { SidebarFooter } from '@renderer/components/sidebar/SidebarFooter'

interface SidebarProps {
  onOpenProjectPanel: () => void
  onOpenLabelModal: () => void
}

export function Sidebar(props: SidebarProps): React.JSX.Element {
  const {
    tasks,
    projects,
    hasLabels,
    selectedView,
    selectedProjectId,
    isSidebarCollapsed,
    selectInbox,
    selectToday,
    selectActivity,
    selectSessions,
    selectSettings,
    selectHealth,
    selectProject,
    toggleSidebar
  } = useAppStore(
    useShallow((state) => ({
      tasks: state.tasks,
      projects: state.projects,
      hasLabels: state.labels.length > 0,
      selectedView: state.selectedView,
      selectedProjectId: state.selectedProjectId,
      isSidebarCollapsed: state.isSidebarCollapsed,
      selectInbox: state.selectInbox,
      selectToday: state.selectToday,
      selectActivity: state.selectActivity,
      selectSessions: state.selectSessions,
      selectSettings: state.selectSettings,
      selectHealth: state.selectHealth,
      selectProject: state.selectProject,
      toggleSidebar: state.toggleSidebar
    }))
  )

  const { inboxCount, todayCount } = useMemo(() => {
    let inboxCount = 0
    let todayCount = 0

    for (const task of tasks) {
      if (task.completed) continue
      if (!task.projectId && (!task.dueDate || isTaskInFuture(task))) inboxCount += 1
      if (isTaskDueToday(task) || isTaskOverdue(task)) todayCount += 1
    }

    return { inboxCount, todayCount }
  }, [tasks])

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
          active={selectedView === 'health'}
          collapsed={isSidebarCollapsed}
          icon={<Pill size={14} />}
          label="Meds"
          onClick={selectHealth}
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

      <div className="mt-auto px-2 py-2 space-y-0.5">
        <NavItem
          active={selectedView === 'settings'}
          collapsed={isSidebarCollapsed}
          icon={<Settings size={14} />}
          label="Settings"
          onClick={selectSettings}
        />
        {!isSidebarCollapsed && (
          <SidebarFooter hasLabels={hasLabels} onOpenLabelModal={props.onOpenLabelModal} />
        )}
      </div>
    </aside>
  )
}
