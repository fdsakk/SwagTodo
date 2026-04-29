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

## Tier 2 — Code Quality / Dead Weight

### High value targets

- [ ] **`task-form-fields.tsx`** (260 lines) — audit: shared between Create + Edit panels. Likely duplicated render logic. Check for inline lambdas re-creating handlers per render.
- [ ] **`KanbanBoard.tsx`** (287 lines) — `useMemo`/`useCallback` audit; `buildColumnTaskIds` complexity; verify drag handlers stable across renders.
- [ ] **`CustomizeSection.tsx`** (282 lines) — token-by-token color editor. Likely lots of repetitive JSX rows. Extract `<TokenRow>` component, drive list from `TOKEN_LABELS`.
- [ ] **`task-context-menu.tsx`** (188 lines) — STATUSES const + many menu items. Check for dead branches, inline duplicate item shapes.
- [ ] **`Sidebar.tsx`** (216 lines) — mostly fine after recent refactor; double-check `COLLAPSED_WIDTH` usage and confirm SidebarContext sync.
- [ ] **`TaskEditPanel.tsx`** (227 lines) — debounced text writes (200ms + blur). Confirm no stale closures on rapid task switches; ensure render-time diff still resets buffer correctly.

### Codebase-wide audit

- [ ] Grep for `any` types — replace with proper types or `unknown` + narrow.
- [ ] Grep for `console.log` / `console.warn` — should be only `console.error` in main process; renderer should be silent in prod or use a wrapper.
- [ ] Grep for `// TODO` / `// FIXME` / `// HACK` — triage list.
- [ ] Grep for `eslint-disable` — verify each is justified, remove unused.
- [ ] Grep for empty `catch {}` blocks — at minimum log; better, narrow to the error class actually expected.
- [ ] Grep for unused exports (`ts-prune` or manual): each `index.tsx` barrel may re-export internal-only helpers.
- [ ] `App.tsx` (227 lines) — view switch statement; consider routing config table `Record<View, () => JSX.Element>` if it grows.
- [ ] Audit `useMemo` / `useCallback` for trivial computations (premature memo). Heuristic: if dep array > body cost, drop the memo.

### Specific code smells observed

- [ ] **HealthPage `ResizeObserver` callback ref** — `chartContainerRef` was a callback ref creating new RO on every render. Now in `EffectChart`, still callback ref but stable via `useCallback([])`. Verify no remount loop on parent re-render. Consider `useEffect` + plain ref instead.
- [ ] **SessionsCalendar `findDayIndexAtX`** — getBoundingClientRect on every pointermove. Acceptable, but cache on drag start if perf shows up.
- [ ] **`changedIds`** in sqlite/serialize — `JSON.stringify` per row each diff. For large medication/session lists this is O(n) string alloc per write. Consider hash or shallow compare.
- [ ] **SQLite delta write** — currently rebuilds child rows for every changed task even if only `title` changed. Negligible for small N; revisit if perf issue.

---

## Tier 3 — Production Practices

### IPC + error boundaries

- [ ] **IPC error handling**: renderer assumes `window.api.storage.savePartial` succeeds. Wrap in try/catch on caller; surface failures via toast. Check `persist.ts`.
- [ ] **GlobalErrorBoundary**: confirm it catches lazy route loads if any. Currently no `React.lazy` — fine for now but note for future.
- [ ] **Main process unhandled errors**: confirm `dialog.showErrorBox` actually fires; test by throwing in IPC handler.

### Persistence

- [ ] **Persist payload diffing**: `persistedStorage` saves only changed keys. Confirm via test with multi-field update — already tested ✓ but verify no regression after Tier 1 splits.
- [ ] **Stale closures in `TaskEditPanel`**: the 200ms debounce flushes via `useRef`. On task switch, ensure flush happens before `task.id` change clears buffer. Existing render-time diff handles this — confirm with manual QA.
- [ ] **Migration path**: `parseLegacyElectronStore` assumes `appState` key. If user never had legacy file, that's fine. If they had a partial/corrupt one, current code logs + returns null. Acceptable.

### Build / config

- [ ] **`UI_SCALE_OPTIONS` duplication** — duplicated in 4 files per CLAUDE.md. Move to `src/shared/defaults.ts` only; renderer/preload/main import from there. Single source.
- [ ] **`tsconfig`**: verify `strict: true` actually set in both tsconfigs (extends `@electron-toolkit/tsconfig`). Run `tsc --showConfig` to confirm.
- [ ] **ESLint cache**: removed per cerebrum (correctness > speed). Don't re-add.
- [ ] **`out/` in anatomy.md** — large built files tracked. Add to `.wolf` ignore if scanning.

### Testing gaps

- [ ] No tests for: IPC handlers in `main/index.ts`, `useCalendarDrag` (DOM-heavy, hard), `useKeyboardShortcuts`. Add only if a regression hits there.
- [ ] No integration test: full hydrate → mutate → savePartial → reload cycle. Worth adding once.
- [ ] No tests for `pharmacokinetics.ts` chart compute. Pure function — easy win, add fixture-based test.

### Architecture

- [ ] **Domain store actions** (`store/domain/actions/*.ts`) — 6 files. Look for duplicate normalize/validate logic across `tasks.ts` / `projects.ts` / `labels.ts`. `normalize.ts` already exists; ensure all actions route through it.
- [ ] **`relations.ts` helpers** — used in deleteProject/deleteLabel cascades. Verify no orphan rows on edge cases (concurrent deletes).
- [ ] **Selectors** (`store/domain/selectors.ts`) — 11+ exports. Audit for unused; some may be dead from earlier refactor.

---

## Notes

- Strategy: do Tier 2 file-by-file, typecheck after each. Do Tier 3 audits in batches (one grep, fix all).
- Risk: Tier 2 touches many components. Manual UI QA needed after each major file.
- Prefer behavior-preserving renames + extracts over rewrites.
