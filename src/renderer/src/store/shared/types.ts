import type {
  AppearanceSettings,
  AppPreferences,
  CreateTaskInput,
  InboxPriorityFilter,
  InboxProjectFilter,
  InboxStatusFilter,
  Label,
  MedicationLog,
  PkSettings,
  Project,
  ProjectTab,
  Task,
  TaskAttachment,
  TaskSession,
  TaskSort,
  TaskStatus,
  ThemeId,
  ThemeTokens,
  UiScale,
  ViewName
} from "@renderer/types"
import type { StoreApi } from "zustand"

export type UpdateTaskInput = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "priority"
    | "dueDate"
    | "dueTime"
    | "recurrence"
    | "blockedBy"
    | "projectId"
    | "labels"
    | "status"
    | "archivedAt"
  >
> & {
  completed?: boolean
}

export type CreateProjectInput = Pick<
  Project,
  "name" | "color" | "emoji" | "description"
>
export type UpdateProjectInput = Partial<CreateProjectInput>

export type CreateLabelInput = Pick<Label, "name" | "color">
export type UpdateLabelInput = Partial<CreateLabelInput>

export type CreateMedicationLogInput = Omit<MedicationLog, "id" | "createdAt">

export type SessionCreateInput = {
  taskId: string
  startAt: string
  endAt: string
}

export type SessionUpdateInput = {
  startAt?: string
  endAt?: string
}

export type SessionResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
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

export type TimeBlockResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
export type TimeBlockUpdateResult = { ok: true } | { ok: false; error: string }

export interface TaskCreateDefaults {
  projectId?: string
  status?: TaskStatus
  dueDate?: string
}

export type TaskPanelState =
  | { open: false }
  | { open: true; mode: "create"; defaults: TaskCreateDefaults }
  | { open: true; mode: "edit"; taskId: string }
  | { open: true; mode: "create_project" }
  | { open: true; mode: "edit_project"; projectId: string }

export interface DomainState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  sessions: import("@renderer/types").TaskSession[]
  timeBlocks: import("@renderer/types").TimeBlock[]
  medications: MedicationLog[]
  pkSettings: PkSettings
  uiScale: UiScale
  isSidebarCollapsed: boolean
  appearance: AppearanceSettings
  preferences: AppPreferences
  hydrated: boolean
}

/** Snapshot taken before a destructive action so it can be undone. */
export interface DeletedTasksSnapshot {
  tasks: { task: Task; index: number }[]
  sessions: TaskSession[]
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
  deleteTasks: (taskIds: string[]) => DeletedTasksSnapshot
  restoreTasks: (snapshot: DeletedTasksSnapshot) => void
  updateTasks: (taskIds: string[], updates: UpdateTaskInput) => void
  setTasksCompleted: (taskIds: string[], completed: boolean) => void
  archiveTasks: (taskIds: string[]) => void
  unarchiveTasks: (taskIds: string[]) => void
  /** Archives tasks completed at least AUTO_ARCHIVE_DAYS ago; returns count. */
  archiveStaleCompletedTasks: (now?: Date) => number
  setTaskOrders: (orders: Record<string, number>) => void
  addAttachments: (taskId: string, attachments: TaskAttachment[]) => void
  removeAttachment: (taskId: string, attachmentId: string) => void
  updatePreferences: (patch: Partial<AppPreferences>) => void
  addSubTask: (taskId: string, title: string) => void
  toggleSubTask: (taskId: string, subTaskId: string) => void
  deleteSubTask: (taskId: string, subTaskId: string) => void
  addProject: (input: CreateProjectInput) => string
  updateProject: (projectId: string, updates: UpdateProjectInput) => void
  deleteProject: (projectId: string) => void
  addLabel: (input: CreateLabelInput) => string
  updateLabel: (labelId: string, updates: UpdateLabelInput) => void
  deleteLabel: (labelId: string) => void
  applyKanbanOrder: (
    projectId: string,
    columns: Record<TaskStatus, string[]>
  ) => void
  addSession: (input: SessionCreateInput) => SessionResult
  updateSession: (
    sessionId: string,
    updates: SessionUpdateInput
  ) => SessionUpdateResult
  deleteSession: (sessionId: string) => void
  addTimeBlock: (input: TimeBlockCreateInput) => TimeBlockResult
  updateTimeBlock: (
    id: string,
    updates: TimeBlockUpdateInput
  ) => TimeBlockUpdateResult
  deleteTimeBlock: (id: string) => void
  setThemeId: (id: ThemeId) => void
  setCustomTokens: (tokens: Partial<ThemeTokens>) => void
  resetCustomTokens: () => void
  addMedicationLog: (input: CreateMedicationLogInput) => void
  updateMedicationLog: (id: string, takenAt: string) => void
  deleteMedicationLog: (id: string) => void
  updateChartSettings: (patch: Partial<PkSettings>) => void
}

export interface ActiveTimer {
  taskId: string
  startAt: string
  mode: "stopwatch" | "pomodoro"
  /** Pomodoro length in minutes. */
  durationMin?: number
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
  selectedTaskIds: string[]
  selectionAnchorId?: string
  activeTimer?: ActiveTimer
  quickAddOpen: boolean
  commandPaletteOpen: boolean
}

export interface UiActions {
  selectInbox: () => void
  selectToday: () => void
  selectActivity: () => void
  selectSessions: () => void
  selectSettings: () => void
  selectHealth: () => void
  selectArchive: () => void
  selectUpcoming: () => void
  selectStats: () => void
  applySavedView: (view: import("@renderer/types").SavedView) => void
  setSelectedTaskIds: (ids: string[], anchorId?: string) => void
  toggleTaskSelection: (id: string) => void
  clearSelection: () => void
  startTimer: (timer: ActiveTimer) => void
  stopTimer: () => void
  setQuickAddOpen: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
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
  | "tasks"
  | "projects"
  | "labels"
  | "sessions"
  | "timeBlocks"
  | "medications"
  | "pkSettings"
  | "uiScale"
  | "isSidebarCollapsed"
  | "appearance"
  | "preferences"
>

export type DomainStore = DomainState & DomainActions & DomainStoreMeta
export type UiStore = UiState & UiActions & UiStoreMeta

export type DomainStoreSet = StoreApi<DomainStore>["setState"]
export type DomainStoreGet = StoreApi<DomainStore>["getState"]
export type UiStoreSet = StoreApi<UiStore>["setState"]
export type UiStoreGet = StoreApi<UiStore>["getState"]
