import type { Metadata } from 'next';
import { Bricolage_Grotesque, Source_Serif_4 } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { MotionProvider } from '@/components/motion-provider';
import { ToastProvider } from '@/components/ui/toast';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { CookieBanner } from '@/components/cookies/CookieBanner';
import './globals.css';

const displaySans = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800'],
  display: 'swap',
});

const bodySerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Learning Partner — AI Notebooks Grounded in Your Sources',
  description:
    'Free, open alternative to Google NotebookLM. Create notebooks, upload sources, and study with grounded AI citations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${displaySans.variable} ${bodySerif.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-brand-600 selection:text-white">
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
              <MotionProvider>
                {children}
                <CookieBanner />
              </MotionProvider>
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
