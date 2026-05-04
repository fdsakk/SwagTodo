import {
  SearchSortBar,
  Sidebar,
  ThemeProvider,
  TitleBar
} from "@renderer/components/layout"
import {
  LabelManagerModal,
  ProjectPickerModal,
  ShortcutsHelpModal
} from "@renderer/components/modals"
import { TaskDetailPanel } from "@renderer/components/task-panel"
import { useKeyboardShortcuts } from "@renderer/hooks/useKeyboardShortcuts"
import InboxPage from "@renderer/pages/InboxPage"
import TodayPage from "@renderer/pages/TodayPage"
import { useDomainStore, useUiStore } from "@renderer/store"
import { UI_SCALE_OPTIONS, type ViewName } from "@renderer/types"
import { cn } from "@renderer/utils/cn"
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"

const FULL_HEIGHT_VIEWS = new Set<ViewName>(["sessions", "settings", "health"])
const ActivityPage = lazy(() => import("@renderer/pages/ActivityPage"))
const ArchivePage = lazy(() => import("@renderer/pages/ArchivePage"))
const HealthPage = lazy(() =>
  import("@renderer/pages/HealthPage").then((module) => ({
    default: module.HealthPage
  }))
)
const ProjectPage = lazy(() => import("@renderer/pages/ProjectPage"))
const SessionsPage = lazy(() => import("@renderer/pages/SessionsPage"))
const SettingsPage = lazy(() => import("@renderer/pages/SettingsPage"))

function ViewFallback(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center text-sm text-app-text-muted">
      Loading view...
    </div>
  )
}

function App(): React.JSX.Element {
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const windowApi = window.api?.window
    if (!windowApi) return
    void windowApi
      .getState()
      .then((state) => setIsFullScreen(state.isFullScreen))
    return windowApi.onStateChange((state) =>
      setIsFullScreen(state.isFullScreen)
    )
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-overlay-top",
      isFullScreen ? "0px" : "1.75rem"
    )
  }, [isFullScreen])

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

  const contentRef = useRef<HTMLDivElement>(null)
  const focusContent = useCallback((): void => {
    contentRef.current?.focus({ preventScroll: true })
  }, [])

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
      focusContent()
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
    onProjectTabList: () => setProjectTab("list"),
    onProjectTabKanban: () => setProjectTab("kanban"),
    onZoomIn: () => {
      const idx = UI_SCALE_OPTIONS.indexOf(uiScale)
      if (idx < UI_SCALE_OPTIONS.length - 1)
        setUiScale(UI_SCALE_OPTIONS[idx + 1])
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
          "flex h-full flex-col overflow-hidden bg-[#070708] px-[2px] pb-[2px] ring-1 ring-white/5",
          !isFullScreen && "rounded-md"
        )}
      >
        <TitleBar />
        <div
          className={cn(
            "flex flex-1 items-center justify-center overflow-hidden bg-app-bg text-sm text-app-text-muted",
            !isFullScreen && "rounded-md"
          )}
        >
          Loading workspace...
        </div>
      </div>
    )
  }

  const viewContent: Record<ViewName, React.JSX.Element> = {
    inbox: <InboxPage />,
    today: <TodayPage />,
    activity: <ActivityPage />,
    archive: <ArchivePage />,
    sessions: <SessionsPage />,
    settings: <SettingsPage />,
    health: <HealthPage />, 
    project: (
      <ProjectPage
        onEditProject={(project) => openEditProjectPanel(project.id)}
      />
    )
  }
  const isFullHeightView = FULL_HEIGHT_VIEWS.has(selectedView)

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-app-titlebar px-1.5 pb-1.5",
        !isFullScreen && "rounded-md"
      )}
    >
      <ThemeProvider />
      <TitleBar />
      <div
        className={cn(
          "relative flex min-h-0 flex-1 overflow-hidden bg-app-bg",
          !isFullScreen && "rounded-md"
        )}
      >
        <Sidebar
          onOpenLabelModal={() => setLabelModalOpen(true)}
          onOpenProjectPanel={openCreateProjectPanel}
        />

        <div
          ref={contentRef}
          tabIndex={-1}
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-app-content outline-none"
        >
          {!isFullHeightView && <SearchSortBar />}
          <div
            className={cn(
              "min-h-0 flex-1",
              isFullHeightView ? "overflow-y-auto" : "mt-4"
            )}
          >
            <Suspense fallback={<ViewFallback />}>
              {viewContent[selectedView]}
            </Suspense>
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
