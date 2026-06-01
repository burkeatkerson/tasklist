import { useState } from 'react';
import type { Project, Store } from '../types';
import { byPriority } from '../types';
import { T } from '../theme';
import { DangerConfirm, Progress } from './atoms';
import { InlineComposer } from './InlineComposer';
import { TaskLine } from './TaskLine';

export function ProjectView({
  project,
  store,
  onBack,
  onToggle,
  onFlag,
  onAddTask,
  onDetach,
  onDeleteTask,
  onDeleteProject,
}: {
  project: Project;
  store: Store;
  onBack: () => void;
  onToggle: (id: string) => void;
  onFlag: (id: string) => void;
  onAddTask: (title: string) => void;
  onDetach: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteProject: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mine = store.tasks.filter((t) => t.projectId === project.id);
  const done = mine.filter((t) => t.done).length;
  const open = mine.filter((t) => !t.done).slice().sort(byPriority);
  const complete = mine.filter((t) => t.done);
  const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;

  return (
    <div style={{ padding: '6px 20px 120px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          color: T.mut,
          font: 'inherit',
          fontSize: 14,
          cursor: 'pointer',
          padding: '6px 0 14px',
          marginLeft: -2,
        }}
      >
        <svg width="8" height="13" viewBox="0 0 8 13">
          <path
            d="M7 1L1 6.5 7 12"
            stroke={T.mut}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Task Manager
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-.02em',
            flex: 1,
            minWidth: 0,
          }}
        >
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
            marginTop: 4,
            marginRight: -6,
            display: 'flex',
            flex: '0 0 auto',
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
                Its {mine.length} {mine.length === 1 ? 'task moves' : 'tasks move'} to{' '}
                Tasks.
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

      <div style={{ marginTop: 26 }}>
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
    </div>
  );
}
