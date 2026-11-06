import { useDomainStore, useUiStore } from "@renderer/store"
import { formatClock, stopActiveTimer, timerEndMs } from "@renderer/utils/timer"
import { Square, Timer, Watch } from "lucide-react"
import { useEffect, useState } from "react"

/** Re-renders every second while a timer runs. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

/** Mounted once in App: finishes pomodoros even when the widget is hidden. */
export function useTimerCompletion(): void {
  const timer = useUiStore((state) => state.activeTimer)
  const taskExists = useDomainStore((state) =>
    timer ? state.tasks.some((task) => task.id === timer.taskId) : true
  )
  const now = useNow(Boolean(timer))

  useEffect(() => {
    if (timer && !taskExists) useUiStore.getState().stopTimer()
  }, [taskExists, timer])

  useEffect(() => {
    if (!timer) return
    const end = timerEndMs(timer)
    if (end === null || now < end) return
    const breakMin = useDomainStore.getState().preferences.pomodoroBreakMinutes
    stopActiveTimer()
    void window.api?.app?.notify(
      "Pomodoro complete",
      `Nice work — take a ${breakMin} minute break.`
    )
  }, [now, timer])
}

export function TimerWidget(): React.JSX.Element | null {
  const timer = useUiStore((state) => state.activeTimer)
  const openEditPanel = useUiStore((state) => state.openEditPanel)
  const title = useDomainStore((state) =>
    timer
      ? state.tasks.find((task) => task.id === timer.taskId)?.title
      : undefined
  )
  const now = useNow(Boolean(timer))
  if (!timer) return null

  const end = timerEndMs(timer)
  const clock = formatClock(
    end !== null ? end - now : now - Date.parse(timer.startAt)
  )
  const Icon = timer.mode === "pomodoro" ? Timer : Watch

  return (
    <div
      className="flex h-5 items-center gap-1.5 rounded-full border border-app-border bg-app-hover pl-2 pr-1 text-[11px] text-app-text-secondary"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <Icon className="shrink-0 text-app-accent" size={12} />
      <button
        className="max-w-40 truncate hover:text-app-text"
        onClick={() => openEditPanel(timer.taskId)}
        title={title}
        type="button"
      >
        {title ?? "Task"}
      </button>
      <span className="tabular-nums text-app-text">{clock}</span>
      <button
        aria-label="Stop timer"
        className="flex size-4 items-center justify-center rounded-full hover:bg-app-active hover:text-app-text"
        onClick={stopActiveTimer}
        title="Stop and log session"
        type="button"
      >
        <Square fill="currentColor" size={8} />
      </button>
    </div>
  )
}
