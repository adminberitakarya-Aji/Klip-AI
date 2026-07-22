"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GenerationForm } from "@/components/generate/GenerationForm";
import { Skeleton } from "@klipai/ui/components/skeleton";

export default function GeneratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/signin?callbackUrl=/generate");
    }
  }, [mounted, status, router]);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <h1 className="text-2xl font-bold text-white">Generate Video AI</h1>
          <p className="text-neutral-400 mt-1">
            Buat video cinematic dengan prompt teks atau gambar
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <GenerationForm />
      </div>
    </div>
  );
}
