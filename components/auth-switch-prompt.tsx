'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AuthSwitchPrompt() {
  const pathname = usePathname();
  const isSignUp = pathname.startsWith('/sign-up');

  if (isSignUp) {
    return (
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    );
  }

  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Don&apos;t have an account?{' '}
      <Link
        href="/sign-up"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        Create one
      </Link>
    </p>
  );
}
