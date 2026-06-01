import type { PointerEvent } from 'react';
import type { Task } from '../types';
import { T } from '../theme';
import { Check, Flag } from './atoms';

export function LooseRow({
  task,
  onToggle,
  onFlag,
  onDragStart,
  isDragging,
  last,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onFlag: (id: string) => void;
  onDragStart: (e: PointerEvent, task: Task) => void;
  isDragging?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '13px 2px',
        borderBottom: last ? 'none' : '1px solid ' + T.lineSoft,
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
    </div>
  );
}
