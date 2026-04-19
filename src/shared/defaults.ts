import { UI_SCALE_OPTIONS, type SyncSettings, type UiScale } from './types'

export { UI_SCALE_OPTIONS }

export const DEFAULT_UI_SCALE: UiScale = UI_SCALE_OPTIONS[0]
export const DEFAULT_WORKSPACE_ID = 'default'

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  mode: 'local',
  supabaseUrl: '',
  supabaseAnonKey: '',
  workspaceId: DEFAULT_WORKSPACE_ID
}
