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
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: "oklch(0.04 0 0)" }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 10%, oklch(0.4 0.16 210 / 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <GenerationForm />
      </div>
    </div>
  );
}
