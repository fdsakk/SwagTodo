import type { MedicationLog, PkSettings } from '@renderer/types'

export interface MedPreset {
  id: string
  name: string
  dose: number
  unit: string
}

interface PkComponent {
  fraction: number
  ka: number // absorption rate [1/h]
  ke: number // elimination rate [1/h]
}

interface PkDef {
  components: PkComponent[]
  baseDurationH: number
  /** Default ke0 for this drug class (effect-site equilibration rate [1/h]).
   *  Higher = faster onset and faster offset relative to plasma.
   *  MPH ~1.5 (fast CNS penetration), Amph ~1.2, LDX ~0.8 (prodrug delay). */
  defaultKe0: number
  /** Reference dose in mg. dose/refDoseMg = Y scale factor so 1 ref-dose → peak 1.0. */
  refDoseMg: number
}

interface EffectCurveCacheEntry {
  curve: Float32Array
  durationH: number
  refDoseMg: number
}

const EFFECT_CURVE_CACHE = new Map<string, EffectCurveCacheEntry>()

/**
 * Base PK definitions (plasma compartment only).
 * Sources: MPH t½≈2.5h, Concerta OROS Tmax≈6.8h, Dexamp t½≈10h, LDX active Tmax≈4h t½≈10h.
 * refDoseMg = lowest commonly prescribed dose for that formulation.
 */
const PK_DEFS: Record<string, PkDef> = {
  'medikinet-ir': {
    components: [{ fraction: 1.0, ka: 2.0, ke: 0.55 }],
    baseDurationH: 3.5,
    defaultKe0: 1.5,
    refDoseMg: 10
  },
  'medikinet-cr': {
    components: [
      { fraction: 0.5, ka: 2.0, ke: 0.55 },
      { fraction: 0.5, ka: 0.7, ke: 0.32 }
    ],
    baseDurationH: 5,
    defaultKe0: 1.5,
    refDoseMg: 20
  },
  concerta: {
    components: [
      { fraction: 0.22, ka: 4.0, ke: 0.2 },
      { fraction: 0.78, ka: 0.28, ke: 0.2 }
    ],
    baseDurationH: 10,
    defaultKe0: 1.5,
    refDoseMg: 18
  },
  dexamp: {
    components: [{ fraction: 1.0, ka: 0.8, ke: 0.07 }],
    baseDurationH: 5,
    defaultKe0: 1.2,
    refDoseMg: 5
  },
  elvanse: {
    components: [{ fraction: 1.0, ka: 0.5, ke: 0.07 }],
    baseDurationH: 11,
    defaultKe0: 0.8,
    refDoseMg: 20
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
  /** Normalized effect 0..N (summed, scaled by dose/doseRef and peakScale). */
  concentration: number
  /** True if dC/dt < crashThreshold at this point. */
  crashRisk: boolean
  /** "below" | "therapeutic" | "above" — position relative to MEC/MTC band. */
  band: 'below' | 'therapeutic' | 'above'
}

/** 5-minute resolution → smooth curve. XAxis tick every 12th point = 1 hour. */
export const CHART_TICK_INTERVAL = 11

/**
 * Build a per-med PK def with user-overridden keMultiplier and tMaxOffsetH applied.
 * keMultiplier scales all elimination rates; tMaxOffsetH shifts the effective intake time.
 */
function applyUserParams(def: PkDef, keMultiplier: number): PkDef {
  return {
    ...def,
    components: def.components.map((c) => ({
      ...c,
      // ke must stay < ka or Bateman equation flips sign — cap at 95% of ka
      ke: Math.min(c.ke * keMultiplier, c.ka * 0.95)
    }))
  }
}

const effectCurveCacheKey = (medId: string, keMultiplier: number): string =>
  `${medId}|${keMultiplier.toFixed(4)}`

function getEffectCurveCached(
  medId: string,
  keMultiplier: number
): EffectCurveCacheEntry | undefined {
  const baseDef = PK_DEFS[medId]
  if (!baseDef) return undefined
  const key = effectCurveCacheKey(medId, keMultiplier)
  const hit = EFFECT_CURVE_CACHE.get(key)
  if (hit) return hit

  const TAIL_H = 3
  const STEP_H = 5 / 60
  const def = applyUserParams(baseDef, keMultiplier)
  const durationH = def.baseDurationH + TAIL_H
  const created: EffectCurveCacheEntry = {
    curve: computeEffectSiteCurve(def, durationH, def.defaultKe0, STEP_H),
    durationH,
    refDoseMg: def.refDoseMg
  }
  EFFECT_CURVE_CACHE.set(key, created)
  return created
}

interface GenerateChartOptions {
  stepMinutes?: 5 | 10
}

/**
 * Shape the summed effect with an asymmetric one-pole filter:
 * - faster rise → keeps onset responsive
 * - slower fall → smooths peaks and stretches offset
 */
function smoothSummedEffect(rawEffects: number[], stepMinutes: number): number[] {
  if (rawEffects.length === 0) return []

  const riseTauMin = 22
  const fallTauMin = 68
  const riseAlpha = 1 - Math.exp(-stepMinutes / riseTauMin)
  const fallAlpha = 1 - Math.exp(-stepMinutes / fallTauMin)

  const shaped = new Array<number>(rawEffects.length)
  shaped[0] = Math.max(0, rawEffects[0])

  for (let i = 1; i < rawEffects.length; i++) {
    const target = Math.max(0, rawEffects[i])
    const prev = shaped[i - 1]
    const alpha = target >= prev ? riseAlpha : fallAlpha
    shaped[i] = prev + (target - prev) * alpha
  }

  return shaped
}

export function generateDailyChartData(
  logs: MedicationLog[],
  date: string,
  pkSettings: PkSettings,
  options: GenerateChartOptions = {}
): ChartPoint[] {
  const { peakScale, tMaxOffsetH, keMultiplier, mec, mtc, crashThreshold } = pkSettings
  const stepMinutes = options.stepMinutes ?? 5
  const dayStart = new Date(`${date}T00:00:00`).getTime()
  const STEP_H = stepMinutes / 60
  const TOTAL_MIN = 24 * 60

  const preparedLogs = logs
    .map((log) => {
      const curve = getEffectCurveCached(log.medId, keMultiplier)
      if (!curve) return null
      return {
        dose: log.dose,
        effectiveIntakeMs: Date.parse(log.takenAt) + tMaxOffsetH * 3_600_000,
        curve
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => !!entry)

  const rawEffects: number[] = []
  for (let minute = 0; minute <= TOTAL_MIN; minute += stepMinutes) {
    const absMs = dayStart + minute * 60_000
    let effect = 0

    for (const log of preparedLogs) {
      const hoursFromIntake = (absMs - log.effectiveIntakeMs) / 3_600_000
      const cache = log.curve
      if (hoursFromIntake < 0 || hoursFromIntake > cache.durationH) continue
      const idx = Math.round(hoursFromIntake / STEP_H)
      if (idx < cache.curve.length) {
        // Scale by actual dose relative to ref dose, then by peakScale (subjective sensitivity)
        effect += cache.curve[idx] * (log.dose / cache.refDoseMg) * peakScale
      }
    }

    rawEffects.push(effect)
  }

  const shapedEffects = smoothSummedEffect(rawEffects, stepMinutes)

  // Smooth slope over ~30 min window to avoid noise-induced split segments
  const SLOPE_WINDOW = Math.max(1, Math.round(15 / stepMinutes))
  const smoothSlope: number[] = shapedEffects.map((_, i) => {
    const lo = Math.max(0, i - SLOPE_WINDOW)
    const hi = Math.min(shapedEffects.length - 1, i + SLOPE_WINDOW)
    const deltaPerPoint = (shapedEffects[hi] - shapedEffects[lo]) / (hi - lo)
    return deltaPerPoint * (5 / stepMinutes)
  })

  const points: ChartPoint[] = []
  for (let i = 0; i < shapedEffects.length; i++) {
    const c = shapedEffects[i]
    const slope = smoothSlope[i]
    const crashRisk = slope < crashThreshold && c > mec * 0.5
    const band: ChartPoint['band'] = c >= mtc ? 'above' : c >= mec ? 'therapeutic' : 'below'

    const minute = i * stepMinutes
    const h = Math.floor(minute / 60)
    const m = minute % 60
    points.push({
      timeLabel: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      minuteOfDay: minute,
      concentration: c,
      crashRisk,
      band
    })
  }

  return points
}

export const MED_PRESETS: MedPreset[] = [
  { id: 'medikinet-ir', name: 'Medikinet IR', dose: 10, unit: 'mg' },
  { id: 'medikinet-ir', name: 'Medikinet IR', dose: 20, unit: 'mg' },
  { id: 'medikinet-cr', name: 'Medikinet CR', dose: 20, unit: 'mg' },
  { id: 'medikinet-cr', name: 'Medikinet CR', dose: 30, unit: 'mg' },
  { id: 'concerta', name: 'Concerta', dose: 18, unit: 'mg' },
  { id: 'concerta', name: 'Concerta', dose: 36, unit: 'mg' },
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
