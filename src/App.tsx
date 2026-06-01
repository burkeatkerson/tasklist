import { useEffect, useMemo, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Store, Task } from './types';
import { isExpiredCompleted } from './types';
import { T } from './theme';
import { useStore } from './data/useStore';
import { useMediaQuery } from './hooks/useMediaQuery';
import { Workspace } from './components/Workspace';
import { ProjectView } from './components/ProjectView';
import { DesktopShell, type Selected } from './components/DesktopShell';
import { DragGhost, type DragState } from './components/DragGhost';
import { Toast, type ToastState } from './components/Toast';

type View = { name: 'home' } | { name: 'project'; id: string };

export default function App() {
  const { store, loading, error, actions } = useStore();
  const wide = useMediaQuery('(min-width: 880px)');
  const [view, setView] = useState<View>({ name: 'home' });
  const [selected, setSelected] = useState<Selected>({ type: 'tasks' });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Re-render every minute so completed tasks vanish as they cross the TTL,
  // even with no other activity.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Hide completed tasks that have aged out (the sweep deletes them server-side;
  // this makes them disappear instantly on the exact boundary).
  const visibleStore: Store = useMemo(
    () => ({
      projects: store.projects,
      tasks: store.tasks.filter((t) => !isExpiredCompleted(t, now)),
    }),
    [store, now],
  );

  const flash = (msg: string) => setToast({ msg, id: nextToastId() });

  const project =
    view.name === 'project'
      ? store.projects.find((p) => p.id === view.id) ?? null
      : null;

  // ── drag-to-attach (pointer-based, touch-friendly) ──
  const hitProject = (x: number, y: number): string | null => {
    const els = document.elementsFromPoint(x, y) as HTMLElement[];
    const el = els.find((e) => e.dataset && e.dataset.projId);
    return el ? el.dataset.projId ?? null : null;
  };

  const onDragStart = (e: PointerEvent, task: Task) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let started = false;

    const move = (ev: globalThis.PointerEvent) => {
      if (!started && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6)
        return;
      started = true;
      setDrag({
        task,
        x: ev.clientX,
        y: ev.clientY,
        over: hitProject(ev.clientX, ev.clientY),
      });
    };

    const up = (ev: globalThis.PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const pid = started ? hitProject(ev.clientX, ev.clientY) : null;
      if (pid && pid !== task.projectId) {
        void actions.attachTask(task.id, pid);
        const pname = store.projects.find((p) => p.id === pid)?.name;
        flash('Attached to ' + pname);
        navigator.vibrate?.(12);
      }
      setDrag(null);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // ── mutation wrappers (with toasts) ──
  const addLooseTask = (title: string) => {
    void actions.createTask(title, null);
    flash('Added to Tasks');
  };
  const addProjectTask = (title: string, projectId: string, name: string) => {
    void actions.createTask(title, projectId);
    flash('Added to ' + name);
  };
  const addTaskDesktop = (
    title: string,
    proj: { id: string; name: string } | null,
  ) => {
    if (proj) addProjectTask(title, proj.id, proj.name);
    else addLooseTask(title);
  };
  const addProject = async (name: string) => {
    const p = await actions.createProject(name);
    if (p) flash('Project created · ' + name);
  };
  const detach = (taskId: string) => {
    void actions.detachTask(taskId);
    flash('Moved to Tasks');
  };
  const deleteTask = (taskId: string) => {
    void actions.deleteTask(taskId);
    flash('Task deleted');
  };
  const deleteProject = (projectId: string) => {
    const name = store.projects.find((p) => p.id === projectId)?.name;
    void actions.deleteProject(projectId);
    setView({ name: 'home' });
    flash(name ? 'Deleted · ' + name : 'Project deleted');
  };

  const errored =
    error && store.projects.length === 0 && store.tasks.length === 0;

  let body: React.ReactNode;
  if (loading || errored) {
    body = (
      <div className="app-bg">
        {loading ? (
          <Centered>Loading…</Centered>
        ) : (
          <Centered>
            <div style={{ color: T.prio, fontWeight: 600, marginBottom: 8 }}>
              Couldn’t reach Supabase
            </div>
            <div style={{ color: T.mut, fontSize: 13, maxWidth: 300 }}>{error}</div>
            <button
              onClick={() => void actions.refresh()}
              style={{
                marginTop: 18,
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                color: T.accInk,
                background: T.acc,
                border: 'none',
                borderRadius: 12,
                padding: '11px 20px',
              }}
            >
              Retry
            </button>
          </Centered>
        )}
      </div>
    );
  } else if (wide) {
    body = (
      <DesktopShell
        store={visibleStore}
        selected={selected}
        onSelect={setSelected}
        onToggle={(id) => void actions.toggleTask(id)}
        onFlag={(id) => void actions.toggleFlag(id)}
        onDetach={detach}
        onDeleteTask={deleteTask}
        onDeleteProject={deleteProject}
        onAddTask={addTaskDesktop}
        onAddProject={addProject}
        onDragStart={onDragStart}
        dragOverId={drag?.over ?? null}
        draggingId={drag?.task.id ?? null}
      />
    );
  } else {
    body = (
      <div className="app-bg">
        <div className="app-frame">
          {view.name === 'home' || !project ? (
            <Workspace
              store={visibleStore}
              onOpen={(id) => setView({ name: 'project', id })}
              onToggle={(id) => void actions.toggleTask(id)}
              onFlag={(id) => void actions.toggleFlag(id)}
              onDelete={deleteTask}
              onDragStart={onDragStart}
              dragOverId={drag?.over ?? null}
              draggingId={drag?.task.id ?? null}
              onAddTask={addLooseTask}
              onAddProject={addProject}
            />
          ) : (
            <ProjectView
              project={project}
              store={visibleStore}
              onBack={() => setView({ name: 'home' })}
              onToggle={(id) => void actions.toggleTask(id)}
              onFlag={(id) => void actions.toggleFlag(id)}
              onAddTask={(title) => addProjectTask(title, project.id, project.name)}
              onDetach={detach}
              onDeleteTask={deleteTask}
              onDeleteProject={deleteProject}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {body}
      <Toast toast={toast} />
      <DragGhost drag={drag} />
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: T.mut,
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

let toastSeq = 0;
function nextToastId(): number {
  toastSeq += 1;
  return toastSeq;
}
