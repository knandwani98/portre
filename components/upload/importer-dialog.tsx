'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  isAllowedUploadFile,
  MAX_ACCEPTED_PHOTOS,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function remainingSlotsMessage(slotsLeft: number) {
  if (slotsLeft <= 0) {
    return `You've reached the ${MAX_ACCEPTED_PHOTOS}-photo limit.`;
  }
  return `You can add at most ${slotsLeft} more photo${slotsLeft === 1 ? '' : 's'}. Maximum is ${MAX_ACCEPTED_PHOTOS}.`;
}

const quotaToastOptions = {
  id: 'photo-quota',
  duration: 6000,
  position: 'top-center' as const,
};

type ImporterDialogProps = {
  open: boolean;
  remaining: number;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => void;
};

export function ImporterDialog({
  open,
  remaining,
  onOpenChange,
  onUpload,
}: ImporterDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url:
          file.type === 'image/heic' ||
          file.type === 'image/heif' ||
          /\.hei[cf]$/i.test(file.name)
            ? null
            : URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      }
    };
  }, [previews]);

  const slotsLeft = Math.max(0, remaining - files.length);

  function addFiles(incoming: FileList | File[]) {
    const next = Array.from(incoming);
    const accepted: File[] = [];
    let formatRejected = false;
    let oversizedName: string | null = null;
    for (const file of next) {
      if (!isAllowedUploadFile(file)) {
        formatRejected = true;
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedName = file.name;
        continue;
      }
      accepted.push(file);
    }
    if (formatRejected) {
      const message = 'Only HEIC, PNG, and JPEG files are allowed.';
      setError(message);
      toast.error(message);
    }
    if (oversizedName) {
      const message = `${oversizedName} is larger than 15 MB.`;
      setError(message);
      toast.error(message);
    }
    if (accepted.length === 0) {
      return;
    }

    const available = Math.max(0, remaining - files.length);
    if (available <= 0) {
      const message = remainingSlotsMessage(0);
      setError(message);
      toast.error(message, quotaToastOptions);
      return;
    }
    if (accepted.length > available) {
      const message = remainingSlotsMessage(available);
      setError(message);
      toast.error(message, quotaToastOptions);
      setFiles((current) => [
        ...current,
        ...accepted.slice(0, Math.max(0, remaining - current.length)),
      ]);
      return;
    }

    setError(null);
    setFiles((current) => [...current, ...accepted]);
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setError(null);
  }

  function openFilePicker() {
    if (slotsLeft <= 0) {
      const message = remainingSlotsMessage(slotsLeft);
      setError(message);
      toast.error(message, quotaToastOptions);
      return;
    }
    inputRef.current?.click();
  }

  function handleUpload() {
    const selected = files.slice(0, remaining);
    if (selected.length === 0) {
      const message = remainingSlotsMessage(remaining);
      setError(message);
      toast.error(message, quotaToastOptions);
      return;
    }
    if (files.length > remaining) {
      toast.error(remainingSlotsMessage(remaining), quotaToastOptions);
    }
    setFiles([]);
    onOpenChange(false);
    onUpload(selected);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFiles([]);
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import photos</DialogTitle>
          <DialogDescription>
            Add up to {remaining} photo{remaining === 1 ? '' : 's'}. HEIC, PNG, and JPEG only.
          </DialogDescription>
        </DialogHeader>
        <button
          type="button"
          className={cn(
            'flex min-h-40 w-full flex-col items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground',
            dragOver && 'border-primary bg-accent',
            slotsLeft <= 0 && 'cursor-not-allowed opacity-60',
          )}
          onClick={openFilePicker}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <ImagePlus className="mb-2 h-8 w-8" />
          {slotsLeft <= 0
            ? remainingSlotsMessage(0)
            : 'Drag photos here or click to browse'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".heic,.heif,.png,.jpg,.jpeg,image/heic,image/heif,image/png,image/jpeg"
          multiple
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
              event.target.value = '';
            }
          }}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {previews.length > 0 ? (
          <ul className="grid grid-cols-4 gap-2">
            {previews.map(({ file, url }, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="relative overflow-hidden rounded-md border"
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={file.name} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted text-[10px] text-muted-foreground">
                    HEIC
                  </div>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-1.5 top-1.5 h-7 w-7"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            type="button"
            onClick={() => void handleUpload()}
            disabled={files.length === 0}
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
