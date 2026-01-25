import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LARU Nexus Command v7',
  description: 'AI Autonomous Management Fortress',
  manifest: '/manifest.json', // PWA用のマニフェスト指定
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ backgroundColor: '#000', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}