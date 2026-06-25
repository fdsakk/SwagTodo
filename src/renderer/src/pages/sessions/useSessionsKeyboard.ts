import { addDays, addMonths, startOfDay } from "@renderer/utils/calendar"
import { useEffect } from "react"
import { DAY_OPTIONS, type DayCount, type ViewMode } from "./SessionsToolbar"

interface Args {
  mode: ViewMode
  blocked: boolean
  setAnchor: (updater: (current: Date) => Date) => void
  setMode: (updater: (current: ViewMode) => ViewMode) => void
}

export function useSessionsKeyboard({
  mode,
  blocked,
  setAnchor,
  setMode
}: Args): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable)
          return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (blocked) return

      // In days mode arrows step by the visible span; in month mode by a month;
      // in agenda mode by a week.
      const step = (dir: -1 | 1) => (d: Date) => {
        if (mode.kind === "month") return addMonths(d, dir)
        const span = mode.kind === "days" ? mode.count : 7
        return addDays(d, dir * span)
      }

      if (e.key === "[") {
        e.preventDefault()
        setAnchor(step(-1))
      } else if (e.key === "]") {
        e.preventDefault()
        setAnchor(step(1))
      } else if (e.key.toLowerCase() === "d" && mode.kind === "days") {
        e.preventDefault()
        const idx = DAY_OPTIONS.indexOf(mode.count)
        const next = DAY_OPTIONS[(idx + 1) % DAY_OPTIONS.length] as DayCount
        setMode(() => ({ kind: "days", count: next }))
      } else if (e.key.toLowerCase() === "g") {
        e.preventDefault()
        setAnchor(() => startOfDay(new Date()))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode, blocked, setAnchor, setMode])
}
