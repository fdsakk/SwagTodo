import type { TaskSession, TaskSessionStats } from '@renderer/types'

export const sessionsInRange = (
  sessions: readonly TaskSession[],
  fromIso: string,
  toIso: string
): TaskSession[] => {
  const from = Date.parse(fromIso)
  const to = Date.parse(toIso)
  if (!Number.isFinite(from) || !Number.isFinite(to)) return []
  const out: TaskSession[] = []
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const start = Date.parse(s.startAt)
    const end = Date.parse(s.endAt)
    if (end > from && start < to) out.push(s)
  }
  return out
}

export const computeTaskStats = (
  sessions: readonly TaskSession[],
  taskId: string,
  now: number = Date.now()
): TaskSessionStats => {
  let count = 0
  let totalMs = 0
  let lastEnd = 0
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    if (s.taskId !== taskId) continue
    const end = Date.parse(s.endAt)
    if (!Number.isFinite(end) || end > now) continue
    const start = Date.parse(s.startAt)
    if (!Number.isFinite(start)) continue
    count += 1
    totalMs += Math.max(0, end - start)
    if (end > lastEnd) lastEnd = end
  }
  return {
    count,
    totalMs,
    lastEndAt: lastEnd > 0 ? new Date(lastEnd).toISOString() : undefined
  }
}

export const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0m'
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
