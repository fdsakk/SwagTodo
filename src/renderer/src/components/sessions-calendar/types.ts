import type { Project, Task, TaskSession, TimeBlock } from '@renderer/types'

export const DAY_MS = 24 * 60 * 60 * 1000

export interface SessionBlock {
  session: TaskSession
  task: Task | undefined
  project: Project | undefined
  startMin: number
  endMin: number
  dayIndex: number
}

export interface TimeBlockDisplayBlock {
  block: TimeBlock
  startMin: number
  endMin: number
  dayIndex: number
}

export type DraftCreate = {
  kind: 'create'
  dayIndex: number
  startMin: number
  endMin: number
}

export type DraftMove = {
  kind: 'move'
  sessionId: string
  dayIndex: number
  startMin: number
  endMin: number
}

export type DraftResize = {
  kind: 'resize'
  sessionId: string
  dayIndex: number
  startMin: number
  endMin: number
}

export type DraftTimeBlockMove = {
  kind: 'tb_move'
  blockId: string
  dayIndex: number
  startMin: number
  endMin: number
}

export type DraftTimeBlockResize = {
  kind: 'tb_resize'
  blockId: string
  dayIndex: number
  startMin: number
  endMin: number
}

export type Draft =
  | DraftCreate
  | DraftMove
  | DraftResize
  | DraftTimeBlockMove
  | DraftTimeBlockResize

export interface PendingDraft {
  dayIndex: number
  startMin: number
  endMin: number
}

export const computeBlocks = (
  sessions: readonly TaskSession[],
  days: Date[],
  taskMap: Map<string, Task>,
  projectMap: Map<string, Project>
): SessionBlock[] => {
  if (days.length === 0) return []
  const rangeStart = days[0].getTime()
  const rangeEnd = days[days.length - 1].getTime() + DAY_MS
  const blocks: SessionBlock[] = []
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const startMs = Date.parse(s.startAt)
    const endMs = Date.parse(s.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    if (endMs <= rangeStart || startMs >= rangeEnd) continue
    for (let d = 0; d < days.length; d++) {
      const dayStart = days[d].getTime()
      const dayEnd = dayStart + DAY_MS
      if (endMs <= dayStart || startMs >= dayEnd) continue
      const sd = startMs <= dayStart ? null : new Date(startMs)
      const startMin = sd ? sd.getHours() * 60 + sd.getMinutes() : 0
      const ed = endMs >= dayEnd ? null : new Date(endMs)
      const endMin = ed ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60
      if (endMin <= startMin) continue
      blocks.push({
        session: s,
        task: taskMap.get(s.taskId),
        project: projectMap.get(s.projectId),
        startMin,
        endMin,
        dayIndex: d
      })
    }
  }
  return blocks
}

export const computeTimeBlockDisplayBlocks = (
  timeBlocks: readonly TimeBlock[],
  days: Date[]
): TimeBlockDisplayBlock[] => {
  if (days.length === 0) return []
  const rangeStart = days[0].getTime()
  const rangeEnd = days[days.length - 1].getTime() + DAY_MS
  const out: TimeBlockDisplayBlock[] = []
  for (let i = 0; i < timeBlocks.length; i++) {
    const b = timeBlocks[i]
    const startMs = Date.parse(b.startAt)
    const endMs = Date.parse(b.endAt)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    if (endMs <= rangeStart || startMs >= rangeEnd) continue
    for (let d = 0; d < days.length; d++) {
      const dayStart = days[d].getTime()
      const dayEnd = dayStart + DAY_MS
      if (endMs <= dayStart || startMs >= dayEnd) continue
      const sd = startMs <= dayStart ? null : new Date(startMs)
      const startMin = sd ? sd.getHours() * 60 + sd.getMinutes() : 0
      const ed = endMs >= dayEnd ? null : new Date(endMs)
      const endMin = ed ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60
      if (endMin <= startMin) continue
      out.push({ block: b, startMin, endMin, dayIndex: d })
    }
  }
  return out
}
