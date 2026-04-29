export const HOUR_PX = 48
export const SLOT_MIN = 15
export const PX_PER_MIN = HOUR_PX / 60

const pad = (n: number): string => (n < 10 ? `0${n}` : String(n))

export const startOfDay = (d: Date): Date => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const addDays = (d: Date, days: number): Date => {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const formatHM = (totalMin: number): string => {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${pad(h)}:${pad(m)}`
}

export const clampMin = (m: number): number => Math.max(0, Math.min(24 * 60, m))

export const snapMin = (m: number): number =>
  Math.round(m / SLOT_MIN) * SLOT_MIN

export const buildIsoAtMinutes = (day: Date, minutes: number): string => {
  const d = new Date(day)
  d.setHours(0, 0, 0, 0)
  d.setMinutes(minutes)
  return d.toISOString()
}

export const pointToMinutes = (
  clientY: number,
  columnEl: HTMLElement
): number => {
  const rect = columnEl.getBoundingClientRect()
  const y = clientY - rect.top
  return clampMin(snapMin(y / PX_PER_MIN))
}
