# Cerebrum

> OpenWolf learning memory. Updated automatically.
> Last updated: 2026-04-29

## User Preferences

- Follow `.wolf` protocol before touching files.
- App `Swag Todo`. Bun pkg manager (`bun install` / `bun run <script>`).
- Components in subfolders w/ `index.tsx` barrel — no loose files at `components/` root. Named exports only (default exports legacy shadcn `components/ui/` only).
- Page padding consistent (Settings/Appearance: `px-4` outer, `px-2` inner).
- Geist Sans UI font. Theme polish nudges harmony, preserves vibe, no redesign.
- Inbox tasks: shadcn `Item` cards, date `Badge`, `app-*` theme vars. Completion: delayed `done` mutation, no row exit/fade anim.
- Resolve review items fully, no cosmetic shortcuts.
- Terse caveman responses, full technical substance.

## Key Learnings

- **Persistence flow**: Zustand → `persist` → `window.api.storage.savePartial` IPC → main `better-sqlite3` cache → `writeDeltaTx` (JSON-diff, `changedTaskIds()`); changed tasks `INSERT OR REPLACE`, child rows rebuilt per-task. Other collections: `INSERT OR REPLACE` + `DELETE WHERE id NOT IN (json_each(?))`. `writeSnapshotTx` legacy-migration only. First run imports `todoist-clone.json` → `swag-todo.db`. Indices on `task_subtasks(task_id)`, `task_labels(task_id)`. `savePartial` failures → coss toast; last persisted JSON unchanged so patch retries. UI filters in `localStorage`. Filtered lists (Inbox) delay real `completed` mutation until exit anim done.
- **Test boundary**: IPC registered through pure `src/main/ipcHandlers.ts` for Node unit-tests w/o Electron. Store modules under Node tests must NOT static-import TSX UI — split non-visual singletons to `.ts` (e.g. `components/ui/toast-manager.ts`). Node tests cover serialization only — no native DB. Guard renderer Zustand auto-hydration w/ `typeof window === 'undefined'`.
- **Crash guard**: root wraps `App` in `GlobalErrorBoundary` + `window.error`/`unhandledrejection`. Ignore resource-load errors (`event.target !== window`). Main installs `uncaughtException`/`unhandledRejection` w/ `dialog.showErrorBox`.
- **Kanban DnD**: update draft column state in `onDragOver`, not only `onDragEnd` — late reorder freezes target column.
- **Component subfolders**: `layout/`, `task-panel/`, `task-list/`, `modals/`, `project/`, `sidebar/`, `settings/`, `task-edit/`, `kanban/`, `sessions-calendar/`, `ui/`. Cross-folder: `SubtaskList` → `task-list/animated-checkbox`; `KanbanCard` → `task-list/subtask-progress-ring`; `ProjectPanel` → `task-panel/panel-field`.
- **Shared modules**: types `src/shared/types.ts`; defaults (`UI_SCALE_OPTIONS`, `UiScale`, `DEFAULT_UI_SCALE`) `src/shared/defaults.ts`. Renderer re-exports via `@renderer/types`. Zod `src/shared/stateSchema.ts` reused by renderer persist + main normalization.
- **Health PK chart**: asymmetric `smoothSummedEffect` (faster rise, slower fall) on summed dose curve pre-crash/band analysis.
- **Theme**: `customTokensByTheme` per-preset; switching restores preset overrides. Legacy flat `customTokens` migrates to active bucket. Presets carry `tone: 'light' | 'dark'`; `ThemeProvider` exposes `data-theme-tone` + `app-theme-light/dark` root classes + chart contrast CSS vars.
- **Date serialization**: due-date calendar uses `format(day, 'yyyy-MM-dd')`, NOT `toISOString().slice(0, 10)` — positive UTC offsets shift back a day.
- **coss/Base UI**: primitives `@base-ui/react/*`, local `@renderer/components/ui/*`, `cn` from `@renderer/utils/cn`. Popup triggers need real DOM anchor; native `button` + `buttonVariants` for `PopoverTrigger render={...}`.
- **Default SelectItem layout**: selected checkmark belongs at the far right end; item text/content stays left in first grid column.
- **Tailwind v4**: `@tailwindcss/vite`, `@import 'tailwindcss'`, `@theme inline` in `src/renderer/src/assets/main.css`. Theme colors as `--color-app-*` for `bg-app-*`.
- **Project List/Board**: controlled coss `Tabs`/`TabsPanel` with `projectTab`/`setProjectTab` (`list`/`kanban`).
- **Dialog overlay + frameless title bar**: portaled to `body`; `DialogBackdrop`/`DialogViewport` constrained by `--app-overlay-top` in `App.tsx`.
- **Sidebar primitive**: `components/ui/sidebar.tsx` ships own `SidebarProvider` w/ `cookieStore.set` + `min-h-svh` — unsuitable for frameless Electron. Layout `Sidebar` exposes custom `SidebarContext.Provider` synced to Zustand `isSidebarCollapsed`, renders `Sidebar collapsible="none"`, sets `data-collapsible="icon"` + `data-state` for `group-data-*` + collapsed tooltips. Override `bg-sidebar`/`text-sidebar-foreground` w/ `!bg-app-sidebar !text-app-text`.
- **Task edit debounce**: pending commits in refs w/ original `taskId`; key `TaskEditPanel` by `task.id` so switching unmounts, flushes pending text, remounts clean.
- **Startup/package perf**: current Linux build packages renderer-only prod deps into `app.asar`; inspected `dist/linux-unpacked/resources/app.asar` at ~115 MB, extracted `node_modules` ~166 MB. Main runtime needs `better-sqlite3`, `zod`, `@electron-toolkit/utils`, but renderer deps are already bundled in `out/renderer/assets/index-*.js`.
- **Windows app icon**: `electron-builder.yml` points `win.icon` at `build/icon.ico`; keep it as a real multi-size ICO generated from `build/icon.png` with 256/128/64/48/32/16 sizes. `resources/icon.ico` is a packaged copy for manual/runtime access; runtime window icon still imports `resources/icon.png`.
- **Activity page responsive rows**: `ActivityRow` should not rely on fixed project/time columns; omit relative elapsed time when space is tight and use adaptive `minmax`/fraction tracks with `min-w-0 truncate` so task titles/projects share width without horizontal scroll.

## Do-Not-Repeat

- [2026-04-19] No loose components at `components/` root; no default exports for new components.
- [2026-04-19] No destructive sync (delete-all then insert-all) for Supabase.
- [2026-04-23] No swap persistence backends without first-run import; preserve old payload.
- [2026-04-23] No `savePartial` via full SQLite reload; keep normalized cache, merge patches in memory.
- [2026-04-23] No `better-sqlite3` tests under plain Node post Electron rebuild; test serialization layer.
- [2026-04-23] No flat `appearance.customTokens`; use per-theme buckets + migrate legacy.
- [2026-04-28] No repo Prettier traverse `.agents`, `.claude/skills`, `.pi`.
- [2026-04-29] No static-import TSX UI from persistence/store modules in Node tests; use `.ts` helpers/injected reporters.
- [2026-04-29] No type re-export alone when same file needs type locally; import + re-export separately.

## Decision Log

- [2026-04-19] Component reorg: 23 loose files → domain subfolders w/ `index.tsx` barrels, named exports.
- [2026-04-19] Supabase sync: debounced diff-based delta (upsert/delete) via shadow slice; `store:save` no longer awaits remote push. Renderer → Zustand `persist` + `store:savePartial`.
- [2026-04-23] Inbox completion: delayed real `toggleTaskComplete` behind local state in `TaskRow`.
- [2026-04-23] Lint: ESLint cache removed from script — false positives post-format.
- [2026-04-24] Archive task merge: keep `archive-tooltip-2` data model + filtering; Radix/shadcn `TaskContextMenu` from `archive-tooltip` w/ hover colors from `archive-tooltip-2`.
- [2026-04-28] `/components/ui` uses coss/Base UI + Tailwind v4; task right-click direct Base UI `ContextMenu`; Radix runtime removed.
- [2026-04-28] SearchSortBar filters: coss `Popover` w/ selects (not `Menu` — nested selects fight focus).
