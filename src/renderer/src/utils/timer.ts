import { toastManager } from "@renderer/components/ui/toast-manager"
import type { ActiveTimer } from "@renderer/store"
import { useDomainStore, useUiStore } from "@renderer/store"

const MIN_SESSION_MS = 60_000

export const timerEndMs = (timer: ActiveTimer): number | null =>
  timer.mode === "pomodoro" && timer.durationMin
    ? Date.parse(timer.startAt) + timer.durationMin * 60_000
    : null

export const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

/** Stops the running timer and logs it as a session when long enough. */
export function stopActiveTimer(): void {
  const { activeTimer, stopTimer } = useUiStore.getState()
  if (!activeTimer) return
  stopTimer()

  const startMs = Date.parse(activeTimer.startAt)
  const endMs = Math.min(Date.now(), timerEndMs(activeTimer) ?? Date.now())
  if (!Number.isFinite(startMs) || endMs - startMs < MIN_SESSION_MS) {
    toastManager.add({
      title: "Timer stopped",
      description: "Under a minute — nothing was logged.",
      type: "info"
    })
    return
  }

  const result = useDomainStore.getState().addSession({
    taskId: activeTimer.taskId,
    startAt: activeTimer.startAt,
    endAt: new Date(endMs).toISOString()
  })
  if (!result.ok) {
    toastManager.add({
      title: "Session not logged",
      description: result.error,
      type: "error"
    })
    return
  }
  toastManager.add({
    title: `Logged ${Math.round((endMs - startMs) / 60_000)} min`,
    type: "success"
  })
}

export function startTaskTimer(
  taskId: string,
  mode: ActiveTimer["mode"]
): void {
  const domain = useDomainStore.getState()
  const task = domain.tasks.find((t) => t.id === taskId)
  if (!task) return
  if (!task.projectId) {
    toastManager.add({
      title: "Assign a project first",
      description: "Tracked time is stored per project in Sessions.",
      type: "warning"
    })
    return
  }
  stopActiveTimer()
  useUiStore.getState().startTimer({
    taskId,
    startAt: new Date().toISOString(),
    mode,
    durationMin:
      mode === "pomodoro" ? domain.preferences.pomodoroWorkMinutes : undefined
  })
}
