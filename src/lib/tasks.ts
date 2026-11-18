import { getTriageRecommendation, type TriageCaseId, type TriageResult } from './triage';

export interface Task {
  id: string;
  title: string;
  urgent: boolean;
  important: boolean;
  /** true = takes more than 5 minutes */
  moreThanFive: boolean;
  /** Only meaningful for urgent + not important + >5 min. */
  recurring: boolean | null;
  done: boolean;
  createdAt: string;
  doneAt: string | null;
}

export type BucketId = 'now' | 'soon' | 'schedule' | 'buffer' | 'later' | 'break';

export interface Bucket {
  id: BucketId;
  title: string;
  hint: string;
  tone: 'accent' | 'teal' | 'amber' | 'slate';
}

/** Board columns, in the order you'd work through them. */
export const BUCKETS: Bucket[] = [
  { id: 'now', title: 'Do now', hint: 'Quick and worth it — clear these first.', tone: 'accent' },
  { id: 'soon', title: 'Attend to soon', hint: 'Urgent and important, but bigger. Give it time soon — without dropping something more critical.', tone: 'accent' },
  { id: 'schedule', title: 'Schedule it', hint: 'Important, not urgent. Give each a fixed slot in your calendar or routine.', tone: 'teal' },
  { id: 'buffer', title: 'Interruption buffer', hint: 'Recurring interruptions. Reserve a repeatable block for them.', tone: 'amber' },
  { id: 'later', title: 'After important work', hint: 'Handle once the important things have had their time.', tone: 'amber' },
  { id: 'break', title: 'Brief breaks', hint: 'Short and harmless. Take them without guilt.', tone: 'slate' },
];

const CASE_TO_BUCKET: Record<TriageCaseId, BucketId> = {
  'important-short': 'now',
  'urgent-short': 'now',
  'both-short': 'now',
  'both-long': 'soon',
  'important-long': 'schedule',
  'urgent-long-recurring': 'buffer',
  'urgent-long-occasional': 'later',
  'urgent-long-unanswered': 'later',
  'neither-long': 'later',
  'neither-short': 'break',
};

export function recommendationFor(t: Pick<Task, 'urgent' | 'important' | 'moreThanFive' | 'recurring'>): TriageResult {
  return getTriageRecommendation({ urgent: t.urgent, important: t.important, moreThanFive: t.moreThanFive, recurring: t.recurring ?? undefined });
}

export function bucketFor(t: Pick<Task, 'urgent' | 'important' | 'moreThanFive' | 'recurring'>): BucketId {
  return CASE_TO_BUCKET[recommendationFor(t).caseId];
}

/** Whether the recurring question must be answered before a task can be added. */
export function needsRecurring(a: { urgent: boolean | null; important: boolean | null; moreThanFive: boolean | null }): boolean {
  return a.urgent === true && a.important === false && a.moreThanFive === true;
}

export function groupByBucket(tasks: readonly Task[]): Record<BucketId, Task[]> {
  const out = { now: [], soon: [], schedule: [], buffer: [], later: [], break: [] } as Record<BucketId, Task[]>;
  for (const t of tasks) if (!t.done) out[bucketFor(t)].push(t);
  return out;
}

// ---------- persistence (this browser only) ----------
export const STORAGE_KEY = 'triage.tasks.v1';
export const TITLE_MAX = 160;

function isTask(x: unknown): x is Task {
  const t = x as Task;
  return (
    !!t &&
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.urgent === 'boolean' &&
    typeof t.important === 'boolean' &&
    typeof t.moreThanFive === 'boolean' &&
    (t.recurring === null || typeof t.recurring === 'boolean') &&
    typeof t.done === 'boolean' &&
    typeof t.createdAt === 'string'
  );
}

/** Parses stored JSON defensively; corrupt or foreign data yields an empty list rather than a crash. */
export function parseStored(raw: string | null): Task[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as { version?: number; tasks?: unknown[] };
    if (data?.version !== 1 || !Array.isArray(data.tasks)) return [];
    return data.tasks.filter(isTask).map((t) => ({ ...t, doneAt: t.doneAt ?? null }));
  } catch {
    return [];
  }
}

export function serialize(tasks: readonly Task[]): string {
  return JSON.stringify({ version: 1, tasks });
}

export function loadTasks(): { tasks: Task[]; storageOk: boolean } {
  try {
    return { tasks: parseStored(localStorage.getItem(STORAGE_KEY)), storageOk: true };
  } catch {
    return { tasks: [], storageOk: false };
  }
}

export function saveTasks(tasks: readonly Task[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(tasks));
    return true;
  } catch {
    return false;
  }
}
