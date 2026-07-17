"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@klipai/ui/components/button";
import { Card } from "@klipai/ui/components/card";
import { cn } from "@klipai/ui/lib/utils";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  credits: string;
  maxResolution: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
  gradient: string;
  border: string;
  badge?: string;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started with AI video generation.",
    credits: "30 credits/month",
    maxResolution: "720p",
    features: [
      "Text-to-Video generation",
      "Image-to-Video animation",
      "Community models access",
      "Standard queue priority",
      "Watermarked outputs",
      "Personal use license",
    ],
    cta: "Start Free",
    href: "/auth/signup",
    popular: false,
    gradient: "from-neutral-800/40 to-neutral-900/40",
    border: "border-neutral-800",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious creators shipping cinematic content daily.",
    credits: "1,000 credits/month",
    maxResolution: "4K",
    features: [
      "Everything in Free",
      "Video-to-Video transformation",
      "Motion Control (camera paths)",
      "Priority queue (2x faster)",
      "No watermarks",
      "Commercial license",
      "Private generations",
      "API access (beta)",
      "4K upscaling included",
    ],
    cta: "Go Pro",
    href: "/auth/signup?plan=pro",
    popular: true,
    badge: "Most Popular",
    gradient: "from-purple-600/20 via-purple-900/10 to-pink-600/20",
    border: "border-purple-500/40",
  },
  {
    name: "UMKM",
    price: "$99",
    period: "/month",
    description: "For teams & businesses scaling content operations.",
    credits: "5,000 credits/month",
    maxResolution: "4K",
    features: [
      "Everything in Pro",
      "5 team seats included",
      "Custom model fine-tuning",
      "Dedicated GPU priority",
      "SLA & priority support",
      "White-label options",
      "Advanced analytics",
      "SSO/SAML auth",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    href: "/contact?plan=umkm",
    popular: false,
    gradient: "from-cyan-600/20 via-cyan-900/10 to-blue-600/20",
    border: "border-cyan-500/40",
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-pink-600/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-3 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            <span className="text-xs uppercase tracking-widest text-neutral-400">
              Simple pricing
            </span>
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Choose the plan that{" "}
            <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              fits your workflow
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            No credit card required. 30 free credits every month. Upgrade
            anytime for more power, more models, and commercial rights.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <PricingCard plan={plan} />
            </motion.div>
          ))}
        </div>

        {/* Trust footer */}
        <motion.p
          className="text-center text-sm text-neutral-500 mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          All plans include global CDN, secure cloud storage, and access to the
          Klip AI community gallery.
        </motion.p>
      </div>
    </section>
  );
}

function PricingCard({ plan }: { plan: Plan }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden group h-full flex flex-col",
        "bg-gradient-to-br",
        plan.gradient,
        "border-2",
        plan.border,
        "transition-all duration-500",
        plan.popular &&
          "hover:shadow-[0_0_60px_rgba(139,92,246,0.25)] scale-[1.02] lg:scale-105",
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-lg shadow-purple-600/40">
            <Sparkles className="h-3 w-3" />
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-8 relative z-10 flex flex-col h-full">
        {/* Plan name */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
          <p className="text-neutral-400 text-sm leading-relaxed min-h-[40px]">
            {plan.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-6 pb-6 border-b border-white/5">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold text-white">{plan.price}</span>
            <span className="text-neutral-400 text-sm">{plan.period}</span>
          </div>
          <p className="text-sm text-neutral-500 mt-3">{plan.credits}</p>
          <p className="text-sm text-neutral-500 mt-1">
            Max resolution:{" "}
            <span className="text-white font-mono">{plan.maxResolution}</span>
          </p>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm text-neutral-300"
            >
              <Check
                className={cn(
                  "h-5 w-5 flex-shrink-0 mt-0.5",
                  plan.popular ? "text-purple-400" : "text-green-500",
                )}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          size="lg"
          className={cn(
            "w-full gap-2",
            plan.popular
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/30"
              : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
          )}
          asChild
        >
          <Link href={plan.href}>
            {plan.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      {/* Background glow for popular */}
      {plan.popular && (
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
    </Card>
  );
}

export default Pricing;
