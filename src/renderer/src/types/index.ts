export type Priority = 'p1' | 'p2' | 'p3' | 'p4'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']
export type TaskSort = 'priority' | 'due_date' | 'created_at'
export type ViewName = 'inbox' | 'today' | 'project' | 'activity' | 'sessions'
export type ProjectTab = 'list' | 'kanban'
export const UI_SCALE_OPTIONS = [100, 110, 125, 150, 175] as const
export type UiScale = (typeof UI_SCALE_OPTIONS)[number]

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: string
  projectId?: string
  labels: string[]
  completed: boolean
  status: TaskStatus
  createdAt: string
  updatedAt: string
  order: number
  subTasks: SubTask[]
}

export interface Project {
  id: string
  name: string
  color: string
  emoji?: string
  description?: string
  createdAt: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface TaskSession {
  id: string
  taskId: string
  projectId: string
  startAt: string
  endAt: string
  createdAt: string
  updatedAt: string
}

export interface TaskSessionStats {
  count: number
  totalMs: number
  lastEndAt?: string
}

export interface AppState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  sessions: TaskSession[]
  uiScale?: UiScale
  isSidebarCollapsed?: boolean
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  projectId?: string
  labels?: string[]
  status?: TaskStatus
}

export interface TaskGroup {
  id: string
  title: string
  accentClass?: string
  tasks: Task[]
}
