import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateDetail } from "@/components/templates/TemplateDetail";
import { prisma } from "@klipai/db/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await prisma.storyboardTemplate.findUnique({
    where: { slug },
    select: { name: true, description: true, previewThumbnailUrl: true },
  });

  if (!template) {
    return { title: "Template Tidak Ditemukan" };
  }

  return {
    title: `${template.name} - Klip AI`,
    description: template.description,
    openGraph: {
      title: template.name,
      description: template.description,
      images: template.previewThumbnailUrl
        ? [template.previewThumbnailUrl]
        : [],
    },
  };
}

export default async function TemplatePage({ params }: PageProps) {
  const { slug } = await params;

  const template = await prisma.storyboardTemplate.findUnique({
    where: { slug },
    include: {
      shots: { orderBy: { index: "asc" } },
    },
  });

  if (!template) {
    notFound();
  }

  // Increment usage count
  await prisma.storyboardTemplate.update({
    where: { id: template.id },
    data: { usageCount: { increment: 1 } },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TemplateDetail
          template={{
            ...template,
            industry: template.industry || "Umum",
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
            brandKitSlots:
              (template.brandKitSlots as Record<string, unknown>) ?? {},
            shots: template.shots.map((s: (typeof template.shots)[number]) => ({
              ...s,
              brandKitOverlays:
                (s.brandKitOverlays as Record<string, unknown>) ?? undefined,
              negativePrompt: s.negativePrompt ?? undefined,
              camera: s.camera ?? undefined,
              lighting: s.lighting ?? undefined,
              cameraMotion: s.cameraMotion ?? undefined,
              motionStrength: s.motionStrength ?? undefined,
              createdAt: s.createdAt.toISOString(),
              updatedAt: s.updatedAt.toISOString(),
            })),
          }}
          customizeUrl={`/templates/${slug}/customize`}
          generateUrl={`/templates/${slug}/generate`}
        />
      </div>
    </div>
  );
}
