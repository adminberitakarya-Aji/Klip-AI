"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Coins,
  Check,
  CreditCard,
  Smartphone,
  Building2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@klipai/ui/components/button";
import { Card } from "@klipai/ui/components/card";
import { cn } from "@klipai/ui/lib/utils";
import {
  ErrorState,
  CardsLoadingSkeleton,
} from "@klipai/ui/components/state-components";

interface CreditPackage {
  id: string;
  name: string;
  slug: string;
  credits: number;
  priceIdr: number;
  description: string | null;
  isActive: boolean;
  isPopular: boolean;
}

type PurchaseStep =
  "select" | "payment" | "processing" | "pending" | "success" | "error";

// Extend Window type for Midtrans Snap
declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export function CreditPurchase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [state, setState] = useState<PurchaseState>({
    step: "select",
    selectedPackage: null,
    snapToken: null,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch packages on mount
  useEffect(() => {
    async function fetchPackages() {
      try {
        const response = await fetch("/api/credits/packages");
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        if (data.success) {
          setPackages(data.data.filter((pkg: CreditPackage) => pkg.isActive));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  // Check for pre-selected package from URL
  useEffect(() => {
    const packageSlug = searchParams.get("package");
    if (packageSlug && packages.length > 0) {
      const pkg = packages.find((p) => p.slug === packageSlug);
      if (pkg) {
        setState((prev) => ({
          ...prev,
          step: "payment",
          selectedPackage: pkg,
        }));
      }
    }
  }, [searchParams, packages]);

  const handleSelectPackage = (pkg: CreditPackage) => {
    setState({
      step: "payment",
      selectedPackage: pkg,
      snapToken: null,
      error: null,
    });
  };

  const handleInitiatePayment = async () => {
    if (!state.selectedPackage) return;

    setState((prev) => ({ ...prev, step: "processing" }));

    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: state.selectedPackage!.id }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Payment initiation failed");
      }

      // Redirect to Midtrans Snap
      if (data.data.snapToken) {
        const snapToken = data.data.snapToken;
        if (window.snap) {
          window.snap.pay(snapToken, {
            onSuccess: () => {
              setState((prev) => ({ ...prev, step: "success" }));
            },
            onPending: () => {
              // User has initiated payment but it's pending confirmation
              // Don't mark as success yet - wait for webhook confirmation
              setState((prev) => ({ ...prev, step: "pending" }));
            },
            onError: () => {
              setState((prev) => ({
                ...prev,
                step: "error",
                error: "Pembayaran gagal. Silakan coba lagi.",
              }));
            },
            onClose: () => {
              // User closed the popup without completing payment
              // Go back to payment selection, don't assume success
              setState((prev) => ({ ...prev, step: "payment" }));
            },
          });
        } else {
          // Fallback: redirect to payment URL
          if (data.data.paymentUrl) {
            window.location.href = data.data.paymentUrl;
          }
        }
      } else if (data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        step: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  };

  const handleBack = () => {
    setState({
      step: "select",
      selectedPackage: null,
      snapToken: null,
      error: null,
    });
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-fetch packages
    fetch("/api/credits/packages")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPackages(data.data.filter((pkg: CreditPackage) => pkg.isActive));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Loading state for packages
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-48 h-8 bg-neutral-800 rounded animate-pulse mx-auto mb-2" />
          <div className="w-64 h-4 bg-neutral-800 rounded animate-pulse mx-auto" />
        </div>
        <CardsLoadingSkeleton count={4} />
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState
          title="Gagal Memuat Paket"
          message={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Payment error state
  if (state.step === "error") {
    return (
      <div className="max-w-md mx-auto">
        <ErrorState
          title="Pembayaran Gagal"
          message={state.error || "Terjadi kesalahan saat memproses pembayaran"}
          onRetry={() => {
            setState((prev) => ({ ...prev, step: "payment", error: null }));
          }}
        />
      </div>
    );
  }

  // Success state
  if (state.step === "success") {
    return (
      <Card className="p-8 text-center bg-neutral-900/50 border-green-500/30">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Pembayaran Berhasil!
        </h3>
        <p className="text-neutral-400 mb-6">
          Credits Anda akan segera bertambah setelah konfirmasi dari Midtrans.
          <br />
          Halaman ini akan otomatis ter-update.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/")} variant="outline">
            Kembali ke Beranda
          </Button>
          <Button onClick={() => router.refresh()}>Cek Saldo</Button>
        </div>
      </Card>
    );
  }

  // Processing state
  if (state.step === "processing") {
    return (
      <Card className="p-12 text-center bg-neutral-900/50 border-neutral-800">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          Memproses Pembayaran...
        </h3>
        <p className="text-neutral-400">
          Mohon tunggu, Anda akan diarahkan ke halaman pembayaran Midtrans.
        </p>
      </Card>
    );
  }

  // Pending state - payment initiated but not yet confirmed
  if (state.step === "pending") {
    return (
      <Card className="p-8 text-center bg-neutral-900/50 border-yellow-500/30">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Pembayaran Pending
        </h3>
        <p className="text-neutral-400 mb-6">
          Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran dan
          tunggu konfirmasi dari Midtrans.
          <br />
          <span className="text-sm text-neutral-500">
            Halaman ini akan otomatis ter-update setelah pembayaran
            dikonfirmasi.
          </span>
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/")} variant="outline">
            Kembali ke Beranda
          </Button>
          <Button onClick={() => router.refresh()}>
            Cek Status Pembayaran
          </Button>
        </div>
      </Card>
    );
  }

  // Payment confirmation state
  if (state.step === "payment" && state.selectedPackage) {
    return (
      <Card className="p-6 bg-neutral-900/50 border-purple-500/30">
        <Button variant="ghost" onClick={handleBack} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            Konfirmasi Pembelian
          </h3>
          <p className="text-neutral-400">
            Pastikan paket yang Anda pilih sudah benar
          </p>
        </div>

        {/* Selected package summary */}
        <div className="bg-purple-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Coins className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  {state.selectedPackage.name}
                </p>
                <p className="text-sm text-neutral-400">
                  {state.selectedPackage.credits.toLocaleString()} credits
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {formatPrice(state.selectedPackage.priceIdr)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-neutral-400 mb-3">
            Metode Pembayaran
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PaymentMethodButton
              icon={CreditCard}
              label="Credit Card"
              selected
            />
            <PaymentMethodButton icon={Smartphone} label="E-Wallet" />
            <PaymentMethodButton icon={Building2} label="Virtual Account" />
            <PaymentMethodButton icon={CreditCard} label="QRIS" />
          </div>
        </div>

        {/* Pay button */}
        <Button
          onClick={handleInitiatePayment}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          size="lg"
        >
          Bayar {formatPrice(state.selectedPackage.priceIdr)}
        </Button>

        <p className="text-xs text-neutral-500 text-center mt-4">
          Pembayaran aman diproses oleh Midtrans. Credits akan bertambah setelah
          pembayaran berhasil.
        </p>
      </Card>
    );
  }

  // Default: Select package
  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          Pilih Paket Credits
        </h3>
        <p className="text-neutral-400">
          Credits tidak pernah kadaluarsa. Top-up kapan saja.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={cn(
              "p-6 cursor-pointer transition-all duration-300 relative",
              "hover:scale-[1.02] hover:border-purple-500/50",
              pkg.isPopular
                ? "bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/40"
                : "bg-neutral-900/50 border-neutral-800",
            )}
            onClick={() => handleSelectPackage(pkg)}
          >
            {pkg.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                Popular
              </span>
            )}

            <div className="mb-4">
              <h4 className="font-bold text-white">{pkg.name}</h4>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-white">
                  {formatPrice(pkg.priceIdr)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Coins className="h-4 w-4 text-purple-400" />
              <span className="text-lg font-semibold text-white">
                {pkg.credits.toLocaleString()}
              </span>
              <span className="text-neutral-400">credits</span>
            </div>

            {pkg.priceIdr > 0 && (
              <p className="text-sm text-neutral-500">
                {Math.ceil(pkg.priceIdr / pkg.credits).toLocaleString("id-ID")}
                /credit
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function PaymentMethodButton({
  icon: Icon,
  label,
  selected,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
        selected
          ? "bg-purple-500/20 border-purple-500 text-white"
          : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default CreditPurchase;

// Internal type for state management
interface PurchaseState {
  step: PurchaseStep;
  selectedPackage: CreditPackage | null;
  snapToken: string | null;
  error: string | null;
}
