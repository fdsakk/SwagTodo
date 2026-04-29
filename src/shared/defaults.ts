export const UI_SCALE_OPTIONS = [100, 110, 125, 150, 175] as const
export type UiScale = (typeof UI_SCALE_OPTIONS)[number]

export const DEFAULT_UI_SCALE: UiScale = UI_SCALE_OPTIONS[0]
