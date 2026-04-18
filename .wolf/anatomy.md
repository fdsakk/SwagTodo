# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-04-18T19:46:03.359Z
> Files: 101 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.editorconfig` — Editor configuration (~42 tok)
- `.eslintcache` (~28848 tok)
- `.gitignore` — Git ignore rules (~14 tok)
- `.prettierignore` (~18 tok)
- `.prettierrc.yaml` (~19 tok)
- `CLAUDE.md` — OpenWolf (~1694 tok)
- `components.json` (~173 tok)
- `electron-builder.yml` (~398 tok)
- `electron.vite.config.ts` (~90 tok)
- `eslint.config.mjs` — ESLint flat configuration (~258 tok)
- `package-lock.json` — npm lock file (~126788 tok)
- `package.json` — Node.js package manifest (~797 tok)
- `postcss.config.cjs` — PostCSS configuration (~22 tok)
- `README.md` — Project documentation (~136 tok)
- `tailwind.config.ts` — Tailwind CSS configuration (~713 tok)
- `tsconfig.json` — TypeScript configuration (~31 tok)
- `tsconfig.node.json` — /*", "src/preload/**/*"], (~66 tok)
- `tsconfig.web.json` (~109 tok)
- `tsconfig.web.tsbuildinfo` (~42821 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## out/main/

- `index.js` — API routes: GET (2 endpoints) (~1602 tok)

## out/preload/

- `index.js` — Declares electron (~374 tok)

## out/renderer/

- `index.html` — Swag Todo (~149 tok)

## out/renderer/assets/

- `index-CM0E2b_P.css` — Styles: 21 rules, 103 vars (~16732 tok)

## src/main/

- `index.ts` — API routes: GET (2 endpoints) (~2225 tok)

## src/preload/

- `index.d.ts` — Declares Priority (~569 tok)
- `index.ts` — Declares Priority (~802 tok)

## src/renderer/

- `index.html` — Swag Todo (~122 tok)

## src/renderer/src/

- `App.tsx` — App — uses useState, useEffect (~1875 tok)
- `env.d.ts` — / <reference types="vite/client" /> (~11 tok)
- `main.tsx` (~97 tok)

## src/renderer/src/assets/

- `base.css` — Styles: 22 vars (~400 tok)
- `main.css` — Styles: 5 rules, 20 vars, 2 layers (~372 tok)

## src/renderer/src/components/

- `animated-checkbox.tsx` — AnimatedCheckbox (~427 tok)
- `BackgroundLayer.tsx` — BackgroundLayer (~126 tok)
- `color-selector.tsx` — sizeClass (~387 tok)
- `custom-color-input.tsx` — HEX_RE — uses useState, useEffect (~573 tok)
- `emoji-picker.tsx` — EMOJI_GROUPS — uses useState, useEffect (~995 tok)
- `KanbanBoard.tsx` — COLUMNS — uses useCallback, useState, useMemo (~3460 tok)
- `LabelManagerModal.tsx` — LabelManagerModal — renders modal — uses useState (~1088 tok)
- `panel-field.tsx` — Field (~91 tok)
- `ProjectPanel.tsx` — ProjectPanel — renders form (~1568 tok)
- `ProjectPickerModal.tsx` — ProjectPickerModal — uses useEffect (~1152 tok)
- `SearchSortBar.tsx` — SearchSortBar (~908 tok)
- `SessionsCalendar.tsx` — DAY_MS — uses useMemo, useEffect, useCallback (~7320 tok)
- `ShortcutsHelpModal.tsx` — SHORTCUTS (~944 tok)
- `Sidebar.tsx` — NavItem — uses useMemo (~2428 tok)
- `subtask-progress-ring.tsx` — SubtaskProgressRingBase (~558 tok)
- `task-form-fields.tsx` — INBOX_VALUE — uses useCallback (~2283 tok)
- `TaskCreatePanel.tsx` — INITIAL_STATE — renders form — uses useCallback (~1375 tok)
- `TaskDetailPanel.tsx` — TaskDetailPanel (~859 tok)
- `TaskEditPanel.tsx` — TEXT_COMMIT_DEBOUNCE_MS — uses useMemo, useState, useEffect, useCallback (~2820 tok)
- `TaskList.tsx` — TaskList (~592 tok)
- `TaskRow.tsx` — TaskRow (~848 tok)
- `ThemeProvider.tsx` — ThemeProvider — uses useEffect (~144 tok)
- `TitleBar.tsx` — isMac — uses useState, useEffect (~829 tok)

## src/renderer/src/components/kanban/

- `KanbanBoard.tsx` — KanbanBoard — uses useMemo, useCallback (~1681 tok)
- `KanbanCard.tsx` — CardBody (~741 tok)
- `KanbanCardPreview.tsx` — KanbanCardPreview (~151 tok)
- `KanbanColumn.tsx` — KanbanColumn (~889 tok)
- `types.ts` — Exports COLUMNS, COLUMN_PREFIX, EMPTY_LABELS, byOrderAsc, resolveTaskLabels (~207 tok)

## src/renderer/src/components/sessions-calendar/

- `DraftGhost.tsx` — DraftGhost (~212 tok)
- `SessionBlockView.tsx` — SessionBlockView (~676 tok)
- `SessionsCalendar.tsx` — WEEKDAYS (~4940 tok)
- `TimeBlockView.tsx` — TimeBlockView (~566 tok)
- `types.ts` — Exports DAY_MS, SessionBlock, TimeBlockDisplayBlock, DraftCreate + 8 more (~1046 tok)

## src/renderer/src/components/settings/

- `BackgroundSection.tsx` — BACKGROUND_OPTIONS (~1021 tok)
- `CustomizeSection.tsx` — TOKEN_LABELS (~1307 tok)
- `ThemeSection.tsx` — ThemeSection (~508 tok)
- `ThemeSwatch.tsx` — ThemeSwatch (~402 tok)

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

## src/renderer/src/pages/

- `ActivityPage.tsx` — buildEvents (~1499 tok)
- `InboxPage.tsx` — InboxPage (~445 tok)
- `ProjectPage.tsx` — ProjectPage (~1196 tok)
- `SessionsPage.tsx` — DAY_OPTIONS (~2985 tok)
- `SettingsPage.tsx` — SettingsPage (~401 tok)
- `TodayPage.tsx` — TodayPage (~407 tok)

## src/renderer/src/pages/sessions/

- `GhostBlockDialog.tsx` — minutesFromIso — renders form (~931 tok)
- `TaskPickerDialog.tsx` — minutesFromIso (~1235 tok)

## src/renderer/src/store/

- `useAppStore.ts` — Exports SessionCreateInput, SessionUpdateInput, SessionResult, SessionUpdateResult + 4 more (~5887 tok)

## src/renderer/src/types/

- `index.ts` — Exports Priority, TaskStatus, TASK_STATUSES, TaskSort + 23 more (~3208 tok)

## src/renderer/src/utils/

- `calendar.ts` — Exports HOUR_PX, SLOT_MIN, PX_PER_MIN, startOfDay + 7 more (~362 tok)
- `cn.ts` — Exports cn (~50 tok)
- `sessions.ts` — Exports sessionsInRange, computeTaskStats, formatDuration (~438 tok)
- `task.ts` — Exports PROJECT_COLOR_SWATCHES, PRIORITY_META, isTaskDueToday, isTaskOverdue + 5 more (~946 tok)
