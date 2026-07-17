import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://klip-ai.com"),
  title: {
    default: "Klip AI — Cinematic AI Video Generation Platform",
    template: "%s | Klip AI",
  },
  description:
    "Generate stunning cinematic videos from text, images, and videos using state-of-the-art AI models. Text-to-Video, Image-to-Video, Motion Control, and more — all in one unified workflow.",
  keywords: [
    "AI video",
    "text to video",
    "image to video",
    "video generation",
    "generative AI",
    "SVD",
    "Gen-2",
    "Motion Control",
    "Klip AI",
  ],
  authors: [{ name: "Klip AI" }],
  creator: "Klip AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://klip-ai.com",
    title: "Klip AI — Cinematic AI Video Generation Platform",
    description:
      "Generate cinematic AI videos from text, images, and videos in seconds.",
    siteName: "Klip AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klip AI — Cinematic AI Video Generation",
    description: "Generate cinematic AI videos in seconds.",
    creator: "@klip_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-black text-white font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
