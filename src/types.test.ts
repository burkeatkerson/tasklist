import { describe, expect, it } from 'vitest';
import { byPriority, isExpiredCompleted, type Task } from './types';
import { COMPLETED_TTL_MS } from './config';

const mk = (over: Partial<Task>): Task => ({
  id: 'x',
  title: 't',
  projectId: null,
  done: false,
  flagged: false,
  position: 0,
  createdAt: '',
  completedAt: null,
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

describe('isExpiredCompleted', () => {
  const now = 1_000_000_000_000;

  it('is false for open tasks regardless of timestamp', () => {
    expect(isExpiredCompleted(mk({ done: false, completedAt: null }), now)).toBe(
      false,
    );
  });

  it('is false for a recently completed task', () => {
    const completedAt = new Date(now - 1000).toISOString();
    expect(isExpiredCompleted(mk({ done: true, completedAt }), now)).toBe(false);
  });

  it('is true once completion is older than the TTL', () => {
    const completedAt = new Date(now - COMPLETED_TTL_MS - 1).toISOString();
    expect(isExpiredCompleted(mk({ done: true, completedAt }), now)).toBe(true);
  });

  it('is false for a completed task missing a timestamp (legacy)', () => {
    expect(isExpiredCompleted(mk({ done: true, completedAt: null }), now)).toBe(
      false,
    );
  });
});
