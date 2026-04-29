# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-04-28T22:23:26.997Z
> Files: 187 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.codex` (~0 tok)
- `.editorconfig` — Editor configuration (~42 tok)
- `.gitignore` — Git ignore rules (~14 tok)
- `.prettierignore` (~18 tok)
- `.prettierrc.yaml` (~19 tok)
- `AGENTS.md` — AGENTS.md (~745 tok)
- `CLAUDE.md` — OpenWolf (~2370 tok)
- `components.json` (~173 tok)
- `electron-builder.yml` (~419 tok)
- `electron.vite.config.ts` (~90 tok)
- `eslint.config.mjs` — ESLint flat configuration (~356 tok)
- `improvements.md` — Review checklist with requested cleanup/refactor items across App, Zustand, Kanban, and SQLite (~1192 tok)
- `package.json` — Node.js package manifest (~909 tok)
- `postcss.config.cjs` — PostCSS configuration (~22 tok)
- `prompt.md` — Prompt For Next Agent (~859 tok)
- `README.md` — Project documentation (~149 tok)
- `tailwind.config.ts` — Tailwind CSS configuration (~713 tok)
- `tsconfig.json` — TypeScript configuration (~31 tok)
- `tsconfig.node.json` — /_", "src/preload/\*\*/_", "src/shared/\*_/_"], (~72 tok)
- `tsconfig.web.json` (~116 tok)

## .claude/

- `settings.json` (~442 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## out/main/

- `index.js` — Declares electron (~8049 tok)

## out/preload/

- `index.js` — Declares electron (~399 tok)

## out/renderer/

- `index.html` — Swag Todo (~149 tok)

## out/renderer/assets/

- `index-C77dME8R.css` — Styles: 21 rules, 103 vars (~17542 tok)

## src/main/

- `index.ts` — IpcMainInvokeEvent: createWindow, registerIpcHandlers (~1657 tok)

## src/main/storage/

- `appState.ts` — Exports defaultAppState, APP_STATE_KEYS, isUiScale, isSafeId + 5 more (~1447 tok)
- `sqlite.ts` — Exports SqliteStateSnapshot, parseLegacyElectronStore, serializeAppState, deserializeAppState, changedTaskIds (~6102 tok)

## src/main/tests/

- `sqlite.test.ts` — Declares createFixtureState (~1977 tok)

## src/preload/

- `index.d.ts` — Declares RendererApi (~222 tok)
- `index.ts` — Declares api (~471 tok)

## src/renderer/

- `index.html` — Swag Todo (~123 tok)

## src/renderer/src/

- `App.tsx` — App — uses useState, useEffect (~2220 tok)
- `env.d.ts` — / <reference types="vite/client" /> (~11 tok)
- `main.tsx` (~97 tok)

## src/renderer/src/assets/

- `base.css` — Styles: 22 vars (~400 tok)
- `main.css` — Styles: 6 rules, 122 vars (~2174 tok)

## src/renderer/src/components/kanban/

- `index.tsx` (~88 tok)
- `KanbanBoard.tsx` — buildColumnTaskIds — uses useMemo, useCallback (~2710 tok)
- `KanbanCard.tsx` — KANBAN_CARD_CLASSNAME — uses useCallback (~733 tok)
- `KanbanCardPreview.tsx` — KanbanCardPreview (~142 tok)
- `KanbanColumn.tsx` — KanbanColumn — uses useState, useMemo, useCallback (~889 tok)
- `types.ts` — Exports COLUMNS, COLUMN_PREFIX, EMPTY_LABELS, byOrderAsc, resolveTaskLabels (~207 tok)

## src/renderer/src/components/layout/

- `GlobalErrorBoundary.tsx` — GlobalErrorBoundary — catches React, window, promise errors (~1150 tok)
- `index.tsx` (~49 tok)
- `SearchSortBar.tsx` — SearchSortBar — uses useEffect (~1840 tok)
- `Sidebar.tsx` — COLLAPSED_WIDTH (~2022 tok)
- `ThemeProvider.tsx` — ThemeProvider — uses useEffect (~142 tok)
- `TitleBar.tsx` — isMac — uses useState, useEffect (~832 tok)

## src/renderer/src/components/modals/

- `index.tsx` (~50 tok)
- `LabelManagerModal.tsx` — LabelManagerModal — renders modal (~1082 tok)
- `ProjectPickerModal.tsx` — ProjectPickerModal — renders modal (~790 tok)
- `ShortcutsHelpModal.tsx` — SHORTCUTS — renders modal (~625 tok)

## src/renderer/src/components/project/

- `color-selector.tsx` — sizeClass (~387 tok)
- `custom-color-input.tsx` — HEX_RE — uses useState, useEffect (~576 tok)
- `emoji-picker.tsx` — EMOJI_GROUPS (~741 tok)
- `index.tsx` (~56 tok)
- `ProjectPanel.tsx` — ProjectPanel — renders form, modal (~1364 tok)

## src/renderer/src/components/sessions-calendar/

- `DraftGhost.tsx` — DraftGhost (~216 tok)
- `index.tsx` (~60 tok)
- `SessionBlockView.tsx` — SessionBlockView (~681 tok)
- `SessionsCalendar.tsx` — WEEKDAYS — uses useMemo, useEffect, useCallback (~5332 tok)
- `TimeBlockView.tsx` — TimeBlockView (~588 tok)
- `types.ts` — Exports DAY_MS, SessionBlock, TimeBlockDisplayBlock, DraftCreate + 8 more (~1061 tok)

## src/renderer/src/components/settings/

- `CustomizeSection.tsx` — TOKEN_LABELS — uses useState, useEffect (~2669 tok)
- `index.tsx` (~42 tok)
- `ThemeSection.tsx` — ThemeSection (~850 tok)
- `ThemeSwatch.tsx` — ThemeSwatch (~413 tok)

## src/renderer/src/components/sidebar/

- `index.tsx` (~37 tok)
- `NavItem.tsx` — NavItem (~380 tok)
- `ProjectList.tsx` — ProjectList (~525 tok)
- `SidebarFooter.tsx` — SidebarFooter (~226 tok)

## src/renderer/src/components/task-edit/

- `index.tsx` (~26 tok)
- `SessionStats.tsx` — SessionStats (~345 tok)
- `SubtaskList.tsx` — SubtaskList (~614 tok)

## src/renderer/src/components/task-list/

- `animated-checkbox.tsx` — AnimatedCheckbox (~427 tok)
- `index.tsx` (~55 tok)
- `subtask-progress-ring.tsx` — SubtaskProgressRingBase (~516 tok)
- `task-context-menu.tsx` — TaskContextMenu — Radix context menu for task archive/delete/priority/status/due date (~1270 tok)
- `TaskList.tsx` — TaskList — uses useMemo (~674 tok)
- `TaskRow.tsx` — TaskRowBase (~914 tok)

## src/renderer/src/components/task-panel/

- `index.tsx` (~59 tok)
- `panel-field.tsx` — Field (~93 tok)
- `task-form-fields.tsx` — INBOX_VALUE (~2260 tok)
- `TaskCreatePanel.tsx` — INITIAL_STATE — renders form, modal (~1210 tok)
- `TaskDetailPanel.tsx` — TaskDetailPanel — renders modal (~747 tok)
- `TaskEditPanel.tsx` — TEXT_COMMIT_DEBOUNCE_MS — renders modal (~2024 tok)

## src/renderer/src/components/ui/

- `accordion.tsx` — coss/Base UI Accordion primitive wrappers (~620 tok)
- `alert-dialog.tsx` — coss/Base UI AlertDialog popup sections and close helpers (~1030 tok)
- `alert.tsx` — coss Alert display components (~365 tok)
- `autocomplete.tsx` — coss/Base UI Autocomplete input/list wrappers (~2030 tok)
- `avatar.tsx` — coss/Base UI Avatar image/fallback wrappers (~330 tok)
- `badge.tsx` — badgeVariants (~317 tok)
- `breadcrumb.tsx` — coss Breadcrumb navigation wrappers (~940 tok)
- `button.tsx` — buttonVariants (~526 tok)
- `calendar.tsx` — Calendar — uses useEffect (~2050 tok)
- `card.tsx` — Card (~519 tok)
- `checkbox-group.tsx` — coss/Base UI CheckboxGroup wrapper (~160 tok)
- `checkbox.tsx` — Checkbox (~306 tok)
- `collapsible.tsx` — coss/Base UI Collapsible wrappers (~335 tok)
- `combobox.tsx` — coss/Base UI Combobox input/list wrappers (~1920 tok)
- `command.tsx` — coss Command dialog built from dialog/autocomplete primitives (~1250 tok)
- `dialog.tsx` — DialogCreateHandle — renders modal (~1817 tok)
- `drawer.tsx` — coss/Base UI Drawer and drawer menu wrappers (~3590 tok)
- `empty.tsx` — coss Empty state layout components (~480 tok)
- `field.tsx` — coss/Base UI Field label/description/error wrappers (~420 tok)
- `fieldset.tsx` — coss/Base UI Fieldset wrappers (~260 tok)
- `form.tsx` — coss/Base UI Form export wrapper (~55 tok)
- `frame.tsx` — coss Frame bordered surface primitive (~210 tok)
- `group.tsx` — coss Group connected-control layout primitive (~560 tok)
- `input-group.tsx` — coss InputGroup composition helpers (~860 tok)
- `input.tsx` — Input (~228 tok)
- `kbd.tsx` — Kbd (~251 tok)
- `label.tsx` — coss Label render helper (~210 tok)
- `menu.tsx` — coss/Base UI Menu wrappers with submenu/radio/checkbox items (~1720 tok)
- `meter.tsx` — coss/Base UI Meter wrapper (~335 tok)
- `number-field.tsx` — coss/Base UI NumberField wrappers (~940 tok)
- `otp-field.tsx` — coss/Base UI OTP field wrappers (~610 tok)
- `pagination.tsx` — coss Pagination layout/actions (~870 tok)
- `popover.tsx` — Popover (~368 tok)
- `preview-card.tsx` — coss/Base UI PreviewCard wrappers (~520 tok)
- `progress.tsx` — coss/Base UI Progress wrapper (~390 tok)
- `radio-group.tsx` — coss/Base UI RadioGroup wrappers (~600 tok)
- `scroll-area.tsx` — ScrollArea (~467 tok)
- `select.tsx` — Select (~1617 tok)
- `separator.tsx` — Separator (~211 tok)
- `sheet.tsx` — coss/Base UI Sheet side panel wrappers (~1480 tok)
- `sidebar.tsx` — coss Sidebar layout/menu primitives (~4940 tok)
- `skeleton.tsx` — coss Skeleton loading primitive (~140 tok)
- `slider.tsx` — coss/Base UI Slider wrapper (~680 tok)
- `spinner.tsx` — coss Spinner primitive (~205 tok)
- `switch.tsx` — coss/Base UI Switch wrapper (~470 tok)
- `table.tsx` — coss Table layout primitives (~650 tok)
- `tabs.tsx` — Tabs (~544 tok)
- `textarea.tsx` — Textarea (~205 tok)
- `toast.tsx` — coss/Base UI Toast provider and toast manager wrapper (~2170 tok)
- `toggle-group.tsx` — coss/Base UI ToggleGroup wrappers (~1010 tok)
- `toggle.tsx` — coss/Base UI Toggle wrapper (~560 tok)
- `toolbar.tsx` — coss/Base UI Toolbar wrappers (~570 tok)
- `tooltip.tsx` — coss/Base UI Tooltip wrappers (~760 tok)

## src/renderer/src/hooks/

- `use-media-query.ts` — coss helper for matchMedia subscriptions (~214 tok)
- `useKeyboardShortcuts.ts` — Exports useKeyboardShortcuts (~753 tok)
- `useTaskComplete.ts` — Exports useTaskComplete (~418 tok)
- `useThemeColors.ts` — Exports useThemeColors (~196 tok)

## src/renderer/src/lib/

- `utils.ts` — coss-generated `cn()` helper equivalent to renderer utility (~40 tok)

## src/renderer/src/pages/

- `ActivityPage.tsx` — buildEvents — uses useMemo (~1521 tok)
- `ArchivePage.tsx` — ArchivePage — lists archived tasks with unarchive/delete/update actions (~420 tok)
- `HealthPage.tsx` — today — renders chart — uses useState, useCallback, useMemo (~5362 tok)
- `InboxPage.tsx` — InboxPage — uses useMemo (~409 tok)
- `ProjectPage.tsx` — ProjectPage — uses useMemo, useEffect (~1364 tok)
- `SessionsPage.tsx` — DAY_OPTIONS (~2938 tok)
- `SettingsPage.tsx` — SettingsPage (~372 tok)
- `TodayPage.tsx` — TodayPage — uses useMemo (~383 tok)

## src/renderer/src/pages/sessions/

- `GhostBlockDialog.tsx` — minutesFromIso — renders form — uses useState (~931 tok)
- `TaskPickerDialog.tsx` — minutesFromIso — uses useState, useMemo (~1235 tok)

## src/renderer/src/store/

- `bootstrap.ts` — Exports hydrateDomainStore (~143 tok)
- `index.ts` (~187 tok)

## src/renderer/src/store/domain/

- `domainStore.ts` — Exports useDomainStore (~316 tok)
- `persist.ts` — Exports PERSISTED_KEYS, stateFromPersisted, pickPersistedState, persistedStorage (~1174 tok)
- `selectors.ts` — Exports isTaskDueToday, isTaskOverdue, isTaskInFuture, VisibleTasksInput + 11 more (~2078 tok)
- `state.ts` — Exports createInitialDomainState (~124 tok)

## src/renderer/src/store/domain/actions/

- `health.ts` — Exports createHealthActions (~465 tok)
- `labels.ts` — Exports createLabelActions (~415 tok)
- `projects.ts` — Exports createProjectActions (~489 tok)
- `sessions.ts` — Exports createSessionActions (~1048 tok)
- `settings.ts` — Exports createSettingsActions (~430 tok)
- `tasks.ts` — Exports createTaskActions (~1423 tok)

## src/renderer/src/store/domain/helpers/

- `relations.ts` — Exports removeTaskRelations, removeProjectSessions, detachProjectFromTasks, detachLabelFromTasks (~444 tok)

## src/renderer/src/store/shared/

- `normalize.ts` — Exports normalizeStoredTask, normalizeTaskPatch, normalizeProjectInput, normalizeProjectPatch + 2 more (~1732 tok)
- `types.ts` — Exports UpdateTaskInput, CreateProjectInput, UpdateProjectInput, CreateLabelInput + 23 more (~1620 tok)
- `utils.ts` — Exports nowIso, nextOrder, isUiScale, findIndexById + 5 more (~635 tok)

## src/renderer/src/store/tests/

- `domain-store.test.ts` — Declares createTask (~2871 tok)
- `persist.test.ts` — Declares state (~1005 tok)
- `register-aliases.cjs` — Module: patchedResolveFilename (~159 tok)

## src/renderer/src/store/ui/

- `actions.ts` — Exports createUiActions (~754 tok)
- `state.ts` — Exports createInitialUiState (~112 tok)
- `uiStore.ts` — Exports useUiStore (~402 tok)

## src/renderer/src/types/

- `index.ts` — Vertical scale — subjective sensitivity. 1.0 = one dose peaks at 1.0 on Y. Default 1.0. (~4278 tok)

## src/renderer/src/utils/

- `calendar.ts` — Exports HOUR_PX, SLOT_MIN, PX_PER_MIN, startOfDay + 7 more (~362 tok)
- `cn.ts` — Exports cn (~50 tok)
- `pharmacokinetics.ts` — Default ke0 for this drug class (effect-site equilibration rate [1/h]). (~2788 tok)
- `sessions.ts` — Exports sessionsInRange, computeTaskStats, formatDuration (~438 tok)
- `task.ts` — Exports PROJECT_COLOR_SWATCHES, PRIORITY_META, formatDueDate, useVisibleTasks (~412 tok)

## src/shared/

- `defaults.ts` — Exports DEFAULT_UI_SCALE (~43 tok)
- `stateSchema.ts` — Shared Zod schemas for normalized tasks/projects/labels/sessions/time blocks/medications/appearance (~1130 tok)
- `types.ts` — Exports Priority, TaskStatus, UI_SCALE_OPTIONS, UiScale + 10 more (~482 tok)
