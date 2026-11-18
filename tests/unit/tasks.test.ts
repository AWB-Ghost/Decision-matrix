import { describe, expect, it } from 'vitest';
import { bucketFor, groupByBucket, needsRecurring, parseStored, serialize, type Task } from '@/lib/tasks';

const t = (urgent: boolean, important: boolean, moreThanFive: boolean, recurring: boolean | null = null, done = false): Task => ({
  id: `${urgent}${important}${moreThanFive}${recurring}`,
  title: 'x',
  urgent,
  important,
  moreThanFive,
  recurring,
  done,
  createdAt: '2026-11-18T10:00:00.000Z',
  doneAt: null,
});

describe('bucket mapping (all eight cases + recurring branch)', () => {
  it.each([
    [false, false, false, null, 'break'],
    [false, false, true, null, 'later'],
    [false, true, false, null, 'now'],
    [false, true, true, null, 'schedule'],
    [true, false, false, null, 'now'],
    [true, false, true, true, 'buffer'],
    [true, false, true, false, 'later'],
    [true, true, false, null, 'now'],
    [true, true, true, null, 'soon'],
  ] as const)('U=%s I=%s >5=%s recurring=%s → %s', (u, i, l, r, bucket) => {
    expect(bucketFor(t(u, i, l, r))).toBe(bucket);
  });

  it('only urgent + not important + long needs the recurring answer', () => {
    expect(needsRecurring({ urgent: true, important: false, moreThanFive: true })).toBe(true);
    expect(needsRecurring({ urgent: true, important: true, moreThanFive: true })).toBe(false);
    expect(needsRecurring({ urgent: true, important: false, moreThanFive: false })).toBe(false);
    expect(needsRecurring({ urgent: null, important: false, moreThanFive: true })).toBe(false);
  });

  it('done tasks leave the board', () => {
    const g = groupByBucket([t(false, true, true), t(false, true, true, null, true)].map((x, k) => ({ ...x, id: String(k) })));
    expect(g.schedule).toHaveLength(1);
  });
});

describe('storage parsing', () => {
  it('round-trips', () => {
    const tasks = [t(true, true, false)];
    expect(parseStored(serialize(tasks))).toEqual(tasks);
  });
  it('ignores corrupt, foreign or wrong-version data instead of crashing', () => {
    expect(parseStored(null)).toEqual([]);
    expect(parseStored('{not json')).toEqual([]);
    expect(parseStored('{"version":2,"tasks":[]}')).toEqual([]);
    expect(parseStored(JSON.stringify({ version: 1, tasks: [{ id: 1 }, t(false, false, false)] }))).toHaveLength(1);
  });
});
