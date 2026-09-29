import { AppHeader } from '@/components/app-header';
import { UploadQueueProvider } from '@/components/upload/upload-queue-provider';
import type { ReactNode } from 'react';

export default function GalleryLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <UploadQueueProvider>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </div>
    </UploadQueueProvider>
  );
}
