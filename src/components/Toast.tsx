import { T } from '../theme';

export interface ToastState {
  msg: string;
  id: number;
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(34px + env(safe-area-inset-bottom, 0px))',
        left: 0,
        right: 0,
        zIndex: 90,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        key={toast.id}
        className="pm-toast"
        style={{
          background: 'rgba(28,28,34,.96)',
          border: '1px solid ' + T.line,
          backdropFilter: 'blur(8px)',
          color: T.ink,
          fontSize: 13.5,
          fontWeight: 500,
          padding: '11px 18px',
          borderRadius: 13,
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
        }}
      >
        {toast.msg}
      </div>
    </div>
  );
}
