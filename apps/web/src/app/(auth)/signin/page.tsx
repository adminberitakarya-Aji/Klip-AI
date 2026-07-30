"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@klipai/ui/components/input";
import { Label } from "@klipai/ui/components/label";

/* ─────────────────────────── Left panel stats ─────────────────────────── */
const stats = [
  { value: "10K+", label: "Kreator aktif" },
  { value: "500K+", label: "Video dihasilkan" },
  { value: "98%", label: "Kepuasan pengguna" },
];

const features = [
  "Text-to-Video & Image-to-Video AI",
  "Template profesional siap pakai",
  "Brand Kit personalisasi",
  "Ekspor resolusi 4K",
];

/* ─────────────────────────── Google SVG ────────────────────────────────── */
function GoogleIcon() {
  return (
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
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

/* ─────────────────────────── Spinner ───────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
  );
}

/* ─────────────────────────── Main form component ───────────────────────── */
function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered") === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
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

  const handleOAuth = (provider: string) => {
    setOauthLoading(provider);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex bg-[oklch(0.04_0_0)]">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.08 0.02 260) 0%, oklch(0.06 0.015 230) 40%, oklch(0.05 0.01 210) 100%)",
          }}
        />
        {/* Ambient orbs */}
        <div
          className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.2 205 / 0.5) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.18 55 / 0.6) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "oklch(0.82 0.15 205)" }}
            >
              Klip<span className="text-white">-AI</span>
            </span>
          </Link>
          <p
            className="mt-1 text-[11px] tracking-[0.3em] uppercase"
            style={{ color: "oklch(1 0 0 / 0.3)" }}
          >
            AI Content Studio
          </p>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2
              className="text-4xl font-bold leading-tight text-white"
              style={{ textShadow: "0 0 60px oklch(0.82 0.15 205 / 0.3)" }}
            >
              Buat konten video
              <br />
              <span style={{ color: "oklch(0.82 0.15 205)" }}>
                10× lebih cepat
              </span>
              <br />
              dengan AI
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "oklch(1 0 0 / 0.5)" }}
            >
              Platform AI terdepan untuk kreator konten Indonesia. Dari ide ke
              video profesional dalam hitungan menit.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: "oklch(0.82 0.15 205 / 0.15)",
                    border: "1px solid oklch(0.82 0.15 205 / 0.3)",
                  }}
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l2.5 2.5L10 3.5"
                      stroke="oklch(0.82 0.15 205)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  className="text-sm"
                  style={{ color: "oklch(1 0 0 / 0.65)" }}
                >
                  {f}
                </span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 text-center"
                style={{
                  background: "oklch(1 0 0 / 0.04)",
                  border: "1px solid oklch(1 0 0 / 0.07)",
                }}
              >
                <div
                  className="text-xl font-bold"
                  style={{ color: "oklch(0.82 0.15 205)" }}
                >
                  {s.value}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "oklch(1 0 0 / 0.4)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p
          className="relative z-10 text-xs"
          style={{ color: "oklch(1 0 0 / 0.25)" }}
        >
          © 2025 Klip-AI. Semua hak dilindungi.
        </p>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1">
            <span
              className="text-2xl font-bold"
              style={{ color: "oklch(0.82 0.15 205)" }}
            >
              Klip<span className="text-white">-AI</span>
            </span>
          </Link>
          <p
            className="mt-1 text-[11px] tracking-[0.25em] uppercase"
            style={{ color: "oklch(1 0 0 / 0.3)" }}
          >
            AI Content Studio
          </p>
        </div>

        <div className="w-full max-w-[400px] animate-fade-up">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Selamat datang kembali
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "oklch(1 0 0 / 0.45)" }}
            >
              Masuk untuk melanjutkan sesi kreatif Anda
            </p>
          </div>

          {/* Registered notice */}
          {registered && (
            <div
              className="mb-6 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{
                background: "oklch(0.82 0.15 205 / 0.1)",
                border: "1px solid oklch(0.82 0.15 205 / 0.25)",
                color: "oklch(0.82 0.15 205)",
              }}
            >
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

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { id: "google", label: "Google", icon: <GoogleIcon /> },
              { id: "github", label: "GitHub", icon: <GitHubIcon /> },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleOAuth(id)}
                disabled={!!oauthLoading || isLoading}
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "oklch(1 0 0 / 0.04)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  color: "oklch(1 0 0 / 0.75)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(1 0 0 / 0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(1 0 0 / 0.18)";
                  (e.currentTarget as HTMLButtonElement).style.color = "white";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(1 0 0 / 0.04)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(1 0 0 / 0.1)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(1 0 0 / 0.75)";
                }}
              >
                {oauthLoading === id ? <Spinner /> : icon}
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-6">
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(1 0 0 / 0.08)" }}
            />
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: "oklch(1 0 0 / 0.3)" }}
            >
              atau
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(1 0 0 / 0.08)" }}
            />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "oklch(0.65 0.22 27 / 0.12)",
                  border: "1px solid oklch(0.65 0.22 27 / 0.3)",
                  color: "oklch(0.75 0.2 27)",
                }}
              >
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

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium tracking-wide uppercase"
                style={{ color: "oklch(1 0 0 / 0.55)" }}
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
                className="h-11 w-full rounded-xl text-white placeholder:text-[oklch(1_0_0/0.25)] transition-all"
                style={{
                  background: "oklch(1 0 0 / 0.04)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium tracking-wide uppercase"
                  style={{ color: "oklch(1 0 0 / 0.55)" }}
                >
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-xs transition-colors"
                  style={{ color: "oklch(0.82 0.15 205)" }}
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
                className="h-11 w-full rounded-xl text-white placeholder:text-[oklch(1_0_0/0.25)] transition-all"
                style={{
                  background: "oklch(1 0 0 / 0.04)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-11 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
                color: "oklch(0.05 0 0)",
                boxShadow: "0 4px 24px -8px oklch(0.82 0.15 205 / 0.5)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center opacity-60">
                  <Spinner /> Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p
            className="mt-6 text-center text-sm"
            style={{ color: "oklch(1 0 0 / 0.4)" }}
          >
            Belum punya akun?{" "}
            <Link
              href="/signup"
              className="font-medium transition-colors"
              style={{ color: "oklch(0.82 0.15 205)" }}
            >
              Daftar gratis
            </Link>
          </p>

          <p
            className="mt-8 text-center text-[11px]"
            style={{ color: "oklch(1 0 0 / 0.2)" }}
          >
            Aman &amp; terenkripsi · Tidak ada spam
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[oklch(0.04_0_0)]">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "oklch(0.82 0.15 205)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
