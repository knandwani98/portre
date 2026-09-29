'use client';

import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import type { ImageDto } from '@/lib/shared';
import { useCallback, useRef, useState } from 'react';
import { createApi, isAbortError } from '@/lib/api';
import { removeImagesFromCache, upsertImageInCache } from '@/hooks/use-images';

export type DeleteItemStatus = 'deleting' | 'success' | 'error';

export type DeleteItem = {
  id: string;
  name: string;
  status: DeleteItemStatus;
  error?: string;
};

export function useDeleteQueue() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<DeleteItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const itemsRef = useRef<DeleteItem[]>([]);
  const originalsRef = useRef(new Map<string, ImageDto>());
  const queueRef = useRef<ImageDto[]>([]);
  const runningRef = useRef(false);
  const abortRef = useRef(new AbortController());

  const applyItems = useCallback((next: DeleteItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patchItem = useCallback(
    (id: string, patch: Partial<DeleteItem>) => {
      applyItems(
        itemsRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [applyItems],
  );

  const abortInFlight = useCallback(() => {
    abortRef.current.abort();
    const leftover = queueRef.current;
    queueRef.current = [];
    runningRef.current = false;
    const restoring = new Map<string, ImageDto>();
    for (const image of leftover) {
      restoring.set(image.id, image);
    }
    for (const item of itemsRef.current) {
      if (item.status !== 'deleting') {
        continue;
      }
      const original = originalsRef.current.get(item.id);
      if (original) {
        restoring.set(original.id, original);
      }
    }
    for (const image of restoring.values()) {
      upsertImageInCache(queryClient, image);
    }
    applyItems(itemsRef.current.filter((item) => item.status !== 'deleting'));
  }, [applyItems, queryClient]);

  const processQueue = useCallback(async () => {
    if (runningRef.current) {
      return;
    }
    if (abortRef.current.signal.aborted) {
      abortRef.current = new AbortController();
    }
    runningRef.current = true;
    const api = createApi(() => getToken(), abortRef.current.signal);

    try {
      while (queueRef.current.length > 0) {
        if (abortRef.current.signal.aborted) {
          break;
        }
        const image = queueRef.current.shift();
        if (!image) {
          continue;
        }
        try {
          await api.deleteImage(image.id);
          patchItem(image.id, { status: 'success' });
          removeImagesFromCache(queryClient, [image.id]);
          originalsRef.current.delete(image.id);
        } catch (error) {
          if (isAbortError(error) || abortRef.current.signal.aborted) {
            upsertImageInCache(queryClient, image);
            applyItems(
              itemsRef.current.filter((item) => item.id !== image.id),
            );
            break;
          }
          upsertImageInCache(queryClient, image);
          patchItem(image.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Could not delete',
          });
        }
      }
    } finally {
      runningRef.current = false;
    }
  }, [applyItems, getToken, patchItem, queryClient]);

  const deleteImages = useCallback(
    (images: ImageDto[]) => {
      if (images.length === 0) {
        return;
      }
      const inFlightIds = new Set(
        itemsRef.current
          .filter((item) => item.status === 'deleting')
          .map((item) => item.id),
      );
      const queued = images.filter((image) => !inFlightIds.has(image.id));
      if (queued.length === 0) {
        setVisible(true);
        setExpanded(true);
        return;
      }
      const queuedIds = new Set(queued.map((image) => image.id));
      for (const image of queued) {
        originalsRef.current.set(image.id, image);
      }
      removeImagesFromCache(
        queryClient,
        queued.map((image) => image.id),
      );
      applyItems([
        ...queued.map((image) => ({
          id: image.id,
          name: image.originalName,
          status: 'deleting' as const,
        })),
        ...itemsRef.current.filter((item) => !queuedIds.has(item.id)),
      ]);
      queueRef.current.push(...queued);
      setVisible(true);
      setExpanded(true);
      void processQueue();
    },
    [applyItems, processQueue, queryClient],
  );

  const dismiss = useCallback(() => {
    applyItems(itemsRef.current.filter((item) => item.status === 'deleting'));
    setVisible(false);
  }, [applyItems]);

  const hiddenIds = new Set(
    items
      .filter((item) => item.status === 'deleting' || item.status === 'success')
      .map((item) => item.id),
  );
  const hasInFlight = items.some((item) => item.status === 'deleting');

  return {
    deleteImages,
    items,
    hasInFlight,
    abortInFlight,
    visible,
    expanded,
    setExpanded,
    dismiss,
    hiddenIds,
  };
}
