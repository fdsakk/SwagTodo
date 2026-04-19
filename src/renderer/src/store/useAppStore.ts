import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  TASK_STATUSES,
  UI_SCALE_OPTIONS,
  DEFAULT_APPEARANCE,
  DEFAULT_SYNC_SETTINGS,
  DEFAULT_PK_SETTINGS,
  normalizeAppearance,
  normalizeSyncSettings,
  type AppearanceSettings,
  type SyncSettings,
  type ThemeId,
  type ThemeTokens,
  type AppState,
  type CreateTaskInput,
  type Label,
  type MedPkSettings,
  type MedicationLog,
  type PkSettings,
  type Project,
  type ProjectTab,
  type Task,
  type TaskSession,
  type TimeBlock,
  type TaskSort,
  type TaskStatus,
  type UiScale,
  type ViewName
} from '@renderer/types'

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

interface TaskPanelCreateDefaults {
  mode: 'create'
  projectId?: string
  status?: TaskStatus
  dueDate?: string
}

type TaskPanelState =
  | { open: false }
  | ({ open: true } & (
      | TaskPanelCreateDefaults
      | { mode: 'edit'; taskId: string }
      | { mode: 'create_project' }
      | { mode: 'edit_project'; projectId: string }
    ))

interface AppStore extends AppState {
  hydrated: boolean
  selectedView: ViewName
  selectedProjectId?: string
  taskPanel: TaskPanelState
  isSidebarCollapsed: boolean
  searchQuery: string
  sortMode: TaskSort
  showCompleted: boolean
  uiScale: UiScale
  projectTab: ProjectTab
  searchFocusSignal: number
  appearance: AppearanceSettings
  sync: SyncSettings
  pkSettings: PkSettings
  hydrate: () => Promise<void>
  refreshFromStorage: () => Promise<void>
  selectInbox: () => void
  selectToday: () => void
  selectActivity: () => void
  selectSessions: () => void
  selectSettings: () => void
  selectProject: (projectId: string) => void
  setProjectTab: (tab: ProjectTab) => void
  setSearchQuery: (query: string) => void
  setSortMode: (mode: TaskSort) => void
  setShowCompleted: (value: boolean) => void
  setUiScale: (scale: UiScale) => void
  toggleSidebar: () => void
  triggerSearchFocus: () => void
  openCreatePanel: (defaults?: Omit<TaskPanelCreateDefaults, 'mode'>) => void
  openCreatePanelForCurrentView: () => void
  openCreateProjectPanel: () => void
  openEditProjectPanel: (projectId: string) => void
  openEditPanel: (taskId: string) => void
  closeTaskPanel: () => void
  addTask: (input: CreateTaskInput) => void
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  toggleTaskComplete: (taskId: string) => void
  deleteTask: (taskId: string) => void
  addSubTask: (taskId: string, title: string) => void
  toggleSubTask: (taskId: string, subTaskId: string) => void
  deleteSubTask: (taskId: string, subTaskId: string) => void
  addProject: (input: Pick<Project, 'name' | 'color' | 'emoji' | 'description'>) => string
  updateProject: (
    projectId: string,
    updates: Partial<Pick<Project, 'name' | 'color' | 'emoji' | 'description'>>
  ) => void
  deleteProject: (projectId: string) => void
  addLabel: (input: Pick<Label, 'name' | 'color'>) => string
  updateLabel: (labelId: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => void
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
  setBackgroundId: (id: string) => void
  setSyncSupabaseUrl: (supabaseUrl: string) => void
  setSyncSupabaseAnonKey: (supabaseAnonKey: string) => void
  setSyncWorkspaceId: (workspaceId: string) => void
  selectHealth: () => void
  addMedicationLog: (input: Omit<MedicationLog, 'id' | 'createdAt'>) => void
  updateMedicationLog: (id: string, takenAt: string) => void
  deleteMedicationLog: (id: string) => void
  updateMedPkSettings: (medId: string, patch: Partial<MedPkSettings>) => void
  resetMedPkSettings: (medId: string) => void
}

const UI_SCALE_SET: ReadonlySet<number> = new Set(UI_SCALE_OPTIONS)
const PERSIST_DEBOUNCE_MS = 120

const nextOrder = (tasks: readonly Task[]): number => {
  let max = 0
  for (let i = 0, len = tasks.length; i < len; i++) {
    const o = tasks[i].order
    if (o > max) max = o
  }
  return max + 1
}

const isUiScale = (v: unknown): v is UiScale => typeof v === 'number' && UI_SCALE_SET.has(v)

const nowIso = (): string => new Date().toISOString()

const mapTaskById = (
  tasks: readonly Task[],
  taskId: string,
  transform: (task: Task) => Task
): Task[] => {
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx === -1) return tasks as Task[]
  const next = tasks.slice()
  next[idx] = transform(tasks[idx])
  return next
}

const stateFromPersisted = (
  persisted: unknown
): Pick<
  AppStore,
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
  | 'sync'
> => {
  const data =
    persisted && typeof persisted === 'object'
      ? (persisted as Partial<AppState> & { appearance?: unknown; sync?: unknown })
      : {}
  return {
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    labels: Array.isArray(data.labels) ? data.labels : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    timeBlocks: Array.isArray(data.timeBlocks) ? data.timeBlocks : [],
    medications: Array.isArray(data.medications) ? data.medications : [],
    pkSettings:
      data.pkSettings && typeof data.pkSettings === 'object' && !Array.isArray(data.pkSettings)
        ? (data.pkSettings as PkSettings)
        : DEFAULT_PK_SETTINGS,
    uiScale: isUiScale(data.uiScale) ? data.uiScale : 100,
    isSidebarCollapsed: data.isSidebarCollapsed ?? false,
    appearance: normalizeAppearance(data.appearance),
    sync: normalizeSyncSettings(data.sync)
  }
}

const useAppStore = create<AppStore>((set, get) => ({
  tasks: [],
  projects: [],
  labels: [],
  sessions: [],
  timeBlocks: [],
  medications: [],
  pkSettings: DEFAULT_PK_SETTINGS,
  hydrated: false,
  selectedView: 'inbox',
  selectedProjectId: undefined,
  taskPanel: { open: false },
  isSidebarCollapsed: false,
  searchQuery: '',
  sortMode: 'priority',
  showCompleted: false,
  uiScale: 100,
  appearance: DEFAULT_APPEARANCE,
  sync: DEFAULT_SYNC_SETTINGS,
  projectTab: 'list',
  searchFocusSignal: 0,
  refreshFromStorage: async () => {
    if (!window.api?.storage) return
    try {
      const persisted = await window.api.storage.loadState()
      set({ ...stateFromPersisted(persisted), hydrated: true })
    } catch (err) {
      console.error('[store] refresh failed', err)
      set({ hydrated: true })
    }
  },
  hydrate: async () => {
    if (get().hydrated) return
    if (!window.api?.storage) {
      set({ hydrated: true })
      return
    }
    await get().refreshFromStorage()
  },
  selectInbox: () => set({ selectedView: 'inbox', selectedProjectId: undefined }),
  selectToday: () => set({ selectedView: 'today', selectedProjectId: undefined }),
  selectActivity: () => set({ selectedView: 'activity', selectedProjectId: undefined }),
  selectSessions: () => set({ selectedView: 'sessions', selectedProjectId: undefined }),
  selectSettings: () => set({ selectedView: 'settings', selectedProjectId: undefined }),
  selectProject: (projectId) => set({ selectedView: 'project', selectedProjectId: projectId }),
  setProjectTab: (tab) => set({ projectTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortMode: (mode) => set({ sortMode: mode }),
  setShowCompleted: (value) => set({ showCompleted: value }),
  setUiScale: (scale) => set({ uiScale: scale }),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  triggerSearchFocus: () => set((s) => ({ searchFocusSignal: s.searchFocusSignal + 1 })),
  openCreatePanel: (defaults = {}) =>
    set({ taskPanel: { open: true, mode: 'create', ...defaults } }),
  openCreatePanelForCurrentView: () => {
    const { selectedView, selectedProjectId } = get()
    const defaults: Omit<TaskPanelCreateDefaults, 'mode'> =
      selectedView === 'project' && selectedProjectId
        ? { projectId: selectedProjectId, status: 'todo' }
        : selectedView === 'today'
          ? { dueDate: new Date().toISOString().slice(0, 10) }
          : {}
    set({ taskPanel: { open: true, mode: 'create', ...defaults } })
  },
  openCreateProjectPanel: () => set({ taskPanel: { open: true, mode: 'create_project' } }),
  openEditProjectPanel: (projectId) =>
    set({ taskPanel: { open: true, mode: 'edit_project', projectId } }),
  openEditPanel: (taskId) => set({ taskPanel: { open: true, mode: 'edit', taskId } }),
  closeTaskPanel: () => set({ taskPanel: { open: false } }),
  addTask: (input) => {
    const title = input.title.trim()
    if (!title) return
    const timestamp = nowIso()
    const status = input.status ?? 'todo'
    const task: Task = {
      id: uuidv4(),
      title,
      description: input.description?.trim() || undefined,
      priority: input.priority ?? 'p4',
      dueDate: input.dueDate,
      projectId: input.projectId,
      labels: input.labels ?? [],
      completed: status === 'done',
      status,
      createdAt: timestamp,
      updatedAt: timestamp,
      order: nextOrder(get().tasks),
      subTasks: []
    }
    set((state) => ({ tasks: [...state.tasks, task] }))
  },
  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: mapTaskById(state.tasks, taskId, (task) => {
        const patch: Partial<Task> = { ...updates }
        if (patch.status !== undefined) {
          patch.completed = patch.status === 'done'
        } else if (typeof patch.completed === 'boolean') {
          patch.status = patch.completed ? 'done' : 'todo'
        }
        return { ...task, ...patch, updatedAt: nowIso() }
      })
    }))
  },
  toggleTaskComplete: (taskId) => {
    set((state) => ({
      tasks: mapTaskById(state.tasks, taskId, (task) => {
        const completed = !task.completed
        return {
          ...task,
          completed,
          status: completed ? 'done' : 'todo',
          updatedAt: nowIso()
        }
      })
    }))
  },
  deleteTask: (taskId) =>
    set((state) => {
      const idx = state.tasks.findIndex((t) => t.id === taskId)
      if (idx === -1) return state
      const tasks = state.tasks.slice()
      tasks.splice(idx, 1)
      const sessions = state.sessions.filter((s) => s.taskId !== taskId)
      const closingEdited =
        state.taskPanel.open && state.taskPanel.mode === 'edit' && state.taskPanel.taskId === taskId
      return {
        tasks,
        sessions: sessions.length === state.sessions.length ? state.sessions : sessions,
        taskPanel: closingEdited ? { open: false } : state.taskPanel
      }
    }),
  addSubTask: (taskId, title) => {
    const trimmed = title.trim()
    if (!trimmed) return
    set((state) => ({
      tasks: mapTaskById(state.tasks, taskId, (task) => ({
        ...task,
        updatedAt: nowIso(),
        subTasks: [...task.subTasks, { id: uuidv4(), title: trimmed, completed: false }]
      }))
    }))
  },
  toggleSubTask: (taskId, subTaskId) => {
    set((state) => ({
      tasks: mapTaskById(state.tasks, taskId, (task) => {
        const subIdx = task.subTasks.findIndex((s) => s.id === subTaskId)
        if (subIdx === -1) return task
        const subTasks = task.subTasks.slice()
        const nextCompleted = !subTasks[subIdx].completed
        subTasks[subIdx] = { ...subTasks[subIdx], completed: nextCompleted }
        const promote = nextCompleted && task.status === 'todo'
        return {
          ...task,
          updatedAt: nowIso(),
          subTasks,
          ...(promote ? { status: 'in_progress' as const, completed: false } : {})
        }
      })
    }))
  },
  deleteSubTask: (taskId, subTaskId) => {
    set((state) => ({
      tasks: mapTaskById(state.tasks, taskId, (task) => {
        const subTasks = task.subTasks.filter((s) => s.id !== subTaskId)
        if (subTasks.length === task.subTasks.length) return task
        return { ...task, updatedAt: nowIso(), subTasks }
      })
    }))
  },
  addProject: (input) => {
    const name = input.name.trim()
    if (!name) return ''
    const project: Project = {
      id: uuidv4(),
      name,
      color: input.color,
      emoji: input.emoji?.trim() || undefined,
      description: input.description?.trim() || undefined,
      createdAt: nowIso()
    }
    set((state) => ({ projects: [...state.projects, project] }))
    return project.id
  },
  updateProject: (projectId, updates) =>
    set((state) => {
      const idx = state.projects.findIndex((p) => p.id === projectId)
      if (idx === -1) return state
      const projects = state.projects.slice()
      const current = state.projects[idx]
      projects[idx] = { ...current, ...updates, name: updates.name?.trim() ?? current.name }
      return { projects }
    }),
  deleteProject: (projectId) =>
    set((state) => {
      const projectIdx = state.projects.findIndex((p) => p.id === projectId)
      if (projectIdx === -1) return state
      const projects = state.projects.slice()
      projects.splice(projectIdx, 1)
      let tasksChanged = false
      const tasks = state.tasks.map((t) => {
        if (t.projectId !== projectId) return t
        tasksChanged = true
        return { ...t, projectId: undefined, updatedAt: nowIso() }
      })
      const sessions = state.sessions.filter((s) => s.projectId !== projectId)
      const wasSelected = state.selectedProjectId === projectId
      return {
        projects,
        tasks: tasksChanged ? tasks : state.tasks,
        sessions: sessions.length === state.sessions.length ? state.sessions : sessions,
        selectedProjectId: wasSelected ? undefined : state.selectedProjectId,
        selectedView: wasSelected ? 'inbox' : state.selectedView
      }
    }),
  addLabel: (input) => {
    const name = input.name.trim()
    if (!name) return ''
    const label: Label = { id: uuidv4(), name, color: input.color }
    set((state) => ({ labels: [...state.labels, label] }))
    return label.id
  },
  updateLabel: (labelId, updates) =>
    set((state) => {
      const idx = state.labels.findIndex((l) => l.id === labelId)
      if (idx === -1) return state
      const labels = state.labels.slice()
      labels[idx] = { ...state.labels[idx], ...updates }
      return { labels }
    }),
  deleteLabel: (labelId) =>
    set((state) => {
      const idx = state.labels.findIndex((l) => l.id === labelId)
      if (idx === -1) return state
      const labels = state.labels.slice()
      labels.splice(idx, 1)
      let tasksChanged = false
      const tasks = state.tasks.map((t) => {
        if (!t.labels.includes(labelId)) return t
        tasksChanged = true
        return { ...t, labels: t.labels.filter((id) => id !== labelId), updatedAt: nowIso() }
      })
      return { labels, tasks: tasksChanged ? tasks : state.tasks }
    }),
  addSession: (input) => {
    const state = get()
    const task = state.tasks.find((t) => t.id === input.taskId)
    if (!task) return { ok: false, error: 'Task not found' }
    if (!task.projectId) return { ok: false, error: 'Task must belong to a project' }
    const startMs = Date.parse(input.startAt)
    const endMs = Date.parse(input.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return { ok: false, error: 'Invalid start/end time' }
    }
    if (endMs <= startMs) return { ok: false, error: 'End must be after start' }
    const timestamp = nowIso()
    const session: TaskSession = {
      id: uuidv4(),
      taskId: task.id,
      projectId: task.projectId,
      startAt: input.startAt,
      endAt: input.endAt,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    set((s) => ({ sessions: [...s.sessions, session] }))
    return { ok: true, id: session.id }
  },
  updateSession: (sessionId, updates) => {
    const state = get()
    const idx = state.sessions.findIndex((s) => s.id === sessionId)
    if (idx === -1) return { ok: false, error: 'Session not found' }
    const current = state.sessions[idx]
    const startAt = updates.startAt ?? current.startAt
    const endAt = updates.endAt ?? current.endAt
    const startMs = Date.parse(startAt)
    const endMs = Date.parse(endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return { ok: false, error: 'Invalid start/end time' }
    }
    if (endMs <= startMs) return { ok: false, error: 'End must be after start' }
    if (startAt === current.startAt && endAt === current.endAt) return { ok: true }
    const sessions = state.sessions.slice()
    sessions[idx] = { ...current, startAt, endAt, updatedAt: nowIso() }
    set({ sessions })
    return { ok: true }
  },
  deleteSession: (sessionId) =>
    set((state) => {
      const idx = state.sessions.findIndex((s) => s.id === sessionId)
      if (idx === -1) return state
      const sessions = state.sessions.slice()
      sessions.splice(idx, 1)
      return { sessions }
    }),
  addTimeBlock: (input) => {
    const label = input.label.trim()
    const startMs = Date.parse(input.startAt)
    const endMs = Date.parse(input.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return { ok: false, error: 'Invalid start/end time' }
    }
    if (endMs <= startMs) return { ok: false, error: 'End must be after start' }
    const block: TimeBlock = {
      id: uuidv4(),
      label: label || 'Block',
      startAt: input.startAt,
      endAt: input.endAt,
      createdAt: nowIso()
    }
    set((s) => ({ timeBlocks: [...s.timeBlocks, block] }))
    return { ok: true, id: block.id }
  },
  updateTimeBlock: (id, updates) => {
    const state = get()
    const idx = state.timeBlocks.findIndex((b) => b.id === id)
    if (idx === -1) return { ok: false, error: 'Time block not found' }
    const current = state.timeBlocks[idx]
    const startAt = updates.startAt ?? current.startAt
    const endAt = updates.endAt ?? current.endAt
    const startMs = Date.parse(startAt)
    const endMs = Date.parse(endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return { ok: false, error: 'Invalid start/end time' }
    }
    if (endMs <= startMs) return { ok: false, error: 'End must be after start' }
    const timeBlocks = state.timeBlocks.slice()
    timeBlocks[idx] = {
      ...current,
      label: updates.label?.trim() ?? current.label,
      startAt,
      endAt
    }
    set({ timeBlocks })
    return { ok: true }
  },
  deleteTimeBlock: (id) =>
    set((state) => {
      const idx = state.timeBlocks.findIndex((b) => b.id === id)
      if (idx === -1) return state
      const timeBlocks = state.timeBlocks.slice()
      timeBlocks.splice(idx, 1)
      return { timeBlocks }
    }),
  setThemeId: (id) =>
    set((s) => ({ appearance: { ...s.appearance, themeId: id, customTokens: {} } })),
  setCustomTokens: (tokens) =>
    set((s) => ({
      appearance: { ...s.appearance, customTokens: { ...s.appearance.customTokens, ...tokens } }
    })),
  resetCustomTokens: () => set((s) => ({ appearance: { ...s.appearance, customTokens: {} } })),
  setBackgroundId: (id) => set((s) => ({ appearance: { ...s.appearance, backgroundId: id } })),
  setSyncSupabaseUrl: (supabaseUrl) =>
    set((s) => ({ sync: { ...s.sync, supabaseUrl: supabaseUrl.trim() } })),
  setSyncSupabaseAnonKey: (supabaseAnonKey) =>
    set((s) => ({ sync: { ...s.sync, supabaseAnonKey: supabaseAnonKey.trim() } })),
  setSyncWorkspaceId: (workspaceId) =>
    set((s) => ({ sync: { ...s.sync, workspaceId: workspaceId.trim() } })),
  selectHealth: () => set({ selectedView: 'health', selectedProjectId: undefined }),
  addMedicationLog: (input) => {
    const log: MedicationLog = { id: uuidv4(), ...input, createdAt: nowIso() }
    set((s) => ({ medications: [...s.medications, log] }))
  },
  updateMedicationLog: (id, takenAt) =>
    set((s) => {
      const idx = s.medications.findIndex((m) => m.id === id)
      if (idx === -1) return s
      const medications = s.medications.slice()
      medications[idx] = { ...medications[idx], takenAt }
      return { medications }
    }),
  deleteMedicationLog: (id) =>
    set((s) => {
      const idx = s.medications.findIndex((m) => m.id === id)
      if (idx === -1) return s
      const medications = s.medications.slice()
      medications.splice(idx, 1)
      return { medications }
    }),
  updateMedPkSettings: (medId, patch) =>
    set((s) => {
      const existing = s.pkSettings.perMed[medId] ?? {
        ke0: 1.0,
        durationScale: 1.0,
        sensitivity: 1.0
      }
      return {
        pkSettings: {
          ...s.pkSettings,
          perMed: { ...s.pkSettings.perMed, [medId]: { ...existing, ...patch } }
        }
      }
    }),
  resetMedPkSettings: (medId) =>
    set((s) => {
      const perMed = { ...s.pkSettings.perMed }
      delete perMed[medId]
      return { pkSettings: { ...s.pkSettings, perMed } }
    }),
  applyKanbanOrder: (projectId, columns) => {
    const updatedAt = nowIso()
    const byTaskId = new Map<string, { status: TaskStatus; order: number }>()
    for (let si = 0; si < TASK_STATUSES.length; si++) {
      const status = TASK_STATUSES[si]
      const ids = columns[status]
      for (let i = 0; i < ids.length; i++) {
        byTaskId.set(ids[i], { status, order: i + 1 })
      }
    }
    set((state) => {
      let changed = false
      const tasks = state.tasks.map((t) => {
        if (t.projectId !== projectId) return t
        const next = byTaskId.get(t.id)
        if (!next) return t
        if (t.status === next.status && t.order === next.order) return t
        changed = true
        return {
          ...t,
          status: next.status,
          completed: next.status === 'done',
          order: next.order,
          updatedAt
        }
      })
      return changed ? { tasks } : state
    })
  }
}))

let persistTimer: ReturnType<typeof setTimeout> | undefined

const unsubscribePersist = useAppStore.subscribe((state, prev) => {
  if (!state.hydrated || !window.api?.storage) return
  if (
    state.tasks === prev.tasks &&
    state.projects === prev.projects &&
    state.labels === prev.labels &&
    state.sessions === prev.sessions &&
    state.timeBlocks === prev.timeBlocks &&
    state.medications === prev.medications &&
    state.pkSettings === prev.pkSettings &&
    state.uiScale === prev.uiScale &&
    state.isSidebarCollapsed === prev.isSidebarCollapsed &&
    state.appearance === prev.appearance &&
    state.sync === prev.sync
  ) {
    return
  }

  if (persistTimer) clearTimeout(persistTimer)
  const {
    tasks,
    projects,
    labels,
    sessions,
    timeBlocks,
    medications,
    pkSettings,
    uiScale,
    isSidebarCollapsed,
    appearance,
    sync
  } = state
  persistTimer = setTimeout(() => {
    persistTimer = undefined
    window.api.storage
      .saveState({
        tasks,
        projects,
        labels,
        sessions,
        timeBlocks,
        medications,
        pkSettings,
        uiScale,
        isSidebarCollapsed,
        appearance,
        sync
      })
      .catch((err) => console.error('[store] persist failed', err))
  }, PERSIST_DEBOUNCE_MS)
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribePersist()
    if (persistTimer) clearTimeout(persistTimer)
  })
}

export default useAppStore
