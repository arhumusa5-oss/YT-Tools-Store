import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import CustomCursor from '@/components/CustomCursor';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  style: ['italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#060608' },
  ],
};

export const metadata: Metadata = {
  title: 'YT Tools Store | Premium Creator Tools & Subscriptions',
  description: 'Official digital products, YouTube tools, and subscriptions store with instant delivery and replacement warranty.',
  keywords: 'YouTube tools, Canva Pro, VidIQ Boost, ChatGPT Plus, CapCut Pro, YouTube Premium, ElevenLabs, Pakistan digital store',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('yt_theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${fontSans.variable} ${fontSerif.variable} font-sans min-h-screen bg-white dark:bg-[#060608] text-[#1f2937] dark:text-[#e5e7eb] selection:bg-[#660000] selection:text-white antialiased relative transition-colors duration-200`}>
        {/* Geometric Grid Background Pattern */}
        <div className="bg-grid-pattern" />

        {/* Ambient Crimson Glows */}
        <div className="ambient-glow glow-top" />
        <div className="ambient-glow glow-right" />

        {/* Interactive Dual Cursor */}
        <CustomCursor />

        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
