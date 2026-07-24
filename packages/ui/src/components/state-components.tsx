"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card } from "./card";
import { Loader2, AlertCircle, RefreshCw, Home } from "lucide-react";

/**
 * Loading state for full page
 */
export function PageLoading({
  message = "Memuat...",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4",
        className,
      )}
    >
      <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      <p className="text-neutral-400">{message}</p>
    </div>
  );
}

/**
 * Loading state for cards/sections with skeleton
 */
export function CardLoadingSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6 bg-neutral-900/50 border-neutral-800", className)}>
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-neutral-800 animate-pulse" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-neutral-800 rounded animate-pulse" />
            <div className="w-24 h-3 bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-neutral-800 rounded animate-pulse" />
          <div className="w-3/4 h-3 bg-neutral-800 rounded animate-pulse" />
          <div className="w-1/2 h-3 bg-neutral-800 rounded animate-pulse" />
        </div>
        {/* Button skeleton */}
        <div className="w-full h-10 bg-neutral-800 rounded animate-pulse mt-4" />
      </div>
    </Card>
  );
}

/**
 * Loading skeleton for multiple cards (e.g., package list)
 */
export function CardsLoadingSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardLoadingSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Transaction item skeleton
 */
export function TransactionLoadingSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={cn("p-4 bg-neutral-900/50 border-neutral-800", className)}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-neutral-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="w-48 h-4 bg-neutral-800 rounded animate-pulse" />
          <div className="w-32 h-3 bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="w-16 h-6 bg-neutral-800 rounded animate-pulse" />
      </div>
    </Card>
  );
}

/**
 * Transaction list loading skeleton
 */
export function TransactionListLoadingSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <TransactionLoadingSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Error state with retry button
 */
export function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Mohon maaf, terjadi kesalahan. Silakan coba lagi.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "p-8 text-center bg-neutral-900/50 border-neutral-800",
        className,
      )}
    >
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-neutral-400 mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      )}
    </Card>
  );
}

/**
 * Error state with back to home and retry options
 * Note: Uses window.location for navigation to avoid next/navigation dependency in ui package
 */
export function ErrorStateWithHome({
  title = "Terjadi Kesalahan",
  message = "Mohon maaf, terjadi kesalahan.",
  className,
}: {
  title?: string;
  message?: string;
  className?: string;
}) {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Card
      className={cn(
        "p-8 text-center bg-neutral-900/50 border-neutral-800",
        className,
      )}
    >
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-neutral-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={handleGoHome} variant="outline" className="gap-2">
          <Home className="h-4 w-4" />
          Kembali ke Beranda
        </Button>
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </Card>
  );
}

/**
 * Inline error message (for forms, small sections)
 */
export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-2 text-red-400 text-sm", className)}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 text-purple-400 hover:text-purple-300 underline"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}

/**
 * Empty state with illustration and action
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "p-12 text-center bg-neutral-900/50 border-neutral-800",
        className,
      )}
    >
      <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-neutral-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-neutral-400 mb-6 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </Card>
  );
}
