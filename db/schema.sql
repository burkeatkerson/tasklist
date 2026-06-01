-- Task Manager schema — shared (no-auth) workspace.
-- Safe to run repeatedly.

create extension if not exists "pgcrypto";

-- ── tables ──────────────────────────────────────────────
create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  position   bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  project_id uuid references public.projects(id) on delete set null,
  done       boolean not null default false,
  flagged    boolean not null default false,
  position   bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on public.tasks (project_id);

-- ── row level security ──────────────────────────────────
-- Shared workspace: anon + authenticated may read/write everything.
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_all') then
    create policy projects_all on public.projects
      for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_all') then
    create policy tasks_all on public.tasks
      for all to anon, authenticated using (true) with check (true);
  end if;
end $$;

-- ── realtime ────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects') then
    alter publication supabase_realtime add table public.projects;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;
