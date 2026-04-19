-- SwagTodo Supabase schema (no JSONB)
-- Apply in Supabase SQL editor.
-- SECURITY: This app currently uses a Supabase anon key without auth.
-- If your project is exposed publicly, you MUST enable Supabase Auth + RLS policies
-- (workspace_id alone is not security).
-- Consider using a long random workspace_id (avoid 'default') to prevent accidental collisions.

create table if not exists swagtodo_projects (
  workspace_id text not null,
  id text not null,
  name text not null,
  color text not null,
  emoji text,
  description text,
  created_at timestamptz not null,
  primary key (workspace_id, id)
);

create table if not exists swagtodo_labels (
  workspace_id text not null,
  id text not null,
  name text not null,
  color text not null,
  primary key (workspace_id, id)
);

create table if not exists swagtodo_tasks (
  workspace_id text not null,
  id text not null,
  title text not null,
  description text,
  priority text not null,
  due_date date,
  project_id text,
  completed boolean not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  sort_order integer not null,
  primary key (workspace_id, id)
);

create table if not exists swagtodo_subtasks (
  workspace_id text not null,
  id text not null,
  task_id text not null,
  title text not null,
  completed boolean not null,
  sort_order integer not null,
  primary key (workspace_id, id)
);

create table if not exists swagtodo_task_labels (
  workspace_id text not null,
  task_id text not null,
  label_id text not null,
  primary key (workspace_id, task_id, label_id)
);

create table if not exists swagtodo_sessions (
  workspace_id text not null,
  id text not null,
  task_id text not null,
  project_id text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (workspace_id, id)
);

create table if not exists swagtodo_time_blocks (
  workspace_id text not null,
  id text not null,
  label text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null,
  primary key (workspace_id, id)
);

create index if not exists swagtodo_projects_ws_idx on swagtodo_projects (workspace_id);
create index if not exists swagtodo_labels_ws_idx on swagtodo_labels (workspace_id);
create index if not exists swagtodo_tasks_ws_idx on swagtodo_tasks (workspace_id);
create index if not exists swagtodo_subtasks_ws_idx on swagtodo_subtasks (workspace_id);
create index if not exists swagtodo_task_labels_ws_idx on swagtodo_task_labels (workspace_id);
create index if not exists swagtodo_sessions_ws_idx on swagtodo_sessions (workspace_id);
create index if not exists swagtodo_time_blocks_ws_idx on swagtodo_time_blocks (workspace_id);
