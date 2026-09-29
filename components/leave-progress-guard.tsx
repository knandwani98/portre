'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ProgressKind = 'upload' | 'delete' | 'both';

type LeaveProgressGuardProps = {
  uploading: boolean;
  deleting: boolean;
  onAbort: () => void;
};

type NavigationInstance = EventTarget & {
  addEventListener(
    type: 'navigate',
    listener: (event: NavigateInterceptEvent) => void,
  ): void;
  removeEventListener(
    type: 'navigate',
    listener: (event: NavigateInterceptEvent) => void,
  ): void;
};

type NavigateInterceptEvent = Event & {
  navigationType?: string;
  canIntercept?: boolean;
  intercept?: (options: { handler: () => Promise<void> }) => void;
};

function getNavigation(): NavigationInstance | null {
  const nav = (window as Window & { navigation?: NavigationInstance }).navigation;
  return nav ?? null;
}

function isReloadKey(event: KeyboardEvent) {
  if (event.key === 'F5') {
    return true;
  }
  const key = event.key.toLowerCase();
  return (event.metaKey || event.ctrlKey) && key === 'r';
}

function copyFor(kind: ProgressKind) {
  if (kind === 'both') {
    return {
      title: 'Leave this page?',
      description:
        'Uploads and deletions are still in progress. Refreshing will cancel them.',
    };
  }
  if (kind === 'delete') {
    return {
      title: 'Leave this page?',
      description:
        'Photo deletion is still in progress. Refreshing will cancel it.',
    };
  }
  return {
    title: 'Leave this page?',
    description: 'Your upload is still in progress. Refreshing will cancel it.',
  };
}

export function LeaveProgressGuard({
  uploading,
  deleting,
  onAbort,
}: LeaveProgressGuardProps) {
  const active = uploading || deleting;
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ProgressKind>('upload');
  const activeRef = useRef(active);
  const uploadingRef = useRef(uploading);
  const deletingRef = useRef(deleting);
  const onAbortRef = useRef(onAbort);
  const allowReloadRef = useRef(false);
  const pendingRef = useRef<Promise<boolean> | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  activeRef.current = active;
  uploadingRef.current = uploading;
  deletingRef.current = deleting;
  onAbortRef.current = onAbort;

  function currentKind(): ProgressKind {
    if (uploadingRef.current && deletingRef.current) {
      return 'both';
    }
    return deletingRef.current ? 'delete' : 'upload';
  }

  function settle(confirmed: boolean) {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    pendingRef.current = null;
    setOpen(false);
    resolve?.(confirmed);
  }

  function askToLeave() {
    if (pendingRef.current) {
      return pendingRef.current;
    }
    setKind(currentKind());
    setOpen(true);
    pendingRef.current = new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
    return pendingRef.current;
  }

  async function confirmAndReload() {
    if (allowReloadRef.current) {
      return;
    }
    allowReloadRef.current = true;
    onAbortRef.current();
    window.location.reload();
  }

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!activeRef.current || allowReloadRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!activeRef.current || allowReloadRef.current || !isReloadKey(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      void (async () => {
        const confirmed = await askToLeave();
        if (confirmed) {
          await confirmAndReload();
        }
      })();
    };

    const onNavigate = (event: NavigateInterceptEvent) => {
      if (!activeRef.current || allowReloadRef.current) {
        return;
      }
      if (event.navigationType !== 'reload' || event.canIntercept === false) {
        return;
      }
      try {
        event.intercept?.({
          handler: async () => {
            const confirmed = await askToLeave();
            if (confirmed) {
              await confirmAndReload();
            }
          },
        });
      } catch {
        // Reload cannot be intercepted; beforeunload handles it.
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('keydown', onKeyDown, true);
    const navigation = getNavigation();
    navigation?.addEventListener('navigate', onNavigate);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('keydown', onKeyDown, true);
      navigation?.removeEventListener('navigate', onNavigate);
    };
  }, []);

  useEffect(() => {
    if (!active && open) {
      settle(false);
    }
  }, [active, open]);

  const copy = copyFor(kind);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          settle(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={() => settle(true)}>
            Cancel and leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
