import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project, Store, Task } from '../types';
import {
  supabase,
  toProject,
  toTask,
  type ProjectRow,
  type TaskRow,
} from '../lib/supabase';
import { COMPLETED_TTL_MS, SWEEP_INTERVAL_MS } from '../config';

const EMPTY: Store = { projects: [], tasks: [] };

function newId(): string {
  // Stable client-side id so optimistic inserts and their realtime echoes dedupe.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'tmp-' + Math.random().toString(36).slice(2);
}

export interface StoreActions {
  toggleTask: (id: string) => Promise<void>;
  toggleFlag: (id: string) => Promise<void>;
  attachTask: (taskId: string, projectId: string) => Promise<void>;
  detachTask: (taskId: string) => Promise<void>;
  createTask: (
    title: string,
    projectId: string | null,
    flagged?: boolean,
  ) => Promise<void>;
  createProject: (name: string) => Promise<Project | null>;
  deleteTask: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  sweepCompleted: () => Promise<void>;
}

export interface UseStore {
  store: Store;
  loading: boolean;
  error: string | null;
  actions: StoreActions;
}

export function useStore(): UseStore {
  const [store, setStore] = useState<Store>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always-current snapshot for realtime merges / rollback without re-subscribing.
  const ref = useRef(store);
  ref.current = store;

  const refresh = useCallback(async () => {
    const [{ data: pData, error: pErr }, { data: tData, error: tErr }] =
      await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('position', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true }),
      ]);
    if (pErr) throw pErr;
    if (tErr) throw tErr;
    setStore({
      projects: (pData ?? []).map(toProject),
      tasks: (tData ?? []).map(toTask),
    });
  }, []);

  // initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await refresh();
      } catch (e) {
        if (alive) setError(messageOf(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  // realtime — keep multiple devices/tabs in sync
  useEffect(() => {
    const channel = supabase
      .channel('tasklist-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) =>
          applyProject(
            setStore,
            payload.eventType,
            (payload.new as ProjectRow) ?? null,
            (payload.old as { id?: string })?.id,
          ),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) =>
          applyTask(
            setStore,
            payload.eventType,
            (payload.new as TaskRow) ?? null,
            (payload.old as { id?: string })?.id,
          ),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── mutations: optimistic local update, persist, resync on failure ──
  const guard = useCallback(
    async (optimistic: (s: Store) => Store, persist: () => Promise<void>) => {
      const prev = ref.current;
      setStore(optimistic(prev));
      try {
        await persist();
      } catch (e) {
        setError(messageOf(e));
        setStore(prev); // roll back
        // best-effort resync with the server's truth
        try {
          await refresh();
        } catch {
          /* keep rolled-back state */
        }
      }
    },
    [refresh],
  );

  const toggleTask = useCallback(
    (id: string) => {
      const cur = ref.current.tasks.find((t) => t.id === id);
      if (!cur) return Promise.resolve();
      const done = !cur.done;
      const completedAt = done ? new Date().toISOString() : null;
      return guard(
        (s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done, completedAt } : t,
          ),
        }),
        async () => {
          const { error } = await supabase
            .from('tasks')
            .update({ done, completed_at: completedAt })
            .eq('id', id);
          if (error) throw error;
        },
      );
    },
    [guard],
  );

  const toggleFlag = useCallback(
    (id: string) => {
      const cur = ref.current.tasks.find((t) => t.id === id);
      if (!cur) return Promise.resolve();
      const flagged = !cur.flagged;
      return guard(
        (s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, flagged } : t)),
        }),
        async () => {
          const { error } = await supabase
            .from('tasks')
            .update({ flagged })
            .eq('id', id);
          if (error) throw error;
        },
      );
    },
    [guard],
  );

  const attachTask = useCallback(
    (taskId: string, projectId: string) =>
      guard(
        (s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, projectId } : t,
          ),
        }),
        async () => {
          const { error } = await supabase
            .from('tasks')
            .update({ project_id: projectId })
            .eq('id', taskId);
          if (error) throw error;
        },
      ),
    [guard],
  );

  const detachTask = useCallback(
    (taskId: string) =>
      guard(
        (s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, projectId: null } : t,
          ),
        }),
        async () => {
          const { error } = await supabase
            .from('tasks')
            .update({ project_id: null })
            .eq('id', taskId);
          if (error) throw error;
        },
      ),
    [guard],
  );

  const createTask = useCallback(
    (title: string, projectId: string | null, flagged = false) => {
      const id = newId();
      const position = Date.now();
      const optimistic: Task = {
        id,
        title,
        projectId,
        done: false,
        flagged,
        position,
        createdAt: new Date().toISOString(),
        completedAt: null,
      };
      return guard(
        (s) => ({ ...s, tasks: [...s.tasks, optimistic] }),
        async () => {
          const { error } = await supabase.from('tasks').insert({
            id,
            title,
            project_id: projectId,
            done: false,
            flagged,
            position,
            completed_at: null,
          });
          if (error) throw error;
        },
      );
    },
    [guard],
  );

  const createProject = useCallback(
    async (name: string): Promise<Project | null> => {
      const id = newId();
      const position = Date.now();
      const optimistic: Project = {
        id,
        name,
        position,
        createdAt: new Date().toISOString(),
      };
      const prev = ref.current;
      setStore((s) => ({ ...s, projects: [...s.projects, optimistic] }));
      try {
        const { error } = await supabase
          .from('projects')
          .insert({ id, name, position });
        if (error) throw error;
        return optimistic;
      } catch (e) {
        setError(messageOf(e));
        setStore(prev);
        return null;
      }
    },
    [],
  );

  const deleteTask = useCallback(
    (id: string) =>
      guard(
        (s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }),
        async () => {
          const { error } = await supabase.from('tasks').delete().eq('id', id);
          if (error) throw error;
        },
      ),
    [guard],
  );

  // Deleting a project detaches its tasks (FK `on delete set null`) rather than
  // destroying them — they fall back to the loose Tasks list.
  const deleteProject = useCallback(
    (id: string) =>
      guard(
        (s) => ({
          ...s,
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: null } : t,
          ),
        }),
        async () => {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
          if (error) throw error;
        },
      ),
    [guard],
  );

  // Permanently delete completed tasks past their TTL. Idempotent; runs on
  // mount and on an interval, and removes them locally for an instant update.
  const sweepCompleted = useCallback(async () => {
    const cutoff = new Date(Date.now() - COMPLETED_TTL_MS).toISOString();
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('done', true)
      .lt('completed_at', cutoff);
    if (error) {
      // Non-fatal: leave them visible; the next sweep retries.
      console.warn('sweep failed:', messageOf(error));
      return;
    }
    setStore((s) => ({
      ...s,
      tasks: s.tasks.filter(
        (t) =>
          !(t.done && t.completedAt != null && t.completedAt < cutoff),
      ),
    }));
  }, []);

  // sweep after the first load, then on a timer
  useEffect(() => {
    if (loading) return;
    void sweepCompleted();
    const id = setInterval(() => void sweepCompleted(), SWEEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loading, sweepCompleted]);

  return {
    store,
    loading,
    error,
    actions: {
      toggleTask,
      toggleFlag,
      attachTask,
      detachTask,
      createTask,
      createProject,
      deleteTask,
      deleteProject,
      refresh,
      sweepCompleted,
    },
  };
}

// ── realtime row appliers (idempotent merge by id) ──────
function applyProject(
  setStore: React.Dispatch<React.SetStateAction<Store>>,
  eventType: string,
  row: ProjectRow | null,
  oldId: string | undefined,
) {
  setStore((s) => {
    if (eventType === 'DELETE') {
      return { ...s, projects: s.projects.filter((p) => p.id !== oldId) };
    }
    if (!row) return s;
    const p = toProject(row);
    const exists = s.projects.some((x) => x.id === p.id);
    const projects = exists
      ? s.projects.map((x) => (x.id === p.id ? p : x))
      : [...s.projects, p];
    projects.sort((a, b) => a.position - b.position);
    return { ...s, projects };
  });
}

function applyTask(
  setStore: React.Dispatch<React.SetStateAction<Store>>,
  eventType: string,
  row: TaskRow | null,
  oldId: string | undefined,
) {
  setStore((s) => {
    if (eventType === 'DELETE') {
      return { ...s, tasks: s.tasks.filter((t) => t.id !== oldId) };
    }
    if (!row) return s;
    const t = toTask(row);
    const exists = s.tasks.some((x) => x.id === t.id);
    const tasks = exists
      ? s.tasks.map((x) => (x.id === t.id ? t : x))
      : [...s.tasks, t];
    return { ...s, tasks };
  });
}

function messageOf(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}
