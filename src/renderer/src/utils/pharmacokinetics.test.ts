import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_PK_SETTINGS, type MedicationLog } from "@renderer/types"
import { generateDailyChartData } from "./pharmacokinetics"

const logAt = (
  takenAt: string,
  overrides: Partial<MedicationLog> = {}
): MedicationLog => ({
  id: overrides.id ?? "log-1",
  medId: overrides.medId ?? "medikinet-ir",
  medName: overrides.medName ?? "Medikinet IR",
  dose: overrides.dose ?? 10,
  takenAt,
  createdAt: overrides.createdAt ?? takenAt
})

test("generateDailyChartData creates full-day 5 minute curve with effect after dose", () => {
  const points = generateDailyChartData(
    [logAt("2026-04-29T08:00:00")],
    "2026-04-29",
    DEFAULT_PK_SETTINGS
  )

  assert.equal(points.length, 289)
  assert.deepEqual(points[0], {
    timeLabel: "00:00",
    minuteOfDay: 0,
    concentration: 0,
    crashRisk: false,
    band: "below"
  })

  const maxPoint = points.reduce((max, point) =>
    point.concentration > max.concentration ? point : max
  )
  assert.ok(maxPoint.minuteOfDay > 8 * 60)
  assert.ok(maxPoint.concentration > 0.2)
  assert.ok(points.some((point) => point.band === "therapeutic"))
})

test("generateDailyChartData supports 10 minute step and dose scaling", () => {
  const lowDose = generateDailyChartData(
    [logAt("2026-04-29T08:00:00", { dose: 10 })],
    "2026-04-29",
    DEFAULT_PK_SETTINGS,
    { stepMinutes: 10 }
  )
  const highDose = generateDailyChartData(
    [logAt("2026-04-29T08:00:00", { dose: 20 })],
    "2026-04-29",
    DEFAULT_PK_SETTINGS,
    { stepMinutes: 10 }
  )

  assert.equal(lowDose.length, 145)
  assert.equal(lowDose[1].minuteOfDay, 10)

  const lowMax = Math.max(...lowDose.map((point) => point.concentration))
  const highMax = Math.max(...highDose.map((point) => point.concentration))
  assert.ok(highMax > lowMax * 1.8)
})

test("generateDailyChartData ignores unknown medication ids", () => {
  const points = generateDailyChartData(
    [logAt("2026-04-29T08:00:00", { medId: "unknown", medName: "Unknown" })],
    "2026-04-29",
    DEFAULT_PK_SETTINGS
  )

  assert.ok(points.every((point) => point.concentration === 0))
  assert.ok(points.every((point) => point.band === "below"))
})
