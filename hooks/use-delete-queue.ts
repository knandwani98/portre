'use client';

import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import type { ImageDto } from '@/lib/shared';
import { useCallback, useRef, useState } from 'react';
import { createApi } from '@/lib/api';

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
  const queueRef = useRef<ImageDto[]>([]);
  const runningRef = useRef(false);

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

  const processQueue = useCallback(async () => {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    const api = createApi(() => getToken());

    try {
      while (queueRef.current.length > 0) {
        const image = queueRef.current.shift();
        if (!image) {
          continue;
        }
        try {
          await api.deleteImage(image.id);
          patchItem(image.id, { status: 'success' });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['images'] }),
            queryClient.invalidateQueries({ queryKey: ['quota'] }),
          ]);
        } catch (error) {
          patchItem(image.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Could not delete',
          });
        }
      }
    } finally {
      runningRef.current = false;
    }
  }, [getToken, patchItem, queryClient]);

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
    [applyItems, processQueue],
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

  return {
    deleteImages,
    items,
    visible,
    expanded,
    setExpanded,
    dismiss,
    hiddenIds,
  };
}
