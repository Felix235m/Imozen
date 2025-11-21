import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TranslationProvider } from '@/components/providers/TranslationProvider';
import { OfflineBanner } from '@/components/ui/offline-banner';
import './globals.css';

export const metadata: Metadata = {
  title: 'ImoZen',
  description: 'Admin Login for ImoZen Real Estate Management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <LanguageProvider>
          <TranslationProvider>
            <OfflineBanner />
            {children}
            <Toaster />
          </TranslationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
