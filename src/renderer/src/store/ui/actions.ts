import type {
  UiActions,
  UiState,
  UiStoreGet,
  UiStoreSet
} from "../shared/types"
import { getCreatePanelDefaults } from "../shared/utils"

const createViewSelector =
  (
    set: UiStoreSet,
    selectedView:
      | "inbox"
      | "today"
      | "activity"
      | "sessions"
      | "settings"
      | "health"
      | "archive"
      | "upcoming"
      | "stats"
  ) =>
  (): void =>
    set({
      selectedView,
      selectedProjectId: undefined,
      selectedTaskIds: [],
      selectionAnchorId: undefined
    })

export const createUiActions = (
  set: UiStoreSet,
  get: UiStoreGet
): UiActions => ({
  selectInbox: createViewSelector(set, "inbox"),
  selectToday: createViewSelector(set, "today"),
  selectActivity: createViewSelector(set, "activity"),
  selectSessions: createViewSelector(set, "sessions"),
  selectSettings: createViewSelector(set, "settings"),
  selectHealth: createViewSelector(set, "health"),
  selectArchive: createViewSelector(set, "archive"),
  selectUpcoming: createViewSelector(set, "upcoming"),
  selectStats: createViewSelector(set, "stats"),
  applySavedView: (view) =>
    set({
      selectedView: "inbox",
      selectedProjectId: undefined,
      searchQuery: view.query,
      inboxStatusFilter: view.status,
      inboxProjectFilter: view.projectId,
      inboxPriorityFilter: view.priority as UiState["inboxPriorityFilter"],
      selectedTaskIds: [],
      selectionAnchorId: undefined
    }),
  setSelectedTaskIds: (selectedTaskIds, selectionAnchorId) =>
    set({ selectedTaskIds, selectionAnchorId }),
  toggleTaskSelection: (id) =>
    set((state) => ({
      selectedTaskIds: state.selectedTaskIds.includes(id)
        ? state.selectedTaskIds.filter((current) => current !== id)
        : [...state.selectedTaskIds, id],
      selectionAnchorId: id
    })),
  clearSelection: () =>
    set((state) =>
      state.selectedTaskIds.length === 0 && !state.selectionAnchorId
        ? state
        : { selectedTaskIds: [], selectionAnchorId: undefined }
    ),
  startTimer: (activeTimer) => set({ activeTimer }),
  stopTimer: () =>
    set((state) => (state.activeTimer ? { activeTimer: undefined } : state)),
  setQuickAddOpen: (quickAddOpen) => set({ quickAddOpen }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  selectProject: (projectId) =>
    set({
      selectedView: "project",
      selectedProjectId: projectId,
      selectedTaskIds: [],
      selectionAnchorId: undefined
    }),
  setProjectTab: (projectTab) =>
    set((state) => (state.projectTab === projectTab ? state : { projectTab })),
  setSearchQuery: (searchQuery) =>
    set((state) =>
      state.searchQuery === searchQuery ? state : { searchQuery }
    ),
  setSortMode: (sortMode) =>
    set((state) => (state.sortMode === sortMode ? state : { sortMode })),
  setShowCompleted: (showCompleted) =>
    set((state) =>
      state.showCompleted === showCompleted ? state : { showCompleted }
    ),
  setInboxStatusFilter: (inboxStatusFilter) =>
    set((state) =>
      state.inboxStatusFilter === inboxStatusFilter
        ? state
        : { inboxStatusFilter }
    ),
  setInboxProjectFilter: (inboxProjectFilter) =>
    set((state) =>
      state.inboxProjectFilter === inboxProjectFilter
        ? state
        : { inboxProjectFilter }
    ),
  setInboxPriorityFilter: (inboxPriorityFilter) =>
    set((state) =>
      state.inboxPriorityFilter === inboxPriorityFilter
        ? state
        : { inboxPriorityFilter }
    ),
  triggerSearchFocus: () =>
    set((state) => ({ searchFocusSignal: state.searchFocusSignal + 1 })),
  openCreatePanel: (defaults = {}) =>
    set({ taskPanel: { open: true, mode: "create", defaults } }),
  openCreatePanelForCurrentView: () => {
    const { selectedView, selectedProjectId } = get()
    set({
      taskPanel: {
        open: true,
        mode: "create",
        defaults: getCreatePanelDefaults(selectedView, selectedProjectId)
      }
    })
  },
  openCreateProjectPanel: () =>
    set({ taskPanel: { open: true, mode: "create_project" } }),
  openEditProjectPanel: (projectId) =>
    set({ taskPanel: { open: true, mode: "edit_project", projectId } }),
  openEditPanel: (taskId) =>
    set({ taskPanel: { open: true, mode: "edit", taskId } }),
  closeTaskPanel: () =>
    set((state) =>
      state.taskPanel.open ? { taskPanel: { open: false } } : state
    )
})
