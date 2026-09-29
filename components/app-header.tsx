'use client';

import { Upload } from 'lucide-react';
import { AuthButtons } from '@/components/auth-buttons';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { useUploadQueueContext } from '@/components/upload/upload-queue-provider';

export function AppHeader() {
  const { remaining, hasAccepted, isReady, isUploading, openImporter } =
    useUploadQueueContext();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <BrandLogo />
        <div className="flex items-center gap-2">
          {isReady && remaining > 0 ? (
            <Button type="button" onClick={openImporter} disabled={isUploading}>
              <Upload />
              {hasAccepted ? 'Upload more' : 'Import photos'}
            </Button>
          ) : null}
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
