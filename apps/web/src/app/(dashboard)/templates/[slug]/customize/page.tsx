import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateCustomize } from "@/components/templates/TemplateCustomize";
import { prisma } from "@klipai/db/client";
import { auth } from "@/lib/auth";

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
    title: `Kustomisasi ${template.name} - Klip AI`,
    description: template.description,
    openGraph: {
      title: `Kustomisasi ${template.name}`,
      description: template.description,
      images: template.previewThumbnailUrl
        ? [template.previewThumbnailUrl]
        : [],
    },
  };
}

export default async function TemplateCustomizePage({ params }: PageProps) {
  const { slug } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  const template = await prisma.storyboardTemplate.findUnique({
    where: { slug },
    include: {
      shots: { orderBy: { index: "asc" } },
    },
  });

  if (!template) {
    notFound();
  }

  // Get user's brand kits
  const brandKits = userId
    ? await prisma.brandKit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Get user credits
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TemplateCustomize
        template={{
          ...template,
          brandKitSlots: template.brandKitSlots as any,
          shots: template.shots.map((s) => ({
            ...s,
            brandKitOverlays: s.brandKitOverlays as any,
            negativePrompt: s.negativePrompt ?? undefined,
            camera: s.camera ?? undefined,
            lighting: s.lighting ?? undefined,
            cameraMotion: s.cameraMotion ?? undefined,
            motionStrength: s.motionStrength ?? undefined,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          createdAt: template.createdAt.toISOString(),
        }}
        brandKits={brandKits.map((bk) => ({
          ...bk,
          colorPalette: bk.colorPalette as string[],
          textValues: ((bk as any).textValues as Record<string, string>) || {},
        }))}
        userCredits={user?.credits || 0}
      />
    </div>
  );
}
