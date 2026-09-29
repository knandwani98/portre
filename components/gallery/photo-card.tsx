'use client';

import type { ImageDto } from '@/lib/shared';
import { Check, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PhotoCardProps = {
  image: ImageDto;
  reason?: string | null;
  selected: boolean;
  selectionActive: boolean;
  onToggleSelect: (image: ImageDto) => void;
  onDelete: (image: ImageDto) => void;
};

export function PhotoCard({
  image,
  reason,
  selected,
  selectionActive,
  onToggleSelect,
  onDelete,
}: PhotoCardProps) {
  const isProcessing =
    !reason && (image.status === 'PENDING' || image.status === 'PROCESSING');
  const isHeic = /\.hei[cf]$/i.test(image.originalName);

  return (
    <figure
      className={cn(
        'group overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <div className="relative aspect-square bg-muted">
        {image.previewUrl && !isProcessing ? (
          <PreviewImage src={image.previewUrl} alt={image.originalName} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            {isProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
            {isHeic && isProcessing ? (
              <span className="px-3 text-center text-xs">Processing HEIC…</span>
            ) : null}
          </div>
        )}
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Select ${image.originalName}`}
          onClick={() => onToggleSelect(image)}
          className={cn(
            'absolute left-2 top-2 z-10 flex h-4.5 w-4.5 cursor-pointer items-center justify-center rounded-md border-2 shadow-sm',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-white/80 bg-background/90 text-transparent',
          )}
        >
          <Check className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
        {!selectionActive ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onDelete(image)}
            aria-label={`Delete ${image.originalName}`}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <figcaption className="space-y-1 p-3">
        <p className="truncate text-sm font-medium">{image.originalName}</p>
        {reason ? (
          <p className="text-xs text-muted-foreground">{reason}</p>
        ) : null}
      </figcaption>
    </figure>
  );
}

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [src]);

  const displaySrc =
    attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => {
        if (attempt < 2) {
          setAttempt((current) => current + 1);
        }
      }}
    />
  );
}
