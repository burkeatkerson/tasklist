import { createClient } from '@supabase/supabase-js';
import type { Project, Task } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Surfaced clearly in dev rather than failing with a cryptic network error.
  throw new Error(
    'Missing Supabase config. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

// Row shapes as stored in Postgres (snake_case).
export interface ProjectRow {
  id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  project_id: string | null;
  done: boolean;
  flagged: boolean;
  position: number;
  created_at: string;
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

// ── row <-> domain mappers ──────────────────────────────
export const toProject = (r: ProjectRow): Project => ({
  id: r.id,
  name: r.name,
  position: r.position,
  createdAt: r.created_at,
});

export const toTask = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  projectId: r.project_id,
  done: r.done,
  flagged: r.flagged,
  position: r.position,
  createdAt: r.created_at,
});
