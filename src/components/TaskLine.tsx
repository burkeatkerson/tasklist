import { useState } from 'react';
import type { Task } from '../types';
import { T } from '../theme';
import { Check, DangerConfirm, Flag, FlagGlyph } from './atoms';

// A task row in a project view (mobile and desktop). Tap to reveal actions:
// flag, detach, delete (two-tap confirm).
export function TaskLine({
  task,
  onToggle,
  onFlag,
  onDetach,
  onDelete,
  last,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onFlag: (id: string) => void;
  onDetach: (id: string) => void;
  onDelete: (id: string) => void;
  last?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid ' + T.lineSoft }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px' }}>
        <Check done={task.done} onClick={() => onToggle(task.id)} big />
        <span
          onClick={() => setOpen((o) => !o)}
          style={{
            flex: 1,
            fontSize: 15,
            cursor: 'pointer',
            color: task.done ? T.faint : T.ink,
            textDecoration: task.done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>
        <Flag on={task.flagged} onClick={() => onFlag(task.id)} size={15} />
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="task options"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: T.faint,
            padding: 4,
            display: 'flex',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
            <circle cx="2.2" cy="7.5" r="1.4" />
            <circle cx="7.5" cy="7.5" r="1.4" />
            <circle cx="12.8" cy="7.5" r="1.4" />
          </svg>
        </button>
      </div>
      {open && (
        <div
          style={{
            padding: '0 2px 13px 35px',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => onFlag(task.id)}
            style={{
              font: 'inherit',
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: task.flagged ? T.prio : T.mut,
              background: task.flagged ? T.prioDim : T.surf2,
              border: '1px solid ' + (task.flagged ? 'rgba(245,84,75,.4)' : T.line),
              borderRadius: 9,
              padding: '7px 12px',
            }}
          >
            <FlagGlyph on={task.flagged} size={12} />
            {task.flagged ? 'Priority' : 'Flag priority'}
          </button>
          <button
            onClick={() => {
              onDetach(task.id);
              setOpen(false);
            }}
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
            Detach
          </button>
          <DangerConfirm
            onConfirm={() => {
              onDelete(task.id);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
