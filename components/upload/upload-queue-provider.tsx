'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ImporterDialog } from '@/components/upload/importer-dialog';
import { quotaFromImages, useImages, usePollInFlightImages } from '@/hooks/use-images';
import { useUploadQueue } from '@/hooks/use-upload-queue';

type UploadQueueContextValue = ReturnType<typeof useUploadQueue> & {
  remaining: number;
  hasAccepted: boolean;
  isReady: boolean;
  openImporter: () => void;
};

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const queue = useUploadQueue();
  const imagesQuery = useImages();
  usePollInFlightImages(imagesQuery.data);
  const [importerOpen, setImporterOpen] = useState(false);
  const remaining = imagesQuery.data
    ? quotaFromImages(imagesQuery.data).remaining
    : 0;
  const hasAccepted = (imagesQuery.data ?? []).some(
    (image) => image.status === 'ACCEPTED',
  );
  const isReady = !imagesQuery.isLoading;

  const value = useMemo(
    () => ({
      ...queue,
      remaining,
      hasAccepted,
      isReady,
      openImporter: () => setImporterOpen(true),
    }),
    [hasAccepted, isReady, queue, remaining],
  );

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
      <ImporterDialog
        open={importerOpen}
        remaining={remaining}
        onOpenChange={setImporterOpen}
        onUpload={queue.uploadFiles}
      />
    </UploadQueueContext.Provider>
  );
}

export function useUploadQueueContext() {
  const context = useContext(UploadQueueContext);
  if (!context) {
    throw new Error('useUploadQueueContext must be used within UploadQueueProvider');
  }
  return context;
}
