import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Store, Task } from '../types';
import { byPriority } from '../types';
import { T } from '../theme';
import { ProjectCard } from './ProjectCard';
import { LooseRow } from './LooseRow';
import { InlineComposer } from './InlineComposer';

function todayLabel(): string {
  const d = new Date();
  const day = d.toLocaleDateString(undefined, { weekday: 'long' });
  const month = d.toLocaleDateString(undefined, { month: 'long' });
  return `${day} · ${month} ${d.getDate()}`;
}

export function Workspace({
  store,
  onOpen,
  onToggle,
  onFlag,
  onDragStart,
  dragOverId,
  draggingId,
  onAddTask,
  onAddProject,
}: {
  store: Store;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onFlag: (id: string) => void;
  onDragStart: (e: PointerEvent, task: Task) => void;
  dragOverId: string | null;
  draggingId: string | null;
  onAddTask: (title: string) => void;
  onAddProject: (name: string) => void;
}) {
  const loose = store.tasks
    .filter((t) => t.projectId === null)
    .slice()
    .sort(byPriority);
  const [addingProject, setAddingProject] = useState(false);
  const [pname, setPname] = useState('');
  const pref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (addingProject) pref.current?.focus();
  }, [addingProject]);
  const commitProject = () => {
    const n = pname.trim();
    if (n) onAddProject(n);
    setPname('');
    setAddingProject(false);
  };

  return (
    <div
      style={{
        padding: '6px 20px 56px',
        minHeight: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ paddingTop: 4, paddingBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
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
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: '-.02em',
            marginTop: 5,
          }}
        >
          Task Manager
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: '.02em',
            color: T.mut,
          }}
        >
          PROJECTS
        </span>
        <button
          onClick={() => setAddingProject(true)}
          aria-label="New project"
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
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
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M7 2v10M2 7h10" />
          </svg>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {store.projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            tasks={store.tasks}
            onOpen={() => onOpen(p.id)}
            dropping={dragOverId === p.id}
          />
        ))}
        {addingProject && (
          <div
            style={{
              background: T.surf,
              border: '1px dashed ' + T.acc,
              borderRadius: 18,
              padding: 15,
              display: 'flex',
              alignItems: 'center',
              minHeight: 92,
            }}
          >
            <input
              ref={pref}
              value={pname}
              onChange={(e) => setPname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitProject();
                else if (e.key === 'Escape') {
                  setPname('');
                  setAddingProject(false);
                }
              }}
              onBlur={commitProject}
              placeholder="Project name"
              className="pm-input"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: T.ink,
                font: 'inherit',
                fontSize: 15.5,
                fontWeight: 600,
                padding: 0,
              }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '28px 0 2px',
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: '.02em',
            color: T.mut,
          }}
        >
          TASKS
        </span>
        <span style={{ fontSize: 12, color: T.faint }}>
          {loose.filter((t) => !t.done).length}
        </span>
      </div>

      {loose.map((t, i) => (
        <LooseRow
          key={t.id}
          task={t}
          onToggle={onToggle}
          onFlag={onFlag}
          onDragStart={onDragStart}
          isDragging={draggingId === t.id}
          last={i === loose.length - 1}
        />
      ))}

      {store.projects.length > 0 && loose.length > 0 && (
        <div
          style={{
            fontSize: 12,
            color: T.faint,
            marginTop: 12,
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <circle cx="6.5" cy="6.5" r="5.5" />
            <path d="M6.5 4v5M4 6.5h5" strokeLinecap="round" />
          </svg>
          Drag a task onto a project to attach it
        </div>
      )}

      <InlineComposer placeholder="Add a task…" onCreate={onAddTask} grow />
    </div>
  );
}
