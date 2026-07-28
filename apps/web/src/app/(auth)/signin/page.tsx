"use client";

import { Suspense } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@klipai/ui/components/button";
import { Input } from "@klipai/ui/components/input";
import { Label } from "@klipai/ui/components/label";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered") === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password salah");
      setIsLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[oklch(0.04_0_0)]">
      {/* Ambient background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 80% 10%, oklch(0.4 0.16 210 / 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 90%, oklch(0.78 0.18 55 / 0.12) 0%, transparent 60%)",
        }}
      />

      {/* Animated aurora top */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] z-0 animate-aurora"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.4 0.16 210 / 0.25) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 0.8) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4 py-12 animate-fade-up">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-2xl font-display font-bold tracking-tight text-gradient-brand">
              Klip-AI
            </span>
          </Link>
          <p className="mt-1 text-xs tracking-[0.25em] uppercase text-[oklch(1_0_0/0.35)]">
            AI Content Studio
          </p>
        </div>

        <div
          className="rounded-2xl border border-[oklch(1_0_0/0.08)] bg-[oklch(0.08_0.005_260/0.8)] shadow-[0_20px_60px_-20px_oklch(0_0_0/0.8),inset_0_1px_0_0_oklch(1_0_0/0.06)]"
          style={{ backdropFilter: "blur(20px)" }}
        >
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[oklch(1_0_0/0.06)]">
            <h1 className="text-[1.6rem] font-display font-bold tracking-tight text-white leading-tight">
              Selamat Datang Kembali
            </h1>
            <p className="mt-1.5 text-sm text-[oklch(1_0_0/0.45)]">
              Generate video &amp; gambar AI untuk konten Anda
            </p>
          </div>

          {/* Card Body */}
          <div className="px-8 py-6 space-y-5">
            {/* Registered success notice */}
            {registered && (
              <div className="flex items-center gap-2.5 rounded-xl bg-[oklch(0.82_0.15_205/0.1)] border border-[oklch(0.82_0.15_205/0.25)] px-4 py-3 text-sm text-[oklch(0.82_0.15_205)]">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Akun berhasil dibuat! Silakan masuk.
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                disabled={isLoading}
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] text-sm font-medium text-[oklch(1_0_0/0.75)] hover:bg-[oklch(1_0_0/0.08)] hover:border-[oklch(1_0_0/0.18)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignIn("github")}
                disabled={isLoading}
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] text-sm font-medium text-[oklch(1_0_0/0.75)] hover:bg-[oklch(1_0_0/0.08)] hover:border-[oklch(1_0_0/0.18)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-[oklch(1_0_0/0.08)]" />
              <span className="text-xs uppercase tracking-widest text-[oklch(1_0_0/0.3)]">
                atau
              </span>
              <div className="flex-1 h-px bg-[oklch(1_0_0/0.08)]" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-[oklch(0.65_0.22_27/0.12)] border border-[oklch(0.65_0.22_27/0.3)] px-4 py-3 text-sm text-[oklch(0.75_0.2_27)]">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium tracking-wide text-[oklch(1_0_0/0.55)] uppercase"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@domain.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="h-11 w-full rounded-xl border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] text-white placeholder:text-[oklch(1_0_0/0.25)] focus-visible:border-[oklch(0.82_0.15_205)] focus-visible:ring-[oklch(0.82_0.15_205/0.2)] transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium tracking-wide text-[oklch(1_0_0/0.55)] uppercase"
                  >
                    Password
                  </Label>
                  <Link
                    href="#"
                    className="text-xs text-[oklch(0.82_0.15_205)] hover:text-[oklch(0.9_0.13_205)] transition-colors"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="h-11 w-full rounded-xl border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] text-white placeholder:text-[oklch(1_0_0/0.25)] focus-visible:border-[oklch(0.82_0.15_205)] focus-visible:ring-[oklch(0.82_0.15_205/0.2)] transition-all"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="relative w-full h-11 rounded-xl font-semibold text-sm tracking-wide overflow-hidden transition-all duration-200"
                disabled={isLoading}
                style={{
                  background: isLoading
                    ? "oklch(0.2 0.05 260)"
                    : "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
                  color: "oklch(0.05 0 0)",
                  boxShadow: isLoading
                    ? "none"
                    : "0 4px 24px -8px oklch(0.82 0.15 205 / 0.5)",
                }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center text-[oklch(1_0_0/0.5)]">
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            {/* Sign up link */}
            <div className="pt-4 border-t border-[oklch(1_0_0/0.06)] text-center">
              <p className="text-sm text-[oklch(1_0_0/0.4)]">
                Belum punya akun?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-[oklch(0.82_0.15_205)] hover:text-[oklch(0.9_0.13_205)] transition-colors"
                >
                  Daftar gratis
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] text-[oklch(1_0_0/0.2)]">
          Aman &amp; terenkripsi &bull; Tidak ada spam
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[oklch(0.04_0_0)]">
          <div className="w-8 h-8 rounded-full border-2 border-[oklch(0.82_0.15_205)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
