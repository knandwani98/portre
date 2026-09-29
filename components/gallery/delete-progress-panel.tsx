'use client';

import { ProgressPanel, type ProgressItem } from '@/components/progress-panel';
import type { DeleteItem } from '@/hooks/use-delete-queue';

type DeleteProgressPanelProps = {
  items: DeleteItem[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onDismiss: () => void;
  className?: string;
};

function headerLabel(items: DeleteItem[]) {
  const total = items.length;
  const deleting = items.filter((item) => item.status === 'deleting').length;
  const success = items.filter((item) => item.status === 'success').length;
  const failed = items.filter((item) => item.status === 'error').length;

  if (deleting > 0) {
    const done = success + failed;
    return done > 0
      ? `Deleting ${done + 1} of ${total}`
      : `Deleting ${total} ${total === 1 ? 'photo' : 'photos'}…`;
  }
  if (failed > 0 && success === 0) {
    return `${failed} ${failed === 1 ? 'delete' : 'deletes'} failed`;
  }
  if (failed > 0) {
    return `${success} deleted, ${failed} failed`;
  }
  return `${success} ${success === 1 ? 'photo' : 'photos'} deleted`;
}

function toProgressItems(items: DeleteItem[]): ProgressItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    status:
      item.status === 'success'
        ? 'success'
        : item.status === 'error'
          ? 'error'
          : 'in-progress',
    detail:
      item.status === 'deleting'
        ? 'Deleting…'
        : item.status === 'error'
          ? (item.error ?? 'Failed')
          : null,
  }));
}

export function DeleteProgressPanel({
  items,
  expanded,
  onExpandedChange,
  onDismiss,
  className,
}: DeleteProgressPanelProps) {
  return (
    <ProgressPanel
      items={toProgressItems(items)}
      header={headerLabel(items)}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      onDismiss={onDismiss}
      ariaLabel="Delete progress"
      className={className}
    />
  );
}
