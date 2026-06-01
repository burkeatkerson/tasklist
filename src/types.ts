// Domain model. Maps to the Supabase `projects` and `tasks` tables.
// In the DB, columns are snake_case (project_id); we expose camelCase to the UI.
import { COMPLETED_TTL_MS } from './config';

export interface Project {
  id: string;
  name: string;
  position: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  /** null = unattached ("loose") task shown in the Workspace TASKS list */
  projectId: string | null;
  done: boolean;
  flagged: boolean;
  position: number;
  createdAt: string;
  /** ISO timestamp set when checked off, cleared when unchecked. null = not done. */
  completedAt: string | null;
}

export interface Store {
  projects: Project[];
  tasks: Task[];
}

// flagged-and-open tasks float to the top; completed sink within their group.
export function byPriority(a: Task, b: Task): number {
  return (
    (a.done ? 1 : 0) - (b.done ? 1 : 0) ||
    (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0)
  );
}

// True once a completed task has aged past the TTL — hidden from the UI and
// eligible for permanent deletion by the sweep.
export function isExpiredCompleted(task: Task, now: number): boolean {
  return (
    task.done &&
    task.completedAt != null &&
    now - Date.parse(task.completedAt) >= COMPLETED_TTL_MS
  );
}
