import { v4 as uuidv4 } from 'uuid'
import type { Label } from '@renderer/types'
import { normalizeLabelInput, normalizeLabelPatch } from '../../shared/normalize'
import type { DomainActions, DomainStoreSet } from '../../shared/types'
import { nowIso, removeById } from '../../shared/utils'
import { detachLabelFromTasks } from '../helpers/relations'

type LabelActions = Pick<DomainActions, 'addLabel' | 'updateLabel' | 'deleteLabel'>

export const createLabelActions = (set: DomainStoreSet): LabelActions => ({
  addLabel: (input) => {
    const normalized = normalizeLabelInput(input)
    if (!normalized) return ''

    const label: Label = { id: uuidv4(), ...normalized }
    set((state) => ({ labels: [...state.labels, label] }))
    return label.id
  },
  updateLabel: (labelId, updates) =>
    set((state) => {
      const index = state.labels.findIndex((label) => label.id === labelId)
      if (index === -1) return state

      const current = state.labels[index]
      const patch = normalizeLabelPatch(current, updates)
      if (!patch) return state

      const labels = state.labels.slice()
      labels[index] = { ...current, ...patch }
      return { labels }
    }),
  deleteLabel: (labelId) =>
    set((state) => {
      const labels = removeById(state.labels, labelId)
      if (labels === state.labels) return state

      const { tasks } = detachLabelFromTasks(state, labelId, nowIso())
      return { labels, tasks }
    })
})
