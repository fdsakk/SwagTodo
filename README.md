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

### Optional Supabase sync

1. Create tables in Supabase using `supabase/schema.sql`.
2. Open **Settings** in the app.
3. Paste your Supabase **Project URL** and **anon key**.
4. (Optional) Set **Workspace ID** (default: `default`).
5. Click **Turn on sync** (or **Turn off sync** to disable).

Behavior:

- Default mode stays local (`electron-store`) until sync is enabled.
- Security: Supabase **anon key is not a secret**. If this project is exposed publicly, you must configure
  **Supabase Auth + RLS** policies, otherwise anyone can read/write your data.
- Workspace ID is a partition key; avoid `default` for anything shared — use a long random value.
- On first sync, local data is uploaded when remote workspace is empty.
- If remote workspace already has data, remote state becomes starting state.
- Synced scope: tasks, projects, labels, sessions, time blocks.

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
