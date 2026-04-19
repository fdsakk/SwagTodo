import type { MedicationLog, PkSettings } from '@renderer/types'

export interface MedPreset {
  id: string
  name: string
  dose: number
  unit: string
}

interface PkComponent {
  fraction: number
  ka: number  // absorption rate [1/h]
  ke: number  // elimination rate [1/h]
}

interface PkDef {
  components: PkComponent[]
  baseDurationH: number
  /** Default ke0 for this drug class (effect-site equilibration rate [1/h]).
   *  Higher = faster onset and faster offset relative to plasma.
   *  MPH ~1.5 (fast CNS penetration), Amph ~1.2, LDX ~0.8 (prodrug delay). */
  defaultKe0: number
}

/**
 * Base PK definitions (plasma compartment only).
 * Sources: MPH t½≈2.5h, Concerta OROS Tmax≈6.8h, Dexamp t½≈10h, LDX active Tmax≈4h t½≈10h.
 */
const PK_DEFS: Record<string, PkDef> = {
  'medikinet-ir': {
    components: [{ fraction: 1.0, ka: 2.0, ke: 0.55 }],
    baseDurationH: 3.5,
    defaultKe0: 1.5
  },
  'medikinet-cr': {
    components: [
      { fraction: 0.5, ka: 2.0, ke: 0.55 },
      { fraction: 0.5, ka: 0.7, ke: 0.32 }
    ],
    baseDurationH: 5,
    defaultKe0: 1.5
  },
  concerta: {
    components: [
      { fraction: 0.22, ka: 4.0, ke: 0.20 },
      { fraction: 0.78, ka: 0.28, ke: 0.20 }
    ],
    baseDurationH: 10,
    defaultKe0: 1.5
  },
  dexamp: {
    components: [{ fraction: 1.0, ka: 0.8, ke: 0.07 }],
    baseDurationH: 5,
    defaultKe0: 1.2
  },
  elvanse: {
    components: [{ fraction: 1.0, ka: 0.5, ke: 0.07 }],
    baseDurationH: 11,
    defaultKe0: 0.8
  }
}

/** Bateman equation, normalized so peak = 1.0. Returns 0..1. */
function batemanNorm(comp: PkComponent, t: number): number {
  if (t <= 0) return 0
  const { ka, ke } = comp
  if (Math.abs(ka - ke) < 1e-6) return 0
  const raw = Math.exp(-ke * t) - Math.exp(-ka * t)
  const tPeak = Math.log(ka / ke) / (ka - ke)
  const rawPeak = Math.exp(-ke * tPeak) - Math.exp(-ka * tPeak)
  return rawPeak > 0 ? raw / rawPeak : 0
}

/** Sum of normalized Bateman components = plasma concentration 0..1+ */
function plasmaConc(def: PkDef, t: number): number {
  let c = 0
  for (const comp of def.components) {
    c += comp.fraction * batemanNorm(comp, t)
  }
  return c
}

/**
 * Effect-site model using numerical integration (Euler, 5-min steps).
 *
 * The effect-site compartment equilibrates with plasma via:
 *   dCe/dt = ke0 * (Cp(t) - Ce(t))
 *
 * This produces:
 * - Onset delay (Ce lags behind Cp)
 * - Faster terminal offset (Ce falls faster than Cp once Cp drops)
 *
 * We pre-compute Ce on a fine grid and return normalized 0..1 values.
 */
function computeEffectSiteCurve(
  def: PkDef,
  durationH: number,
  ke0: number,
  stepH: number
): Float32Array {
  const n = Math.ceil(durationH / stepH) + 1
  const ce = new Float32Array(n)
  let ceVal = 0
  let maxCe = 0

  for (let i = 0; i < n; i++) {
    const t = i * stepH
    const cp = t <= def.baseDurationH ? plasmaConc(def, t) : 0
    // Euler step: dCe = ke0 * (Cp - Ce) * dt
    ceVal += ke0 * (cp - ceVal) * stepH
    ceVal = Math.max(0, ceVal)
    ce[i] = ceVal
    if (ceVal > maxCe) maxCe = ceVal
  }

  // Normalize so peak effect = 1.0
  if (maxCe > 0) {
    for (let i = 0; i < n; i++) ce[i] /= maxCe
  }

  return ce
}

export interface ChartPoint {
  timeLabel: string
  minuteOfDay: number
  concentration: number
}

/** 5-minute resolution → smooth curve. XAxis tick every 12th point = 1 hour. */
export const CHART_TICK_INTERVAL = 11

export function generateDailyChartData(
  logs: MedicationLog[],
  date: string,
  pkSettings: PkSettings
): ChartPoint[] {
  const dayStart = new Date(`${date}T00:00:00`).getTime()
  const STEP_MIN = 5
  const STEP_H = STEP_MIN / 60
  const TOTAL_MIN = 24 * 60

  // Pre-compute effect-site curves for each unique med in today's logs
  type CurveCache = { curve: Float32Array; durationH: number; sensitivity: number }
  const curveCache = new Map<string, CurveCache>()

  for (const log of logs) {
    const cacheKey = log.medId
    if (curveCache.has(cacheKey)) continue

    const def = PK_DEFS[log.medId]
    if (!def) continue

    const userSettings = pkSettings.perMed[log.medId]
    const ke0 = userSettings?.ke0 ?? def.defaultKe0
    const durationScale = userSettings?.durationScale ?? 1.0
    const sensitivity = userSettings?.sensitivity ?? 1.0

    const durationH = def.baseDurationH * durationScale
    // Add 1h buffer so effect-site tail decays naturally
    const computeH = durationH + 1.5

    const curve = computeEffectSiteCurve(def, computeH, ke0, STEP_H)
    curveCache.set(cacheKey, { curve, durationH: computeH, sensitivity })
  }

  const points: ChartPoint[] = []

  for (let minute = 0; minute <= TOTAL_MIN; minute += STEP_MIN) {
    const absMs = dayStart + minute * 60_000
    let effect = 0

    for (const log of logs) {
      const cache = curveCache.get(log.medId)
      if (!cache) continue

      const takenMs = new Date(log.takenAt).getTime()
      const hoursFromIntake = (absMs - takenMs) / 3_600_000

      if (hoursFromIntake < 0 || hoursFromIntake > cache.durationH) continue

      const idx = Math.round(hoursFromIntake / STEP_H)
      const ceNorm = idx < cache.curve.length ? cache.curve[idx] : 0

      // Scale by dose (relative to 10mg) and user sensitivity
      effect += ceNorm * (log.dose / 10) * cache.sensitivity
    }

    const h = Math.floor(minute / 60)
    const m = minute % 60
    const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    points.push({ timeLabel, minuteOfDay: minute, concentration: Math.max(0, effect) })
  }

  return points
}

export const MED_PRESETS: MedPreset[] = [
  { id: 'medikinet-ir', name: 'Medikinet IR', dose: 10, unit: 'mg' },
  { id: 'medikinet-ir', name: 'Medikinet IR', dose: 20, unit: 'mg' },
  { id: 'medikinet-cr', name: 'Medikinet CR', dose: 20, unit: 'mg' },
  { id: 'medikinet-cr', name: 'Medikinet CR', dose: 30, unit: 'mg' },
  { id: 'concerta', name: 'Concerta', dose: 18, unit: 'mg' },
  { id: 'concerta', name: 'Concerta', dose: 27, unit: 'mg' },
  { id: 'concerta', name: 'Concerta', dose: 36, unit: 'mg' },
  { id: 'dexamp', name: 'Dexamphetamine', dose: 5, unit: 'mg' },
  { id: 'elvanse', name: 'Elvanse', dose: 20, unit: 'mg' },
  { id: 'elvanse', name: 'Elvanse', dose: 30, unit: 'mg' },
  { id: 'elvanse', name: 'Elvanse', dose: 40, unit: 'mg' }
]

export const MED_IDS = [...new Set(MED_PRESETS.map((p) => p.id))]

export const MED_DISPLAY_NAME: Record<string, string> = {
  'medikinet-ir': 'Medikinet IR',
  'medikinet-cr': 'Medikinet CR',
  concerta: 'Concerta',
  dexamp: 'Dexamphetamine',
  elvanse: 'Elvanse'
}
