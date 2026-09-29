'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { createApi } from '@/lib/api';
import type { ImageDto } from '@/lib/shared';

const previewUrlCache = new Map<string, string>();

function previewCacheKey(image: ImageDto) {
  return `${image.id}:${image.status}:${image.processedAt ?? ''}`;
}

function reusePreviewUrls(images: ImageDto[]): ImageDto[] {
  const next = new Map<string, string>();
  const result = images.map((image) => {
    const key = previewCacheKey(image);
    const previewUrl = previewUrlCache.get(key) ?? image.previewUrl;
    if (previewUrl) {
      next.set(key, previewUrl);
    }
    return previewUrl === image.previewUrl ? image : { ...image, previewUrl };
  });
  previewUrlCache.clear();
  for (const [key, url] of next) {
    previewUrlCache.set(key, url);
  }
  return result;
}

export function useImages() {
  const { getToken } = useAuth();
  const api = createApi(() => getToken());

  return useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      const result = await api.listImages();
      return reusePreviewUrls(result.data);
    },
    refetchInterval: (query) => {
      const images = query.state.data;
      if (images?.some((image) => image.status === 'PROCESSING')) {
        return 1500;
      }
      return false;
    },
  });
}

export function useQuota() {
  const { getToken } = useAuth();
  const api = createApi(() => getToken());

  return useQuery({
    queryKey: ['quota'],
    queryFn: () => api.getQuota(),
    refetchInterval: (query) => {
      if ((query.state.data?.processing ?? 0) > 0) {
        return 1500;
      }
      return false;
    },
  });
}
