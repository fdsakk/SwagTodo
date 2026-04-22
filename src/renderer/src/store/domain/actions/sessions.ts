import { v4 as uuidv4 } from 'uuid'
import type { DomainActions, DomainStoreGet, DomainStoreSet } from '../../shared/types'
import { appendIfValid, getTimeRangeError, nowIso, removeById } from '../../shared/utils'

type SessionActions = Pick<
  DomainActions,
  | 'addSession'
  | 'updateSession'
  | 'deleteSession'
  | 'addTimeBlock'
  | 'updateTimeBlock'
  | 'deleteTimeBlock'
>

export const createSessionActions = (set: DomainStoreSet, get: DomainStoreGet): SessionActions => ({
  addSession: (input) => {
    const state = get()
    const task = state.tasks.find((currentTask) => currentTask.id === input.taskId)
    if (!task) return { ok: false, error: 'Task not found' }
    if (!task.projectId) return { ok: false, error: 'Task must belong to a project' }

    const rangeError = getTimeRangeError(input.startAt, input.endAt)
    if (rangeError) return { ok: false, error: rangeError }

    const timestamp = nowIso()
    const session = {
      id: uuidv4(),
      taskId: task.id,
      projectId: task.projectId,
      startAt: input.startAt,
      endAt: input.endAt,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    set((state) => ({ sessions: appendIfValid(state.sessions, session) }))
    return { ok: true, id: session.id }
  },
  updateSession: (sessionId, updates) => {
    const state = get()
    const index = state.sessions.findIndex((session) => session.id === sessionId)
    if (index === -1) return { ok: false, error: 'Session not found' }

    const current = state.sessions[index]
    const startAt = updates.startAt ?? current.startAt
    const endAt = updates.endAt ?? current.endAt
    const rangeError = getTimeRangeError(startAt, endAt)
    if (rangeError) return { ok: false, error: rangeError }
    if (startAt === current.startAt && endAt === current.endAt) return { ok: true }

    const sessions = state.sessions.slice()
    sessions[index] = { ...current, startAt, endAt, updatedAt: nowIso() }
    set({ sessions })
    return { ok: true }
  },
  deleteSession: (sessionId) =>
    set((state) => {
      const sessions = removeById(state.sessions, sessionId)
      return sessions === state.sessions ? state : { sessions }
    }),
  addTimeBlock: (input) => {
    const rangeError = getTimeRangeError(input.startAt, input.endAt)
    if (rangeError) return { ok: false, error: rangeError }

    const timeBlock = {
      id: uuidv4(),
      label: input.label.trim() || 'Block',
      startAt: input.startAt,
      endAt: input.endAt,
      createdAt: nowIso()
    }

    set((state) => ({ timeBlocks: appendIfValid(state.timeBlocks, timeBlock) }))
    return { ok: true, id: timeBlock.id }
  },
  updateTimeBlock: (id, updates) => {
    const state = get()
    const index = state.timeBlocks.findIndex((timeBlock) => timeBlock.id === id)
    if (index === -1) return { ok: false, error: 'Time block not found' }

    const current = state.timeBlocks[index]
    const startAt = updates.startAt ?? current.startAt
    const endAt = updates.endAt ?? current.endAt
    const rangeError = getTimeRangeError(startAt, endAt)
    if (rangeError) return { ok: false, error: rangeError }

    const label = updates.label?.trim() ?? current.label
    if (label === current.label && startAt === current.startAt && endAt === current.endAt) {
      return { ok: true }
    }

    const timeBlocks = state.timeBlocks.slice()
    timeBlocks[index] = { ...current, label, startAt, endAt }
    set({ timeBlocks })
    return { ok: true }
  },
  deleteTimeBlock: (id) =>
    set((state) => {
      const timeBlocks = removeById(state.timeBlocks, id)
      return timeBlocks === state.timeBlocks ? state : { timeBlocks }
    })
})
