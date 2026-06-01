import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the Supabase client so the app's data layer runs against in-memory data
// (no network). Verifies useStore -> supabase wiring end to end.
const h = vi.hoisted(() => {
  const projectsData = [
    { id: 'p1', name: 'Launch', position: 1, created_at: '' },
    { id: 'p2', name: 'Mobile App', position: 2, created_at: '' },
  ];
  const tasksData = [
    { id: 'u1', title: 'Reply to landlord', project_id: null, done: false, flagged: true, position: 1, created_at: '', completed_at: null },
    { id: 't1', title: 'Press kit', project_id: 'p1', done: false, flagged: false, position: 2, created_at: '', completed_at: null },
    // completed long ago — should be hidden and swept
    { id: 'old', title: 'Old done thing', project_id: null, done: true, flagged: false, position: 0, created_at: '', completed_at: '2000-01-01T00:00:00Z' },
  ];
  const updateEq = vi.fn(() => Promise.resolve({ error: null }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const insert = vi.fn(() => Promise.resolve({ error: null }));
  // sweepCompleted: from('tasks').delete().eq('done', true).lt('completed_at', cutoff)
  const deleteLt = vi.fn(() => Promise.resolve({ error: null }));
  const deleteEq = vi.fn(() => ({ lt: deleteLt }));
  const del = vi.fn(() => ({ eq: deleteEq }));
  // thenable query builder: select().order().order() resolves to { data, error }
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
      update,
      insert,
      delete: del,
    }),
    channel: () => {
      const ch: Record<string, unknown> = {};
      ch.on = () => ch;
      ch.subscribe = () => ch;
      return ch;
    },
    removeChannel: () => {},
  };
  return { supabase, update, updateEq, insert, del };
});

vi.mock('./lib/supabase', async (orig) => {
  const actual = await (orig() as Promise<Record<string, unknown>>);
  return { ...actual, supabase: h.supabase };
});

import App from './App';

describe('App (integration)', () => {
  it('loads data from Supabase and renders the workspace', async () => {
    render(<App />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Launch')).toBeInTheDocument());
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.getByText('Reply to landlord')).toBeInTheDocument();
  });

  it('persists a task toggle to Supabase', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Reply to landlord'));
    const row = screen.getByText('Reply to landlord').closest('div')!;
    const checkbox = row.querySelector('button[aria-label="toggle done"]')!;
    fireEvent.click(checkbox);
    await waitFor(() =>
      expect(h.update).toHaveBeenCalledWith(
        expect.objectContaining({ done: true, completed_at: expect.any(String) }),
      ),
    );
  });

  it('hides expired completed tasks and sweeps them from the database', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Reply to landlord'));
    // the long-ago-completed task is filtered out of the UI
    expect(screen.queryByText('Old done thing')).not.toBeInTheDocument();
    // and the sweep issued a delete
    await waitFor(() => expect(h.del).toHaveBeenCalled());
  });

  it('opens a project detail view', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Launch'));
    fireEvent.click(screen.getByText('Launch'));
    // project detail shows the attached task and a back link
    await waitFor(() => expect(screen.getByText('Press kit')).toBeInTheDocument());
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });
});
