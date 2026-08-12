import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'viralTier.ai — Ranking Videos That Go Viral',
  description:
    'Transform raw video clips into viral ranking-style short videos for YouTube Shorts, TikTok, and Instagram Reels. AI-powered or fully manual.',
  keywords: ['viral video', 'ranking video', 'short video', 'TikTok', 'YouTube Shorts', 'video editor', 'AI video'],
  openGraph: {
    title: 'viralTier.ai',
    description: 'Turn your clips into viral ranking videos in minutes.',
    type: 'website',
    siteName: 'viralTier.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'viralTier.ai',
    description: 'Turn your clips into viral ranking videos in minutes.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
