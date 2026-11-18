import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { BinaryChoice, Button, FieldError, Notice, TextInput } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/cn';
import {
  BUCKETS,
  TITLE_MAX,
  bucketFor,
  groupByBucket,
  loadTasks,
  needsRecurring,
  recommendationFor,
  saveTasks,
  type Bucket,
  type Task,
} from '@/lib/tasks';
import { getTriageRecommendation } from '@/lib/triage';

interface Answers {
  urgent: boolean | null;
  important: boolean | null;
  moreThanFive: boolean | null;
  recurring: boolean | null;
}
const EMPTY: Answers = { urgent: null, important: null, moreThanFive: null, recurring: null };

const TONE: Record<Bucket['tone'], { dot: string; soft: string; text: string }> = {
  accent: { dot: 'var(--color-accent)', soft: 'var(--color-accent-soft)', text: '#2a55c9' },
  teal: { dot: 'var(--color-q-imp)', soft: 'var(--color-q-imp-soft)', text: '#1c6656' },
  amber: { dot: 'var(--color-q-urg)', soft: 'var(--color-q-urg-soft)', text: '#7f561f' },
  slate: { dot: 'var(--color-q-none)', soft: 'var(--color-q-none-soft)', text: '#4d5560' },
};

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable="false">
      <rect width="64" height="64" rx="15" fill="#3567E8" />
      <path d="M32 50 V34 M32 34 L20 20 M32 34 L44 20" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="18" r="4" fill="#fff" />
      <circle cx="44" cy="18" r="4" fill="#fff" fillOpacity="0.45" />
    </svg>
  );
}

function usePersistentTasks() {
  const initial = useMemo(loadTasks, []);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [storageOk, setStorageOk] = useState(initial.storageOk);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStorageOk(saveTasks(tasks));
  }, [tasks]);
  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'triage.tasks.v1') setTasks(loadTasks().tasks);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return { tasks, setTasks, storageOk };
}

export function App() {
  const { tasks, setTasks, storageOk } = usePersistentTasks();
  const toast = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLElement>(null);
  const groups = groupByBucket(tasks);
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done).sort((a, b) => ((a.doneAt ?? '') < (b.doneAt ?? '') ? 1 : -1));
  const editing = tasks.find((t) => t.id === editingId) ?? null;

  function upsert(t: Task) {
    setTasks((prev) => (prev.some((p) => p.id === t.id) ? prev.map((p) => (p.id === t.id ? t : p)) : [t, ...prev]));
  }
  function remove(t: Task) {
    setTasks((prev) => prev.filter((p) => p.id !== t.id));
    if (editingId === t.id) setEditingId(null);
    toast({
      message: `Deleted “${t.title.length > 28 ? `${t.title.slice(0, 28)}…` : t.title}”`,
      tone: 'info',
      action: { label: 'Undo', onClick: () => setTasks((prev) => (prev.some((p) => p.id === t.id) ? prev : [t, ...prev])) },
    });
  }
  function toggleDone(t: Task) {
    const next = { ...t, done: !t.done, doneAt: t.done ? null : new Date().toISOString() };
    upsert(next);
    if (next.done) toast({ message: 'Marked done', action: { label: 'Undo', onClick: () => upsert(t) } });
  }
  function startEdit(t: Task) {
    setEditingId(t.id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-[1160px] items-center justify-between px-5 pb-2 pt-[max(16px,env(safe-area-inset-top))] max-[359px]:px-4 lg:px-10 lg:pt-8">
        <a href="/" className="flex items-center gap-2 rounded-lg" aria-label="Triage — home">
          <LogoMark size={28} />
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Triage</span>
        </a>
        <a href="#how" className="flex min-h-[40px] items-center rounded-lg px-2 text-[14px] font-semibold text-accent hover:bg-accent-soft">
          How it decides
        </a>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1160px] px-5 pb-24 pt-4 max-[359px]:px-4 lg:px-10 lg:pt-8">
        <div className="max-w-[640px]">
          <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink md:text-[40px]">What should you do next?</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-secondary">
            Three Yes/No questions — urgent, important, more than five minutes — give one of eight clear calls. Add your tasks and get a sorted list.
          </p>
        </div>

        {open.length > 0 && (
          <a href="#list-h" className="mt-4 inline-flex min-h-[40px] items-center rounded-full border border-line bg-surface px-4 text-[14px] font-semibold text-accent md:hidden">
            Jump to your list · {open.length} open
          </a>
        )}

        {!storageOk && (
          <div className="mt-5 max-w-[640px]">
            <Notice tone="warning">This browser isn’t letting the site save, so your list will be lost when you close the page (private browsing can do this).</Notice>
          </div>
        )}

        <div className="mt-7 grid items-start gap-6 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-10">
          <section ref={formRef} aria-labelledby="form-h" className="scroll-mt-4 md:sticky md:top-6">
            <TaskForm
              key={editing?.id ?? 'new'}
              editing={editing}
              onCancelEdit={() => setEditingId(null)}
              onSubmit={(t, isNew) => {
                upsert(t);
                setEditingId(null);
                const bucket = BUCKETS.find((b) => b.id === bucketFor(t))!;
                toast({ message: isNew ? `Added to “${bucket.title}”` : `Updated · ${bucket.title}` });
              }}
            />
          </section>

          <section aria-labelledby="list-h" className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="list-h" className="scroll-mt-4 text-[20px] font-semibold tracking-[-0.01em]">
                Your list
              </h2>
              <p className="text-[13.5px] text-ink-secondary tabular" aria-live="polite">
                {open.length === 0 ? 'No open tasks' : `${open.length} open`}
                {done.length > 0 && ` · ${done.length} done`}
              </p>
            </div>

            {open.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong px-5 py-8 text-center">
                <p className="text-[16px] font-semibold text-ink">{done.length ? 'All clear.' : 'Nothing here yet.'}</p>
                <p className="mx-auto mt-1 max-w-[42ch] text-[14.5px] leading-relaxed text-ink-secondary">
                  {done.length ? 'Everything on your list is done.' : 'Add a task with the form. It lands in the right group automatically.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {BUCKETS.filter((b) => groups[b.id].length > 0).map((b) => (
                  <BucketSection key={b.id} bucket={b} tasks={groups[b.id]} editingId={editingId} onToggle={toggleDone} onEdit={startEdit} onDelete={remove} />
                ))}
              </div>
            )}

            {done.length > 0 && (
              <details className="group mt-4 rounded-[var(--radius-card)] border border-line bg-surface">
                <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-[15px] font-semibold text-ink">
                  <span>Done ({done.length})</span>
                  <ChevronDown size={18} className="text-ink-secondary transition-transform duration-150 group-open:rotate-180" aria-hidden />
                </summary>
                <ul className="border-t border-line">
                  {done.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                      <DoneToggle task={t} onToggle={toggleDone} />
                      <span className="min-w-0 flex-1 truncate text-[15px] text-ink-secondary line-through decoration-ink-tertiary">{t.title}</span>
                      <button type="button" onClick={() => remove(t)} aria-label={`Delete ${t.title}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-quiet hover:bg-surface-muted hover:text-danger">
                        <Trash2 size={17} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2">
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      const removed = done;
                      setTasks((prev) => prev.filter((p) => !p.done));
                      toast({ message: `Cleared ${removed.length} done`, tone: 'info', action: { label: 'Undo', onClick: () => setTasks((prev) => [...prev, ...removed]) } });
                    }}
                  >
                    Clear done tasks
                  </Button>
                </div>
              </details>
            )}
          </section>
        </div>

        <HowItDecides />

        <footer className="mt-12 border-t border-line pt-5 text-[13px] leading-relaxed text-ink-quiet">
          <p>Your list is saved in this browser only — no account, nothing sent anywhere. Clearing this site’s data removes it, and other devices won’t see it.</p>
          <p className="mt-1">Decision rule from the course “Take Charge of Your Time”, Module 1 (eight combinations of urgent, important and time taken).</p>
        </footer>
      </main>
    </div>
  );
}

function TaskForm({ editing, onSubmit, onCancelEdit }: { editing: Task | null; onSubmit: (t: Task, isNew: boolean) => void; onCancelEdit: () => void }) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [a, setA] = useState<Answers>(editing ? { urgent: editing.urgent, important: editing.important, moreThanFive: editing.moreThanFive, recurring: editing.recurring } : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const askRecurring = needsRecurring(a);
  const complete = a.urgent !== null && a.important !== null && a.moreThanFive !== null && (!askRecurring || a.recurring !== null);
  const preview =
    a.urgent !== null && a.important !== null && a.moreThanFive !== null
      ? getTriageRecommendation({ urgent: a.urgent, important: a.important, moreThanFive: a.moreThanFive, recurring: a.recurring ?? undefined })
      : null;

  const set = (k: keyof Answers, v: boolean) => {
    setA((p) => {
      const n = { ...p, [k]: v };
      if (!needsRecurring(n)) n.recurring = null;
      return n;
    });
    setError(null);
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = title.trim();
    if (!name) {
      setError('Name the task so you can find it in your list.');
      titleRef.current?.focus();
      return;
    }
    if (!complete) {
      setError(askRecurring ? 'Answer whether this happens regularly.' : 'Answer all three questions.');
      return;
    }
    const t: Task = {
      id: editing?.id ?? crypto.randomUUID(),
      title: name.slice(0, TITLE_MAX),
      urgent: a.urgent!,
      important: a.important!,
      moreThanFive: a.moreThanFive!,
      recurring: askRecurring ? a.recurring : null,
      done: editing?.done ?? false,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      doneAt: editing?.doneAt ?? null,
    };
    onSubmit(t, !editing);
    if (!editing) {
      setTitle('');
      setA(EMPTY);
      titleRef.current?.focus({ preventScroll: true });
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card p-4 md:p-5">
      <h2 id="form-h" className="text-[17px] font-semibold tracking-[-0.01em]">
        {editing ? 'Edit task' : 'New task'}
      </h2>
      <div className="mt-4 flex flex-col gap-5">
        <div>
          <label htmlFor={`${id}-t`} className="mb-2 block text-[15px] font-semibold text-ink">
            Task
          </label>
          <TextInput
            ref={titleRef}
            id={`${id}-t`}
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Reply to the vendor email"
            autoComplete="off"
            enterKeyHint="done"
            invalid={Boolean(error) && !title.trim()}
          />
        </div>
        <BinaryChoice label="Is it urgent?" value={a.urgent} onChange={(v) => set('urgent', v)} />
        <BinaryChoice label="Is it important to you?" value={a.important} onChange={(v) => set('important', v)} />
        <div>
          <BinaryChoice label="Will it take more than 5 minutes?" value={a.moreThanFive} onChange={(v) => set('moreThanFive', v)} />
          <p className="mt-1.5 text-[13px] text-ink-quiet">Exactly 5 minutes counts as No.</p>
        </div>
        {askRecurring && (
          <div className="anim-fade-up">
            <BinaryChoice label="Does this happen regularly?" value={a.recurring} onChange={(v) => set('recurring', v)} />
          </div>
        )}

        <div aria-live="polite">
          {preview && complete ? (
            <div className="anim-fade-up rounded-[14px] bg-accent-soft px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-accent-strong">Case {preview.caseNumber} of 8</p>
              <p className="mt-0.5 text-[18px] font-semibold tracking-[-0.01em] text-ink">{preview.action}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-secondary">{preview.detail}</p>
            </div>
          ) : (
            <p className="text-[14px] text-ink-quiet">{preview ? 'One more question.' : 'Answer the questions to see the recommendation.'}</p>
          )}
        </div>

        <FieldError id={`${id}-err`}>{error}</FieldError>
        <div className={cn('grid gap-2', editing ? 'grid-cols-2' : 'grid-cols-1')}>
          {editing && (
            <Button variant="secondary" size="lg" onClick={onCancelEdit}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" size="lg">
            {editing ? 'Save changes' : 'Add to list'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function DoneToggle({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={task.done}
      aria-label={`${task.done ? 'Mark not done' : 'Mark done'}: ${task.title}`}
      onClick={() => onToggle(task)}
      className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
    >
      <span
        className={cn(
          'flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-150',
          task.done ? 'border-accent bg-accent text-white' : 'border-line-strong bg-surface hover:border-accent',
        )}
      >
        {task.done && <Check size={14} strokeWidth={3} aria-hidden />}
      </span>
    </button>
  );
}

function BucketSection({
  bucket,
  tasks,
  editingId,
  onToggle,
  onEdit,
  onDelete,
}: {
  bucket: Bucket;
  tasks: Task[];
  editingId: string | null;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  const tone = TONE[bucket.tone];
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section aria-labelledby={`b-${bucket.id}`} className="card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-line px-4 py-3" style={{ background: tone.soft }}>
        <span className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tone.dot }} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id={`b-${bucket.id}`} className="text-[16px] font-semibold" style={{ color: tone.text }}>
              {bucket.title}
            </h3>
            <span className="text-[13px] font-semibold tabular" style={{ color: tone.text }}>
              {tasks.length}
            </span>
          </div>
          <p className="mt-0.5 text-[13.5px] leading-snug text-ink-secondary">{bucket.hint}</p>
        </div>
      </div>
      <ul>
        {tasks.map((t) => {
          const r = recommendationFor(t);
          const expanded = openId === t.id;
          return (
            <li key={t.id} className={cn('border-b border-line last:border-b-0', editingId === t.id && 'bg-accent-soft/40')}>
              <div className="flex items-center gap-3 px-4 py-2.5">
                <DoneToggle task={t} onToggle={onToggle} />
                <button
                  type="button"
                  onClick={() => setOpenId(expanded ? null : t.id)}
                  aria-expanded={expanded}
                  className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-semibold text-ink">{t.title}</span>
                    <span className="mt-0.5 block text-[12.5px] text-ink-secondary">
                      {[t.urgent ? 'Urgent' : 'Not urgent', t.important ? 'Important' : 'Not important', t.moreThanFive ? '> 5 min' : '≤ 5 min', t.recurring ? 'Recurring' : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <ChevronDown size={18} className={cn('shrink-0 text-ink-tertiary transition-transform duration-150', expanded && 'rotate-180')} aria-hidden />
                </button>
              </div>
              {expanded && (
                <div className="anim-fade-up px-4 pb-3 pl-[60px]">
                  <p className="text-[14.5px] font-semibold text-ink">{r.action}</p>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-ink-secondary">{r.detail}</p>
                  <div className="mt-2 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(t)} aria-label={`Edit ${t.title}`}>
                      <Pencil size={15} aria-hidden /> Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onDelete(t)} aria-label={`Delete ${t.title}`}>
                      <Trash2 size={15} aria-hidden /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HowItDecides() {
  const rows: Array<[boolean, boolean, boolean]> = [
    [true, true, false],
    [true, true, true],
    [false, true, false],
    [false, true, true],
    [true, false, false],
    [true, false, true],
    [false, false, false],
    [false, false, true],
  ];
  const yn = (b: boolean) => (b ? 'Yes' : 'No');
  return (
    <section id="how" aria-labelledby="how-h" className="mt-14 scroll-mt-6">
      <h2 id="how-h" className="text-[24px] font-semibold tracking-[-0.02em]">
        How it decides
      </h2>
      <p className="mt-2 max-w-[66ch] text-[15px] leading-relaxed text-ink-secondary">
        The classic urgent/important matrix gets a third question: <strong className="text-ink">how long will it take?</strong> Five minutes or less counts as short. The definitions are yours — <em>urgent</em> means it has to happen now or soon; <em>important</em> means it matters to you, whatever anyone else thinks.
      </p>
      <div className="card mt-5 overflow-x-auto" tabIndex={0} role="region" aria-label="The eight cases (scrolls sideways on small screens)">
        <table className="w-full min-w-[560px] border-collapse text-[14px]">
          <caption className="sr-only">The eight cases</caption>
          <thead>
            <tr className="border-b border-line text-left text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-secondary">
              <th scope="col" className="px-4 py-3">Urgent</th>
              <th scope="col" className="px-2 py-3">Important</th>
              <th scope="col" className="px-2 py-3">&gt; 5 min</th>
              <th scope="col" className="px-4 py-3">What to do</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([u, i, l]) => {
              const r = getTriageRecommendation({ urgent: u, important: i, moreThanFive: l });
              return (
                <tr key={`${u}${i}${l}`} className="border-b border-line align-top last:border-b-0">
                  <td className="px-4 py-3 tabular">{yn(u)}</td>
                  <td className="px-2 py-3 tabular">{yn(i)}</td>
                  <td className="px-2 py-3 tabular">{yn(l)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-ink">{r.action}</span>
                    <span className="block text-[13px] text-ink-secondary">{r.courseExample}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 max-w-[66ch] text-[14px] leading-relaxed text-ink-secondary">
        <strong className="text-ink">Urgent, not important, more than 5 minutes</strong> depends on one more question: if it happens regularly, reserve a repeatable buffer for it, sized from your own experience; if it’s occasional, handle it once the important work has had its time.
      </p>
    </section>
  );
}
