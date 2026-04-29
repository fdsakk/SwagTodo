# Refactor Suggestions — Tiers 2 & 3

> Created 2026-04-29 after Tier 1 completion. Tier 1 (file splits) done.
> Resume with: HealthPage, SessionsCalendar, sqlite.ts, SessionsPage all split + tests pass.

---

## Tier 1 — DONE

- [x] `HealthPage.tsx` 532 → 67 lines. Extracted `pages/health/{utils,SliderRow,QuickAddButtons,MedLogList,EffectChart,PkParams}.tsx`
- [x] `SessionsCalendar.tsx` 527 → 247 lines. Extracted `CalendarHeader.tsx`, `useCalendarDrag.ts`. Default → named export. Dedupe drag mode shape.
- [x] `sqlite.ts` 814 → 8-line barrel. Split into `sqlite/{types,schema,serialize,storage}.ts`. Extracted `idsJson` helper.
- [x] `SessionsPage.tsx` 317 → 220 lines. Extracted `pages/sessions/{SessionsToolbar,useSessionsKeyboard}.ts(x)`

Verified: `bun run typecheck` ✓, `bun run lint` ✓, `bun run test` 29/29 ✓.

---

## Tier 2 — DONE

### High value targets

- [x] **`task-form-fields.tsx`** — memoized label set/project options; stable handlers remain shared by Create + Edit.
- [x] **`KanbanBoard.tsx`** — named export; extracted label/task/column mapping helpers; drag handlers stay stable.
- [x] **`CustomizeSection.tsx`** — extracted memoized token group/card flow; token rows driven by `TOKEN_LABELS`.
- [x] **`task-context-menu.tsx`** — deduped submenu shell/checked item shapes; priorities derive from `PRIORITY_META`.
- [x] **`Sidebar.tsx`** — replaced loose collapsed/expanded constants with width map; SidebarContext noop setters stable.
- [x] **`TaskEditPanel.tsx`** — debounced commits use pending refs keyed by task id; edit panel keyed by task id so switch flushes on unmount.

### Codebase-wide audit

- [x] Grep for `any` types — no app-source matches after audit.
- [x] Grep for `console.log` / `console.warn` — no app-source matches.
- [x] Grep for `// TODO` / `// FIXME` / `// HACK` — no app-source matches.
- [x] Grep for `eslint-disable` — only CommonJS require-hook test preload; narrowed to two justified next-line disables.
- [x] Grep for empty `catch {}` blocks — no app-source matches.
- [x] Grep for unused exports (`ts-prune` or manual): removed `domainSelectors`, `isTaskInFuture`, `CHART_TICK_INTERVAL`, `CALENDAR_PX_PER_MIN`.
- [x] `App.tsx` — replaced repeated view conditionals with `Record<ViewName, JSX.Element>` content map and full-height view set.
- [x] Audit `useMemo` / `useCallback` — kept non-trivial map/drag/selector handlers; removed stale/default export issue in Kanban.

### Specific code smells observed

- [x] **HealthPage `ResizeObserver` callback ref** — `EffectChart` now uses plain ref + `useEffect` observer lifecycle.
- [x] **SessionsCalendar `findDayIndexAtX`** — column rects cached on drag start for session/time-block moves.
- [x] **`changedIds`** in sqlite/serialize — replaced per-row `JSON.stringify` diff with shallow row compare.
- [x] **SQLite delta write** — child rows rebuild only when subtask/label child signatures change, not on title-only task updates.

---

## Tier 3 — DONE

### IPC + error boundaries

- [x] **IPC error handling**: `persistedStorage` catches `savePartial`, reports coss toast, keeps patch pending for retry.
- [x] **GlobalErrorBoundary**: no `React.lazy` routes currently; existing root boundary covers current route tree.
- [x] **Main process unhandled errors**: handler remains installed; IPC registration extracted and tested with invalid payload/zoom paths.

### Persistence

- [x] **Persist payload diffing**: changed-key save and retry covered by tests; full hydrate → mutate → savePartial → reload test added.
- [x] **Stale closures in `TaskEditPanel`**: pending text commits store `taskId`; keyed edit panel flushes cleanup before task switch.
- [x] **Migration path**: existing legacy/corrupt payload tests retained and passing.

### Build / config

- [x] **`UI_SCALE_OPTIONS` duplication** — now defined in `src/shared/defaults.ts`; `UiScale` type re-exported from shared types.
- [x] **`tsconfig`**: verified `strict: true` in node and web via `tsc --showConfig`.
- [x] **ESLint cache**: not re-added.
- [x] **`out/` in anatomy.md** — noted as generated build output already present from scanner; no source dependency added.

### Testing gaps

- [x] IPC handlers covered through extracted `src/main/ipcHandlers.ts` with fake registrar/window/storage tests. DOM-heavy `useCalendarDrag` and keyboard hook remain lint/typechecked; no regression-specific unit added.
- [x] Full hydrate → mutate → savePartial → reload cycle test added in `persist.test.ts`.
- [x] `pharmacokinetics.ts` fixture tests added for full-day curve, step sizing/dose scaling, unknown medication ids.

### Architecture

- [x] **Domain store actions** — audited; tasks/projects/labels already route through shared normalize helpers.
- [x] **`relations.ts` helpers** — existing deleteTask/deleteProject/deleteLabel cascade tests retained and passing.
- [x] **Selectors** — unused `domainSelectors` aggregate and unused future helper removed.

---

## Notes

- Completed 2026-04-29.
- Verified: `bun run format` ✓, `bun run lint` ✓, `bun run test` ✓, `bun run typecheck` ✓, `bun run build` ✓.
- Follow-up only if desired: manual UI smoke test for drag/menu/dialog workflows.
