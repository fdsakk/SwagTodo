import type { Recurrence } from "@renderer/types"
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  getDay,
  isAfter,
  parseISO,
  startOfDay
} from "date-fns"

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const UNIT: Record<Recurrence["freq"], string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year"
}

/** Monday-based index so a week boundary falls between Sunday and Monday. */
const mondayIndex = (date: Date): number => (getDay(date) + 6) % 7

const step = (rule: Recurrence, date: Date): Date => {
  const interval = Math.max(1, Math.floor(rule.interval || 1))
  switch (rule.freq) {
    case "daily":
      return addDays(date, interval)
    case "monthly":
      return addMonths(date, interval)
    case "yearly":
      return addYears(date, interval)
    case "weekly": {
      const days = new Set(rule.weekdays ?? [])
      if (days.size === 0) return addWeeks(date, interval)
      for (let offset = 1; offset <= 7; offset++) {
        const candidate = addDays(date, offset)
        if (!days.has(getDay(candidate))) continue
        const wrapped = mondayIndex(candidate) <= mondayIndex(date)
        return wrapped && interval > 1
          ? addWeeks(candidate, interval - 1)
          : candidate
      }
      return addWeeks(date, interval)
    }
  }
}

/**
 * Next due date ("yyyy-MM-dd") after completing an occurrence.
 * Schedule-based rules skip occurrences that would already be in the past.
 */
export function nextDueDate(
  rule: Recurrence,
  dueDate: string | undefined,
  today: Date = new Date()
): string {
  const todayStart = startOfDay(today)
  const base =
    rule.fromCompletion || !dueDate ? todayStart : startOfDay(parseISO(dueDate))
  let next = step(rule, base)
  for (let guard = 0; guard < 2000 && !isAfter(next, todayStart); guard++) {
    next = step(rule, next)
  }
  return format(next, "yyyy-MM-dd")
}

export function describeRecurrence(rule: Recurrence): string {
  const interval = Math.max(1, Math.floor(rule.interval || 1))
  const unit = UNIT[rule.freq]
  let text = interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`
  if (rule.freq === "weekly" && rule.weekdays?.length) {
    const sorted = [...rule.weekdays].sort(
      (a, b) => ((a + 6) % 7) - ((b + 6) % 7)
    )
    text += ` on ${sorted.map((d) => WEEKDAY_SHORT[d]).join(", ")}`
  }
  if (rule.fromCompletion) text += " after completion"
  return text
}
