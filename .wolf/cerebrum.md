# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-23

## User Preferences

- Read and follow `.wolf` protocol before touching project files; treat `.wolf` as mandatory project instructions.
- Keep page padding and content alignment visually consistent across views (especially matching Activity/Today spacing).
- Components must be organized in subfolders — no loose files at `components/` root.
- All component exports are **named** (not default). Default exports only in legacy shadcn/ui primitives under `components/ui/`.
- Each component subfolder has an `index.tsx` barrel that re-exports everything from that folder.
- Public app name is `Swag Todo`; use in docs and UI-facing metadata. Bun is the package manager; use `bun install` / `bun run <script>`.

## Key Learnings

- SQLite persistence: main-process `better-sqlite3` behind `window.api.storage` IPC. First run imports legacy `todoist-clone.json` into `swag-todo.db`. In-memory normalized cache avoids reload before every `store:savePartial`. Node tests must not open the native DB directly — test serialization helpers only.
- Renderer crash guard lives at root: wrap `App` in layout-level `GlobalErrorBoundary` and also listen for `window.error` + `unhandledrejection` so runtime faults show fallback UI instead of blank/crashed window.
- In renderer global `window.error` handling, ignore resource-load errors (`event.target !== window`) or missing font/img/script can falsely trip full-app fallback.
- Renderer Zustand is live state source; `persist` sends changed-slice patches via `store:savePartial`. UI filters still use `localStorage`.
- Kanban cross-column DnD: update draft column state in `onDragOver`, not only `onDragEnd` — late reorder leaves target column frozen and misplaces drop index.
- Settings/Appearance page: same container rhythm as list pages (`px-4` outer, `px-2` inner).
- Component subfolders: `layout/`, `task-panel/`, `task-list/`, `modals/`, `project/`, `sidebar/`, `settings/`, `task-edit/`, `kanban/`, `sessions-calendar/`, `ui/`. See CLAUDE.md for full mapping.
- Cross-folder import paths: `SubtaskList` → `task-list/animated-checkbox`; `KanbanCard` → `task-list/subtask-progress-ring`; `ProjectPanel` → `task-panel/panel-field`.
- Shared types in `src/shared/types.ts`; shared defaults (`UI_SCALE_OPTIONS`, `DEFAULT_UI_SCALE`, etc.) in `src/shared/defaults.ts`. Main + preload import directly; renderer re-exports from `@renderer/types`.
- Health PK chart: apply asymmetric smoothing (`smoothSummedEffect` — faster rise, slower fall) to summed dose curve before crash/band analysis to avoid sharp additive peaks.

## Do-Not-Repeat

- [2026-04-23] Do NOT swap persistence backends without a first-run import for existing user data; migrations must preserve old on-disk payload.
- [2026-04-23] Do NOT implement `savePartial` by reloading the full SQLite snapshot; keep normalized cache, merge patches in memory.
- [2026-04-23] Do NOT run `better-sqlite3` storage tests under plain Node runtime after Electron rebuild; test serialization layer instead.
- [2026-04-19] Do NOT place new components as loose files in `components/` root. Always use appropriate subfolder + `index.tsx` barrel.
- [2026-04-19] Do NOT use default exports for new components.
- [2026-04-19] Do NOT implement destructive sync (delete-all then insert-all) for Supabase — slow, risks data loss on partial failure.

## Decision Log

- [2026-04-23] Runtime crash guard: main process now installs global `uncaughtException` / `unhandledRejection` handlers with `dialog.showErrorBox`; renderer root wrapped in `GlobalErrorBoundary` to keep app open and offer reload after React/window/promise failures.
- [2026-04-23] Lint workflow: removed ESLint cache from repo script because cached prettier diagnostics produced false positives after formatting; correctness of signal beats small speed gain here.
- [2026-04-23] SQLite migration: replaced `electron-store` with `better-sqlite3`. Delta writes via `writeDeltaTx` (JSON-stringify diff, `changedTaskIds()`); only changed tasks get `INSERT OR REPLACE`, child rows rebuilt per-task. Other collections use `INSERT OR REPLACE` + `DELETE WHERE id NOT IN (json_each(?))`. In-memory cache avoids read-before-write. `writeSnapshotTx` kept for legacy migration only. Indices on `task_subtasks(task_id)` and `task_labels(task_id)`.
- [2026-04-19] Component reorganization: moved 23 loose root files into domain subfolders with `index.tsx` barrels. Named exports for barrel compatibility.
- [2026-04-19] Supabase sync: debounced diff-based delta (upsert/delete) via shadow slice; `store:save` IPC no longer awaits remote push. Types/constants consolidated into `src/shared/types.ts` + `src/shared/defaults.ts`. Renderer switched to Zustand `persist` with `store:savePartial`.
- [2026-04-19] Health PK: asymmetric smoothing (`smoothSummedEffect`) applied before crash/band analysis.
