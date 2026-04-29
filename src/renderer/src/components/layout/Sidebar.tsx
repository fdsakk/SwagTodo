import * as React from 'react'
import {
  Activity,
  Archive,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Pill,
  Plus,
  Settings,
  Sun
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { NavItem } from '@renderer/components/sidebar/NavItem'
import { ProjectList } from '@renderer/components/sidebar/ProjectList'
import { SidebarFooter as LabelsFooter } from '@renderer/components/sidebar/SidebarFooter'
import { selectInboxCounts, useDomainStore, useUiStore } from '@renderer/store'
import {
  SidebarContent,
  SidebarContext,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  Sidebar as ShadcnSidebar
} from '@renderer/components/ui/sidebar'
import { cn } from '@renderer/utils/cn'

interface SidebarProps {
  onOpenProjectPanel: () => void
  onOpenLabelModal: () => void
}

const COLLAPSED_WIDTH = '56px'
const EXPANDED_WIDTH = '220px'

export function Sidebar(props: SidebarProps): React.JSX.Element {
  const { projects, hasLabels, isSidebarCollapsed, toggleSidebar } = useDomainStore(
    useShallow((state) => ({
      projects: state.projects,
      hasLabels: state.labels.length > 0,
      isSidebarCollapsed: state.isSidebarCollapsed,
      toggleSidebar: state.toggleSidebar
    }))
  )
  const { inboxCount, todayCount } = useDomainStore(useShallow(selectInboxCounts))
  const {
    selectedView,
    selectedProjectId,
    selectInbox,
    selectToday,
    selectActivity,
    selectArchive,
    selectSessions,
    selectSettings,
    selectHealth,
    selectProject
  } = useUiStore(
    useShallow((state) => ({
      selectedView: state.selectedView,
      selectedProjectId: state.selectedProjectId,
      selectInbox: state.selectInbox,
      selectToday: state.selectToday,
      selectActivity: state.selectActivity,
      selectArchive: state.selectArchive,
      selectSessions: state.selectSessions,
      selectSettings: state.selectSettings,
      selectHealth: state.selectHealth,
      selectProject: state.selectProject
    }))
  )

  const open = !isSidebarCollapsed
  const state = open ? 'expanded' : 'collapsed'

  const ctx = React.useMemo(
    () => ({
      isMobile: false,
      open,
      openMobile: false,
      setOpen: () => { },
      setOpenMobile: () => { },
      state: state as 'expanded' | 'collapsed',
      toggleSidebar
    }),
    [open, state, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={ctx}>
      <div
        className="group/sidebar peer flex h-full shrink-0 transition-[width] duration-200 ease-linear"
        data-collapsible="icon"
        data-side="left"
        data-state={state}
        style={
          {
            '--sidebar-width': open ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
            width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH
          } as React.CSSProperties
        }
      >
        <ShadcnSidebar className="bg-app-sidebar! text-app-text!" collapsible="none">
          <SidebarHeader className="flex-row items-center justify-between px-2 py-2">
            {open && <span className="text-xs font-medium text-app-text-muted">Tasks</span>}
            <button
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-app-text-secondary hover:bg-app-hover hover:text-app-text',
                !open && 'mx-auto'
              )}
              onClick={toggleSidebar}
              type="button"
              aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </SidebarHeader>

          <SidebarContent className="px-0">
            <SidebarGroup className="py-0">
              <SidebarMenu className="gap-0.5">
                <NavItem
                  active={selectedView === 'inbox'}
                  collapsed={!open}
                  count={inboxCount}
                  icon={<Inbox size={14} />}
                  label="Inbox"
                  onClick={selectInbox}
                />
                <NavItem
                  active={selectedView === 'today'}
                  collapsed={!open}
                  count={todayCount}
                  icon={<Sun size={14} />}
                  label="Today"
                  onClick={selectToday}
                />
                <NavItem
                  active={selectedView === 'activity'}
                  collapsed={!open}
                  icon={<Activity size={14} />}
                  label="Activity"
                  onClick={selectActivity}
                />
                <NavItem
                  active={selectedView === 'archive'}
                  collapsed={!open}
                  icon={<Archive size={14} />}
                  label="Archive"
                  onClick={selectArchive}
                />
                <NavItem
                  active={selectedView === 'sessions'}
                  collapsed={!open}
                  icon={<Calendar size={14} />}
                  label="Sessions"
                  onClick={selectSessions}
                />
                <NavItem
                  active={selectedView === 'health'}
                  collapsed={!open}
                  icon={<Pill size={14} />}
                  label="Meds"
                  onClick={selectHealth}
                />
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="flex-1 py-0">
              {open && (
                <>
                  <SidebarGroupLabel className="px-4 text-[11px] text-app-text-muted">
                    Projects
                  </SidebarGroupLabel>
                  <SidebarGroupAction
                    onClick={props.onOpenProjectPanel}
                    aria-label="New project"
                    className="text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
                  >
                    <Plus />
                  </SidebarGroupAction>
                </>
              )}
              <ProjectList
                projects={projects}
                selectedProjectId={selectedProjectId}
                isProjectView={selectedView === 'project'}
                collapsed={!open}
                onSelect={selectProject}
                onOpenCreatePanel={props.onOpenProjectPanel}
              />
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="px-2 py-2 gap-0.5">
            <SidebarMenu className="gap-0.5">
              <NavItem
                active={selectedView === 'settings'}
                collapsed={!open}
                icon={<Settings size={14} />}
                label="Settings"
                onClick={selectSettings}
              />
              {open && (
                <LabelsFooter hasLabels={hasLabels} onOpenLabelModal={props.onOpenLabelModal} />
              )}
            </SidebarMenu>
          </SidebarFooter>
        </ShadcnSidebar>
      </div>
    </SidebarContext.Provider>
  )
}
