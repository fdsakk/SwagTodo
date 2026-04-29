export const today = (): string => new Date().toISOString().slice(0, 10)

export const isoToTimeInput = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const timeInputToIso = (date: string, timeValue: string): string => {
  const [h, m] = timeValue.split(':').map(Number)
  const d = new Date(`${date}T00:00:00`)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
