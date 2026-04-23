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
- Format: `bun run format`
- Lint: `bun run lint`
- Test: `bun run test`
- Typecheck and build: `bun run build`
- Prefer repo scripts over ad hoc command chains.

## Project Layout
- `src/main/` owns Electron main-process logic, storage, dialogs, windows, and native app behavior.
- `src/preload/` owns the only renderer bridge. Expose APIs here, not in renderer.
- `src/shared/` owns cross-process types and defaults shared by main, preload, and renderer.
- `src/renderer/src/pages/` contains route-level page components.
- `src/renderer/src/components/<domain>/` contains feature components grouped by domain.
- `src/renderer/src/components/ui/` contains reusable UI primitives.

## Component Rules
- Never add loose files directly under `src/renderer/src/components/`.
- New feature components must live in their own subfolder with a barrel `index.tsx`.
- Prefer named exports for feature components and hooks.
- Keep default exports only where an existing page file already uses that pattern.
- Reuse existing subfolder boundaries such as `layout`, `task-panel`, `task-list`, `modals`, `project`, `sidebar`, `settings`, `task-edit`, `kanban`, and `sessions-calendar`.
- Import from the nearest barrel when one exists.

## IPC / API Rules
- Renderer code must talk to Electron through `window.api` only.
- Do not import `electron`, `ipcRenderer`, `fs`, `path`, or `electron-store` into renderer files.
- When adding a new bridge, implement the handler in `src/main/`, expose it in `src/preload/index.ts`, and type it in `src/preload/index.d.ts` or `src/shared/types.ts`.
- Reuse `window.api.storage`, `window.api.ui`, and `window.api.window` patterns already in place.
- Shared app state and schema values belong in `src/shared/types.ts` and `src/shared/defaults.ts`.

## State / Data
- Keep the app local-first. No telemetry, cloud sync, or remote persistence unless the user asks.
- Use existing Zustand stores and IPC-backed persistence paths instead of ad hoc storage.
- Preserve partial-save flows like `store:savePartial` when changing renderer state persistence.

## Housekeeping
- If you create, rename, or delete files, update `.wolf/anatomy.md`.
- Record meaningful mistakes or fixes in `.wolf/buglog.json` when protocol says so.
- Append a short entry to `.wolf/memory.md` after significant work.
- Keep UI spacing and container rhythm aligned with existing pages.
