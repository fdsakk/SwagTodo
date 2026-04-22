import { DEFAULT_APPEARANCE, DEFAULT_PK_SETTINGS, UI_SCALE_OPTIONS } from '@renderer/types'
import type { DomainState } from '../shared/types'

export const createInitialDomainState = (): DomainState => ({
  tasks: [],
  projects: [],
  labels: [],
  sessions: [],
  timeBlocks: [],
  medications: [],
  pkSettings: DEFAULT_PK_SETTINGS,
  uiScale: UI_SCALE_OPTIONS[0],
  isSidebarCollapsed: true,
  appearance: DEFAULT_APPEARANCE
})
