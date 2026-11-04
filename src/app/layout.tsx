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
      dir="ltr"
      data-theme="dark"
      className={`${displaySans.variable} ${bodySerif.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('lp_theme') || 'dark';
                let eff = t;
                if (t === 'system') {
                  eff = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', eff);
                if (eff === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
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
