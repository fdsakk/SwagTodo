import type { StoreApi } from 'zustand'
import type {
  AppearanceSettings,
  CreateTaskInput,
  Label,
  MedicationLog,
  InboxPriorityFilter,
  InboxProjectFilter,
  InboxStatusFilter,
  PkSettings,
  Project,
  ProjectTab,
  Task,
  TaskSort,
  TaskStatus,
  ThemeId,
  ThemeTokens,
  UiScale,
  ViewName
} from '@renderer/types'

export type UpdateTaskInput = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'priority'
    | 'dueDate'
    | 'projectId'
    | 'labels'
    | 'status'
    | 'archivedAt'
  >
> & {
  completed?: boolean
}

export type CreateProjectInput = Pick<Project, 'name' | 'color' | 'emoji' | 'description'>
export type UpdateProjectInput = Partial<CreateProjectInput>

export type CreateLabelInput = Pick<Label, 'name' | 'color'>
export type UpdateLabelInput = Partial<CreateLabelInput>

export type CreateMedicationLogInput = Omit<MedicationLog, 'id' | 'createdAt'>

export type SessionCreateInput = {
  taskId: string
  startAt: string
  endAt: string
}

export type SessionUpdateInput = {
  startAt?: string
  endAt?: string
}

export type SessionResult = { ok: true; id: string } | { ok: false; error: string }
export type SessionUpdateResult = { ok: true } | { ok: false; error: string }

export type TimeBlockCreateInput = {
  label: string
  startAt: string
  endAt: string
}

export type TimeBlockUpdateInput = {
  label?: string
  startAt?: string
  endAt?: string
}

export type TimeBlockResult = { ok: true; id: string } | { ok: false; error: string }
export type TimeBlockUpdateResult = { ok: true } | { ok: false; error: string }

export interface TaskCreateDefaults {
  projectId?: string
  status?: TaskStatus
  dueDate?: string
}

export type TaskPanelState =
  | { open: false }
  | { open: true; mode: 'create'; defaults: TaskCreateDefaults }
  | { open: true; mode: 'edit'; taskId: string }
  | { open: true; mode: 'create_project' }
  | { open: true; mode: 'edit_project'; projectId: string }

export interface DomainState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  sessions: import('@renderer/types').TaskSession[]
  timeBlocks: import('@renderer/types').TimeBlock[]
  medications: MedicationLog[]
  pkSettings: PkSettings
  uiScale: UiScale
  isSidebarCollapsed: boolean
  appearance: AppearanceSettings
  hydrated: boolean
}

export interface DomainActions {
  setUiScale: (scale: UiScale) => void
  toggleSidebar: () => void
  addTask: (input: CreateTaskInput) => void
  updateTask: (taskId: string, updates: UpdateTaskInput) => void
  toggleTaskComplete: (taskId: string) => void
  archiveTask: (taskId: string) => void
  unarchiveTask: (taskId: string) => void
  deleteTask: (taskId: string) => void
  addSubTask: (taskId: string, title: string) => void
  toggleSubTask: (taskId: string, subTaskId: string) => void
  deleteSubTask: (taskId: string, subTaskId: string) => void
  addProject: (input: CreateProjectInput) => string
  updateProject: (projectId: string, updates: UpdateProjectInput) => void
  deleteProject: (projectId: string) => void
  addLabel: (input: CreateLabelInput) => string
  updateLabel: (labelId: string, updates: UpdateLabelInput) => void
  deleteLabel: (labelId: string) => void
  applyKanbanOrder: (projectId: string, columns: Record<TaskStatus, string[]>) => void
  addSession: (input: SessionCreateInput) => SessionResult
  updateSession: (sessionId: string, updates: SessionUpdateInput) => SessionUpdateResult
  deleteSession: (sessionId: string) => void
  addTimeBlock: (input: TimeBlockCreateInput) => TimeBlockResult
  updateTimeBlock: (id: string, updates: TimeBlockUpdateInput) => TimeBlockUpdateResult
  deleteTimeBlock: (id: string) => void
  setThemeId: (id: ThemeId) => void
  setCustomTokens: (tokens: Partial<ThemeTokens>) => void
  resetCustomTokens: () => void
  addMedicationLog: (input: CreateMedicationLogInput) => void
  updateMedicationLog: (id: string, takenAt: string) => void
  deleteMedicationLog: (id: string) => void
  updateChartSettings: (patch: Partial<PkSettings>) => void
}

export interface UiState {
  selectedView: ViewName
  selectedProjectId?: string
  taskPanel: TaskPanelState
  searchQuery: string
  sortMode: TaskSort
  showCompleted: boolean
  inboxStatusFilter: InboxStatusFilter
  inboxProjectFilter: InboxProjectFilter
  inboxPriorityFilter: InboxPriorityFilter
  projectTab: ProjectTab
  searchFocusSignal: number
}

export interface UiActions {
  selectInbox: () => void
  selectToday: () => void
  selectActivity: () => void
  selectSessions: () => void
  selectSettings: () => void
  selectHealth: () => void
  selectArchive: () => void
  selectProject: (projectId: string) => void
  setProjectTab: (tab: ProjectTab) => void
  setSearchQuery: (query: string) => void
  setSortMode: (mode: TaskSort) => void
  setShowCompleted: (value: boolean) => void
  setInboxStatusFilter: (filter: InboxStatusFilter) => void
  setInboxProjectFilter: (filter: InboxProjectFilter) => void
  setInboxPriorityFilter: (filter: InboxPriorityFilter) => void
  triggerSearchFocus: () => void
  openCreatePanel: (defaults?: TaskCreateDefaults) => void
  openCreatePanelForCurrentView: () => void
  openCreateProjectPanel: () => void
  openEditProjectPanel: (projectId: string) => void
  openEditPanel: (taskId: string) => void
  closeTaskPanel: () => void
}

export interface DomainStoreMeta {
  actions: DomainActions
}

export interface UiStoreMeta {
  actions: UiActions
}

export type PersistedDomainState = Pick<
  DomainState,
  | 'tasks'
  | 'projects'
  | 'labels'
  | 'sessions'
  | 'timeBlocks'
  | 'medications'
  | 'pkSettings'
  | 'uiScale'
  | 'isSidebarCollapsed'
  | 'appearance'
>

export type DomainStore = DomainState & DomainActions & DomainStoreMeta
export type UiStore = UiState & UiActions & UiStoreMeta

export type DomainStoreSet = StoreApi<DomainStore>['setState']
export type DomainStoreGet = StoreApi<DomainStore>['getState']
export type UiStoreSet = StoreApi<UiStore>['setState']
export type UiStoreGet = StoreApi<UiStore>['getState']
