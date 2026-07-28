"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@klipai/ui/components/button";
import { Input } from "@klipai/ui/components/input";
import { Label } from "@klipai/ui/components/label";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registrasi gagal");
        setIsLoading(false);
        return;
      }

      router.push("/signin?registered=true");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[oklch(0.04_0_0)]">
      {/* Ambient background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 10%, oklch(0.4 0.16 210 / 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 90%, oklch(0.78 0.18 55 / 0.12) 0%, transparent 60%)",
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
              Buat Akun Baru
            </h1>
            <p className="mt-1.5 text-sm text-[oklch(1_0_0/0.45)]">
              Generate video &amp; gambar AI untuk konten Anda
            </p>
          </div>

          {/* Card Body */}
          <div className="px-8 py-6 space-y-5">
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

              {/* Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium tracking-wide text-[oklch(1_0_0/0.55)] uppercase"
                >
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className="h-11 w-full rounded-xl border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] text-white placeholder:text-[oklch(1_0_0/0.25)] focus-visible:border-[oklch(0.82_0.15_205)] focus-visible:ring-[oklch(0.82_0.15_205/0.2)] transition-all"
                  />
                </div>
              </div>

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
                <Label
                  htmlFor="password"
                  className="text-xs font-medium tracking-wide text-[oklch(1_0_0/0.55)] uppercase"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="h-11 w-full rounded-xl border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] text-white placeholder:text-[oklch(1_0_0/0.25)] focus-visible:border-[oklch(0.82_0.15_205)] focus-visible:ring-[oklch(0.82_0.15_205/0.2)] transition-all"
                />
                <p className="text-[11px] text-[oklch(1_0_0/0.3)]">
                  Minimal 8 karakter
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-medium tracking-wide text-[oklch(1_0_0/0.55)] uppercase"
                >
                  Konfirmasi Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  disabled={isLoading}
                  className="h-11 w-full rounded-xl border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] text-white placeholder:text-[oklch(1_0_0/0.25)] focus-visible:border-[oklch(0.82_0.15_205)] focus-visible:ring-[oklch(0.82_0.15_205/0.2)] transition-all"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="relative w-full h-11 rounded-xl font-semibold text-sm tracking-wide overflow-hidden transition-all duration-200 group"
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
                    Mendaftar...
                  </span>
                ) : (
                  "Buat Akun"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="pt-4 border-t border-[oklch(1_0_0/0.06)] text-center">
              <p className="text-sm text-[oklch(1_0_0/0.4)]">
                Sudah punya akun?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-[oklch(0.82_0.15_205)] hover:text-[oklch(0.9_0.13_205)] transition-colors"
                >
                  Masuk sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] text-[oklch(1_0_0/0.2)]">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link
            href="#"
            className="underline hover:text-[oklch(1_0_0/0.5)] transition-colors"
          >
            Syarat &amp; Ketentuan
          </Link>{" "}
          kami.
        </p>
      </div>
    </div>
  );
}
