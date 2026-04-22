import type { UiState } from '../shared/types'

export const createInitialUiState = (): UiState => ({
  selectedView: 'inbox',
  selectedProjectId: undefined,
  taskPanel: { open: false },
  searchQuery: '',
  sortMode: 'priority',
  showCompleted: false,
  inboxStatusFilter: 'all',
  inboxProjectFilter: 'all',
  inboxPriorityFilter: 'all',
  projectTab: 'list',
  searchFocusSignal: 0
})
