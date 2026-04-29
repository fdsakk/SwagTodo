import { addDays, startOfDay } from "@renderer/utils/calendar"
import { useEffect } from "react"
import { DAY_OPTIONS, type DayCount } from "./SessionsToolbar"

interface Args {
  dayCount: DayCount
  blocked: boolean
  setAnchor: (updater: (current: Date) => Date) => void
  setDayCount: (updater: (current: DayCount) => DayCount) => void
}

export function useSessionsKeyboard({
  dayCount,
  blocked,
  setAnchor,
  setDayCount
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
      if (e.key === "[") {
        e.preventDefault()
        setAnchor((current) => addDays(current, -dayCount))
      } else if (e.key === "]") {
        e.preventDefault()
        setAnchor((current) => addDays(current, dayCount))
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault()
        setDayCount((current) => {
          const idx = DAY_OPTIONS.indexOf(current)
          return DAY_OPTIONS[(idx + 1) % DAY_OPTIONS.length] ?? current
        })
      } else if (e.key.toLowerCase() === "g") {
        e.preventDefault()
        setAnchor(() => startOfDay(new Date()))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dayCount, blocked, setAnchor, setDayCount])
}
