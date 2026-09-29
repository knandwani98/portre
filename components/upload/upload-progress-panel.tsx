'use client';

import { ProgressPanel, type ProgressItem } from '@/components/progress-panel';
import type { UploadItem } from '@/hooks/use-upload-queue';

type UploadProgressPanelProps = {
  items: UploadItem[];
  retryableIds?: readonly string[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onDismiss: () => void;
  onRetry?: (id: string) => void;
  onRetryFailed?: () => void;
  className?: string;
};

function headerLabel(items: UploadItem[]) {
  const total = items.length;
  const uploading = items.filter((item) => item.status === 'uploading').length;
  const validating = items.filter((item) => item.status === 'validating').length;
  const success = items.filter((item) => item.status === 'success').length;
  const rejected = items.filter((item) => item.status === 'rejected').length;
  const failed = items.filter((item) => item.status === 'error').length;
  const inFlight = uploading + validating;
  const settled = success + rejected;

  if (inFlight > 0) {
    const done = settled + failed;
    if (uploading > 0) {
      return done > 0
        ? `Uploading ${done + 1} of ${total}`
        : `Uploading ${total} ${total === 1 ? 'item' : 'items'}…`;
    }
    return done > 0
      ? `Validating ${done + 1} of ${total}`
      : `Validating ${total} ${total === 1 ? 'photo' : 'photos'}…`;
  }
  if (failed > 0 && settled === 0) {
    return `${failed} ${failed === 1 ? 'upload' : 'uploads'} failed`;
  }
  if (failed > 0) {
    return `${settled} complete, ${failed} failed`;
  }
  return `${settled} ${settled === 1 ? 'upload' : 'uploads'} complete`;
}

function itemDetail(item: UploadItem) {
  if (item.status === 'uploading') {
    return 'Uploading…';
  }
  if (item.status === 'validating') {
    return 'Validating…';
  }
  if (item.status === 'rejected') {
    return item.error ?? "Didn't meet guidelines";
  }
  if (item.status === 'error') {
    return item.error ?? 'Failed';
  }
  return null;
}

function toProgressItems(
  items: UploadItem[],
  retryableIds: ReadonlySet<string>,
): ProgressItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    status:
      item.status === 'success'
        ? 'success'
        : item.status === 'error' || item.status === 'rejected'
          ? 'error'
          : 'in-progress',
    detail: itemDetail(item),
    retryable: retryableIds.has(item.id),
  }));
}

export function UploadProgressPanel({
  items,
  retryableIds = [],
  expanded,
  onExpandedChange,
  onDismiss,
  onRetry,
  onRetryFailed,
  className,
}: UploadProgressPanelProps) {
  return (
    <ProgressPanel
      items={toProgressItems(items, new Set(retryableIds))}
      header={headerLabel(items)}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      onDismiss={onDismiss}
      onRetry={onRetry}
      onRetryFailed={onRetryFailed}
      retryFailedLabel="Retry failed uploads"
      ariaLabel="Upload progress"
      className={className}
    />
  );
}
