'use client';

import { motion } from 'framer-motion';
import { 
  Zap, 
  Image, 
  Video, 
  SlidersHorizontal,
  Sparkles,
  Layers,
  Cpu,
  Globe
} from 'lucide-react';
import { Card } from '@klipai/ui/components/card';
import { Button } from '@klipai/ui/components/button';

const features = [
  {
    icon: Zap,
    title: 'Text to Video',
    description: 'Generate cinematic videos from text prompts. Describe your vision and watch it come to life with physics-aware motion.',
    badge: 'T2V',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Image,
    title: 'Image to Video',
    description: 'Animate static images with natural motion. Upload any image and control camera movement, character animation, and scene dynamics.',
    badge: 'I2V',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Video,
    title: 'Video to Video',
    description: 'Transform existing videos with style transfer, motion editing, and resolution upscaling. Maintain temporal consistency.',
    badge: 'V2V',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: SlidersHorizontal,
    title: 'Motion Control',
    description: 'Precise control over camera trajectories, object motion, and physics parameters. Keyframe your vision frame by frame.',
    badge: 'CTRL',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Sparkles,
    title: 'Text to Image',
    description: 'Generate stunning reference images with photorealistic quality. Perfect for storyboarding and concept art.',
    badge: 'T2I',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Layers,
    title: 'Image to Image',
    description: 'Edit and transform images with natural language. Inpaint, outpaint, and style transfer with pixel-perfect precision.',
    badge: 'I2I',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Cpu,
    title: 'Multi-Model Pipeline',
    description: 'Access SOTA models: SVD, Stable Video Diffusion, AnimateDiff, Gen-2, Pika, Runway. Auto-select optimal model per task.',
    badge: 'MULTI',
    gradient: 'from-slate-500 to-blue-500',
  },
  {
    icon: Globe,
    title: 'Global CDN Delivery',
    description: 'Generated content delivered via edge network. Stream 4K videos instantly. Share with signed URLs and access controls.',
    badge: 'CDN',
    gradient: 'from-green-500 to-emerald-500',
  },
];

export function Features() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="eyebrow-rule inline-flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-widest text-neutral-400">Capabilities</span>
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              create cinematic AI video
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Eight powerful generation modes powered by state-of-the-art models. 
            From text-to-video to precision motion control—all in one unified workflow.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <FeatureCard feature={feature} index={index} />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button 
            size="lg" 
            className="gap-2 px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-600/25"
            asChild
          >
            <a href="/generate">
              <Sparkles className="h-5 w-5" />
              Start Creating Free
              <Zap className="h-5 w-5" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const Icon = feature.icon;
  const delay = index * 0.05;

  return (
    <Card className="group relative overflow-hidden bg-neutral-950/50 border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-500 glass">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
        style={{ background: `linear-gradient(135deg, ${feature.gradient.replace('from-', '').replace('to-', '')} 0%, transparent 70%)` }} />
      
      <div className="relative p-6 h-full flex flex-col">
        {/* Icon */}
        <motion.div
          className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{ background: `linear-gradient(135deg, ${feature.gradient})` }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay }}
        >
          <Icon className="h-7 w-7 text-white" />
        </motion.div>

        {/* Badge */}
        <span className="mb-4 inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-white/5 border border-white/10 text-neutral-300">
          {feature.badge}
        </span>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r" 
          style={{ background: feature.gradient }}>
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-neutral-400 leading-relaxed flex-1">
          {feature.description}
        </p>
      </div>
    </Card>
  );
}