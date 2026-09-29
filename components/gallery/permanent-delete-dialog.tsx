'use client';

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

type PermanentDeleteDialogProps = {
  open: boolean;
  count?: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function PermanentDeleteDialog({
  open,
  count = 1,
  onOpenChange,
  onConfirm,
}: PermanentDeleteDialogProps) {
  const multiple = count > 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {multiple ? `Delete ${count} photos permanently?` : 'Delete permanently?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {multiple
              ? `This will permanently delete ${count} photos and we can't recover them.`
              : "This will delete permanently and we can't recover that."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
