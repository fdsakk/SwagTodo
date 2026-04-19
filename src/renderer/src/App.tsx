import { useEffect, useState } from 'react'
import { TitleBar, Sidebar, SearchSortBar, ThemeProvider } from '@renderer/components/layout'
import { TaskDetailPanel } from '@renderer/components/task-panel'
import {
  LabelManagerModal,
  ShortcutsHelpModal,
  ProjectPickerModal
} from '@renderer/components/modals'
import InboxPage from '@renderer/pages/InboxPage'
import TodayPage from '@renderer/pages/TodayPage'
import ActivityPage from '@renderer/pages/ActivityPage'
import ProjectPage from '@renderer/pages/ProjectPage'
import SessionsPage from '@renderer/pages/SessionsPage'
import SettingsPage from '@renderer/pages/SettingsPage'
import { HealthPage } from '@renderer/pages/HealthPage'
import useAppStore from '@renderer/store/useAppStore'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'
import { useShallow } from 'zustand/react/shallow'

function App(): React.JSX.Element {
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const windowApi = window.api?.window
    if (!windowApi) return
    void windowApi.getState().then((state) => setIsFullScreen(state.isFullScreen))
    return windowApi.onStateChange((state) => setIsFullScreen(state.isFullScreen))
  }, [])

  const {
    hydrated,
    selectedView,
    hydrate,
    closeTaskPanel,
    openCreatePanelForCurrentView,
    openCreateProjectPanel,
    openEditProjectPanel,
    triggerSearchFocus,
    uiScale,
    labels,
    addLabel,
    updateLabel,
    deleteLabel,
    selectInbox,
    selectToday,
    selectActivity,
    selectSessions,
    selectSettings,
    selectProject,
    projects,
    toggleSidebar,
    setProjectTab
  } = useAppStore(
    useShallow((state) => ({
      hydrated: state.hydrated,
      selectedView: state.selectedView,
      hydrate: state.hydrate,
      closeTaskPanel: state.closeTaskPanel,
      openCreatePanelForCurrentView: state.openCreatePanelForCurrentView,
      openCreateProjectPanel: state.openCreateProjectPanel,
      openEditProjectPanel: state.openEditProjectPanel,
      triggerSearchFocus: state.triggerSearchFocus,
      uiScale: state.uiScale,
      labels: state.labels,
      addLabel: state.addLabel,
      updateLabel: state.updateLabel,
      deleteLabel: state.deleteLabel,
      selectInbox: state.selectInbox,
      selectToday: state.selectToday,
      selectActivity: state.selectActivity,
      selectSessions: state.selectSessions,
      selectSettings: state.selectSettings,
      selectProject: state.selectProject,
      projects: state.projects,
      toggleSidebar: state.toggleSidebar,
      setProjectTab: state.setProjectTab
    }))
  )

  const [labelModalOpen, setLabelModalOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [projectPickerOpen, setProjectPickerOpen] = useState(false)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydrated || !window.api?.ui) return
    void window.api.ui.setZoomFactor(uiScale / 100)
  }, [hydrated, uiScale])

  useKeyboardShortcuts({
    onEscape: () => {
      if (projectPickerOpen) setProjectPickerOpen(false)
      else if (helpOpen) setHelpOpen(false)
      else if (labelModalOpen) setLabelModalOpen(false)
      else closeTaskPanel()
    },
    onFocusSearch: triggerSearchFocus,
    onNewTask: openCreatePanelForCurrentView,
    onNewProject: openCreateProjectPanel,
    onOpenLabels: () => setLabelModalOpen(true),
    onShowHelp: () => setHelpOpen((v) => !v),
    onToggleSidebar: toggleSidebar,
    onGoInbox: selectInbox,
    onGoToday: selectToday,
    onGoActivity: selectActivity,
    onGoSessions: selectSessions,
    onGoSettings: selectSettings,
    onGoProjects: () => setProjectPickerOpen(true),
    onProjectTabList: () => setProjectTab('list'),
    onProjectTabKanban: () => setProjectTab('kanban')
  })

  if (!hydrated) {
    return (
      <div className={`flex h-full flex-col overflow-hidden bg-[#070708] px-[2px] pb-[2px] ring-1 ring-white/5${isFullScreen ? '' : ' rounded-xl'}`}>
        <TitleBar />
        <div className={`flex flex-1 items-center justify-center overflow-hidden bg-app-bg text-sm text-app-text-muted${isFullScreen ? '' : ' rounded-b-[10px]'}`}>
          Loading workspace...
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-full flex-col overflow-hidden bg-app-titlebar px-2 pb-2${isFullScreen ? '' : ' rounded-xl'}`}>
      <ThemeProvider />
      <TitleBar />
      <div className={`relative flex min-h-0 flex-1 overflow-hidden bg-app-bg${isFullScreen ? '' : ' rounded-lg'}`}>
        <Sidebar
          onOpenLabelModal={() => setLabelModalOpen(true)}
          onOpenProjectPanel={openCreateProjectPanel}
        />

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-app-content">
          {selectedView !== 'sessions' &&
            selectedView !== 'settings' &&
            selectedView !== 'health' && <SearchSortBar />}
          <div
            className={
              selectedView === 'sessions' ||
              selectedView === 'settings' ||
              selectedView === 'health'
                ? 'min-h-0 flex-1 overflow-y-auto'
                : 'min-h-0 flex-1 mt-4'
            }
          >
            {selectedView === 'inbox' && <InboxPage />}
            {selectedView === 'today' && <TodayPage />}
            {selectedView === 'activity' && <ActivityPage />}
            {selectedView === 'sessions' && <SessionsPage />}
            {selectedView === 'settings' && <SettingsPage />}
            {selectedView === 'health' && <HealthPage />}
            {selectedView === 'project' && (
              <ProjectPage onEditProject={(project) => openEditProjectPanel(project.id)} />
            )}
          </div>
        </div>

        <TaskDetailPanel onClose={closeTaskPanel} />
      </div>

      <button
        type="button"
        onClick={() => setHelpOpen((v) => !v)}
        className="absolute bottom-1 right-1 z-10 flex items-center gap-1.5 rounded-ss-xl bg-app-titlebar px-2 py-1.5 text-[10px] text-app-text-muted hover:text-app-text-secondary transition-colors"
        title="Show keyboard shortcuts"
      >
        <span>Help</span>
        <kbd className="rounded border border-app-border bg-app-hover px-1 font-mono text-[9px] text-app-text-secondary">
          ?
        </kbd>
      </button>

      <ShortcutsHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ProjectPickerModal
        open={projectPickerOpen}
        projects={projects}
        onClose={() => setProjectPickerOpen(false)}
        onSelect={selectProject}
      />

      <LabelManagerModal
        labels={labels}
        onClose={() => setLabelModalOpen(false)}
        onCreate={addLabel}
        onDelete={deleteLabel}
        onUpdate={updateLabel}
        open={labelModalOpen}
      />
    </div>
  )
}

export default App
