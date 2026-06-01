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
