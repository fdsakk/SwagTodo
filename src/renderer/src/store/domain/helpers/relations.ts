import type { DomainState } from '../../shared/types'

export const removeTaskRelations = (
  state: Pick<DomainState, 'sessions'>,
  taskId: string
): Pick<DomainState, 'sessions'> => {
  const sessions = state.sessions.filter((session) => session.taskId !== taskId)
  return { sessions: sessions.length === state.sessions.length ? state.sessions : sessions }
}

export const removeProjectSessions = (
  state: Pick<DomainState, 'sessions'>,
  projectId: string
): Pick<DomainState, 'sessions'> => {
  const sessions = state.sessions.filter((session) => session.projectId !== projectId)
  return { sessions: sessions.length === state.sessions.length ? state.sessions : sessions }
}

export const detachProjectFromTasks = (
  state: Pick<DomainState, 'tasks'>,
  projectId: string,
  updatedAt: string
): Pick<DomainState, 'tasks'> => {
  let changed = false
  const tasks = state.tasks.map((task) => {
    if (task.projectId !== projectId) return task
    changed = true
    return { ...task, projectId: undefined, updatedAt }
  })

  return { tasks: changed ? tasks : state.tasks }
}

export const detachLabelFromTasks = (
  state: Pick<DomainState, 'tasks'>,
  labelId: string,
  updatedAt: string
): Pick<DomainState, 'tasks'> => {
  let changed = false
  const tasks = state.tasks.map((task) => {
    if (!task.labels.includes(labelId)) return task
    changed = true
    return {
      ...task,
      labels: task.labels.filter((currentId) => currentId !== labelId),
      updatedAt
    }
  })

  return { tasks: changed ? tasks : state.tasks }
}
