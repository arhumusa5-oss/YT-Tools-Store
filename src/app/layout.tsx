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
  metadataBase: new URL('https://yt-tools-store.vercel.app'),
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
  openGraph: {
    title: 'YT Tools Store | Premium Creator Tools & Subscriptions',
    description: 'Official digital products, YouTube tools, and subscriptions store with instant delivery and replacement warranty.',
    url: 'https://yt-tools-store.vercel.app',
    siteName: 'YT Tools Store',
    images: [
      {
        url: '/og-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'YT Tools Store - Premium Creator Tools & Subscriptions',
        type: 'image/jpeg',
      },
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'YT Tools Store - Premium Creator Tools & Subscriptions',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YT Tools Store | Premium Creator Tools & Subscriptions',
    description: 'Official digital products, YouTube tools, and subscriptions store with instant delivery and replacement warranty.',
    images: ['/og-banner.jpg'],
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
        {/* Explicit Open Graph / WhatsApp link preview meta tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="YT Tools Store" />
        <meta property="og:title" content="YT Tools Store | Premium Creator Tools & Subscriptions" />
        <meta property="og:description" content="Official digital products, YouTube tools, and subscriptions store with instant delivery and replacement warranty." />
        <meta property="og:image" content="https://yt-tools-store.vercel.app/og-banner.jpg" />
        <meta property="og:image:secure_url" content="https://yt-tools-store.vercel.app/og-banner.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://yt-tools-store.vercel.app/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YT Tools Store | Premium Creator Tools & Subscriptions" />
        <meta name="twitter:description" content="Official digital products, YouTube tools, and subscriptions store with instant delivery and replacement warranty." />
        <meta name="twitter:image" content="https://yt-tools-store.vercel.app/og-banner.jpg" />
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

                // Anti-drag & text selection protection (Nexcore style)
                document.addEventListener('selectstart', function(e) {
                  var t = e.target;
                  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable || (t.closest && t.closest('.selectable, .allow-select')))) {
                    return true;
                  }
                  e.preventDefault();
                  return false;
                });

                document.addEventListener('dragstart', function(e) {
                  var t = e.target;
                  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
                    return true;
                  }
                  e.preventDefault();
                  return false;
                });
              })();
            `,
          }}
        />
      </head>
      <body className={`${fontSans.variable} ${fontSerif.variable} font-sans min-h-screen bg-white dark:bg-[#060608] text-[#1f2937] dark:text-[#e5e7eb] antialiased relative transition-colors duration-200 select-none`}>
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
