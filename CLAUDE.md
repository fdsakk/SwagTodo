# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: npm (lockfile present). `bun.lock` also exists but CI/scripts target npm.

| Task                                              | Command                                           |
| ------------------------------------------------- | ------------------------------------------------- |
| Install                                           | `npm install`                                     |
| Dev (hot reload, Electron window + Vite renderer) | `npm run dev`                                     |
| Type-check both targets                           | `npm run typecheck`                               |
| Type-check node/main+preload only                 | `npm run typecheck:node`                          |
| Type-check web/renderer only                      | `npm run typecheck:web`                           |
| Lint                                              | `npm run lint` (ESLint flat config, caching on)   |
| Format                                            | `npm run format` (Prettier)                       |
| Build (typecheck + bundle)                        | `npm run build`                                   |
| Preview built app                                 | `npm run start`                                   |
| Platform packages                                 | `npm run build:linux` / `build:mac` / `build:win` |

No test runner configured. No `test` script in `package.json`.

## Architecture

Electron app with three build targets via `electron-vite`: `main`, `preload`, `renderer`. Config in `electron.vite.config.ts`. Renderer alias `@renderer` → `src/renderer/src`.

### Process boundaries

- **Main** (`src/main/index.ts`) — creates the single `BrowserWindow`, owns `electron-store` persistence, registers all IPC handlers (`store:*`, `ui:*`, `window:*`), and emits `window:state` on maximize/unmaximize/full-screen transitions. Frameless window (`titleBarStyle: 'hidden'` / macOS `hiddenInset`), transparent. On Wayland it disables `WaylandColorManagement*` features to avoid rendering issues.
- **Preload** (`src/preload/index.ts`) — exposes a typed `window.api` bridge (`storage`, `ui`, `window`) via `contextBridge`. Non-context-isolated fallback assigns directly to `window`. Type declarations live in `src/preload/index.d.ts` and define the global `Window.api` shape consumed by the renderer.
- **Renderer** (`src/renderer/src/**`) — React 18 + Vite + Tailwind + shadcn/ui primitives (under `components/ui/`). Entry: `main.tsx` → `App.tsx`.

### State model

Single Zustand store in `src/renderer/src/store/useAppStore.ts` holds both persistent domain data (`tasks`, `projects`, `labels`, `uiScale`) and transient UI state (`selectedView`, `taskPanel`, `searchQuery`, `sortMode`, `showCompleted`, `isSidebarCollapsed`, `projectTab`, `searchFocusSignal`, `hydrated`).

Persistence flow:

1. `hydrate()` loads via `window.api.storage.loadState()` on mount (`App.tsx` `useEffect`).
2. A `useAppStore.subscribe` listener diff-checks `tasks` / `projects` / `labels` / `uiScale` by reference; unrelated UI state changes do **not** trigger persistence.
3. Debounced (120 ms) `window.api.storage.saveState({ tasks, projects, labels, uiScale })`.
4. Main validates the payload via `isAppState` before writing to `electron-store` (store name: `todoist-clone`).

When adding a persistent field: update `AppState` in `src/renderer/src/types/index.ts`, `src/main/index.ts` (+ `isAppState` guard), `src/preload/index.ts`, `src/preload/index.d.ts`, and the persist-subscribe diff in `useAppStore.ts`.

### Task domain invariants

- `Task.status` (`'todo' | 'in_progress' | 'done'`) and `Task.completed` are kept in sync inside `updateTask` / `toggleTaskComplete` — never update one without the other. `status === 'done'` ⇔ `completed === true`.
- `Task.order` is a per-project-column integer used by the kanban board; `applyKanbanOrder` rewrites `status` + `order` atomically for a project's tasks from drag output.
- Deleting a project nulls `projectId` on its tasks (does not delete them) and resets the current view to `inbox` if it was selected. Deleting a label strips its id from every task's `labels[]`.

### Component structure

All components live in `src/renderer/src/components/` subfolders — no loose files at root. Each subfolder has an `index.tsx` barrel. All exports are **named** (no default exports except legacy shadcn/ui primitives).

| Subfolder            | Contents                                                                         |
| -------------------- | -------------------------------------------------------------------------------- |
| `layout/`            | `TitleBar`, `Sidebar`, `ThemeProvider`, `SearchSortBar`                          |
| `task-panel/`        | `TaskDetailPanel`, `TaskCreatePanel`, `TaskEditPanel`, `TaskFormFields`, `Field` |
| `task-list/`         | `TaskList`, `TaskRow`, `AnimatedCheckbox`, `SubtaskProgressRing`                 |
| `modals/`            | `LabelManagerModal`, `ShortcutsHelpModal`, `ProjectPickerModal`                  |
| `project/`           | `ProjectPanel`, `ColorSelector`, `CustomColorInput`, `EmojiPicker`               |
| `sidebar/`           | `NavItem`, `ProjectList`, `SidebarFooter`                                        |
| `settings/`          | `CustomizeSection`, `ThemeSection`, `ThemeSwatch`                                |
| `task-edit/`         | `SessionStats`, `SubtaskList`                                                    |
| `kanban/`            | `KanbanBoard`, `KanbanCard`, `KanbanCardPreview`, `KanbanColumn`                 |
| `sessions-calendar/` | `SessionsCalendar`, `SessionBlockView`, `TimeBlockView`, `DraftGhost`            |
| `ui/`                | shadcn/ui primitives                                                             |

### Views

`App.tsx` renders one of six pages driven by `selectedView`: `InboxPage`, `TodayPage`, `ActivityPage`, `ProjectPage`, `SessionsPage`, `SettingsPage`. `ProjectPage` has two tabs (`list` | `kanban`) controlled by `projectTab` in the store. `TaskDetailPanel` is a slide-over that renders `TaskCreatePanel` / `TaskEditPanel` / project create/edit forms based on the discriminated-union `taskPanel` state.

### Shared form UI

`TaskCreatePanel` and `TaskEditPanel` share `components/task-panel/task-form-fields.tsx` (priority / due date / project / status / labels). The edit panel debounces title + description writes locally (200 ms + blur flush) to avoid store-wide re-renders per keystroke; `task.id` changes reset the local buffer via a render-time diff (no effect).

### IPC surface (renderer → main)

- `storage.loadState()` / `saveState(state)`
- `ui.getZoomFactor()` / `setZoomFactor(factor)` — zoom clamped server-side to `UI_SCALE_OPTIONS` (`[100, 110, 125, 150, 175]` / 100).
- `window.minimize()` / `toggleMaximize()` / `close()` / `getState()` / `onStateChange(listener)` — used by the custom `TitleBar`.

`UI_SCALE_OPTIONS` is duplicated in `src/main/index.ts`, `src/preload/index.ts`, `src/preload/index.d.ts`, and `src/renderer/src/types/index.ts` — keep them in sync when adding a scale.

### Keyboard shortcuts

Centralized in `src/renderer/src/hooks/useKeyboardShortcuts.ts`, wired from `App.tsx`. Shortcuts are suppressed while focus is in an input-like element (except `Escape`, which blurs the field then runs `onEscape`). Bindings: `n` new task, `p` new project, `l` labels, `b` toggle sidebar, `i`/`t`/`a` go to Inbox/Today/Activity, `1`/`2` switch project list/kanban, `/` focus search, `?` help.

### Styling

Tailwind 3 with shadcn/ui conventions. `cn()` helper in `src/renderer/src/utils/cn.ts` combines `clsx` + `tailwind-merge`. Theme tokens used in classes (`bg-app-bg`, `bg-app-titlebar`, `bg-app-content`) are defined in `tailwind.config.ts`.

### Drag-and-drop

Kanban uses `@dnd-kit/core` + `@dnd-kit/sortable`. `KanbanBoard` buckets tasks into columns in a single pass, precomputes a `labelMap` + `taskById` map for O(1) lookups, and commits reorders through the single `applyKanbanOrder` reducer (which short-circuits when nothing changed).

## Conventions

- Strict TS. Both node and web `tsconfig` extend `@electron-toolkit/tsconfig`. Run `npm run typecheck` after touching any shared type (`types/index.ts`, preload `.d.ts`, main state shape).
- Reducers in `useAppStore` prefer slice-return-unchanged patterns (`return state`) when no domain data changes, to avoid spurious re-renders and persistence writes.
- Platform-specific logic in main keys off `process.platform` and `process.env.XDG_SESSION_TYPE`; the `IS_MAC`/`IS_WAYLAND` constants at the top of `src/main/index.ts` are the canonical checks.
- When touching the title bar, note that `trafficLightPosition` is set for macOS; the frameless frame and drag regions are styled in `TitleBar.tsx`.
