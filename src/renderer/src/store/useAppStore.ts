import { create, type StoreApi } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import {
  normalizeLabelInput,
  normalizeLabelPatch,
  normalizeProjectInput,
  normalizeProjectPatch,
  normalizeStoredTask,
  normalizeTaskPatch
} from './entity-normalizers'
import {
  TASK_STATUSES,
  UI_SCALE_OPTIONS,
  DEFAULT_APPEARANCE,
  DEFAULT_PK_SETTINGS,
  normalizeAppearance,
  type AppearanceSettings,
  type ThemeId,
  type ThemeTokens,
  type AppState,
  type CreateTaskInput,
  type Label,
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
  selectHealth: () => void
  addMedicationLog: (input: Omit<MedicationLog, 'id' | 'createdAt'>) => void
  updateMedicationLog: (id: string, takenAt: string) => void
  deleteMedicationLog: (id: string) => void
  updateChartSettings: (patch: Partial<PkSettings>) => void
}

const UI_SCALE_SET: ReadonlySet<number> = new Set(UI_SCALE_OPTIONS)

type PersistedSlice = Pick<
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
>

const PERSISTED_KEYS: (keyof PersistedSlice)[] = [
  'tasks',
  'projects',
  'labels',
  'sessions',
  'timeBlocks',
  'medications',
  'pkSettings',
  'uiScale',
  'isSidebarCollapsed',
  'appearance'
]

const nextOrder = (tasks: readonly Task[]): number => {
  let max = 0
  for (let i = 0, len = tasks.length; i < len; i++) {
    const o = tasks[i].order
    if (o > max) max = o
  }
  return max + 1
}

const isUiScale = (v: unknown): v is UiScale => typeof v === 'number' && UI_SCALE_SET.has(v)

const normalizePkSettings = (raw: unknown): PkSettings => {
  const d = DEFAULT_PK_SETTINGS
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>
    return {
      peakScale: typeof r.peakScale === 'number' ? r.peakScale : d.peakScale,
      tMaxOffsetH: typeof r.tMaxOffsetH === 'number' ? r.tMaxOffsetH : d.tMaxOffsetH,
      keMultiplier: typeof r.keMultiplier === 'number' ? r.keMultiplier : d.keMultiplier,
      mec: typeof r.mec === 'number' ? r.mec : d.mec,
      mtc: typeof r.mtc === 'number' ? r.mtc : d.mtc,
      crashThreshold: typeof r.crashThreshold === 'number' ? r.crashThreshold : d.crashThreshold
    }
  }
  return d
}

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
> => {
  const data =
    persisted && typeof persisted === 'object'
      ? (persisted as Partial<AppState> & { appearance?: unknown })
      : {}
  return {
    tasks: Array.isArray(data.tasks) ? data.tasks.map((task) => normalizeStoredTask(task)) : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    labels: Array.isArray(data.labels) ? data.labels : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    timeBlocks: Array.isArray(data.timeBlocks) ? data.timeBlocks : [],
    medications: Array.isArray(data.medications) ? data.medications : [],
    pkSettings: normalizePkSettings(data.pkSettings),
    uiScale: isUiScale(data.uiScale) ? data.uiScale : UI_SCALE_OPTIONS[0],
    isSidebarCollapsed: data.isSidebarCollapsed ?? false,
    appearance: normalizeAppearance(data.appearance)
  }
}

const pickPersistedSlice = (state: AppStore): PersistedSlice => ({
  tasks: state.tasks,
  projects: state.projects,
  labels: state.labels,
  sessions: state.sessions,
  timeBlocks: state.timeBlocks,
  medications: state.medications,
  pkSettings: state.pkSettings,
  uiScale: state.uiScale,
  isSidebarCollapsed: state.isSidebarCollapsed,
  appearance: state.appearance
})

let lastPersistedSlice: PersistedSlice | undefined

const persistedStorage: PersistStorage<PersistedSlice> = {
  getItem: async () => {
    if (!window.api?.storage) return null
    const loaded = stateFromPersisted(await window.api.storage.loadState())
    lastPersistedSlice = loaded
    return { state: loaded, version: 1 }
  },
  setItem: async (_, value) => {
    if (!window.api?.storage) return
    const next = value.state
    const patch: Partial<PersistedSlice> = {}
    for (const key of PERSISTED_KEYS) {
      if (!lastPersistedSlice || next[key] !== lastPersistedSlice[key]) {
        ;(patch as Record<string, unknown>)[key] = next[key]
      }
    }
    if (Object.keys(patch).length === 0) return
    await window.api.storage.savePartial(patch)
    lastPersistedSlice = { ...(lastPersistedSlice ?? next), ...patch }
  },
  removeItem: async () => {
    lastPersistedSlice = undefined
  }
}

type AppStoreSet = StoreApi<AppStore>['setState']
type AppStoreGet = StoreApi<AppStore>['getState']

const createLegacyStore = (set: AppStoreSet, get: AppStoreGet): AppStore => ({
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
  uiScale: UI_SCALE_OPTIONS[0],
  appearance: DEFAULT_APPEARANCE,
  projectTab: 'list',
  searchFocusSignal: 0,
  refreshFromStorage: async () => {
    if (!window.api?.storage) {
      set({ hydrated: true })
      return
    }
    try {
      const persisted = stateFromPersisted(await window.api.storage.loadState())
      lastPersistedSlice = persisted
      set({ ...persisted, hydrated: true })
    } catch (err) {
      console.error('[store] refresh failed', err)
      set({ hydrated: true })
    }
  },
  hydrate: async () => {
    if (get().hydrated) return
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
    const timestamp = nowIso()
    const status = input.status ?? 'todo'
    const completed = status === 'done'
    const title = input.title.trim()
    if (!title) return
    const task: Task = {
      id: uuidv4(),
      title,
      description: input.description?.trim() || undefined,
      priority: input.priority ?? 'p4',
      dueDate: input.dueDate,
      projectId: input.projectId,
      labels: input.labels ?? [],
      completed,
      status,
      completedAt: completed ? timestamp : undefined,
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
        const patch = normalizeTaskPatch(task, updates, nowIso())
        return patch ? { ...task, ...patch } : task
      })
    }))
  },
  toggleTaskComplete: (taskId) => {
    set((state) => ({
      tasks: mapTaskById(state.tasks, taskId, (task) => {
        const patch = normalizeTaskPatch(task, { completed: !task.completed }, nowIso())
        return patch ? { ...task, ...patch } : task
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
    const normalized = normalizeProjectInput(input)
    if (!normalized) return ''
    const project: Project = {
      id: uuidv4(),
      ...normalized,
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
      const patch = normalizeProjectPatch(current, updates)
      if (!patch) return state
      projects[idx] = { ...current, ...patch }
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
    const normalized = normalizeLabelInput(input)
    if (!normalized) return ''
    const label: Label = { id: uuidv4(), ...normalized }
    set((state) => ({ labels: [...state.labels, label] }))
    return label.id
  },
  updateLabel: (labelId, updates) =>
    set((state) => {
      const idx = state.labels.findIndex((l) => l.id === labelId)
      if (idx === -1) return state
      const labels = state.labels.slice()
      const current = state.labels[idx]
      const patch = normalizeLabelPatch(current, updates)
      if (!patch) return state
      labels[idx] = { ...current, ...patch }
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
  updateChartSettings: (patch) => set((s) => ({ pkSettings: { ...s.pkSettings, ...patch } })),
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
        const patch = normalizeTaskPatch(
          t,
          { status: next.status, completed: next.status === 'done' },
          updatedAt
        )
        return patch
          ? { ...t, ...patch, order: next.order }
          : { ...t, order: next.order, updatedAt }
      })
      return changed ? { tasks } : state
    })
  }
})

const pickSlice = <T extends object, const K extends readonly (keyof T)[]>(
  source: T,
  keys: K
): Pick<T, K[number]> => {
  const out = {} as Pick<T, K[number]>
  for (const key of keys) out[key] = source[key]
  return out
}

const UI_SLICE_KEYS = [
  'hydrated',
  'selectedView',
  'selectedProjectId',
  'taskPanel',
  'isSidebarCollapsed',
  'searchQuery',
  'sortMode',
  'showCompleted',
  'projectTab',
  'searchFocusSignal',
  'hydrate',
  'refreshFromStorage',
  'selectInbox',
  'selectToday',
  'selectActivity',
  'selectSessions',
  'selectSettings',
  'selectProject',
  'setProjectTab',
  'setSearchQuery',
  'setSortMode',
  'setShowCompleted',
  'toggleSidebar',
  'triggerSearchFocus',
  'openCreatePanel',
  'openCreatePanelForCurrentView',
  'openCreateProjectPanel',
  'openEditProjectPanel',
  'openEditPanel',
  'closeTaskPanel',
  'selectHealth'
] as const satisfies readonly (keyof AppStore)[]

const TASK_PROJECT_SLICE_KEYS = [
  'tasks',
  'projects',
  'labels',
  'addTask',
  'updateTask',
  'toggleTaskComplete',
  'deleteTask',
  'addSubTask',
  'toggleSubTask',
  'deleteSubTask',
  'addProject',
  'updateProject',
  'deleteProject',
  'addLabel',
  'updateLabel',
  'deleteLabel',
  'applyKanbanOrder'
] as const satisfies readonly (keyof AppStore)[]

const SESSION_SLICE_KEYS = [
  'sessions',
  'timeBlocks',
  'addSession',
  'updateSession',
  'deleteSession',
  'addTimeBlock',
  'updateTimeBlock',
  'deleteTimeBlock'
] as const satisfies readonly (keyof AppStore)[]

const SETTINGS_SLICE_KEYS = [
  'uiScale',
  'appearance',
  'setUiScale',
  'setThemeId',
  'setCustomTokens',
  'resetCustomTokens'
] as const satisfies readonly (keyof AppStore)[]

const HEALTH_SLICE_KEYS = [
  'medications',
  'pkSettings',
  'addMedicationLog',
  'updateMedicationLog',
  'deleteMedicationLog',
  'updateChartSettings'
] as const satisfies readonly (keyof AppStore)[]

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      const legacy = createLegacyStore(set, get)
      return {
        ...pickSlice(legacy, UI_SLICE_KEYS),
        ...pickSlice(legacy, TASK_PROJECT_SLICE_KEYS),
        ...pickSlice(legacy, SESSION_SLICE_KEYS),
        ...pickSlice(legacy, SETTINGS_SLICE_KEYS),
        ...pickSlice(legacy, HEALTH_SLICE_KEYS)
      }
    },
    {
      name: 'app-state',
      version: 1,
      storage: persistedStorage,
      partialize: pickPersistedSlice,
      skipHydration: true
    }
  )
)

export default useAppStore
