# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-04-22T13:42:35.127Z
> Files: 120 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.editorconfig` — Editor configuration (~42 tok)
- `.eslintcache` (~160191 tok)
- `.gitignore` — Git ignore rules (~14 tok)
- `.prettierignore` (~18 tok)
- `.prettierrc.yaml` (~19 tok)
- `CLAUDE.md` — OpenWolf (~1984 tok)
- `components.json` (~173 tok)
- `electron-builder.yml` (~398 tok)
- `electron.vite.config.ts` (~90 tok)
- `eslint.config.mjs` — ESLint flat configuration (~262 tok)
- `medi.md` — Plan: Medication Tracking (Health/Meds) (~1244 tok)
- `package-lock.json` — npm lock file (~132737 tok)
- `package.json` — Node.js package manifest (~838 tok)
- `postcss.config.cjs` — PostCSS configuration (~22 tok)
- `README.md` — Project documentation (~354 tok)
- `tailwind.config.ts` — Tailwind CSS configuration (~713 tok)
- `tsconfig.json` — TypeScript configuration (~31 tok)
- `tsconfig.node.json` — /_", "src/preload/\*\*/_"], (~66 tok)
- `tsconfig.web.json` (~109 tok)
- `tsconfig.web.tsbuildinfo` (~42821 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## out/main/

- `index.js` — Declares electron (~8903 tok)

## out/preload/

- `index.js` — Declares electron (~438 tok)

## out/renderer/

- `index.html` — Swag Todo (~149 tok)

## out/renderer/assets/

- `index-UkYvfQdR.css` — Styles: 21 rules, 103 vars (~17510 tok)

## src/main/

- `index.ts` — Declares IpcMainInvokeEvent (~10629 tok)

## src/preload/

- `index.d.ts` — Declares global Window.api bridge typings (~205 tok)
- `index.ts` — Exposes typed IPC bridge via contextBridge (~367 tok)

## src/renderer/

- `index.html` — Swag Todo (~122 tok)

## src/renderer/src/

- `App.tsx` — App (~1970 tok)
- `env.d.ts` — / <reference types="vite/client" /> (~11 tok)
- `main.tsx` (~97 tok)

## src/renderer/src/assets/

- `base.css` — Styles: 22 vars (~400 tok)
- `main.css` — Styles: 5 rules, 20 vars, 2 layers (~372 tok)

## src/renderer/src/components/kanban/

- `index.tsx` (~88 tok)
- `KanbanBoard.tsx` — KanbanBoard — uses useMemo, useCallback (~1681 tok)
- `KanbanCard.tsx` — CardBody — uses useCallback (~744 tok)
- `KanbanCardPreview.tsx` — KanbanCardPreview (~151 tok)
- `KanbanColumn.tsx` — KanbanColumn — uses useState, useMemo, useCallback (~889 tok)
- `types.ts` — Exports COLUMNS, COLUMN_PREFIX, EMPTY_LABELS, byOrderAsc, resolveTaskLabels (~207 tok)

## src/renderer/src/components/layout/

- `index.tsx` (~49 tok)
- `SearchSortBar.tsx` — SearchSortBar — uses useEffect (~909 tok)
- `Sidebar.tsx` — Sidebar — uses useMemo (~1346 tok)
- `ThemeProvider.tsx` — ThemeProvider — uses useEffect (~142 tok)
- `TitleBar.tsx` — isMac — uses useState, useEffect (~827 tok)

## src/renderer/src/components/modals/

- `index.tsx` (~50 tok)
- `LabelManagerModal.tsx` — LabelManagerModal — renders modal — uses useState (~1092 tok)
- `ProjectPickerModal.tsx` — ProjectPickerModal — uses useEffect (~1162 tok)
- `ShortcutsHelpModal.tsx` — SHORTCUTS (~947 tok)

## src/renderer/src/components/project/

- `color-selector.tsx` — sizeClass (~387 tok)
- `custom-color-input.tsx` — HEX_RE — uses useState, useEffect (~576 tok)
- `emoji-picker.tsx` — EMOJI_GROUPS — uses useState, useEffect (~994 tok)
- `index.tsx` (~56 tok)
- `ProjectPanel.tsx` — ProjectPanel — renders form (~1620 tok)

## src/renderer/src/components/sessions-calendar/

- `DraftGhost.tsx` — DraftGhost (~216 tok)
- `index.tsx` (~60 tok)
- `SessionBlockView.tsx` — SessionBlockView (~681 tok)
- `SessionsCalendar.tsx` — WEEKDAYS — uses useMemo, useEffect, useCallback (~5052 tok)
- `TimeBlockView.tsx` — TimeBlockView (~575 tok)
- `types.ts` — Exports DAY_MS, SessionBlock, TimeBlockDisplayBlock, DraftCreate + 8 more (~1057 tok)

## src/renderer/src/components/settings/

- `CustomizeSection.tsx` — TOKEN_LABELS (~2449 tok)
- `index.tsx` (~54 tok)
- `SyncSection.tsx` — formatSyncAt — uses useState (~1763 tok)
- `ThemeSection.tsx` — ThemeSection (~841 tok)
- `ThemeSwatch.tsx` — ThemeSwatch (~402 tok)

## src/renderer/src/components/sidebar/

- `index.tsx` (~37 tok)
- `NavItem.tsx` — NavItem (~295 tok)
- `ProjectList.tsx` — ProjectList (~598 tok)
- `SidebarFooter.tsx` — SidebarFooter (~204 tok)

## src/renderer/src/components/task-edit/

- `index.tsx` (~26 tok)
- `SessionStats.tsx` — SessionStats (~345 tok)
- `SubtaskList.tsx` — SubtaskList (~615 tok)

## src/renderer/src/components/task-list/

- `animated-checkbox.tsx` — AnimatedCheckbox (~427 tok)
- `index.tsx` (~55 tok)
- `subtask-progress-ring.tsx` — SubtaskProgressRingBase (~558 tok)
- `TaskList.tsx` — TaskList (~585 tok)
- `TaskRow.tsx` — TaskRowBase (~842 tok)

## src/renderer/src/components/task-panel/

- `index.tsx` (~70 tok)
- `panel-field.tsx` — Field (~93 tok)
- `task-form-fields.tsx` — INBOX_VALUE — uses useCallback (~2300 tok)
- `TaskCreatePanel.tsx` — INITIAL_STATE — renders form (~1442 tok)
- `TaskDetailPanel.tsx` — TaskDetailPanel (~1091 tok)
- `TaskEditPanel.tsx` — TEXT_COMMIT_DEBOUNCE_MS (~2351 tok)

## src/renderer/src/components/ui/

- `badge.tsx` — badgeVariants (~325 tok)
- `button.tsx` — buttonVariants (~546 tok)
- `calendar.tsx` — Calendar — uses useEffect (~2163 tok)
- `card.tsx` — Card (~519 tok)
- `checkbox.tsx` — Checkbox (~310 tok)
- `dialog.tsx` — Dialog — renders modal (~1098 tok)
- `input.tsx` — Input (~228 tok)
- `kbd.tsx` — Kbd (~251 tok)
- `popover.tsx` — Popover (~368 tok)
- `scroll-area.tsx` — ScrollArea (~472 tok)
- `select.tsx` — Select (~1617 tok)
- `separator.tsx` — Separator (~222 tok)
- `tabs.tsx` — Tabs (~544 tok)
- `textarea.tsx` — Textarea (~205 tok)

## src/renderer/src/hooks/

- `useKeyboardShortcuts.ts` — Exports useKeyboardShortcuts (~586 tok)
- `useTaskComplete.ts` — Exports useTaskComplete (~417 tok)
- `useThemeColors.ts` — Exports useThemeColors (~196 tok)

## src/renderer/src/pages/

- `ActivityPage.tsx` — buildEvents — uses useMemo (~1495 tok)
- `HealthPage.tsx` — today — renders chart — uses useState, useCallback, useMemo (~5312 tok)
- `InboxPage.tsx` — InboxPage (~460 tok)
- `ProjectPage.tsx` — ProjectPage — uses useMemo (~1197 tok)
- `SessionsPage.tsx` — DAY_OPTIONS — uses useEffect, useMemo, useCallback (~2987 tok)
- `SettingsPage.tsx` — SettingsPage — uses useState, useCallback, useEffect (~1126 tok)
- `TodayPage.tsx` — TodayPage (~411 tok)

## src/renderer/src/pages/sessions/

- `GhostBlockDialog.tsx` — minutesFromIso — renders form — uses useState (~931 tok)
- `TaskPickerDialog.tsx` — minutesFromIso — uses useState, useMemo (~1235 tok)

## src/renderer/src/store/

- `useAppStore.ts` — Exports SessionCreateInput, SessionUpdateInput, SessionResult, SessionUpdateResult + 4 more (~6933 tok)

## src/renderer/src/types/

- `index.ts` — Vertical scale — subjective sensitivity. 1.0 = one dose peaks at 1.0 on Y. Default 1.0. (~4728 tok)

## src/renderer/src/utils/

- `calendar.ts` — Exports HOUR_PX, SLOT_MIN, PX_PER_MIN, startOfDay + 7 more (~362 tok)
- `cn.ts` — Exports cn (~50 tok)
- `pharmacokinetics.ts` — Default ke0 for this drug class (effect-site equilibration rate [1/h]). (~2335 tok)
- `sessions.ts` — Exports sessionsInRange, computeTaskStats, formatDuration (~438 tok)
- `task.ts` — Exports PROJECT_COLOR_SWATCHES, PRIORITY_META, isTaskDueToday, isTaskOverdue + 5 more (~946 tok)

## src/shared/

- `defaults.ts` — Shared app defaults (ui scale, sync/workspace defaults) (~87 tok)
- `types.ts` — Shared domain/IPC types for main, preload, renderer (~494 tok)

## supabase/

- `schema.sql` — Database schema (~804 tok)

## Recent Updates

- 2026-04-22: Kanban drag overlay sizing preserves source card width and height; preview now reuses same shell classes as sortable card. Files: `src/renderer/src/components/kanban/KanbanBoard.tsx`, `src/renderer/src/components/kanban/KanbanCard.tsx`, `src/renderer/src/components/kanban/KanbanCardPreview.tsx`.
- 2026-04-22: Kanban cross-column drag now uses live draft column ids in `onDragOver`, so target columns preview insertion and final drop index follows hover position instead of snapping to start. File: `src/renderer/src/components/kanban/KanbanBoard.tsx`.
