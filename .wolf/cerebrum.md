# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-19

## User Preferences

- Keep page padding and content alignment visually consistent across views (especially matching Activity/Today spacing).
- Components must be organized in subfolders — no loose files at `components/` root.
- All component exports are **named** (not default). Default exports only in legacy shadcn/ui primitives under `components/ui/`.
- Each component subfolder has an `index.tsx` barrel that re-exports everything from that folder.

## Key Learnings

- Settings/Appearance page should follow the same container rhythm used by list pages (`px-4` outer, `px-2` inner alignment) for consistent layout.
- Component subfolders: `layout/`, `task-panel/`, `task-list/`, `modals/`, `project/`, `sidebar/`, `settings/`, `task-edit/`, `kanban/`, `sessions-calendar/`, `ui/`. See CLAUDE.md component table for full mapping.
- `SubtaskList` (`task-edit/`) imports `AnimatedCheckbox` from `task-list/animated-checkbox` — not from root.
- `KanbanCard` (`kanban/`) imports `SubtaskProgressRing` from `task-list/subtask-progress-ring` — not from root.
- `ProjectPanel` (`project/`) imports `Field` from `task-panel/panel-field` — shared primitive across folders.
- Supabase sync should be **delta-based** (upsert/delete) with main-process debouncing; avoid delete+reinsert of whole workspace and don’t await remote push inside `store:save` IPC.
- Shared domain/IPC types now live in `src/shared/types.ts`; main + preload import from it, renderer re-exports those shared types from `@renderer/types`.
- Shared defaults now live in `src/shared/defaults.ts` (`UI_SCALE_OPTIONS`, `DEFAULT_UI_SCALE`, `DEFAULT_WORKSPACE_ID`, `DEFAULT_SYNC_SETTINGS`) and should be reused across main/renderer.
- Renderer persistence now uses Zustand `persist` with IPC-backed storage and partial patch saves (`store:savePartial`) instead of manual subscribe+debounce.

## Do-Not-Repeat

<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

- [2026-04-19] Do NOT place new components as loose files in `components/` root. Always put in appropriate subfolder + export from its `index.tsx`.
- [2026-04-19] Do NOT use default exports for new components. Use named exports throughout.
- [2026-04-19] Do NOT implement destructive sync (delete-all then insert-all) for Supabase workspaces — it’s slow and can wipe remote data on partial failure.

## Decision Log

- [2026-04-19] Moved all 23 loose `components/` root files into domain subfolders with `index.tsx` barrels. Rationale: reduce import noise, enforce discoverability, eliminate root clutter. Named exports chosen over default so barrel re-exports work without aliasing.
- [2026-04-19] Refactored Supabase sync to use a debounced, diff-based delta (upsert/delete) driven by a “shadow” slice; IPC `store:save` no longer awaits remote sync to avoid backpressure.
- [2026-04-19] Consolidated duplicated cross-process types/constants into `src/shared/types.ts` and updated `main`, `preload`, `preload/index.d.ts`, and renderer types to consume/re-export shared definitions.
- [2026-04-19] Introduced shared defaults module and partial IPC persistence path (`store:savePartial`), then switched renderer persistence to Zustand `persist` with changed-slice patching.
