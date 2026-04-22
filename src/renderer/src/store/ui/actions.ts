import { getCreatePanelDefaults } from '../shared/utils'
import type { UiActions, UiStoreGet, UiStoreSet } from '../shared/types'

const createViewSelector =
  (
    set: UiStoreSet,
    selectedView: 'inbox' | 'today' | 'activity' | 'sessions' | 'settings' | 'health'
  ) =>
  (): void =>
    set({ selectedView, selectedProjectId: undefined })

export const createUiActions = (set: UiStoreSet, get: UiStoreGet): UiActions => ({
  selectInbox: createViewSelector(set, 'inbox'),
  selectToday: createViewSelector(set, 'today'),
  selectActivity: createViewSelector(set, 'activity'),
  selectSessions: createViewSelector(set, 'sessions'),
  selectSettings: createViewSelector(set, 'settings'),
  selectHealth: createViewSelector(set, 'health'),
  selectProject: (projectId) => set({ selectedView: 'project', selectedProjectId: projectId }),
  setProjectTab: (projectTab) =>
    set((state) => (state.projectTab === projectTab ? state : { projectTab })),
  setSearchQuery: (searchQuery) =>
    set((state) => (state.searchQuery === searchQuery ? state : { searchQuery })),
  setSortMode: (sortMode) => set((state) => (state.sortMode === sortMode ? state : { sortMode })),
  setShowCompleted: (showCompleted) =>
    set((state) => (state.showCompleted === showCompleted ? state : { showCompleted })),
  triggerSearchFocus: () => set((state) => ({ searchFocusSignal: state.searchFocusSignal + 1 })),
  openCreatePanel: (defaults = {}) => set({ taskPanel: { open: true, mode: 'create', defaults } }),
  openCreatePanelForCurrentView: () => {
    const { selectedView, selectedProjectId } = get()
    set({
      taskPanel: {
        open: true,
        mode: 'create',
        defaults: getCreatePanelDefaults(selectedView, selectedProjectId)
      }
    })
  },
  openCreateProjectPanel: () => set({ taskPanel: { open: true, mode: 'create_project' } }),
  openEditProjectPanel: (projectId) =>
    set({ taskPanel: { open: true, mode: 'edit_project', projectId } }),
  openEditPanel: (taskId) => set({ taskPanel: { open: true, mode: 'edit', taskId } }),
  closeTaskPanel: () =>
    set((state) => (state.taskPanel.open ? { taskPanel: { open: false } } : state))
})
