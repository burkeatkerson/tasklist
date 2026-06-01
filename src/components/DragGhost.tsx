import type { Task } from '../types';
import { T } from '../theme';

export interface DragState {
  task: Task;
  x: number;
  y: number;
  over: string | null;
}

// The lifted card that follows the pointer during a drag-to-attach.
export function DragGhost({ drag }: { drag: DragState | null }) {
  if (!drag) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 200,
        pointerEvents: 'none',
        transform: `translate(${drag.x}px, ${drag.y}px)`,
      }}
    >
      <div
        style={{
          transform: 'translate(-44%, -50%) rotate(-2.5deg)',
          transformOrigin: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '13px 16px',
            minWidth: 210,
            background: T.surf2,
            border: '1.5px solid var(--acc)',
            borderRadius: 14,
            boxShadow: '0 18px 40px rgba(0,0,0,.6)',
            fontFamily: T.font,
            color: T.ink,
          }}
        >
          <svg width="11" height="16" viewBox="0 0 11 16" fill="rgba(244,244,245,.35)">
            <circle cx="2.5" cy="2.5" r="1.4" />
            <circle cx="8.5" cy="2.5" r="1.4" />
            <circle cx="2.5" cy="8" r="1.4" />
            <circle cx="8.5" cy="8" r="1.4" />
            <circle cx="2.5" cy="13.5" r="1.4" />
            <circle cx="8.5" cy="13.5" r="1.4" />
          </svg>
          <span style={{ fontSize: 14.5, fontWeight: 500 }}>{drag.task.title}</span>
        </div>
      </div>
    </div>
  );
}
