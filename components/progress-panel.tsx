'use client';

import { CheckCircle2, ChevronDown, ChevronUp, ImageIcon, Loader2, RotateCcw, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProgressItem = {
  id: string;
  name: string;
  status: 'in-progress' | 'success' | 'error';
  detail?: string | null;
  retryable?: boolean;
};

type ProgressPanelProps = {
  items: ProgressItem[];
  header: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onDismiss: () => void;
  onRetry?: (id: string) => void;
  onRetryFailed?: () => void;
  retryFailedLabel?: string;
  ariaLabel: string;
  className?: string;
};

export function ProgressPanel({
  items,
  header,
  expanded,
  onExpandedChange,
  onDismiss,
  onRetry,
  onRetryFailed,
  retryFailedLabel = 'Retry failed items',
  ariaLabel,
  className,
}: ProgressPanelProps) {
  if (items.length === 0) {
    return null;
  }

  const allDone = items.every((item) => item.status !== 'in-progress');
  const retryableFailedCount = items.filter(
    (item) => item.status === 'error' && item.retryable,
  ).length;
  const showRetryFailed = allDone && retryableFailedCount > 1 && Boolean(onRetryFailed);

  return (
    <aside
      className={cn(
        'w-full overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl',
        className,
      )}
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <header className="flex items-center gap-2 bg-muted/70 px-3 py-2.5">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{header}</p>
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => onExpandedChange(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${ariaLabel}` : `Expand ${ariaLabel}`}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        {showRetryFailed ? (
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={onRetryFailed}
            aria-label={retryFailedLabel}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : allDone ? (
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={onDismiss}
            aria-label={`Dismiss ${ariaLabel}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </header>
      {expanded ? (
        <ul className="max-h-72 overflow-y-auto py-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  item.status === 'error'
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-primary/15 text-primary',
                )}
              >
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.name}</p>
                {item.detail ? (
                  <p
                    className={cn(
                      'truncate text-xs',
                      item.status === 'error'
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                    )}
                  >
                    {item.detail}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0">
                {item.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-label="Complete" />
                ) : null}
                {item.status === 'error' ? (
                  item.retryable && onRetry ? (
                    <button
                      type="button"
                      className="rounded-md p-0.5 text-destructive hover:bg-destructive/10"
                      onClick={() => onRetry(item.id)}
                      aria-label={`Retry ${item.name}`}
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" aria-label="Failed" />
                  )
                ) : null}
                {item.status === 'in-progress' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="In progress" />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
