import { Fragment } from 'react';
import type { Project, Task } from '../types';
import { T } from '../theme';
import { FlagGlyph, Progress } from './atoms';

export function ProjectCard({
  project,
  tasks,
  onOpen,
  dropping,
}: {
  project: Project;
  tasks: Task[];
  onOpen: () => void;
  dropping?: boolean;
}) {
  const mine = tasks.filter((t) => t.projectId === project.id);
  const done = mine.filter((t) => t.done).length;
  const hasPrio = mine.some((t) => t.flagged && !t.done);
  return (
    <button
      data-proj-id={project.id}
      onClick={onOpen}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
        background: dropping ? T.accDim : T.surf,
        border: '1px solid ' + (dropping ? T.acc : T.lineSoft),
        borderRadius: 18,
        padding: 15,
        display: 'flex',
        flexDirection: 'column',
        gap: 13,
        transition: 'background .12s, border-color .12s, transform .12s',
        transform: dropping ? 'scale(1.015)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            fontSize: 15.5,
            fontWeight: 600,
            letterSpacing: '-.01em',
            color: dropping ? T.acc : T.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {project.name}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flex: '0 0 auto',
          }}
        >
          {hasPrio && !dropping && (
            <span style={{ display: 'flex', color: T.prio }}>
              <FlagGlyph on size={13} />
            </span>
          )}
          <svg width="7" height="12" viewBox="0 0 7 12">
            <path
              d="M1 1l5 5-5 5"
              stroke={T.faint}
              strokeWidth="1.7"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div style={{ pointerEvents: 'none' }}>
        {dropping ? (
          <div style={{ fontSize: 12, color: T.acc, fontWeight: 600, padding: '1px 0' }}>
            Drop to attach
          </div>
        ) : (
          <Fragment>
            <Progress done={done} total={mine.length} />
            <span style={{ fontSize: 12, color: T.mut, display: 'block', marginTop: 13 }}>
              {done}
              <span style={{ color: T.faint }}> / {mine.length}</span>
            </span>
          </Fragment>
        )}
      </div>
    </button>
  );
}
