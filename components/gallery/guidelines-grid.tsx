'use client';

import type { ImageDto } from '@/lib/shared';
import { PhotoCard } from '@/components/gallery/photo-card';
import { Button } from '@/components/ui/button';

type GuidelinesGridProps = {
  images: ImageDto[];
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleSelect: (image: ImageDto) => void;
  onToggleSelectAll: () => void;
  onDelete: (image: ImageDto) => void;
};

export function GuidelinesGrid({
  images,
  selectedIds,
  allSelected,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
}: GuidelinesGridProps) {
  if (images.length === 0) {
    return null;
  }

  const selectionActive = selectedIds.size > 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Some photos didn&apos;t meet our guidelines
          </h2>
          <p className="text-sm text-muted-foreground">
            These don&apos;t count toward your 10 accepted photos.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onToggleSelectAll}>
          {allSelected ? 'Deselect all' : 'Select all'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <PhotoCard
            key={image.id}
            image={image}
            reason={
              image.rejectionMessage ??
              (image.status === 'PENDING'
                ? "Upload didn't finish"
                : "We couldn't process this photo")
            }
            selected={selectedIds.has(image.id)}
            selectionActive={selectionActive}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
