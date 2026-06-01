import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Workspace } from './Workspace';
import type { Store } from '../types';

const store: Store = {
  projects: [
    { id: 'p1', name: 'Launch', position: 1, createdAt: '' },
    { id: 'p2', name: 'Mobile App', position: 2, createdAt: '' },
  ],
  tasks: [
    { id: 't1', title: 'Press kit', projectId: 'p1', done: false, flagged: false, position: 1, createdAt: '', completedAt: null },
    { id: 't2', title: 'Ship it', projectId: 'p1', done: true, flagged: false, position: 2, createdAt: '', completedAt: '2026-06-01T00:00:00Z' },
    { id: 'u1', title: 'Reply to landlord', projectId: null, done: false, flagged: true, position: 3, createdAt: '', completedAt: null },
    { id: 'u2', title: 'Book dentist', projectId: null, done: false, flagged: false, position: 4, createdAt: '', completedAt: null },
  ],
};

const noop = () => {};
const baseProps = {
  store,
  onOpen: noop,
  onToggle: noop,
  onFlag: noop,
  onDragStart: noop,
  dragOverId: null,
  draggingId: null,
  onAddTask: noop,
  onAddProject: noop,
};

describe('Workspace', () => {
  it('renders project cards and loose tasks', () => {
    render(<Workspace {...baseProps} />);
    expect(screen.getByText('Launch')).toBeInTheDocument();
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.getByText('Reply to landlord')).toBeInTheDocument();
    expect(screen.getByText('Book dentist')).toBeInTheDocument();
    // attached tasks are not shown in the loose list
    expect(screen.queryByText('Press kit')).not.toBeInTheDocument();
  });

  it('floats the flagged loose task above the unflagged one', () => {
    render(<Workspace {...baseProps} />);
    const landlord = screen.getByText('Reply to landlord');
    const dentist = screen.getByText('Book dentist');
    // Reply (flagged) should appear before Book dentist in DOM order
    expect(
      landlord.compareDocumentPosition(dentist) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('opens a project when its card is clicked', () => {
    const onOpen = vi.fn();
    render(<Workspace {...baseProps} onOpen={onOpen} />);
    fireEvent.click(screen.getByText('Launch'));
    expect(onOpen).toHaveBeenCalledWith('p1');
  });

  it('shows the drag-to-attach hint when projects and loose tasks coexist', () => {
    render(<Workspace {...baseProps} />);
    expect(
      screen.getByText(/Drag a task onto a project to attach it/i),
    ).toBeInTheDocument();
  });
});
