import { AuthHeroPanel } from '@/components/auth-hero-panel';
import { AuthSwitchPrompt } from '@/components/auth-switch-prompt';
import { BrandLogo } from '@/components/brand-logo';
import type { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="auth-split relative min-h-screen">
      <AuthHeroPanel />
      <section className="relative z-10 flex min-h-screen w-full min-w-0 flex-col overflow-hidden bg-[#FEF7E9] md:ml-auto md:w-1/2">
        <div className="absolute inset-x-0 top-0 z-10 px-5 py-5 md:px-6">
          <BrandLogo size="sm" />
        </div>
        <div className="flex w-full flex-1 items-center justify-center px-4 py-24">
          <div className="mx-auto w-full max-w-[480px]">
            {children}
            <AuthSwitchPrompt />
          </div>
        </div>
      </section>
    </div>
  );
}
