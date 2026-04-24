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
import ArchivePage from '@renderer/pages/ArchivePage'
import ProjectPage from '@renderer/pages/ProjectPage'
import SessionsPage from '@renderer/pages/SessionsPage'
import SettingsPage from '@renderer/pages/SettingsPage'
import { HealthPage } from '@renderer/pages/HealthPage'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'
import { useShallow } from 'zustand/react/shallow'
import { UI_SCALE_OPTIONS } from '@renderer/types'
import { useDomainStore, useUiStore } from '@renderer/store'
import { cn } from '@renderer/utils/cn'

function App(): React.JSX.Element {
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const windowApi = window.api?.window
    if (!windowApi) return
    void windowApi.getState().then((state) => setIsFullScreen(state.isFullScreen))
    return windowApi.onStateChange((state) => setIsFullScreen(state.isFullScreen))
  }, [])

  const {
    selectedView,
    actions: {
      closeTaskPanel,
      openCreatePanelForCurrentView,
      openCreateProjectPanel,
      openEditProjectPanel,
      triggerSearchFocus,
      selectInbox,
      selectToday,
      selectActivity,
      selectArchive,
      selectSessions,
      selectSettings,
      selectHealth,
      selectProject,
      setProjectTab
    }
  } = useUiStore(
    useShallow((state) => ({
      selectedView: state.selectedView,
      actions: state.actions
    }))
  )
  const {
    hydrated,
    uiScale,
    labels,
    projects,
    actions: { addLabel, updateLabel, deleteLabel, toggleSidebar, setUiScale }
  } = useDomainStore(
    useShallow((state) => ({
      hydrated: state.hydrated,
      uiScale: state.uiScale,
      labels: state.labels,
      projects: state.projects,
      actions: state.actions
    }))
  )

  const [labelModalOpen, setLabelModalOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [projectPickerOpen, setProjectPickerOpen] = useState(false)

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
    onGoArchive: selectArchive,
    onGoHealth: selectHealth,
    onGoSessions: selectSessions,
    onGoSettings: selectSettings,
    onGoProjects: () => setProjectPickerOpen(true),
    onProjectTabList: () => setProjectTab('list'),
    onProjectTabKanban: () => setProjectTab('kanban'),
    onZoomIn: () => {
      const idx = UI_SCALE_OPTIONS.indexOf(uiScale)
      if (idx < UI_SCALE_OPTIONS.length - 1) setUiScale(UI_SCALE_OPTIONS[idx + 1])
    },
    onZoomOut: () => {
      const idx = UI_SCALE_OPTIONS.indexOf(uiScale)
      if (idx > 0) setUiScale(UI_SCALE_OPTIONS[idx - 1])
    },
    onZoomReset: () => setUiScale(100)
  })

  if (!hydrated) {
    return (
      <div
        className={cn(
          'flex h-full flex-col overflow-hidden bg-[#070708] px-[2px] pb-[2px] ring-1 ring-white/5',
          !isFullScreen && 'rounded-lg'
        )}
      >
        <TitleBar />
        <div
          className={cn(
            'flex flex-1 items-center justify-center overflow-hidden bg-app-bg text-sm text-app-text-muted',
            !isFullScreen && 'rounded-b-[10px]'
          )}
        >
          Loading workspace...
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden bg-app-titlebar px-1.5 pb-1.5',
        !isFullScreen && 'rounded-lg'
      )}
    >
      <ThemeProvider />
      <TitleBar />
      <div
        className={cn(
          'relative flex min-h-0 flex-1 overflow-hidden bg-app-bg',
          !isFullScreen && 'rounded-lg'
        )}
      >
        <Sidebar
          onOpenLabelModal={() => setLabelModalOpen(true)}
          onOpenProjectPanel={openCreateProjectPanel}
        />

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-app-content">
          {selectedView !== 'sessions' &&
            selectedView !== 'settings' &&
            selectedView !== 'health' && <SearchSortBar />}
          <div
            className={cn(
              'min-h-0 flex-1',
              selectedView === 'sessions' ||
                selectedView === 'settings' ||
                selectedView === 'health'
                ? 'overflow-y-auto'
                : 'mt-4'
            )}
          >
            {selectedView === 'inbox' && <InboxPage />}
            {selectedView === 'today' && <TodayPage />}
            {selectedView === 'activity' && <ActivityPage />}
            {selectedView === 'archive' && <ArchivePage />}
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
