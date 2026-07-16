import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Klip AI API',
  description: 'API for Klip AI - AI Video Generation Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}