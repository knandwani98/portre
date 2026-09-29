'use client';

import { useAuth } from '@clerk/nextjs';
import {
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { ApiError, createApi } from '@/lib/api';
import {
  JOB_POLL_INTERVAL_MS,
  MAX_ACCEPTED_PHOTOS,
  type ImageDto,
  type QuotaDto,
} from '@/lib/shared';

export const IMAGES_QUERY_KEY = ['images'] as const;

const previewUrlCache = new Map<string, string>();

function previewCacheKey(image: ImageDto) {
  return `${image.id}:${image.status}:${image.processedAt ?? ''}`;
}

function withCachedPreview(image: ImageDto): ImageDto {
  const key = previewCacheKey(image);
  const previewUrl = previewUrlCache.get(key) ?? image.previewUrl;
  if (previewUrl) {
    previewUrlCache.set(key, previewUrl);
  }
  return previewUrl === image.previewUrl ? image : { ...image, previewUrl };
}

function reusePreviewUrls(images: ImageDto[]): ImageDto[] {
  return images.map(withCachedPreview);
}

export function quotaFromImages(images: ImageDto[]): QuotaDto {
  let accepted = 0;
  let processing = 0;
  for (const image of images) {
    if (image.status === 'ACCEPTED') {
      accepted += 1;
    } else if (image.status === 'PENDING' || image.status === 'PROCESSING') {
      processing += 1;
    }
  }
  return {
    accepted,
    processing,
    remaining: Math.max(0, MAX_ACCEPTED_PHOTOS - accepted - processing),
  };
}

function isInFlight(image: ImageDto) {
  return image.status === 'PENDING' || image.status === 'PROCESSING';
}

function sameImageRecord(left: ImageDto, right: ImageDto) {
  return (
    left.status === right.status &&
    left.processedAt === right.processedAt &&
    left.rejectionMessage === right.rejectionMessage
  );
}

export function upsertImageInCache(queryClient: QueryClient, image: ImageDto) {
  const nextImage = withCachedPreview(image);
  queryClient.setQueryData<ImageDto[]>(IMAGES_QUERY_KEY, (current = []) => {
    const index = current.findIndex((item) => item.id === nextImage.id);
    if (index === -1) {
      return [nextImage, ...current];
    }
    const prev = current[index];
    if (prev && sameImageRecord(prev, nextImage)) {
      return current;
    }
    const next = [...current];
    next[index] = nextImage;
    return next;
  });
}

export function removeImagesFromCache(
  queryClient: QueryClient,
  ids: Iterable<string>,
) {
  const remove = new Set(ids);
  if (remove.size === 0) {
    return;
  }
  queryClient.setQueryData<ImageDto[]>(IMAGES_QUERY_KEY, (current) => {
    if (!current) {
      return current;
    }
    const next = current.filter((image) => !remove.has(image.id));
    return next.length === current.length ? current : next;
  });
}

export function useImages() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const api = createApi(() => getToken());

  return useQuery({
    queryKey: IMAGES_QUERY_KEY,
    queryFn: async () => {
      const result = await api.listImages();
      return reusePreviewUrls(result.data);
    },
    enabled: isLoaded && Boolean(isSignedIn),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

export function usePollInFlightImages(images: ImageDto[] | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const inFlight = (images ?? []).filter(isInFlight);

  useQueries({
    queries: inFlight.map((image) => ({
      queryKey: ['image', image.id],
      queryFn: async () => {
        try {
          const next = await createApi(() => getToken()).getImage(image.id);
          upsertImageInCache(queryClient, next);
          return next;
        } catch (error) {
          if (
            error instanceof ApiError &&
            (error.status === 404 || error.code === 'NOT_FOUND')
          ) {
            removeImagesFromCache(queryClient, [image.id]);
            return null;
          }
          throw error;
        }
      },
      initialData: image,
      staleTime: JOB_POLL_INTERVAL_MS,
      refetchOnMount: false,
      refetchInterval: (query: { state: { data?: ImageDto | null } }) =>
        query.state.data && isInFlight(query.state.data)
          ? JOB_POLL_INTERVAL_MS
          : false,
    })),
  });
}
