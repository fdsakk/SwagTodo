import type { Label, Priority, Project, Recurrence } from "@renderer/types"
import { addDays, addMonths, addWeeks, format, getDay } from "date-fns"

export interface QuickAddResult {
  title: string
  dueDate?: string
  dueTime?: string
  priority?: Priority
  projectId?: string
  labelIds: string[]
  /** `#names` that do not match an existing label. */
  newLabels: string[]
  recurrence?: Recurrence
}

interface ParseContext {
  projects: readonly Project[]
  labels: readonly Label[]
  now?: Date
}

/** Lowercase, strip diacritics (incl. Polish ł) and trailing punctuation. */
const fold = (word: string): string =>
  word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[,;.]+$/, "")

const WEEKDAY_WORDS: Record<string, number> = {}
const WEEKDAY_ABBR: Record<string, number> = {}
const addWords = (
  target: Record<string, number>,
  day: number,
  words: string[]
): void => {
  for (const word of words) target[word] = day
}
addWords(WEEKDAY_WORDS, 0, ["sunday", "niedziela", "niedziele", "niedzieli"])
addWords(WEEKDAY_WORDS, 1, ["monday", "poniedzialek", "poniedzialku"])
addWords(WEEKDAY_WORDS, 2, ["tuesday", "wtorek", "wtorku"])
addWords(WEEKDAY_WORDS, 3, ["wednesday", "sroda", "srode", "srody"])
addWords(WEEKDAY_WORDS, 4, ["thursday", "czwartek", "czwartku"])
addWords(WEEKDAY_WORDS, 5, ["friday", "piatek", "piatku"])
addWords(WEEKDAY_WORDS, 6, ["saturday", "sobota", "sobote", "soboty"])
addWords(WEEKDAY_ABBR, 0, ["sun", "nd", "ndz", "niedz"])
addWords(WEEKDAY_ABBR, 1, ["mon", "pon"])
addWords(WEEKDAY_ABBR, 2, ["tue", "tues", "wt"])
addWords(WEEKDAY_ABBR, 3, ["wed", "sr"])
addWords(WEEKDAY_ABBR, 4, ["thu", "thur", "thurs", "czw"])
addWords(WEEKDAY_ABBR, 5, ["fri", "pt", "pia"])
addWords(WEEKDAY_ABBR, 6, ["sat", "sob"])

/** Words that make a following short weekday abbreviation unambiguous. */
const WEEKDAY_PREFIX = new Set(["on", "next", "w", "we", "do", "every", "co"])
const DATE_PREFIX = new Set(["on", "w", "we", "do", "due", "na"])

const TODAY = new Set(["today", "tod", "dzis", "dzisiaj"])
const TOMORROW = new Set(["tomorrow", "tmr", "tmrw", "jutro"])

type Unit = "day" | "week" | "month" | "year"
const UNITS: Record<string, Unit> = {}
const addUnit = (unit: Unit, words: string[]): void => {
  for (const word of words) UNITS[word] = unit
}
addUnit("day", ["day", "days", "dzien", "dni", "dnia"])
addUnit("week", ["week", "weeks", "tydzien", "tygodnie", "tygodni", "tygodnia"])
addUnit("month", [
  "month",
  "months",
  "miesiac",
  "miesiace",
  "miesiecy",
  "miesiaca"
])
addUnit("year", ["year", "years", "rok", "lata", "lat", "roku"])

const UNIT_FREQ: Record<Unit, Recurrence["freq"]> = {
  day: "daily",
  week: "weekly",
  month: "monthly",
  year: "yearly"
}

const STANDALONE_RECURRENCE: Record<string, Recurrence> = {
  daily: { freq: "daily", interval: 1 },
  codziennie: { freq: "daily", interval: 1 },
  weekly: { freq: "weekly", interval: 1 },
  cotygodniowo: { freq: "weekly", interval: 1 },
  monthly: { freq: "monthly", interval: 1 },
  comiesiecznie: { freq: "monthly", interval: 1 },
  yearly: { freq: "yearly", interval: 1 },
  annually: { freq: "yearly", interval: 1 },
  corocznie: { freq: "yearly", interval: 1 },
  weekdays: { freq: "weekly", interval: 1, weekdays: [1, 2, 3, 4, 5] }
}
const RECURRENCE_PREFIX = new Set(["every", "co", "kazdy", "kazdego", "kazda"])

const ymd = (date: Date): string => format(date, "yyyy-MM-dd")

const nextWeekday = (today: Date, day: number, includeToday: boolean): Date => {
  const diff = (day - getDay(today) + 7) % 7
  return addDays(today, diff === 0 && !includeToday ? 7 : diff)
}

const shiftBy = (today: Date, amount: number, unit: Unit): Date => {
  if (unit === "day") return addDays(today, amount)
  if (unit === "week") return addWeeks(today, amount)
  if (unit === "month") return addMonths(today, amount)
  return addMonths(today, amount * 12)
}

const parseTime = (word: string): string | undefined => {
  const hm = /^(\d{1,2}):(\d{2})$/.exec(word)
  if (hm) {
    const h = Number(hm[1])
    const m = Number(hm[2])
    if (h < 24 && m < 60)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    return undefined
  }
  const ampm = /^(\d{1,2})(?::(\d{2}))?(am|pm)$/.exec(word)
  if (ampm) {
    let h = Number(ampm[1])
    const m = Number(ampm[2] ?? 0)
    if (h < 1 || h > 12 || m > 59) return undefined
    if (ampm[3] === "pm" && h !== 12) h += 12
    if (ampm[3] === "am" && h === 12) h = 0
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }
  return undefined
}

const parseExplicitDate = (word: string, today: Date): string | undefined => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(word)) return word
  const match = /^(\d{1,2})[./](\d{1,2})(?:[./](\d{2}|\d{4}))?$/.exec(word)
  if (!match) return undefined
  const day = Number(match[1])
  const month = Number(match[2])
  if (day < 1 || day > 31 || month < 1 || month > 12) return undefined
  let year = match[3] ? Number(match[3]) : today.getFullYear()
  if (year < 100) year += 2000
  let date = new Date(year, month - 1, day)
  if (date.getMonth() !== month - 1) return undefined
  if (!match[3] && ymd(date) < ymd(today))
    date = new Date(year + 1, month - 1, day)
  return ymd(date)
}

export function parseQuickAdd(
  input: string,
  context: ParseContext
): QuickAddResult {
  const today = context.now ?? new Date()
  const words = input.trim().split(/\s+/).filter(Boolean)
  const folded = words.map(fold)
  const result: QuickAddResult = { title: "", labelIds: [], newLabels: [] }
  const titleWords: string[] = []

  const weekdayAt = (index: number, allowAbbr: boolean): number | undefined => {
    const word = folded[index]
    if (word === undefined) return undefined
    if (word in WEEKDAY_WORDS) return WEEKDAY_WORDS[word]
    if (allowAbbr && word in WEEKDAY_ABBR) return WEEKDAY_ABBR[word]
    return undefined
  }

  const matchLabel = (i: number): number => {
    const m = /^#(\S+)$/.exec(words[i])
    if (!m) return 0
    const name = m[1].replace(/_/g, " ")
    const label = context.labels.find(
      (l) => l.name.toLowerCase() === name.toLowerCase()
    )
    if (label) {
      if (!result.labelIds.includes(label.id)) result.labelIds.push(label.id)
    } else if (!result.newLabels.includes(name)) {
      result.newLabels.push(name)
    }
    return 1
  }

  const matchProject = (i: number): number => {
    const m = /^@(\S+)$/.exec(words[i])
    if (!m) return 0
    const needle = fold(m[1]).replace(/_/g, "")
    const key = (p: Project): string => fold(p.name).replace(/\s+/g, "")
    const project =
      context.projects.find((p) => key(p) === needle) ??
      context.projects.find((p) => key(p).startsWith(needle))
    if (!project) return 0
    result.projectId = project.id
    return 1
  }

  const matchPriority = (i: number): number => {
    const m = /^(?:p|!)([1-4])$/i.exec(words[i])
    if (!m) return 0
    result.priority = `p${m[1]}` as Priority
    return 1
  }

  const matchRecurrence = (i: number): number => {
    const word = folded[i]
    if (word in STANDALONE_RECURRENCE) {
      result.recurrence = { ...STANDALONE_RECURRENCE[word] }
      return 1
    }
    if (
      word === "w" &&
      folded[i + 1] === "dni" &&
      folded[i + 2] === "robocze"
    ) {
      result.recurrence = { ...STANDALONE_RECURRENCE.weekdays }
      return 3
    }
    if (!RECURRENCE_PREFIX.has(word)) return 0

    const next = folded[i + 1]
    if (next === undefined) return 0
    if (next === "weekday" || next === "workday") {
      result.recurrence = { ...STANDALONE_RECURRENCE.weekdays }
      return 2
    }
    if (next in UNITS) {
      result.recurrence = { freq: UNIT_FREQ[UNITS[next]], interval: 1 }
      return 2
    }
    if (/^\d+$/.test(next) && folded[i + 2] in UNITS) {
      result.recurrence = {
        freq: UNIT_FREQ[UNITS[folded[i + 2]]],
        interval: Math.max(1, Number(next))
      }
      return 3
    }
    const weekdays: number[] = []
    let j = i + 1
    while (j < words.length) {
      const day = weekdayAt(j, true)
      if (day !== undefined) {
        if (!weekdays.includes(day)) weekdays.push(day)
        j++
      } else if (folded[j] === "and" || folded[j] === "i") {
        if (weekdayAt(j + 1, true) === undefined) break
        j++
      } else break
    }
    if (weekdays.length === 0) return 0
    result.recurrence = { freq: "weekly", interval: 1, weekdays }
    return j - i
  }

  const matchDate = (i: number): number => {
    const word = folded[i]
    const setDate = (date: Date, consumed: number): number => {
      result.dueDate = ymd(date)
      return consumed
    }
    if (TODAY.has(word)) return setDate(today, 1)
    if (TOMORROW.has(word)) return setDate(addDays(today, 1), 1)
    if (word === "pojutrze") return setDate(addDays(today, 2), 1)
    if (
      word === "day" &&
      folded[i + 1] === "after" &&
      folded[i + 2] === "tomorrow"
    )
      return setDate(addDays(today, 2), 3)

    const nextMonday = (): Date => nextWeekday(today, 1, false)
    if (word === "next" && folded[i + 1] === "week")
      return setDate(nextMonday(), 2)
    if (word === "przyszly" && folded[i + 1] === "tydzien")
      return setDate(nextMonday(), 2)
    if (
      word === "w" &&
      folded[i + 1] === "przyszlym" &&
      folded[i + 2] === "tygodniu"
    )
      return setDate(nextMonday(), 3)

    if (word === "in" || word === "za") {
      const amount = folded[i + 1]
      if (/^\d+$/.test(amount ?? "") && folded[i + 2] in UNITS)
        return setDate(shiftBy(today, Number(amount), UNITS[folded[i + 2]]), 3)
      if (amount in UNITS) return setDate(shiftBy(today, 1, UNITS[amount]), 2)
      return 0
    }

    const prefixed = WEEKDAY_PREFIX.has(word) && !RECURRENCE_PREFIX.has(word)
    if (prefixed) {
      const day = weekdayAt(i + 1, true)
      if (day !== undefined) return setDate(nextWeekday(today, day, false), 2)
      if (DATE_PREFIX.has(word)) {
        const explicit = parseExplicitDate(folded[i + 1] ?? "", today)
        if (explicit) {
          result.dueDate = explicit
          return 2
        }
      }
    }
    const day = weekdayAt(i, false)
    if (day !== undefined) return setDate(nextWeekday(today, day, false), 1)

    const explicit = parseExplicitDate(word, today)
    if (explicit) {
      result.dueDate = explicit
      return 1
    }
    return 0
  }

  const matchTime = (i: number): number => {
    const word = folded[i]
    const direct = parseTime(word)
    if (direct) {
      result.dueTime = direct
      return 1
    }
    if (word === "at" || word === "o" || word === "godz") {
      const next = folded[i + 1] ?? ""
      const time =
        parseTime(next) ??
        (/^\d{1,2}$/.test(next) && Number(next) < 24
          ? `${next.padStart(2, "0")}:00`
          : undefined)
      if (time) {
        result.dueTime = time
        return 2
      }
    }
    return 0
  }

  const matchers = [
    matchLabel,
    matchProject,
    matchPriority,
    matchRecurrence,
    matchDate,
    matchTime
  ]

  let i = 0
  while (i < words.length) {
    let consumed = 0
    for (const matcher of matchers) {
      consumed = matcher(i)
      if (consumed > 0) break
    }
    if (consumed > 0) i += consumed
    else titleWords.push(words[i++])
  }

  if (result.recurrence && !result.dueDate) {
    const days = result.recurrence.weekdays
    result.dueDate = ymd(
      days?.length
        ? days
            .map((d) => nextWeekday(today, d, true))
            .sort((a, b) => a.getTime() - b.getTime())[0]
        : today
    )
  }
  if (result.dueTime && !result.dueDate) result.dueDate = ymd(today)

  result.title = titleWords.join(" ")
  return result
}
