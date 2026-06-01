import { useEffect, useState } from 'react';
import { T } from '../theme';

export function Check({
  done,
  onClick,
  big,
}: {
  done?: boolean;
  onClick?: () => void;
  big?: boolean;
}) {
  const s = big ? 22 : 20;
  return (
    <button
      onClick={onClick}
      aria-label="toggle done"
      aria-pressed={!!done}
      style={{
        width: s,
        height: s,
        borderRadius: '50%',
        flex: '0 0 auto',
        cursor: 'pointer',
        border: '1.6px solid ' + (done ? T.acc : 'rgba(255,255,255,.22)'),
        background: done ? T.acc : 'transparent',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all .15s',
      }}
    >
      {done && (
        <svg
          width={big ? 12 : 11}
          height={big ? 12 : 11}
          viewBox="0 0 11 11"
          fill="none"
          stroke={T.accInk}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1.5 5.6l2.4 2.5L9.5 2.4" />
        </svg>
      )}
    </button>
  );
}

export function FlagGlyph({ on, size = 16 }: { on?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={on ? T.prio : 'none'}
      stroke={on ? T.prio : 'currentColor'}
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M4 14.5V2" />
      <path d="M4 2.6h7.6L9.9 5.4l1.7 2.8H4z" />
    </svg>
  );
}

export function Flag({
  on,
  onClick,
  size = 16,
}: {
  on?: boolean;
  onClick?: () => void;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="flag priority"
      aria-pressed={!!on}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        display: 'flex',
        flex: '0 0 auto',
        color: on ? T.prio : 'rgba(244,244,245,.24)',
        transition: 'color .12s',
      }}
    >
      <FlagGlyph on={on} size={size} />
    </button>
  );
}

export function TrashGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 4h11M6 4V2.6h4V4M5 4l.6 9.4h4.8L11 4" />
      <path d="M6.6 6.6v4.6M9.4 6.6v4.6" />
    </svg>
  );
}

// Two-tap destructive button: first tap arms ("Delete?"), second confirms.
// Auto-disarms after 3s so a stray tap never deletes.
export function DangerConfirm({
  label = 'Delete',
  armedLabel = 'Confirm delete',
  onConfirm,
}: {
  label?: string;
  armedLabel?: string;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button
      onClick={() => {
        if (armed) onConfirm();
        else setArmed(true);
      }}
      style={{
        font: 'inherit',
        fontSize: 12.5,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: T.prio,
        background: armed ? T.prio : T.prioDim,
        border: '1px solid ' + (armed ? T.prio : 'rgba(245,84,75,.4)'),
        borderRadius: 9,
        padding: '7px 12px',
        transition: 'all .12s',
        ...(armed ? { color: '#fff', fontWeight: 600 } : null),
      }}
    >
      <TrashGlyph size={12} />
      {armed ? armedLabel : label}
    </button>
  );
}

export function Progress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div
      style={{
        height: 3,
        borderRadius: 3,
        background: 'rgba(255,255,255,.09)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: pct + '%',
          height: '100%',
          background: T.acc,
          borderRadius: 3,
          transition: 'width .35s cubic-bezier(.4,0,.2,1)',
        }}
      />
    </div>
  );
}
