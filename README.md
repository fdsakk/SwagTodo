# electron-todo

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Optional PostgreSQL sync

1. Open **Settings** in the app.
2. Paste your PostgreSQL connection URL.
3. Click **Turn on sync** (or **Turn off sync** to disable).

Behavior:

- Default mode stays local (`electron-store`) until sync is enabled.
- On first sync, local data is uploaded when DB is empty.
- If DB already has data, DB state is used as the starting state.
- Synced data scope: tasks, projects, labels, sessions, time blocks.

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
