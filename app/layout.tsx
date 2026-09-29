import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/components/app-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PortreAI',
  description: 'Upload and validate portrait photos',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-full font-sans antialiased">
        <ClerkProvider
          appearance={{ theme: shadcn }}
          localization={{
            socialButtonsBlockButton: '{{provider|titleize}}',
            signUp: {
              start: {
                title: 'Import, validate, and keep portraits with PortreAI',
                titleCombined:
                  'Import, validate, and keep portraits with PortreAI',
                subtitle: '',
                subtitleCombined: '',
              },
            },
          }}
        >
          <AppProviders>{children}</AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
