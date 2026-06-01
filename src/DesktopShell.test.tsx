import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Same in-memory Supabase mock as App.test, so the desktop layout runs against data.
const h = vi.hoisted(() => {
  const projectsData = [
    { id: 'p1', name: 'Launch', position: 1, created_at: '' },
    { id: 'p2', name: 'Mobile App', position: 2, created_at: '' },
  ];
  const tasksData = [
    { id: 'u1', title: 'Reply to landlord', project_id: null, done: false, flagged: true, position: 1, created_at: '', completed_at: null },
    { id: 't1', title: 'Press kit', project_id: 'p1', done: false, flagged: false, position: 2, created_at: '', completed_at: null },
  ];
  const ok = () => Promise.resolve({ error: null });
  const selectBuilder = (data: unknown) => {
    const b: Record<string, unknown> = {
      order: () => b,
      then: (resolve: (v: { data: unknown; error: null }) => void) =>
        resolve({ data, error: null }),
    };
    return b;
  };
  const supabase = {
    from: (table: string) => ({
      select: () => selectBuilder(table === 'projects' ? projectsData : tasksData),
      update: () => ({ eq: ok }),
      insert: ok,
      delete: () => ({ eq: () => ({ lt: ok, then: (r: (v: { error: null }) => void) => r({ error: null }) }) }),
    }),
    channel: () => {
      const ch: Record<string, unknown> = {};
      ch.on = () => ch;
      ch.subscribe = () => ch;
      return ch;
    },
    removeChannel: () => {},
  };
  return { supabase };
});

vi.mock('./lib/supabase', async (orig) => {
  const actual = await (orig() as Promise<Record<string, unknown>>);
  return { ...actual, supabase: h.supabase };
});

import App from './App';

const wideMatchMedia = (query: string) =>
  ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;

describe('Desktop layout', () => {
  beforeEach(() => {
    window.matchMedia = wideMatchMedia;
  });
  afterEach(() => {
    // restore the mobile default from setup.ts
    window.matchMedia = ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  });

  it('renders the wide sidebar + main pane with projects and tasks', async () => {
    const { container } = render(<App />);
    await waitFor(() => screen.getByText('Launch'));
    // wide two-pane shell, not the mobile column
    expect(container.querySelector('.dk-app')).toBeTruthy();
    expect(container.querySelector('.app-frame')).toBeNull();
    // sidebar projects + default Tasks pane
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.getByText('Reply to landlord')).toBeInTheDocument();
  });

  it('switches the main pane when a project is selected in the sidebar', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Launch'));
    fireEvent.click(screen.getByText('Launch'));
    await waitFor(() => expect(screen.getByText('Press kit')).toBeInTheDocument());
  });
});
