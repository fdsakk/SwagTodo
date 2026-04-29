import { v4 as uuidv4 } from "uuid"
import type { DomainActions, DomainStoreSet } from "../../shared/types"
import { nowIso, removeById } from "../../shared/utils"

type HealthActions = Pick<
  DomainActions,
  | "addMedicationLog"
  | "updateMedicationLog"
  | "deleteMedicationLog"
  | "updateChartSettings"
>

const hasChartPatchChanges = (
  current: Parameters<HealthActions["updateChartSettings"]>[0],
  patch: Parameters<HealthActions["updateChartSettings"]>[0]
): boolean =>
  Object.entries(patch).some(
    ([key, value]) => current[key as keyof typeof current] !== value
  )

export const createHealthActions = (set: DomainStoreSet): HealthActions => ({
  addMedicationLog: (input) => {
    const medicationLog = { id: uuidv4(), ...input, createdAt: nowIso() }
    set((state) => ({ medications: [...state.medications, medicationLog] }))
  },
  updateMedicationLog: (id, takenAt) =>
    set((state) => {
      const index = state.medications.findIndex(
        (medication) => medication.id === id
      )
      if (index === -1) return state
      if (state.medications[index].takenAt === takenAt) return state

      const medications = state.medications.slice()
      medications[index] = { ...medications[index], takenAt }
      return { medications }
    }),
  deleteMedicationLog: (id) =>
    set((state) => {
      const medications = removeById(state.medications, id)
      return medications === state.medications ? state : { medications }
    }),
  updateChartSettings: (patch) =>
    set((state) =>
      hasChartPatchChanges(state.pkSettings, patch)
        ? { pkSettings: { ...state.pkSettings, ...patch } }
        : state
    )
})
