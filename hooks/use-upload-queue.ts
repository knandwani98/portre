'use client';

import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import {
  isAllowedUploadFile,
  JOB_MAX_ATTEMPTS,
  MAX_ACCEPTED_PHOTOS,
  MAX_FILE_SIZE_BYTES,
  type AllowedMimeType,
  type ImageDto,
} from '@/lib/shared';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, createApi, putToPresignedUrl } from '@/lib/api';
import {
  removeImagesFromCache,
  upsertImageInCache,
} from '@/hooks/use-images';

export type UploadItemStatus =
  | 'uploading'
  | 'validating'
  | 'success'
  | 'rejected'
  | 'error';

export type UploadItem = {
  id: string;
  name: string;
  status: UploadItemStatus;
  imageId?: string;
  error?: string;
};

type QueueEntry = {
  itemId: string;
  file: File;
  batchId: string;
};

const FAILED_TOAST_ID = 'upload-failed';

function guessMime(file: File): AllowedMimeType | null {
  if (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  ) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.png')) {
    return 'image/png';
  }
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (name.endsWith('.heic')) {
    return 'image/heic';
  }
  if (name.endsWith('.heif')) {
    return 'image/heif';
  }
  return null;
}

function isInProgress(status: UploadItemStatus) {
  return status === 'uploading' || status === 'validating';
}

function mergeUploadItems(
  current: UploadItem[],
  images: ImageDto[],
): { next: UploadItem[]; addedInFlight: boolean; failedIds: string[] } {
  const byId = new Map(images.map((image) => [image.id, image]));
  let changed = false;
  const failedIds: string[] = [];

  const next = current.map((item) => {
    if (!item.imageId) {
      return item;
    }
    const image = byId.get(item.imageId);
    if (!image) {
      if (item.status === 'validating') {
        changed = true;
        failedIds.push(item.id);
        return {
          ...item,
          status: 'error' as const,
          error: 'Upload failed',
        };
      }
      return item;
    }
    if (image.status === 'ACCEPTED' && item.status !== 'success') {
      changed = true;
      return { ...item, status: 'success' as const, error: undefined };
    }
    if (image.status === 'REJECTED' && item.status !== 'rejected') {
      changed = true;
      return {
        ...item,
        status: 'rejected' as const,
        error: image.rejectionMessage ?? "This photo didn't meet our guidelines",
      };
    }
    if (image.status === 'PROCESSING' && isInProgress(item.status)) {
      if (item.status !== 'validating') {
        changed = true;
        return { ...item, status: 'validating' as const };
      }
      return item;
    }
    return item;
  });

  const knownIds = new Set(
    next.map((item) => item.imageId).filter((id): id is string => Boolean(id)),
  );
  const extras: UploadItem[] = [];
  for (const image of images) {
    if (knownIds.has(image.id)) {
      continue;
    }
    if (image.status === 'PROCESSING') {
      extras.push({
        id: image.id,
        imageId: image.id,
        name: image.originalName,
        status: 'validating',
      });
    }
  }

  if (extras.length === 0 && !changed) {
    return { next: current, addedInFlight: false, failedIds };
  }
  return {
    next: extras.length > 0 ? [...extras, ...next] : next,
    addedInFlight: extras.length > 0,
    failedIds,
  };
}

export function useUploadQueue() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const itemsRef = useRef<UploadItem[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const queueRef = useRef<QueueEntry[]>([]);
  const runningRef = useRef(false);

  const applyItems = useCallback((next: UploadItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patchItem = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      applyItems(
        itemsRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [applyItems],
  );

  const showFailedToast = useCallback(() => {
    const retryable = itemsRef.current.filter(
      (item) => item.status === 'error' && filesRef.current.has(item.id),
    );
    if (retryable.length === 0) {
      return;
    }
    const count = retryable.length;
    toast.error(count === 1 ? 'Upload failed' : `${count} uploads failed`, {
      id: FAILED_TOAST_ID,
      description: 'Please try again.',
      duration: 5000,
      position: 'top-center',
    });
  }, []);

  const dropRetryFile = useCallback((itemId: string) => {
    filesRef.current.delete(itemId);
  }, []);

  const syncFromImages = useCallback(
    (images: ImageDto[]) => {
      const { next, addedInFlight, failedIds } = mergeUploadItems(
        itemsRef.current,
        images,
      );
      if (next !== itemsRef.current) {
        applyItems(next);
      }
      for (const item of next) {
        if (item.status === 'success' || item.status === 'rejected') {
          dropRetryFile(item.id);
        }
      }
      if (addedInFlight) {
        setVisible(true);
        setExpanded(true);
      }
      if (failedIds.length > 0) {
        showFailedToast();
      }
    },
    [applyItems, dropRetryFile, showFailedToast],
  );

  const dismiss = useCallback(() => {
    applyItems(itemsRef.current.filter((item) => isInProgress(item.status)));
    setVisible(false);
  }, [applyItems]);

  const uploadOne = useCallback(
    async (entry: QueueEntry): Promise<'ok' | 'quota' | 'failed'> => {
      const { itemId, file, batchId } = entry;
      if (!isAllowedUploadFile(file)) {
        patchItem(itemId, { status: 'error', error: 'Not a supported format' });
        dropRetryFile(itemId);
        return 'failed';
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        patchItem(itemId, { status: 'error', error: 'File is too large' });
        dropRetryFile(itemId);
        return 'failed';
      }
      const mimeType = guessMime(file);
      if (!mimeType) {
        patchItem(itemId, { status: 'error', error: 'Not a supported format' });
        dropRetryFile(itemId);
        return 'failed';
      }

      const api = createApi(() => getToken());
      for (let attempt = 1; attempt <= JOB_MAX_ATTEMPTS; attempt += 1) {
        let imageId: string | undefined;
        try {
          const presign = await api.presign({
            originalName: file.name,
            mimeType,
            sizeBytes: file.size,
            batchId,
          });
          imageId = presign.imageId;
          patchItem(itemId, { imageId });
          const token = await getToken();
          await putToPresignedUrl(presign.uploadUrl, file, mimeType, token);
          const image = await api.complete({ imageId });
          upsertImageInCache(queryClient, image);
          patchItem(itemId, { status: 'validating', imageId });
          return 'ok';
        } catch (error) {
          if (imageId) {
            try {
              await api.deleteImage(imageId);
            } catch {
              // Slot may already be freed.
            }
            patchItem(itemId, { imageId: undefined });
            removeImagesFromCache(queryClient, [imageId]);
          }
          if (error instanceof ApiError && error.code === 'QUOTA_EXCEEDED') {
            patchItem(itemId, {
              status: 'error',
              error: `You've reached the ${MAX_ACCEPTED_PHOTOS}-photo limit.`,
            });
            dropRetryFile(itemId);
            toast.error(`You've reached the ${MAX_ACCEPTED_PHOTOS}-photo limit.`, {
              id: 'photo-quota',
              duration: 6000,
              position: 'top-center',
            });
            return 'quota';
          }
          if (attempt >= JOB_MAX_ATTEMPTS) {
            patchItem(itemId, {
              status: 'error',
              error: error instanceof Error ? error.message : 'Failed to upload',
            });
            return 'failed';
          }
        }
      }
      patchItem(itemId, { status: 'error', error: 'Failed to upload' });
      return 'failed';
    },
    [dropRetryFile, getToken, patchItem, queryClient],
  );

  const processQueue = useCallback(async () => {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    setIsUploading(true);
    let hadRetryableFailure = false;
    try {
      while (queueRef.current.length > 0) {
        const entry = queueRef.current.shift();
        if (!entry) {
          continue;
        }
        const result = await uploadOne(entry);
        if (result === 'quota') {
          while (queueRef.current.length > 0) {
            const rest = queueRef.current.shift();
            if (!rest) {
              continue;
            }
            patchItem(rest.itemId, {
              status: 'error',
              error: `You've reached the ${MAX_ACCEPTED_PHOTOS}-photo limit.`,
            });
            dropRetryFile(rest.itemId);
          }
          break;
        }
        if (result === 'failed' && filesRef.current.has(entry.itemId)) {
          hadRetryableFailure = true;
        }
      }
    } finally {
      runningRef.current = false;
      setIsUploading(false);
    }
    if (hadRetryableFailure) {
      showFailedToast();
    }
  }, [dropRetryFile, patchItem, showFailedToast, uploadOne]);

  const uploadFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) {
        return;
      }
      const batchId = crypto.randomUUID();
      const queued: UploadItem[] = [];
      const entries: QueueEntry[] = [];
      for (const file of files) {
        const itemId = crypto.randomUUID();
        filesRef.current.set(itemId, file);
        queued.push({
          id: itemId,
          name: file.name,
          status: 'uploading',
        });
        entries.push({ itemId, file, batchId });
      }
      applyItems([...queued, ...itemsRef.current]);
      queueRef.current.push(...entries);
      setVisible(true);
      setExpanded(true);
      void processQueue();
    },
    [applyItems, processQueue],
  );

  const enqueueRetries = useCallback(
    (itemIds?: Set<string>) => {
      toast.dismiss(FAILED_TOAST_ID);
      const batchId = crypto.randomUUID();
      const retry: QueueEntry[] = [];
      const retryIds = new Set<string>();
      for (const item of itemsRef.current) {
        if (item.status !== 'error') {
          continue;
        }
        if (itemIds && !itemIds.has(item.id)) {
          continue;
        }
        const file = filesRef.current.get(item.id);
        if (!file) {
          continue;
        }
        retryIds.add(item.id);
        retry.push({ itemId: item.id, file, batchId });
      }
      if (retry.length === 0) {
        return;
      }
      applyItems(
        itemsRef.current.map((item) =>
          retryIds.has(item.id)
            ? { ...item, status: 'uploading', error: undefined, imageId: undefined }
            : item,
        ),
      );
      queueRef.current.push(...retry);
      setVisible(true);
      setExpanded(true);
      void processQueue();
    },
    [applyItems, processQueue],
  );

  const retryFailed = useCallback(() => {
    enqueueRetries();
  }, [enqueueRetries]);

  const retryItem = useCallback(
    (id: string) => {
      enqueueRetries(new Set([id]));
    },
    [enqueueRetries],
  );

  const retryableIds = items
    .filter((item) => item.status === 'error' && filesRef.current.has(item.id))
    .map((item) => item.id);

  return {
    uploadFiles,
    isUploading,
    items,
    retryableIds,
    retryItem,
    retryFailed,
    visible,
    expanded,
    setExpanded,
    dismiss,
    syncFromImages,
  };
}
