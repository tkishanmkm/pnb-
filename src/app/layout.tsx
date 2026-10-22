
import type { Metadata } from 'next';
import Script from 'next/script';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

export const metadata: Metadata = {
  title: 'PNB Pro',
  description: 'A high-fidelity interactive mobile banking application prototype.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="safari-compatibility-polyfills" strategy="beforeInteractive">{`
          if (typeof Promise.withResolvers !== 'function') {
            Promise.withResolvers = function () {
              var resolve, reject;
              var promise = new Promise(function (res, rej) { resolve = res; reject = rej; });
              return { promise: promise, resolve: resolve, reject: reject };
            };
          }
        `}</Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        {/* Preload critical splash screen images to prevent hydration mismatch */}
        <link rel="preload" href="https://placehold.co/150x150/FFFFFF/9D2536?text=PNB+One" as="image" fetchPriority="high" />
        <link rel="preload" href="https://placehold.co/250x31/FFFFFF/9D2536?text=Punjab+National+Bank" as="image" fetchPriority="high" />
      </head>
      <body className="font-body antialiased">
        <div className="max-w-md mx-auto bg-background">
          <AuthProvider>
              {children}
            <Toaster />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
