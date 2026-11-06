import type { AppPreferences } from "./types"

export const UI_SCALE_OPTIONS = [100, 110, 125, 150, 175] as const
export type UiScale = (typeof UI_SCALE_OPTIONS)[number]

export const DEFAULT_UI_SCALE: UiScale = UI_SCALE_OPTIONS[0]

export const DEFAULT_PREFERENCES: AppPreferences = {
  notificationsEnabled: true,
  reminderLeadMinutes: 0,
  closeToTray: false,
  autoBackup: true,
  backupKeep: 7,
  quickAddShortcut: "CommandOrControl+Shift+Space",
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  savedViews: []
}
