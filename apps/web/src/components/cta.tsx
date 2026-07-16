'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, Globe, Users } from 'lucide-react';
import { Button } from '@klipai/ui/components/button';
import { Card } from '@klipai/ui/components/card';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    credits: '30 credits/month',
    maxResolution: '720p',
    features: [
      'Text-to-Video generation',
      'Image-to-Video animation',
      'Community models access',
      'Standard queue priority',
      'Watermarked outputs',
      'Personal use license',
    ],
    cta: 'Start Free',
    popular: false,
    gradient: 'from-neutral-800 to-neutral-900',
    border: 'border-neutral-800',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For serious creators',
    credits: '1,000 credits/month',
    maxResolution: '4K',
    features: [
      'Everything in Free',
      'Video-to-Video transformation',
      'Motion Control (camera paths)',
      'Priority queue (2x faster)',
      'No watermarks',
      'Commercial license',
      'Private generations',
      'API access (beta)',
      '4K upscaling included',
    ],
    cta: 'Go Pro',
    popular: true,
    gradient: 'from-purple-600/20 via-purple-900/10 to-pink-600/20',
    border: 'border-purple-500/30',
  },
  {
    name: 'UMKM',
    price: '$99',
    period: '/month',
    description: 'For teams & businesses',
    credits: '5,000 credits/month',
    maxResolution: '4K',
    features: [
      'Everything in Pro',
      '5 team seats included',
      'Custom model fine-tuning',
      'Dedicated GPU priority',
      'SLA & priority support',
      'White-label options',
      'Advanced analytics',
      'SSO/SAML auth',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: 'from-cyan-600/20 via-cyan-900/10 to-blue-600/20',
    border: 'border-cyan-500/30',
  },
];

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-pink-600/10" />
      
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
            <span className="text-xs uppercase tracking-widest text-neutral-400">Choose your plan</span>
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Start creating{' '}
            <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              today
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            No credit card required. 30 free credits every month. Upgrade anytime for more power.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <PricingCard plan={plan} />
            </motion.div>
          ))}
        </motion.div>

        {/* Features Comparison */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why creators choose Klip AI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'Multi-Model Pipeline', desc: 'Access SVD, Gen-2, AnimateDiff, MotionCtrl & more in one place' },
              { icon: Zap, title: 'Lightning Fast', desc: 'Dedicated GPU clusters with priority queue for Pro/UMKM plans' },
              { icon: Shield, title: 'Commercial Ready', desc: 'Full commercial license, no watermarks, private generations' },
              { icon: Globe, title: 'Global CDN', desc: 'Instant delivery worldwide with edge caching' },
              { icon: Users, title: 'Team Workspaces', desc: 'Collaborate with shared credits, projects & templates' },
              { icon: ArrowRight, title: 'API & Integrations', desc: 'REST API, webhooks, Zapier, ComfyUI nodes' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group p-6 rounded-2xl bg-neutral-950/50 border border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + i * 0.08 }}
              >
                <div className="p-3 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PricingCard({ plan }: { plan: typeof plans[0] }) {
  return (
    <Card 
      className={`relative overflow-hidden group ${plan.gradient} ${plan.border} transition-all duration-500 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]`}
    >
      {plan.popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full">
          Most Popular
        </div>
      )}

      <div className="p-8 relative z-10 flex flex-col h-full">
        {/* Plan Name */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
          <p className="text-neutral-400 text-sm">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold text-white">{plan.price}</span>
            <span className="text-neutral-400">{plan.period}</span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">{plan.credits}</p>
          <p className="text-sm text-neutral-500">Max resolution: <span className="text-white font-mono">{plan.maxResolution}</span></p>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-neutral-300">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          size="lg"
          className="w-full gap-2"
          variant={plan.popular ? 'default' : 'outline'}
          asChild
        >
          <a href={plan.popular ? '/pricing?plan=pro' : '/auth/signup'}>
            {plan.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </Button>
      </div>

      {/* Background glow for popular */}
      {plan.popular && (
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
    </Card>
  );
}