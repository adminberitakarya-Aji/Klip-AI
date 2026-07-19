import { TemplateBrowser } from "@/components/templates/TemplateBrowser";

export const metadata = {
  title: "Template Video - Klip AI",
  description:
    "Jelajahi template video siap pakai untuk UMKM Indonesia. Reels, TikTok, Shorts, dan lebih banyak lagi.",
};

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TemplateBrowser />
      </div>
    </div>
  );
}
