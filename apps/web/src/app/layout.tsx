import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Klip AI - AI Video Generation Platform',
  description: 'Generate stunning videos from text, images, and videos using advanced AI models.',
  keywords: ['AI video', 'text to video', 'image to video', 'video generation', 'generative AI'],
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}