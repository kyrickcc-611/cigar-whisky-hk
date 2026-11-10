import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { VerifyEmailBanner } from '@/components/auth/VerifyEmailBanner';
import { AuthProvider } from '@/context/AuthProvider';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME}｜香港雪茄吧・威士忌吧發現平台`,
    template: `%s｜${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    '雪茄吧',
    '威士忌吧',
    '香港酒吧',
    'Cigar Bar Hong Kong',
    'Whisky Bar Hong Kong',
    '中環酒吧',
    '尖沙咀酒吧',
  ],
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'zh_HK',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0a0d',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant-HK">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AuthProvider>
          <SiteHeader />
          <VerifyEmailBanner />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}

