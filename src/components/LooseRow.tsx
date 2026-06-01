import { useState } from 'react';
import type { PointerEvent } from 'react';
import type { Task } from '../types';
import { T } from '../theme';
import { Check, DangerConfirm, Flag } from './atoms';

export function LooseRow({
  task,
  onToggle,
  onFlag,
  onDelete,
  onDragStart,
  isDragging,
  last,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onFlag: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: PointerEvent, task: Task) => void;
  isDragging?: boolean;
  last?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: last && !open ? 'none' : '1px solid ' + T.lineSoft,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '13px 2px',
          opacity: isDragging ? 0.32 : 1,
          transition: 'opacity .15s',
          touchAction: 'none',
        }}
      >
        <span
          onPointerDown={(e) => onDragStart(e, task)}
          style={{
            cursor: 'grab',
            color: T.faint,
            display: 'flex',
            padding: '2px 1px',
            touchAction: 'none',
          }}
          aria-label="drag handle"
        >
          <svg width="11" height="16" viewBox="0 0 11 16" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.4" />
            <circle cx="8.5" cy="2.5" r="1.4" />
            <circle cx="2.5" cy="8" r="1.4" />
            <circle cx="8.5" cy="8" r="1.4" />
            <circle cx="2.5" cy="13.5" r="1.4" />
            <circle cx="8.5" cy="13.5" r="1.4" />
          </svg>
        </span>
        <span
          onPointerDown={(e) => onDragStart(e, task)}
          style={{
            flex: 1,
            fontSize: 14.5,
            cursor: 'grab',
            touchAction: 'none',
            color: task.done ? T.faint : T.ink,
            textDecoration: task.done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>
        <Flag on={task.flagged} onClick={() => onFlag(task.id)} size={15} />
        <Check done={task.done} onClick={() => onToggle(task.id)} />
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="task options"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: open ? T.mut : T.faint,
            padding: 4,
            display: 'flex',
            flex: '0 0 auto',
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
        <div style={{ padding: '0 2px 13px 24px', display: 'flex', gap: 8 }}>
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
