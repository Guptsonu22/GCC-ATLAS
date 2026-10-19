import type { ReactNode } from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-border bg-surface-900 ${className}`}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-ink-100">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'teal' | 'cyan' | 'amber' | 'rose' | 'slate';
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: 'border-border-strong bg-surface-800 text-ink-200',
    teal: 'border-teal-accent/30 bg-teal-accent/10 text-teal-accent',
    cyan: 'border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent',
    amber: 'border-amber-flag/30 bg-amber-flag/10 text-amber-flag',
    rose: 'border-rose-flag/30 bg-rose-flag/10 text-rose-flag',
    slate: 'border-surface-600 bg-surface-700/50 text-ink-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 px-6 py-14 text-sm text-ink-300" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin text-teal-accent" />
      <span>{label ?? 'Loading data…'}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center" role="alert">
      <AlertTriangle className="h-5 w-5 text-amber-flag" />
      <p className="text-sm text-ink-200">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-1.5 rounded border border-border-strong bg-surface-800 px-3 py-1.5 text-xs font-medium text-ink-100 hover:bg-surface-700"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-14 text-center">
      <Inbox className="h-5 w-5 text-ink-400" />
      <p className="text-sm font-medium text-ink-200">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow: string;
  title: string;
  description: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">{eyebrow}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink-100">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-300">{description}</p>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}
