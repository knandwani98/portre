'use client';

import type { ImageDto } from '@/lib/shared';
import { PhotoCard } from '@/components/gallery/photo-card';

type AcceptedGridProps = {
  images: ImageDto[];
  selectedIds: Set<string>;
  onToggleSelect: (image: ImageDto) => void;
  onDelete: (image: ImageDto) => void;
};

export function AcceptedGrid({
  images,
  selectedIds,
  onToggleSelect,
  onDelete,
}: AcceptedGridProps) {
  if (images.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No accepted photos yet. Import portraits to get started.
      </p>
    );
  }

  const selectionActive = selectedIds.size > 0;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <PhotoCard
          key={image.id}
          image={image}
          selected={selectedIds.has(image.id)}
          selectionActive={selectionActive}
          onToggleSelect={onToggleSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
