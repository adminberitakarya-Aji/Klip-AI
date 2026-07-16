'use client';

import { motion } from 'framer-motion';
import { Image, Video, Play, Maximize2, Loader2 } from 'lucide-react';
import { Card } from '@klipai/ui/components/card';
import { Button } from '@klipai/ui/components/button';
import { cn } from '@klipai/ui/lib/utils';

const galleryItems = [
  {
    id: '1',
    type: 'video',
    title: 'Cyberpunk City Flythrough',
    prompt: 'Neon-lit cyberpunk metropolis at night, flying cars, volumetric fog, 8K cinematic',
    model: 'SVD-XT',
    duration: '4s',
    resolution: '1080p',
    thumbnail: '/assets/gallery-1.jpg',
    videoUrl: '/assets/gallery-1.mp4',
    tags: ['T2V', 'Cinematic', 'Night'],
  },
  {
    id: '2',
    type: 'video',
    title: 'Ocean Waves Macro',
    prompt: 'Extreme closeup of crystalline ocean waves, golden hour lighting, macro photography, 4K',
    model: 'Gen-2',
    duration: '3s',
    resolution: '4K',
    thumbnail: '/assets/gallery-2.jpg',
    videoUrl: '/assets/gallery-2.mp4',
    tags: ['T2V', 'Nature', 'Macro'],
  },
  {
    id: '3',
    type: 'video',
    title: 'Portrait Animation from Photo',
    prompt: 'Subtle portrait animation, natural breathing, eye movement, soft smile, cinematic lighting',
    model: 'AnimateDiff',
    duration: '5s',
    resolution: '1080p',
    thumbnail: '/assets/gallery-3.jpg',
    videoUrl: '/assets/gallery-3.mp4',
    tags: ['I2V', 'Portrait', 'Subtle'],
  },
  {
    id: '4',
    type: 'video',
    title: 'Style Transfer: Oil Painting',
    prompt: 'Van Gogh starry night style transfer on city timelapse, thick brushstrokes, vibrant colors',
    model: 'Ebsynth',
    duration: '6s',
    resolution: '1080p',
    thumbnail: '/assets/gallery-4.jpg',
    videoUrl: '/assets/gallery-4.mp4',
    tags: ['V2V', 'Style Transfer', 'Artistic'],
  },
  {
    id: '5',
    type: 'image',
    title: 'Concept Art: Alien Landscape',
    prompt: 'Alien world with bioluminescent flora, twin suns, floating islands, concept art, ArtStation trending',
    model: 'SDXL',
    resolution: '1024x1024',
    thumbnail: '/assets/feat-t2i.jpg',
    tags: ['T2I', 'Concept Art', 'Sci-Fi'],
  },
  {
    id: '6',
    type: 'video',
    title: 'Motion Control: Orbit Camera',
    prompt: 'Product shot of luxury watch, precise orbital camera path, macro details, studio lighting',
    model: 'MotionCtrl',
    duration: '4s',
    resolution: '4K',
    thumbnail: '/assets/feat-motion.jpg',
    videoUrl: '/assets/gallery-6.mp4',
    tags: ['CTRL', 'Product', 'Precision'],
  },
  {
    id: '7',
    type: 'video',
    title: 'Character Animation: Dance',
    prompt: 'Anime character dancing in cherry blossom garden, fluid motion, sakura petals, 60fps',
    model: 'AnimateDiff',
    duration: '5s',
    resolution: '1080p',
    thumbnail: '/assets/feat-i2v.jpg',
    videoUrl: '/assets/gallery-7.mp4',
    tags: ['I2V', 'Character', 'Anime'],
  },
  {
    id: '8',
    type: 'image',
    title: 'Architectural Visualization',
    prompt: 'Modern glass house on cliff, sunset, ocean view, architectural photography, 8K',
    model: 'Midjourney v6',
    resolution: '2048x2048',
    thumbnail: '/assets/feat-i2i.jpg',
    tags: ['T2I', 'Architecture', 'Photorealistic'],
  },
];

export function Gallery() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-neutral-950/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-widest text-neutral-400">Showcase</span>
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Created by our{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              community
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Real generations from real creators. No cherry-picking—these are actual outputs 
            from our multi-model pipeline. Explore the possibilities.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {['All', 'Text-to-Video', 'Image-to-Video', 'Video-to-Video', 'Motion Control', 'Images'].map((filter, i) => (
            <motion.button
              key={filter}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                'bg-neutral-900 border border-neutral-800 hover:border-neutral-700',
                'text-neutral-300 hover:text-white'
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              {filter}
            </motion.button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
            >
              <GalleryCard item={item} />
            </motion.div>
          ))}
        </div>

        {/* View More CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button 
            size="lg" 
            variant="outline"
            className="gap-2 px-8 py-4 text-lg border-white/20 hover:border-white/40 hover:bg-white/5"
            asChild
          >
            <a href="/gallery">
              <Maximize2 className="h-5 w-5" />
              View Full Gallery
              <span className="inline-flex">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function GalleryCard({ item }: { item: typeof galleryItems[0] }) {
  const isVideo = item.type === 'video';
  const [isHovered, setIsHovered] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <Card 
      className={cn(
        'group relative overflow-hidden bg-neutral-950 border-neutral-800/50 hover:border-neutral-700/50',
        'transition-all duration-500 glass h-full flex flex-col cursor-pointer'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-cyan-600/20"
          style={{ opacity: isHovered ? 1 : 0 }}
        />
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
            <Loader2 className="h-8 w-8 text-neutral-500 animate-spin" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={cn(
            'px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-full',
            isVideo ? 'bg-purple-600/90 text-white' : 'bg-cyan-600/90 text-white'
          )}>
            {isVideo ? 'VIDEO' : 'IMAGE'}
          </span>
        </div>

        {/* Play/Expand Button */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className={cn(
              'p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20',
              'hover:bg-white/20 hover:border-white/40 transition-all duration-200'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo ? (
              <Play className="h-6 w-6 text-white ml-1" />
            ) : (
              <Maximize2 className="h-6 w-6 text-white" />
            )}
          </motion.button>
        </motion.div>

        {/* Duration / Resolution Badge */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {isVideo && (
            <span className="px-2 py-1 text-xs font-mono bg-black/80 backdrop-blur text-white rounded">
              {item.duration}
            </span>
          )}
          <span className="px-2 py-1 text-xs font-mono bg-black/80 backdrop-blur text-white rounded">
            {item.resolution}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 text-xs font-mono bg-white/5 border border-white/10 rounded text-neutral-400">
            {item.model}
          </span>
        </div>
        
        <h3 className="font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-purple-300 transition-all duration-300">
          {item.title}
        </h3>
        
        <p className="text-sm text-neutral-500 mb-4 line-clamp-2 flex-1">
          {item.prompt}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-white/5 border border-white/10 rounded text-neutral-500 hover:text-neutral-300 transition-colors">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Need to import React for hooks
import React from 'react';