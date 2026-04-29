# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-04-29T10:16:02.446Z
> Files: 262 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.codex` (~0 tok)
- `.editorconfig` — Editor configuration (~42 tok)
- `.gitignore` — Git ignore rules (~14 tok)
- `.prettierignore` (~25 tok)
- `.prettierrc.yaml` (~19 tok)
- `AGENTS.md` — AGENTS.md (~745 tok)
- `components.json` (~187 tok)
- `electron-builder.yml` (~419 tok)
- `electron.vite.config.ts` (~107 tok)
- `eslint.config.mjs` — ESLint flat configuration (~356 tok)
- `package.json` — Node.js package manifest (~849 tok)
- `README.md` — Project documentation (~149 tok)
- `skills-lock.json` (~144 tok)
- `tsconfig.json` — TypeScript configuration (~31 tok)
- `tsconfig.node.json` — /_", "src/preload/\*\*/_", "src/shared/\*_/_"], (~72 tok)
- `tsconfig.web.json` (~116 tok)

## .agents/skills/coss-particles/

- `SKILL.md` — COSS UI Particles Index (~10397 tok)

## .agents/skills/coss/

- `SKILL.md` — coss ui (~1390 tok)

## .agents/skills/coss/references/

- `cli.md` — coss CLI Reference (Focused) (~798 tok)
- `component-registry.md` — coss Component Registry Index (~1284 tok)
- `portal-props.md` — Portal forwarding (`portalProps`) (~443 tok)

## .agents/skills/coss/references/primitives/

- `accordion.md` — coss Accordion (~545 tok)
- `alert-dialog.md` — coss Alert Dialog (~736 tok)
- `alert.md` — coss Alert (~539 tok)
- `autocomplete.md` — coss Autocomplete (~1033 tok)
- `avatar.md` — coss Avatar (~416 tok)
- `badge.md` — coss Badge (~399 tok)
- `breadcrumb.md` — coss Breadcrumb (~455 tok)
- `button.md` — coss Button (~650 tok)
- `calendar.md` — coss Calendar (~354 tok)
- `card.md` — coss Card (~474 tok)
- `checkbox-group.md` — coss Checkbox Group (~497 tok)
- `checkbox.md` — coss Checkbox (~508 tok)
- `collapsible.md` — coss Collapsible (~338 tok)
- `combobox.md` — coss Combobox (~735 tok)
- `command.md` — coss Command (~752 tok)
- `dialog.md` — coss Dialog (~1026 tok)
- `drawer.md` — coss Drawer (~770 tok)
- `empty.md` — coss Empty (~418 tok)
- `field.md` — coss Field (~594 tok)
- `fieldset.md` — coss Fieldset (~343 tok)
- `form.md` — coss Form (~741 tok)
- `frame.md` — coss Frame (~431 tok)
- `group.md` — coss Group (~419 tok)
- `input-group.md` — coss Input Group (~694 tok)
- `input.md` — coss Input (~449 tok)
- `kbd.md` — coss Kbd (~315 tok)
- `label.md` — coss Label (~345 tok)
- `menu.md` — coss Menu (~779 tok)
- `meter.md` — coss Meter (~383 tok)
- `number-field.md` — coss Number Field (~571 tok)
- `otp-field.md` — coss OTP Field (~609 tok)
- `pagination.md` — coss Pagination (~510 tok)
- `popover.md` — coss Popover (~649 tok)
- `preview-card.md` — coss Preview Card (~460 tok)
- `progress.md` — coss Progress (~383 tok)
- `radio-group.md` — coss Radio Group (~613 tok)
- `scroll-area.md` — coss Scroll Area (~592 tok)
- `select.md` — coss Select (~938 tok)
- `separator.md` — coss Separator (~334 tok)
- `sheet.md` — coss Sheet (~665 tok)
- `sidebar.md` — coss Sidebar (~931 tok)
- `skeleton.md` — coss Skeleton (~380 tok)
- `slider.md` — coss Slider (~353 tok)
- `spinner.md` — coss Spinner (~382 tok)
- `switch.md` — coss Switch (~444 tok)
- `table.md` — coss Table (~686 tok)
- `tabs.md` — coss Tabs (~474 tok)
- `textarea.md` — coss Textarea (~475 tok)
- `toast.md` — coss Toast (~900 tok)
- `toggle-group.md` — coss Toggle Group (~524 tok)
- `toggle.md` — coss Toggle (~429 tok)
- `toolbar.md` — coss Toolbar (~575 tok)
- `tooltip.md` — coss Tooltip (~551 tok)

## .agents/skills/coss/references/rules/

- `composition.md` — Composition Rules (coss) (~386 tok)
- `forms.md` — Forms and Inputs Rules (coss) (~432 tok)
- `migration.md` — coss vs shadcn/Radix assumptions (~1283 tok)
- `styling.md` — Styling Rules (coss) (~1229 tok)

## .claude/

- `settings.json` (~442 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## out/main/

- `index.js` — Declares electron (~9831 tok)

## out/preload/

- `index.js` — Declares electron (~399 tok)

## out/renderer/

- `index.html` — Swag Todo (~149 tok)

## out/renderer/assets/

- `index-CX6S-WSs.css` — Styles: 6 rules, 174 vars, 3 layers (~79538 tok)

## src/main/

- `index.ts` — IpcMainInvokeEvent: installGlobalErrorHandlers, createWindow (~1365 tok)
- `ipcHandlers.ts` — Exports IpcRegistrar, IpcStorage, isZoomFactor, getPersistedUiScale, registerIpcHandlers (~933 tok)

## src/main/storage/

- `appState.ts` — Exports defaultAppState, APP_STATE_KEYS, isUiScale, isSafeId + 5 more (~1437 tok)
- `sqlite.ts` (~81 tok)

## src/main/storage/sqlite/

- `schema.ts` — Exports SCHEMA (~646 tok)
- `serialize.ts` — Exports parseSetting, parseJsonArray, inflateTaskRows, parseLegacyElectronStore + 6 more (~3224 tok)
- `storage.ts` — Exports SqliteAppStorage, createSqliteAppStorage (~3163 tok)
- `types.ts` — Exports StoredTaskRow, StoredSubTaskRow, StoredTaskLabelRow, StoredProjectRow + 10 more (~640 tok)

## src/main/tests/

- `ipcHandlers.test.ts` — Declares IpcRegistrar (~1091 tok)
- `sqlite.test.ts` — Declares createFixtureState (~2274 tok)

## src/preload/

- `index.d.ts` — Declares RendererApi (~222 tok)
- `index.ts` — Declares api (~471 tok)

## src/renderer/

- `index.html` — Swag Todo (~123 tok)

## src/renderer/src/

- `App.tsx` — FULL_HEIGHT_VIEWS — uses useState, useEffect (~1990 tok)
- `env.d.ts` — / <reference types="vite/client" /> (~11 tok)
- `main.tsx` (~192 tok)

## src/renderer/src/assets/

- `base.css` — Styles: 22 vars (~402 tok)
- `main.css` — Styles: 6 rules, 121 vars, 6 animations, 2 layers (~2150 tok)

## src/renderer/src/components/kanban/

- `index.tsx` (~84 tok)
- `KanbanBoard.tsx` — buildLabelMap — uses useMemo, useCallback (~2773 tok)
- `KanbanCard.tsx` — KANBAN_CARD_CLASSNAME (~1044 tok)
- `KanbanCardPreview.tsx` — KanbanCardPreview (~142 tok)
- `KanbanColumn.tsx` — KanbanColumn — uses useState, useMemo, useCallback (~889 tok)
- `types.ts` — Exports COLUMNS, COLUMN_PREFIX, EMPTY_LABELS, byOrderAsc, resolveTaskLabels (~207 tok)

## src/renderer/src/components/layout/

- `GlobalErrorBoundary.tsx` — INITIAL_STATE (~1210 tok)
- `index.tsx` (~66 tok)
- `SearchSortBar.tsx` — SORT_OPTIONS — uses useMemo, useEffect (~2681 tok)
- `Sidebar.tsx` — SIDEBAR_WIDTH — uses useMemo (~2032 tok)
- `ThemeProvider.tsx` — CHART_TONE_VARS — renders chart — uses useEffect (~513 tok)
- `TitleBar.tsx` — isMac — uses useState, useEffect (~832 tok)

## src/renderer/src/components/modals/

- `index.tsx` (~50 tok)
- `LabelManagerModal.tsx` — LabelManagerModal — renders modal — uses useState (~1082 tok)
- `ProjectPickerModal.tsx` — ProjectPickerModal — renders modal — uses useEffect (~790 tok)
- `ShortcutsHelpModal.tsx` — SHORTCUTS — renders modal (~612 tok)

## src/renderer/src/components/project/

- `color-selector.tsx` — sizeClass (~387 tok)
- `custom-color-input.tsx` — HEX_RE — uses useState, useEffect (~576 tok)
- `emoji-picker.tsx` — EMOJI_GROUPS — uses useState (~741 tok)
- `index.tsx` (~56 tok)
- `ProjectPanel.tsx` — ProjectPanel — renders form, modal (~1364 tok)

## src/renderer/src/components/sessions-calendar/

- `CalendarHeader.tsx` — WEEKDAYS (~380 tok)
- `DraftGhost.tsx` — DraftGhost (~216 tok)
- `index.tsx` (~57 tok)
- `SessionBlockView.tsx` — SessionBlockView (~681 tok)
- `SessionsCalendar.tsx` — HOURS — uses useMemo, useEffect (~2561 tok)
- `TimeBlockView.tsx` — TimeBlockView (~588 tok)
- `types.ts` — Exports DAY_MS, SessionBlock, TimeBlockDisplayBlock, DraftCreate + 8 more (~1061 tok)
- `useCalendarDrag.ts` — Exports useCalendarDrag (~2746 tok)

## src/renderer/src/components/settings/

- `CustomizeSection.tsx` — TOKEN_LABELS — uses useState, useEffect, useCallback, useMemo (~2960 tok)
- `index.tsx` (~42 tok)
- `ThemeSection.tsx` — UI_SCALE_ITEMS (~894 tok)
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
- `index.tsx` (~70 tok)
- `subtask-progress-ring.tsx` — SubtaskProgressRingBase (~516 tok)
- `task-context-menu.tsx` — STATUSES (~1935 tok)
- `TaskList.tsx` — TaskList — uses useMemo (~909 tok)
- `TaskRow.tsx` — COMPLETE_TOGGLE_DELAY_MS — uses useState, useEffect (~1492 tok)

## src/renderer/src/components/task-panel/

- `index.tsx` (~59 tok)
- `task-form-fields.tsx` — INBOX_VALUE — uses useCallback, useMemo (~2304 tok)
- `TaskCreatePanel.tsx` — INITIAL_STATE — renders form, modal — uses useCallback (~1266 tok)
- `TaskDetailPanel.tsx` — TaskDetailPanel — renders modal — uses useEffect (~770 tok)
- `TaskEditPanel.tsx` — TEXT_COMMIT_DEBOUNCE_MS — renders modal — uses useMemo, useState, useCallback, useEffect (~2433 tok)

## src/renderer/src/components/ui/

- `accordion.tsx` — Accordion (~622 tok)
- `alert-dialog.tsx` — AlertDialogCreateHandle (~1389 tok)
- `alert.tsx` — alertVariants (~686 tok)
- `autocomplete.tsx` — Autocomplete (~2996 tok)
- `avatar.tsx` — Avatar (~332 tok)
- `badge.tsx` — badgeVariants (~786 tok)
- `breadcrumb.tsx` — Breadcrumb (~703 tok)
- `button.tsx` — buttonVariants (~1794 tok)
- `calendar.tsx` — buttonClassNames (~1468 tok)
- `card.tsx` — Card (~2001 tok)
- `checkbox-group.tsx` — CheckboxGroup (~131 tok)
- `checkbox.tsx` — Checkbox (~829 tok)
- `collapsible.tsx` — Collapsible (~312 tok)
- `combobox.tsx` — ComboboxContext — uses useContext (~4291 tok)
- `command.tsx` — CommandDialog (~2130 tok)
- `dialog.tsx` — DialogCreateHandle — renders modal (~1844 tok)
- `drawer.tsx` — DrawerContext — renders modal — uses useContext (~6743 tok)
- `empty.tsx` — emptyMediaVariants (~984 tok)
- `field.tsx` — Field (~498 tok)
- `fieldset.tsx` — Fieldset (~192 tok)
- `form.tsx` — Form — renders form (~86 tok)
- `frame.tsx` — Frame (~557 tok)
- `group.tsx` — groupVariants (~1390 tok)
- `input-group.tsx` — inputGroupAddonVariants (~1816 tok)
- `input.tsx` — Input (~845 tok)
- `kbd.tsx` — Kbd (~215 tok)
- `label.tsx` — Label (~180 tok)
- `menu.tsx` — MenuCreateHandle (~3213 tok)
- `meter.tsx` — Meter (~481 tok)
- `number-field.tsx` — NumberFieldContext — uses useContext (~1648 tok)
- `otp-field.tsx` — OTPField (~782 tok)
- `pagination.tsx` — Pagination (~886 tok)
- `popover.tsx` — PopoverCreateHandle (~1290 tok)
- `preview-card.tsx` — PreviewCard (~606 tok)
- `progress.tsx` — Progress (~512 tok)
- `radio-group.tsx` — RadioGroup (~584 tok)
- `scroll-area.tsx` — ScrollArea (~707 tok)
- `select.tsx` — Select (~2661 tok)
- `separator.tsx` — Separator (~201 tok)
- `sheet.tsx` — Sheet (~1932 tok)
- `sidebar.tsx` — SIDEBAR_COOKIE_NAME — uses useContext, useState, useCallback, useEffect (~6396 tok)
- `skeleton.tsx` — Skeleton (~168 tok)
- `slider.tsx` — Slider — uses useMemo (~880 tok)
- `spinner.tsx` — Spinner (~110 tok)
- `switch.tsx` — Switch (~456 tok)
- `table.tsx` — Table — renders table (~1417 tok)
- `tabs.tsx` — Tabs (~847 tok)
- `textarea.tsx` — Textarea (~709 tok)
- `toast-manager.ts` — Exports toastManager, anchoredToastManager (~74 tok)
- `toast.tsx` — TOAST_ICONS (~4075 tok)
- `toggle-group.tsx` — ToggleGroupContext — uses useContext (~1028 tok)
- `toggle.tsx` — toggleVariants (~671 tok)
- `toolbar.tsx` — Toolbar (~573 tok)
- `tooltip.tsx` — TooltipCreateHandle (~922 tok)

## src/renderer/src/hooks/

- `use-media-query.ts` — Touch-like input (finger). Use "fine" for mouse/trackpad. (~740 tok)
- `useKeyboardShortcuts.ts` — Exports useKeyboardShortcuts (~766 tok)
- `useTaskComplete.ts` — Exports useTaskComplete (~514 tok)
- `useThemeColors.ts` — Exports useThemeColors (~196 tok)

## src/renderer/src/lib/

- `utils.ts` — Exports cn (~50 tok)

## src/renderer/src/pages/

- `ActivityPage.tsx` — buildEvents — uses useMemo (~1650 tok)
- `ArchivePage.tsx` — ArchivePage — uses useMemo (~401 tok)
- `HealthPage.tsx` — HealthPage — renders chart — uses useState, useMemo (~691 tok)
- `InboxPage.tsx` — InboxPage — uses useMemo (~463 tok)
- `ProjectPage.tsx` — ProjectPage — uses useMemo, useEffect (~1326 tok)
- `SessionsPage.tsx` — NOW_TICK_MS — uses useEffect, useMemo, useCallback (~2178 tok)
- `SettingsPage.tsx` — SettingsPage (~372 tok)
- `TodayPage.tsx` — TodayPage — uses useMemo (~429 tok)

## src/renderer/src/pages/health/

- `EffectChart.tsx` — EffectChart — renders chart — uses useState, useEffect, useMemo (~2502 tok)
- `MedLogList.tsx` — MedLogList (~786 tok)
- `PkParams.tsx` — PkParams — uses useState (~871 tok)
- `QuickAddButtons.tsx` — PRESET_BUTTONS (~310 tok)
- `SliderRow.tsx` — SliderRow (~263 tok)
- `utils.ts` — Exports today, isoToTimeInput, timeInputToIso (~136 tok)

## src/renderer/src/pages/sessions/

- `GhostBlockDialog.tsx` — minutesFromIso — renders form — uses useState (~931 tok)
- `SessionsToolbar.tsx` — DAY_OPTIONS (~580 tok)
- `TaskPickerDialog.tsx` — minutesFromIso — uses useState, useMemo (~1235 tok)
- `useSessionsKeyboard.ts` — Exports useSessionsKeyboard (~447 tok)

## src/renderer/src/store/

- `bootstrap.ts` — Exports hydrateDomainStore (~143 tok)
- `index.ts` (~174 tok)

## src/renderer/src/store/domain/

- `domainStore.ts` — Exports useDomainStore (~406 tok)
- `persist.ts` — Exports PERSISTED_KEYS, stateFromPersisted, pickPersistedState, setPersistenceErrorReporter, persistedStorage (~1614 tok)
- `selectors.ts` — Exports isTaskDueToday, isTaskOverdue, VisibleTasksInput, InboxTasksInput + 10 more (~2104 tok)
- `state.ts` — Exports createInitialDomainState (~130 tok)

## src/renderer/src/store/domain/actions/

- `health.ts` — Exports createHealthActions (~465 tok)
- `labels.ts` — Exports createLabelActions (~415 tok)
- `projects.ts` — Exports createProjectActions (~489 tok)
- `sessions.ts` — Exports createSessionActions (~1048 tok)
- `settings.ts` — Exports createSettingsActions (~576 tok)
- `tasks.ts` — Exports createTaskActions (~1610 tok)

## src/renderer/src/store/domain/helpers/

- `relations.ts` — Exports removeTaskRelations, removeProjectSessions, detachProjectFromTasks, detachLabelFromTasks (~444 tok)

## src/renderer/src/store/shared/

- `normalize.ts` — Exports normalizeStoredTask, normalizeTaskPatch, normalizeProjectInput, normalizeProjectPatch + 2 more (~1788 tok)
- `types.ts` — Exports UpdateTaskInput, CreateProjectInput, UpdateProjectInput, CreateLabelInput + 25 more (~1716 tok)
- `utils.ts` — Exports nowIso, nextOrder, isUiScale, findIndexById + 5 more (~635 tok)

## src/renderer/src/store/tests/

- `domain-store.test.ts` — Declares createTask (~3488 tok)
- `persist.test.ts` — Declares state (~2814 tok)
- `register-aliases.cjs` — Module: patchedResolveFilename (~210 tok)

## src/renderer/src/store/ui/

- `actions.ts` — Exports createUiActions (~772 tok)
- `state.ts` — Exports createInitialUiState (~112 tok)
- `uiStore.ts` — Exports useUiStore (~423 tok)

## src/renderer/src/types/

- `index.ts` — Vertical scale — subjective sensitivity. 1.0 = one dose peaks at 1.0 on Y. Default 1.0. (~4740 tok)

## src/renderer/src/utils/

- `calendar.ts` — Exports HOUR_PX, SLOT_MIN, PX_PER_MIN, startOfDay + 7 more (~362 tok)
- `cn.ts` — Exports cn (~50 tok)
- `pharmacokinetics.test.ts` — Declares MedicationLog (~633 tok)
- `pharmacokinetics.ts` — Default ke0 for this drug class (effect-site equilibration rate [1/h]). (~2754 tok)
- `sessions.ts` — Exports sessionsInRange, computeTaskStats, formatDuration (~438 tok)
- `task.ts` — Exports PROJECT_COLOR_SWATCHES, PRIORITY_META, formatDueDate, useVisibleTasks (~412 tok)

## src/shared/

- `defaults.ts` — Exports UI_SCALE_OPTIONS, UiScale, DEFAULT_UI_SCALE (~53 tok)
- `stateSchema.ts` — Zod schemas: storedBooleanSchema, prioritySchema, taskStatusSchema (~1128 tok)
- `types.ts` — Exports Priority, TaskStatus, SubTask, Task + 8 more (~495 tok)
