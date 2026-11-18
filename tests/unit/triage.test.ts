import { describe, expect, it } from 'vitest';
import { getTriageRecommendation, isMoreThanFiveMinutes } from '@/lib/triage';

describe('eight-case triage (CORE-10, CORE-11)', () => {
  const cases: Array<[boolean, boolean, boolean, number, string]> = [
    // urgent, important, >5min, case#, action
    [false, false, false, 1, 'Do it — take the brief break'],
    [false, false, true, 2, 'Do it after your important work'],
    [false, true, false, 3, 'Do it now'],
    [false, true, true, 4, 'Schedule it'],
    [true, false, false, 5, 'Get it done'],
    [true, false, true, 6, 'Handle once — or reserve a buffer if it recurs'],
    [true, true, false, 7, 'Do it now'],
    [true, true, true, 8, 'Attend to it as soon as feasible'],
  ];
  it.each(cases)('urgent=%s important=%s >5min=%s → case %s', (urgent, important, moreThanFive, num, action) => {
    const r = getTriageRecommendation({ urgent, important, moreThanFive });
    expect(r.caseNumber).toBe(num);
    expect(r.action).toBe(action);
  });

  it('all eight combinations produce distinct case numbers', () => {
    const nums = new Set<number>();
    for (const u of [false, true]) for (const i of [false, true]) for (const l of [false, true]) nums.add(getTriageRecommendation({ urgent: u, important: i, moreThanFive: l }).caseNumber);
    expect([...nums].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('only urgent + not important + >5 asks whether it recurs', () => {
    for (const u of [false, true]) for (const i of [false, true]) for (const l of [false, true]) {
      const r = getTriageRecommendation({ urgent: u, important: i, moreThanFive: l });
      expect(r.asksRecurring).toBe(u && !i && l);
    }
  });

  it('CORE-11: recurring → scheduled urgent-allocation buffer sized from own data', () => {
    const r = getTriageRecommendation({ urgent: true, important: false, moreThanFive: true, recurring: true });
    expect(r.caseId).toBe('urgent-long-recurring');
    expect(r.action).toMatch(/buffer/i);
    expect(r.detail).toMatch(/actually take you/i);
  });

  it('occasional → handle after more important work', () => {
    const r = getTriageRecommendation({ urgent: true, important: false, moreThanFive: true, recurring: false });
    expect(r.caseId).toBe('urgent-long-occasional');
  });

  it('5 minutes is short (inclusive); 6 is long', () => {
    expect(isMoreThanFiveMinutes(5)).toBe(false);
    expect(isMoreThanFiveMinutes(5.5)).toBe(true);
    expect(isMoreThanFiveMinutes(0)).toBe(false);
    expect(() => isMoreThanFiveMinutes(-1)).toThrow();
  });
});
