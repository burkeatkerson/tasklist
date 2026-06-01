import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Store, Task } from '../types';
import { byPriority } from '../types';
import { T } from '../theme';
import { DangerConfirm, FlagGlyph, Progress } from './atoms';
import { LooseRow } from './LooseRow';
import { TaskLine } from './TaskLine';
import { InlineComposer } from './InlineComposer';

export type Selected = { type: 'tasks' } | { type: 'project'; id: string };

function todayLabel(): string {
  const d = new Date();
  const day = d.toLocaleDateString(undefined, { weekday: 'long' });
  const month = d.toLocaleDateString(undefined, { month: 'long' });
  return `${day} · ${month} ${d.getDate()}`;
}

export interface DesktopShellProps {
  store: Store;
  selected: Selected;
  onSelect: (s: Selected) => void;
  onToggle: (id: string) => void;
  onFlag: (id: string) => void;
  onDetach: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (title: string, project: { id: string; name: string } | null) => void;
  onAddProject: (name: string) => void;
  onDragStart: (e: PointerEvent, task: Task) => void;
  dragOverId: string | null;
  draggingId: string | null;
}

export function DesktopShell({
  store,
  selected,
  onSelect,
  onToggle,
  onFlag,
  onDetach,
  onDeleteTask,
  onDeleteProject,
  onAddTask,
  onAddProject,
  onDragStart,
  dragOverId,
  draggingId,
}: DesktopShellProps) {
  const loose = store.tasks
    .filter((t) => t.projectId === null)
    .slice()
    .sort(byPriority);
  const looseOpen = loose.filter((t) => !t.done).length;

  const selProject =
    selected.type === 'project'
      ? store.projects.find((p) => p.id === selected.id) ?? null
      : null;
  // selection fell away (e.g. project deleted) → show Tasks
  const showTasks = selected.type === 'tasks' || !selProject;

  return (
    <div className="dk-shell">
      <div className="dk-app">
        <aside className="dk-side">
          <div style={{ padding: '2px 12px 18px' }}>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: T.faint,
                fontWeight: 600,
              }}
            >
              {todayLabel()}
            </div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: '-.02em',
                marginTop: 5,
              }}
            >
              Task Manager
            </div>
          </div>

          <button
            className={'dk-row' + (showTasks ? ' sel' : '')}
            onClick={() => onSelect({ type: 'tasks' })}
          >
            <span style={{ display: 'flex', color: showTasks ? T.ink : T.mut }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" />
              </svg>
            </span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Tasks</span>
            {looseOpen > 0 && (
              <span style={{ fontSize: 11.5, color: T.faint }}>{looseOpen}</span>
            )}
          </button>

          <ProjectsHeader onAddProject={onAddProject} />

          <div style={{ overflowY: 'auto', marginLeft: -4, marginRight: -4, paddingLeft: 4, paddingRight: 4 }}>
            {store.projects.map((p) => {
              const mine = store.tasks.filter((t) => t.projectId === p.id);
              const done = mine.filter((t) => t.done).length;
              const hasPrio = mine.some((t) => t.flagged && !t.done);
              const isSel = selProject?.id === p.id;
              const dropping = dragOverId === p.id;
              return (
                <button
                  key={p.id}
                  data-proj-id={p.id}
                  className={
                    'dk-row' + (isSel ? ' sel' : '') + (dropping ? ' drop' : '')
                  }
                  onClick={() => onSelect({ type: 'project', id: p.id })}
                  style={{ alignItems: 'flex-start' }}
                >
                  <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 7,
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 14,
                          fontWeight: 500,
                          color: dropping ? T.acc : T.ink,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name}
                      </span>
                      {hasPrio && !dropping && (
                        <span style={{ display: 'flex', color: T.prio }}>
                          <FlagGlyph on size={11} />
                        </span>
                      )}
                    </div>
                    {dropping ? (
                      <div style={{ fontSize: 11.5, color: T.acc, fontWeight: 600 }}>
                        Drop to attach
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Progress done={done} total={mine.length} />
                        </div>
                        <span style={{ fontSize: 11, color: T.faint }}>
                          {done}/{mine.length}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="dk-main">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {showTasks ? (
              <TasksPane
                loose={loose}
                onToggle={onToggle}
                onFlag={onFlag}
                onDelete={onDeleteTask}
                onDragStart={onDragStart}
                draggingId={draggingId}
                hasProjects={store.projects.length > 0}
                onAddTask={(title) => onAddTask(title, null)}
              />
            ) : (
              <ProjectPane
                project={selProject!}
                store={store}
                onToggle={onToggle}
                onFlag={onFlag}
                onDetach={onDetach}
                onDeleteTask={onDeleteTask}
                onDeleteProject={(id) => {
                  onDeleteProject(id);
                  onSelect({ type: 'tasks' });
                }}
                onAddTask={(title) =>
                  onAddTask(title, { id: selProject!.id, name: selProject!.name })
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProjectsHeader({ onAddProject }: { onAddProject: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (adding) ref.current?.focus();
  }, [adding]);
  const commit = () => {
    const n = name.trim();
    if (n) onAddProject(n);
    setName('');
    setAdding(false);
  };
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 12px 6px',
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '.04em',
            color: T.mut,
          }}
        >
          PROJECTS
        </span>
        <button
          onClick={() => setAdding(true)}
          aria-label="New project"
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            border: '1px solid ' + T.line,
            background: T.surf2,
            color: T.mut,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
        </button>
      </div>
      {adding && (
        <div style={{ padding: '4px 12px 6px' }}>
          <input
            ref={ref}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              else if (e.key === 'Escape') {
                setName('');
                setAdding(false);
              }
            }}
            onBlur={commit}
            placeholder="Project name"
            className="pm-input"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid ' + T.acc,
              outline: 'none',
              color: T.ink,
              font: 'inherit',
              fontSize: 14,
              fontWeight: 500,
              padding: '4px 0',
            }}
          />
        </div>
      )}
    </>
  );
}

function TasksPane({
  loose,
  onToggle,
  onFlag,
  onDelete,
  onDragStart,
  draggingId,
  hasProjects,
  onAddTask,
}: {
  loose: Task[];
  onToggle: (id: string) => void;
  onFlag: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: PointerEvent, task: Task) => void;
  draggingId: string | null;
  hasProjects: boolean;
  onAddTask: (title: string) => void;
}) {
  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.02em' }}>
        Tasks
      </div>
      <div style={{ fontSize: 12.5, color: T.faint, marginTop: 6, marginBottom: 18 }}>
        {loose.filter((t) => !t.done).length} open
      </div>
      {loose.length === 0 && (
        <div style={{ color: T.faint, fontSize: 13.5, padding: '4px 2px 2px' }}>
          No loose tasks. Add one below
          {hasProjects ? ' — or open a project from the sidebar.' : '.'}
        </div>
      )}
      {loose.map((t, i) => (
        <LooseRow
          key={t.id}
          task={t}
          onToggle={onToggle}
          onFlag={onFlag}
          onDelete={onDelete}
          onDragStart={onDragStart}
          isDragging={draggingId === t.id}
          last={i === loose.length - 1}
        />
      ))}
      {hasProjects && loose.length > 0 && (
        <div
          style={{
            fontSize: 12,
            color: T.faint,
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="6.5" cy="6.5" r="5.5" />
            <path d="M6.5 4v5M4 6.5h5" strokeLinecap="round" />
          </svg>
          Drag a task onto a project in the sidebar to attach it
        </div>
      )}
      <InlineComposer placeholder="Add a task…" onCreate={onAddTask} />
    </>
  );
}

function ProjectPane({
  project,
  store,
  onToggle,
  onFlag,
  onDetach,
  onDeleteTask,
  onDeleteProject,
  onAddTask,
}: {
  project: { id: string; name: string };
  store: Store;
  onToggle: (id: string) => void;
  onFlag: (id: string) => void;
  onDetach: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (title: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mine = store.tasks.filter((t) => t.projectId === project.id);
  const done = mine.filter((t) => t.done).length;
  const open = mine.filter((t) => !t.done).slice().sort(byPriority);
  const complete = mine.filter((t) => t.done);
  const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.02em', flex: 1, minWidth: 0 }}>
          {project.name}
        </div>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="project options"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: menuOpen ? T.ink : T.mut,
            padding: 6,
            marginTop: 2,
            marginRight: -6,
            display: 'flex',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 15 15" fill="currentColor">
            <circle cx="7.5" cy="2.2" r="1.5" />
            <circle cx="7.5" cy="7.5" r="1.5" />
            <circle cx="7.5" cy="12.8" r="1.5" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div
          style={{
            marginTop: 12,
            background: T.surf,
            border: '1px solid ' + T.line,
            borderRadius: 12,
            padding: 13,
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
          }}
        >
          <div style={{ fontSize: 12.5, color: T.mut, lineHeight: 1.4 }}>
            Delete “{project.name}”?{' '}
            {mine.length > 0 && (
              <>
                Its {mine.length} {mine.length === 1 ? 'task moves' : 'tasks move'} to Tasks.
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <DangerConfirm
              label="Delete project"
              armedLabel="Confirm delete"
              onConfirm={() => onDeleteProject(project.id)}
            />
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                font: 'inherit',
                fontSize: 12.5,
                cursor: 'pointer',
                color: T.mut,
                background: T.surf2,
                border: '1px solid ' + T.line,
                borderRadius: 9,
                padding: '7px 12px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <div style={{ flex: 1 }}>
          <Progress done={done} total={mine.length} />
        </div>
        <span style={{ fontSize: 13, color: T.mut, fontWeight: 500 }}>{pct}%</span>
      </div>
      <div style={{ fontSize: 12.5, color: T.faint, marginTop: 8 }}>
        {open.length} open · {done} done
      </div>

      <div style={{ marginTop: 24 }}>
        {mine.length === 0 && (
          <div style={{ color: T.faint, fontSize: 13.5, padding: '4px 2px 2px' }}>
            No tasks yet — add one below.
          </div>
        )}
        {open.map((t, i) => (
          <TaskLine
            key={t.id}
            task={t}
            onToggle={onToggle}
            onFlag={onFlag}
            onDetach={onDetach}
            onDelete={onDeleteTask}
            last={i === open.length - 1 && complete.length === 0}
          />
        ))}
        {complete.length > 0 && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.04em',
              color: T.faint,
              margin: '22px 0 4px',
            }}
          >
            COMPLETED
          </div>
        )}
        {complete.map((t, i) => (
          <TaskLine
            key={t.id}
            task={t}
            onToggle={onToggle}
            onFlag={onFlag}
            onDetach={onDetach}
            onDelete={onDeleteTask}
            last={i === complete.length - 1}
          />
        ))}
      </div>

      <div style={{ marginTop: 6 }}>
        <InlineComposer placeholder="Add a task…" onCreate={onAddTask} />
      </div>
    </>
  );
}
