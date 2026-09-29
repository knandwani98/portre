import { AuthButtons } from '@/components/auth-buttons';
import { BrandLogo } from '@/components/brand-logo';
import type { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="absolute right-4 top-4">
        <AuthButtons />
      </div>
      <BrandLogo size="lg" />
      {children}
    </div>
  );
}
