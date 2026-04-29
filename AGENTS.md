# AGENTS.md

Repo rules for any agent working here.

## Start Here

- Read `.wolf/OPENWOLF.md`, `.wolf/anatomy.md`, and `.wolf/cerebrum.md` before touching code.
- If a file is missing from anatomy, add it after you read or create it.
- If AGENTS conflicts with README or old habits, follow AGENTS plus `.wolf`.

## Package Manager

- Use Bun for all repo work: `bun install`, `bun run <script>`, `bunx <tool>`, `bun add`, `bun add -d`.
- Do not use `npm`, `npx`, `yarn`, or `pnpm` unless the user explicitly asks.
- Do not regenerate `package-lock.json` as part of normal work.

## Commands

- Format: `bun run format` (Biome `format --write`)
- Lint: `bun run lint` (Biome `check`)
- Auto-fix lint + format: `bun run check` (Biome `check --write --unsafe`)
- Test: `bun run test` — runs `test:store` using `node --test` with sucrase TS transpile, not Vitest/Jest.
- Typecheck: `bun run typecheck` — runs both `typecheck:node` (main+preload) and `typecheck:web` (renderer).
- Build: `bun run build` — typechecks first, then `electron-vite build`.
- Dev: `bun run dev` — `electron-vite dev`.
- Typecheck is a prerequisite for build. Run typecheck before build if changing types.
- Prefer repo scripts over ad hoc command chains.

## Code Style (Biome)

Biome enforces these repo-wide rules — match them in new code:
- Double quotes, no semicolons, no trailing commas.
- JS line width: 80 chars; general line width: 100 chars.
- Import organization is auto-applied on `bun run check`.

## Project Layout

- `src/main/` — Electron main-process logic, SQLite storage, IPC handlers, dialogs, windows.
- `src/preload/` — The only renderer bridge. Expose APIs here, not in renderer.
- `src/shared/` — Cross-process types (`types.ts`), Zod schemas (`stateSchema.ts`), defaults (`defaults.ts`).
- `src/renderer/src/pages/` — Route-level page components.
- `src/renderer/src/components/<domain>/` — Feature components grouped by domain.
- `src/renderer/src/components/ui/` — Reusable UI primitives (coss/Base UI + Tailwind).
- `src/renderer/src/store/` — Zustand stores (domain state, UI state, persistence).
- Renderer path alias: `@renderer` → `src/renderer/src` (configured in `electron.vite.config.ts`).

## UI Stack

- **Primitives**: `@base-ui/react` (coss), not Radix. UI components in `components/ui/` use coss patterns.
- **Styling**: Tailwind v4 with `@tailwindcss/vite`. Theme vars use `--color-app-*` for `bg-app-*` classes. `@theme inline` block in `src/renderer/src/assets/main.css`.
- **Class merging**: `cn()` from `@renderer/utils/cn` (or `src/renderer/src/utils/cn.ts`).
- **Component registry**: `components.json` configures coss (`@coss`) and spell (`@spell`) registries for adding UI primitives.
- **Tailwind v4 specifics**: Uses `@import "tailwindcss"` and `@theme inline`, not a `tailwind.config.js`.

## Component Rules

- Never add loose files directly under `src/renderer/src/components/`.
- New feature components must live in their own subfolder with a barrel `index.tsx`.
- Named exports for feature components and hooks; default exports only where existing pages already use that pattern.
- Existing subfolder boundaries: `layout`, `task-panel`, `task-list`, `modals`, `project`, `sidebar`, `settings`, `task-edit`, `kanban`, `sessions-calendar`.
- Import from the nearest barrel when one exists.

## IPC / API Rules

- Renderer code must talk to Electron through `window.api` only.
- Do not import `electron`, `ipcRenderer`, `fs`, `path`, or `electron-store` into renderer files.
- When adding a new bridge: handler in `src/main/`, expose in `src/preload/index.ts`, type in `src/preload/index.d.ts` or `src/shared/types.ts`.
- Reuse `window.api.storage`, `window.api.ui`, and `window.api.window` patterns already in place.
- Shared app state and schema values belong in `src/shared/types.ts` and `src/shared/defaults.ts`.

## State / Data

- Keep the app local-first. No telemetry, cloud sync, or remote persistence unless the user asks.
- Use existing Zustand stores and IPC-backed persistence paths instead of ad hoc storage.
- Preserve partial-save flows like `store:savePartial` when changing renderer state persistence.
- Persistence flow: Zustand → `persist` → `window.api.storage.savePartial` IPC → main `better-sqlite3` → `writeDeltaTx` (JSON-diff). Do not replace with full-reload approaches.

## Testing

- Tests run via `node --test` with sucrase TS transpilation and `register-aliases.cjs` for path aliases.
- Store/domain tests must NOT static-import TSX UI modules. Use `.ts` helpers (e.g. `toast-manager.ts`) for injected reporters.
- Main IPC tests are pure Node — no Electron runtime needed.
- Guard renderer Zustand auto-hydration with `typeof window === 'undefined'` in test files.

## Housekeeping

- If you create, rename, or delete files, update `.wolf/anatomy.md`.
- Record meaningful mistakes or fixes in `.wolf/buglog.json` when protocol says so.
- Append a short entry to `.wolf/memory.md` after significant work.
- Keep UI spacing and container rhythm aligned with existing pages.