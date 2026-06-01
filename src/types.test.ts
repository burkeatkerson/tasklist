import { describe, expect, it } from 'vitest';
import { byPriority, type Task } from './types';

const mk = (over: Partial<Task>): Task => ({
  id: 'x',
  title: 't',
  projectId: null,
  done: false,
  flagged: false,
  position: 0,
  createdAt: '',
  ...over,
});

describe('byPriority', () => {
  it('sinks completed tasks below open ones', () => {
    const done = mk({ id: 'a', done: true });
    const open = mk({ id: 'b', done: false });
    expect([done, open].sort(byPriority).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('floats flagged open tasks above unflagged open ones', () => {
    const plain = mk({ id: 'a', flagged: false });
    const flagged = mk({ id: 'b', flagged: true });
    expect([plain, flagged].sort(byPriority).map((t) => t.id)).toEqual([
      'b',
      'a',
    ]);
  });

  it('orders flagged-open > open > done', () => {
    const tasks = [
      mk({ id: 'done', done: true, flagged: true }),
      mk({ id: 'open', done: false, flagged: false }),
      mk({ id: 'prio', done: false, flagged: true }),
    ];
    expect(tasks.sort(byPriority).map((t) => t.id)).toEqual([
      'prio',
      'open',
      'done',
    ]);
  });
});
