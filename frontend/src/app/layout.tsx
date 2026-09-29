import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gomail.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'GoMAil — Plan. Deliver. Observe.',
    template: '%s · GoMAil',
  },
  description:
    'GoMAil is a production-grade email campaign orchestration and delivery platform. Built on transactional outbox guarantees, BullMQ distributed queues, and deterministic SHA-256 idempotency.',
  keywords: ['email campaigns', 'email delivery', 'campaign management', 'email orchestration', 'BullMQ', 'transactional outbox'],
  authors: [{ name: 'GoMAil' }],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    siteName: 'GoMAil',
    title: 'GoMAil — Plan. Deliver. Observe.',
    description: 'Production-grade email campaign orchestration and delivery platform. Real data, real analytics, zero fabricated metrics.',
    url: SITE_URL,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GoMAil — Plan. Deliver. Observe. Email campaign orchestration pipeline diagram.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoMAil — Plan. Deliver. Observe.',
    description: 'Production-grade email campaign orchestration and delivery platform.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-icon.jpg', type: 'image/jpeg', sizes: '512x512' },
    ],
    apple: '/favicon-icon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
