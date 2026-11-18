import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
type Size = 'md' | 'lg' | 'sm';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; block?: boolean }>(
  function Button({ variant = 'secondary', size = 'md', block, className, type = 'button', ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold select-none transition-[background-color,border-color,color,opacity] duration-150 disabled:opacity-45',
          size === 'lg' && 'min-h-[50px] px-5 text-[16px]',
          size === 'md' && 'min-h-[44px] px-4 text-[15px]',
          size === 'sm' && 'min-h-[36px] px-3 text-[14px]',
          variant === 'primary' && 'bg-accent text-white hover:bg-accent-strong active:bg-accent-strong',
          variant === 'secondary' && 'bg-surface text-ink border border-line hover:bg-surface-muted active:bg-surface-muted',
          variant === 'ghost' && 'text-accent hover:bg-accent-soft active:bg-accent-soft',
          variant === 'quiet' && 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
          variant === 'danger' && 'text-danger hover:bg-danger-soft active:bg-danger-soft',
          block && 'w-full',
          className,
        )}
        {...rest}
      />
    );
  },
);

export function Card({ className, children, as: As = 'section', ...rest }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' } & Record<string, unknown>) {
  return (
    <As className={cn('card', className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({ title, description, action, id }: { title: ReactNode; description?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[14px] text-ink-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Accessible Yes/No segmented control (radiogroup). null = unanswered, rendered with neither selected.
 */
export function BinaryChoice({
  label,
  value,
  onChange,
  noLabel = 'No',
  yesLabel = 'Yes',
  size = 'md',
  describedBy,
  name,
}: {
  label: ReactNode;
  value: boolean | null;
  onChange: (v: boolean) => void;
  noLabel?: string;
  yesLabel?: string;
  size?: 'md' | 'lg';
  describedBy?: string;
  name?: string;
}) {
  const id = useId();
  const options: Array<[boolean, string]> = [
    [false, noLabel],
    [true, yesLabel],
  ];
  const onKey = (e: React.KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const next = value === null ? e.key === 'ArrowRight' || e.key === 'ArrowDown' : !value;
      onChange(next);
      const el = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-value="${String(next)}"]`);
      el?.focus();
    }
  };
  return (
    <div>
      <div id={`${id}-label`} className="mb-2 text-[15px] font-semibold text-ink">
        {label}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        data-name={name}
        onKeyDown={onKey}
        className="grid grid-cols-2 gap-1 rounded-[14px] bg-surface-muted p-1"
      >
        {options.map(([v, text]) => {
          const selected = value === v;
          const focusable = value === null ? v === false : selected;
          return (
            <button
              key={text}
              type="button"
              role="radio"
              aria-checked={selected}
              data-value={String(v)}
              tabIndex={focusable ? 0 : -1}
              onClick={() => onChange(v)}
              className={cn(
                'rounded-[11px] font-semibold transition-[background-color,color,box-shadow] duration-150',
                size === 'lg' ? 'min-h-[52px] text-[16px]' : 'min-h-[44px] text-[15px]',
                selected
                  ? 'bg-surface text-accent shadow-[0_1px_3px_rgba(20,30,50,0.12),0_0_0_1px_var(--color-accent)]'
                  : 'text-ink-secondary hover:text-ink',
              )}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-[10px] bg-surface-muted p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-[36px] rounded-[8px] px-3 text-[13px] font-semibold transition-colors duration-150',
            value === o.value ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(20,30,50,0.1)]' : 'text-ink-secondary hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function TextInput(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'block min-h-[48px] w-full rounded-xl border bg-surface px-3.5 text-[16px] text-ink placeholder:text-ink-tertiary transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]',
        invalid ? 'border-danger' : 'border-line-strong',
        className,
      )}
      {...rest}
    />
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function TextArea(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'block min-h-[88px] w-full resize-y rounded-xl border bg-surface px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]',
        invalid ? 'border-danger' : 'border-line-strong',
        className,
      )}
      {...rest}
    />
  );
});

export function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[15px] font-semibold text-ink">
        {children}
      </label>
      {hint && <span className="text-[13px] text-ink-quiet">{hint}</span>}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-[14px] font-medium text-danger">
      {children}
    </p>
  );
}

export function Chip({ selected, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-[36px] items-center rounded-full border px-3.5 text-[14px] font-medium transition-colors duration-150',
        selected ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line bg-surface text-ink hover:bg-surface-muted',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-surface-muted', className)} />;
}

export function Notice({ tone = 'neutral', icon, children, action }: { tone?: 'neutral' | 'warning' | 'accent' | 'danger' | 'success'; icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[14px] border px-4 py-3 text-[14px]',
        tone === 'neutral' && 'border-line bg-surface text-ink-secondary',
        tone === 'warning' && 'border-[#ecdcc2] bg-warning-soft text-[#6f4a17]',
        tone === 'accent' && 'border-[#d6e1fb] bg-accent-soft text-[#24459c]',
        tone === 'danger' && 'border-[#f1cfcf] bg-danger-soft text-[#8e2a2c]',
        tone === 'success' && 'border-[#cde6dd] bg-success-soft text-[#1d5e4b]',
      )}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
