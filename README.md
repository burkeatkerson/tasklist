# Task Manager

A minimalist, mobile-first task & project manager. Tap a project to open it,
check tasks off, flag priorities, and **drag a loose task onto a project card to
attach it** — the app's signature interaction. Built from the Direction D
wireframe, backed by Supabase.

## Stack

- **Vite + React 18 + TypeScript**
- **Supabase** (Postgres + Realtime) — shared workspace, no login
- Custom pointer-based drag-and-drop (touch-friendly, no extra library)
- **Vitest + Testing Library** for tests

## Getting started

```bash
npm install
cp .env.example .env        # then fill in your Supabase URL + anon key
npm run db:migrate          # create tables + seed sample data
npm run dev                 # http://localhost:5173
```

### Environment (`.env`)

| Variable                  | Used by  | Purpose                                  |
| ------------------------- | -------- | ---------------------------------------- |
| `VITE_SUPABASE_URL`       | frontend | Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY`  | frontend | Public anon / publishable key            |
| `SUPABASE_DB_*`           | migrate  | Direct Postgres connection (server-only) |

The `SUPABASE_DB_*` values are only read by `scripts/migrate.mjs` and are never
bundled into the browser.

## Database

`db/schema.sql` creates `projects` and `tasks` with RLS open to the shared
(anon) workspace and Realtime enabled. `db/seed.sql` loads sample data when the
tables are empty. Apply both with `npm run db:migrate`, or paste them into the
Supabase SQL Editor.

| `projects` | `tasks`                                              |
| ---------- | ---------------------------------------------------- |
| id, name, position, created_at | id, title, project_id (nullable), done, flagged, position, created_at |

A task with `project_id = null` is a "loose" task shown in the Workspace TASKS
list. Dragging it onto a project sets its `project_id`.

## Scripts

| Command              | What it does                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Start the dev server                      |
| `npm run build`      | Type-check + production build             |
| `npm run preview`    | Preview the production build              |
| `npm test`           | Run the test suite                        |
| `npm run db:migrate` | Apply schema + seed to Supabase           |
