/**
 * Eight-case five-minute triage — Course “Take Charge of Your Time”, Module 1, Unit 2 (eight combinations).
 * The decision engine for this site: three Yes/No questions → one of eight cases.
 * Exactly 5 minutes counts as short.
 */

export interface TriageInput {
  urgent: boolean;
  important: boolean;
  /** true = takes MORE than 5 minutes. Exactly 5 minutes is "short" (≤5, inclusive). */
  moreThanFive: boolean;
  /** Only meaningful for urgent + not important + >5 min. undefined = not answered yet. */
  recurring?: boolean;
}

export type TriageCaseId =
  | 'neither-short'
  | 'neither-long'
  | 'important-short'
  | 'important-long'
  | 'urgent-short'
  | 'urgent-long-occasional'
  | 'urgent-long-recurring'
  | 'urgent-long-unanswered'
  | 'both-short'
  | 'both-long';

export interface TriageResult {
  caseId: TriageCaseId;
  /** 1..8 — the instructor's case number (Unit 2 order). */
  caseNumber: number;
  action: string;
  detail: string;
  /** Instructor's illustrative example — never a classification of the user's task. */
  courseExample: string;
  /** True when the recurring question should be shown. */
  asksRecurring: boolean;
}

/** Converts an estimate in minutes into the course's binary. 5 is short (inclusive). */
export function isMoreThanFiveMinutes(estimatedMinutes: number): boolean {
  if (!Number.isFinite(estimatedMinutes) || estimatedMinutes < 0) {
    throw new Error('Estimated minutes must be a non-negative number');
  }
  return estimatedMinutes > 5;
}

export function getTriageRecommendation(input: TriageInput): TriageResult {
  const { urgent, important, moreThanFive } = input;

  if (!urgent && !important) {
    return moreThanFive
      ? {
          caseId: 'neither-long',
          caseNumber: 2,
          action: 'Do it after your important work',
          detail:
            'Longer leisure is a choice, not a failure. Pick it consciously once the important things for the day have had their time.',
          courseExample: 'Watching a series episode or a long scroll — fine, after the important things.',
          asksRecurring: false,
        }
      : {
          caseId: 'neither-short',
          caseNumber: 1,
          action: 'Do it — take the brief break',
          detail:
            'A short break is human. Take it and move on without guilt; nobody is productive every minute.',
          courseExample: 'Five minutes on social media between two blocks of work.',
          asksRecurring: false,
        };
  }

  if (!urgent && important) {
    return moreThanFive
      ? {
          caseId: 'important-long',
          caseNumber: 4,
          action: 'Schedule it',
          detail:
            'Give it a fixed place in your calendar or routine. Nothing breaks if you skip it today, which is exactly why it gets skipped — and its value builds over time.',
          courseExample: 'Exercise, reading, a hobby, studying, enough sleep.',
          asksRecurring: false,
        }
      : {
          caseId: 'important-short',
          caseNumber: 3,
          action: 'Do it now',
          detail: "It matters and it's quick. Don't postpone a meaningful small action just because nothing forces it.",
          courseExample: 'A short call to your parents.',
          asksRecurring: false,
        };
  }

  if (urgent && !important) {
    if (!moreThanFive) {
      return {
        caseId: 'urgent-short',
        caseNumber: 5,
        action: 'Get it done',
        detail: 'Clear it quickly so a small open loop stops pulling at your attention.',
        courseExample: 'Calling the plumber about a broken tap.',
        asksRecurring: false,
      };
    }
    if (input.recurring === true) {
      return {
        caseId: 'urgent-long-recurring',
        caseNumber: 6,
        action: 'Reserve an urgent-allocation buffer',
        detail:
          'Because this keeps happening, plan for it: set aside a repeatable block for interruptions like this. Size it from how long these actually take you (15, 30, 45 or 60 minutes), not from a preset.',
        courseExample: 'Interruptions that arrive every few hours, or recurring low-value meetings.',
        asksRecurring: true,
      };
    }
    if (input.recurring === false) {
      return {
        caseId: 'urgent-long-occasional',
        caseNumber: 6,
        action: 'Handle it once, after more important work',
        detail: 'An occasional interruption: get it done when you can, once the more important work has had its time.',
        courseExample: 'A one-off request that has to be dealt with but adds little.',
        asksRecurring: true,
      };
    }
    return {
      caseId: 'urgent-long-unanswered',
      caseNumber: 6,
      action: 'Handle once — or reserve a buffer if it recurs',
      detail: 'Answer whether this happens regularly to see the specific recommendation.',
      courseExample: 'Recurring meetings that are urgent but rarely important.',
      asksRecurring: true,
    };
  }

  // urgent && important
  return moreThanFive
    ? {
        caseId: 'both-long',
        caseNumber: 8,
        action: 'Attend to it as soon as feasible',
        detail:
          "Give it your attention soon — within the half-hour, hour or two its urgency really demands. Don't blindly drop a more critical task for something that only seems urgent; a true crisis can need you immediately.",
        courseExample: 'A health, family or financial crisis.',
        asksRecurring: false,
      }
    : {
        caseId: 'both-short',
        caseNumber: 7,
        action: 'Do it now',
        detail: "Time-sensitive, important and quick. Do it and be done.",
        courseExample: 'A quick client call or a timely message to a customer.',
        asksRecurring: false,
      };
}
