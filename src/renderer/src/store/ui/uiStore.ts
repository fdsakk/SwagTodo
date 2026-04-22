import { create } from 'zustand'
import type { UiStore } from '../shared/types'
import { createUiActions } from './actions'
import { createInitialUiState } from './state'

export const useUiStore = create<UiStore>()((set, get) => ({
  ...createInitialUiState(),
  ...createUiActions(set, get)
}))
