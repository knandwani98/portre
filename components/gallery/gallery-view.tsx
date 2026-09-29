'use client';

import { MAX_ACCEPTED_PHOTOS, type ImageDto } from '@/lib/shared';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AcceptedGrid } from '@/components/gallery/accepted-grid';
import { DeleteProgressPanel } from '@/components/gallery/delete-progress-panel';
import { GuidelinesGrid } from '@/components/gallery/guidelines-grid';
import { PermanentDeleteDialog } from '@/components/gallery/permanent-delete-dialog';
import { UploadProgressPanel } from '@/components/upload/upload-progress-panel';
import { useUploadQueueContext } from '@/components/upload/upload-queue-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteQueue } from '@/hooks/use-delete-queue';
import { quotaFromImages, useImages } from '@/hooks/use-images';
import { cn } from '@/lib/utils';

export function GalleryView() {
  const imagesQuery = useImages();
  const {
    items,
    retryableIds,
    retryItem,
    retryFailed,
    visible,
    expanded,
    setExpanded,
    dismiss,
    syncFromImages,
  } = useUploadQueueContext();
  const {
    deleteImages,
    items: deleteItems,
    visible: deleteVisible,
    expanded: deleteExpanded,
    setExpanded: setDeleteExpanded,
    dismiss: dismissDelete,
    hiddenIds,
  } = useDeleteQueue();
  const [deleteTargets, setDeleteTargets] = useState<ImageDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const images = imagesQuery.data ?? [];
  const accepted = images.filter(
    (image) => image.status === 'ACCEPTED' && !hiddenIds.has(image.id),
  );
  const notAccepted = images.filter(
    (image) => image.status === 'REJECTED' && !hiddenIds.has(image.id),
  );
  const quota = imagesQuery.data
    ? quotaFromImages(imagesQuery.data)
    : undefined;
  const remaining = quota?.remaining ?? 0;
  const selectedCount = selectedIds.size;
  const allAcceptedSelected =
    accepted.length > 0 && accepted.every((image) => selectedIds.has(image.id));
  const allGuidelinesSelected =
    notAccepted.length > 0 &&
    notAccepted.every((image) => selectedIds.has(image.id));

  useEffect(() => {
    syncFromImages(images);
  }, [images, syncFromImages]);

  useEffect(() => {
    const validIds = new Set(images.map((image) => image.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [images]);

  function toggleSelect(image: ImageDto) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(image.id)) {
        next.delete(image.id);
      } else {
        next.add(image.id);
      }
      return next;
    });
  }

  function toggleSelectGroup(images: ImageDto[]) {
    const ids = images.map((image) => image.id);
    const groupSelected =
      images.length > 0 && images.every((image) => selectedIds.has(image.id));
    setSelectedIds((prev) => {
      if (groupSelected) {
        const remove = new Set(ids);
        return new Set([...prev].filter((id) => !remove.has(id)));
      }
      return new Set([...prev, ...ids]);
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function requestDelete(targets: ImageDto[]) {
    if (targets.length === 0) {
      return;
    }
    setDeleteTargets(targets);
  }

  function handleDelete() {
    if (deleteTargets.length === 0) {
      return;
    }
    const targets = deleteTargets;
    setDeleteTargets([]);
    setSelectedIds((prev) => {
      const removed = new Set(targets.map((image) => image.id));
      return new Set([...prev].filter((id) => !removed.has(id)));
    });
    deleteImages(targets);
  }

  if (imagesQuery.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={selectedCount > 0 ? 'space-y-10 pb-24' : 'space-y-10'}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Accepted Photos</h1>
            <p className="text-sm text-muted-foreground">
              {quota?.accepted ?? 0} of {MAX_ACCEPTED_PHOTOS} accepted
              {remaining > 0 ? ` · ${remaining} remaining` : ''}
            </p>
          </div>
          {accepted.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => toggleSelectGroup(accepted)}
            >
              {allAcceptedSelected ? 'Deselect all' : 'Select all'}
            </Button>
          ) : null}
        </div>
        <AcceptedGrid
          images={accepted}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDelete={(image) => requestDelete([image])}
        />
      </section>

      <GuidelinesGrid
        images={notAccepted}
        selectedIds={selectedIds}
        allSelected={allGuidelinesSelected}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={() => toggleSelectGroup(notAccepted)}
        onDelete={(image) => requestDelete([image])}
      />

      <PermanentDeleteDialog
        open={deleteTargets.length > 0}
        count={deleteTargets.length}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargets([]);
          }
        }}
        onConfirm={handleDelete}
      />
      {selectedCount > 0 ? (
        <div
          className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur"
          role="toolbar"
          aria-label="Selected photos"
        >
          <p className="text-sm font-medium">
            {selectedCount} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                requestDelete(images.filter((image) => selectedIds.has(image.id)))
              }
            >
              <Trash2 />
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={clearSelection}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {visible || deleteVisible ? (
        <div
          className={cn(
            'fixed right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col-reverse gap-2',
            selectedCount > 0 ? 'bottom-24' : 'bottom-4',
          )}
        >
          {visible ? (
            <UploadProgressPanel
              items={items}
              retryableIds={retryableIds}
              expanded={expanded}
              onExpandedChange={setExpanded}
              onDismiss={dismiss}
              onRetry={retryItem}
              onRetryFailed={retryFailed}
            />
          ) : null}
          {deleteVisible ? (
            <DeleteProgressPanel
              items={deleteItems}
              expanded={deleteExpanded}
              onExpandedChange={setDeleteExpanded}
              onDismiss={dismissDelete}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
