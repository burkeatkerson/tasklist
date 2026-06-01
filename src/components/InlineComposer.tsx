import { useEffect, useRef, useState } from 'react';
import { T } from '../theme';

// Tap empty space → type → Enter to add (stays open for rapid entry), Esc/blur closes.
export function InlineComposer({
  placeholder,
  onCreate,
  grow,
}: {
  placeholder: string;
  onCreate: (title: string) => void;
  grow?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = (keepOpen: boolean) => {
    const t = val.trim();
    if (t) onCreate(t);
    setVal('');
    if (!keepOpen) setEditing(false);
  };

  const circle = (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        flex: '0 0 auto',
        border: '1.6px dashed rgba(255,255,255,.22)',
      }}
    />
  );

  const root: React.CSSProperties = {
    flex: grow ? '1 1 auto' : '0 0 auto',
    display: 'flex',
    flexDirection: 'column',
  };

  if (!editing) {
    return (
      <div style={root}>
        <button
          onClick={() => setEditing(true)}
          style={{
            flex: grow ? '1 1 auto' : '0 0 auto',
            width: '100%',
            textAlign: 'left',
            cursor: 'text',
            minHeight: 50,
            background: 'none',
            border: 'none',
            font: 'inherit',
            color: T.faint,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 13,
            padding: '14px 2px',
          }}
        >
          {circle}
          <span style={{ fontSize: 14.5, lineHeight: '20px' }}>{placeholder}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={root}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 13,
          padding: '14px 2px',
          minHeight: 50,
        }}
      >
        {circle}
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(true);
            else if (e.key === 'Escape') {
              setVal('');
              setEditing(false);
            }
          }}
          onBlur={() => commit(false)}
          placeholder="Task name…"
          className="pm-input"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: T.ink,
            font: 'inherit',
            fontSize: 14.5,
            lineHeight: '20px',
            padding: 0,
          }}
        />
      </div>
    </div>
  );
}
