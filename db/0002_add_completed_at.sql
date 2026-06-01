-- Adds completion timestamps so completed tasks auto-expire (24h TTL).
-- Run once against an existing database:
--   node scripts/migrate.mjs --file db/0002_add_completed_at.sql

alter table public.tasks add column if not exists completed_at timestamptz;

create index if not exists tasks_completed_at_idx on public.tasks (completed_at)
  where done = true;

-- Backfill: existing completed tasks start their 24h clock now.
update public.tasks
  set completed_at = now()
  where done = true and completed_at is null;
