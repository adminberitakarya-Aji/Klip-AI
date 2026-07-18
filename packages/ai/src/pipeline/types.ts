import {
  GenerationType,
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
} from "@klipai/core/types";

// ============================================
// REFERENCE IMAGE SYSTEM (NEW - Phase 11.1)
// ============================================

export interface ReferenceImage {
  url: string; // Base64 data URL or HTTPS URL
  role: "character" | "subject" | "style" | "structure" | "face" | "pose";
  weight: number; // 0.1 - 1.0, influence strength
  // Optional: crop/region of interest
  crop?: {
    x: number; // 0-1 normalized
    y: number;
    width: number;
    height: number;
  };
  // Optional: mask for inpainting-style control
  maskUrl?: string;
}

export interface ConsistencyConfig {
  // Identity preservation mode
  identityPreservation: "face" | "subject" | "full" | "style";
  // Reference strength (overrides individual ReferenceImage.weight if set)
  referenceStrength?: number; // 0.1 - 1.0
  // Number of frames to enforce temporal consistency
  consistencyFrames?: number; // e.g., 8, 16, 24
  // For multi-reference: how to blend
  blendMode?: "average" | "weighted" | "primary";
}

// ============================================
// ENHANCED GENERATION REQUEST (Output from Claude Orchestrator)
// ============================================

export interface EnhancedGenerationRequest {
  // Core prompt
  prompt: string;
  negativePrompt?: string;

  // Type & structured params (type-specific)
  type: GenerationType;

  // Reference inputs (carried through from the original request)
  images?: string[]; // Legacy: simple URLs (backward compat)
  video?: string; // Legacy: single video URL (backward compat)

  // NEW: Structured reference images with roles/weights
  referenceImages?: ReferenceImage[];

  // Type-specific structured params
  params:
    | TextToVideoParams
    | ImageToVideoParams
    | VideoToVideoParams
    | TextToImageParams
    | ImageToImageParams
    | MotionControlParams;

  // Metadata for routing & optimization
  metadata: {
    complexity: "simple" | "storyboard" | "complex";
    recommendedProvider: "seedance" | "kling" | "wan";
    estimatedDuration: number; // seconds
    requiresConsistency: boolean;
    priority: "speed" | "quality" | "cost";
    // NEW: Consistency configuration
    consistency?: ConsistencyConfig;
  };
}

// ============================================
// TYPE-SPECIFIC STRUCTURED PARAMS (Extended)
// ============================================

export interface TextToVideoParams {
  duration: 6 | 12 | 15;
  aspectRatio: "9:16" | "16:9" | "1:1";
  resolution: "720p" | "1080p" | "4k";
  fps: 24 | 30;
  cameraMotion: "static" | "pan" | "zoom" | "orbit" | "handheld";
  seed?: number;
  // Storyboard support
  scenes?: Array<{
    timeRange: string; // "0-3s"
    description: string; // "Hero shot produk"
    camera: string; // "slow push in"
    lighting?: string; // "soft key light"
  }>;
  // NEW: Consistency for text-to-video (character generation)
  consistency?: ConsistencyConfig;
  // NEW: Camera control (Phase 11.2)
  cameraControl?: CameraControlConfig;
  // NEW: Motion brush for region-based motion (Phase 11.2)
  motionBrush?: MotionBrushConfig;
}

export interface ImageToVideoParams {
  motionStrength: number; // 0.1 - 1.0
  cameraMotion: "static" | "pan" | "zoom" | "orbit";
  duration: 6 | 12 | 15;
  // Start/end frame control
  endImage?: string; // Optional end frame
  // NEW: Reference images for character consistency in I2V
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
  // NEW: Camera control (Phase 11.2)
  cameraControl?: CameraControlConfig;
  // NEW: Motion brush for region-based motion (Phase 11.2)
  motionBrush?: MotionBrushConfig;
}

export interface VideoToVideoParams {
  style: string; // Style reference / prompt
  strength: number; // 0.1 - 1.0
  preserveStructure: boolean; // ControlNet-style
  // Temporal consistency
  consistencyFrames?: number;
  // NEW: Reference for identity preservation during style transfer
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
  // NEW: Camera control (Phase 11.2)
  cameraControl?: CameraControlConfig;
}

export interface TextToImageParams {
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3" | "3:4";
  resolution: "512" | "768" | "1024" | "2048";
  style?: string;
  negativePrompt?: string;
  // Batch
  batchSize?: number; // 1-4
  // NEW: Reference for character consistency in T2I
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
}

export interface ImageToImageParams {
  strength: number; // 0.1 - 1.0
  preserveStructure: boolean;
  style?: string;
  // Mask support
  mask?: string; // Base64 mask for inpainting
  // NEW: Reference images for consistency
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
}

export interface MotionControlParams {
  trajectory:
    "linear" | "circular" | "spiral" | "custom" | "orbit" | "dolly" | "crane";
  keyframes: Array<{
    time: number; // 0-1 normalized
    position: [number, number, number]; // x, y, z
    rotation: [number, number, number]; // pitch, yaw, roll
    fov?: number; // Field of view
  }>;
  // Subject tracking
  subjectPosition?: [number, number, number];
  // NEW: Reference for subject tracking
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
  // NEW: Camera control (Phase 11.2)
  cameraControl?: CameraControlConfig;
  // NEW: Motion brush for region-based motion (Phase 11.2)
  motionBrush?: MotionBrushConfig;
}

// ============================================
// MOTION BRUSH & CAMERA CONTROL (Phase 11.2)
// ============================================

/**
 * Motion Brush Configuration - Runway Gen-2 style
 * Allows users to paint regions and define motion vectors
 */
export interface MotionBrushConfig {
  // Array of brush strokes, each defining a motion region
  strokes: MotionBrushStroke[];
  // Global motion scale (multiplier for all strokes)
  globalStrength?: number; // 0.1 - 2.0, default 1.0
  // Whether to use optical flow estimation for smoother motion
  useOpticalFlow?: boolean;
  // Temporal smoothing factor
  temporalSmoothness?: number; // 0.0 - 1.0
}

export interface MotionBrushStroke {
  // Unique identifier for this stroke
  id: string;
  // Brush mask: base64 encoded image (grayscale) or polygon points
  mask: MotionBrushMask;
  // Motion vector in normalized coordinates (-1 to 1)
  // x: horizontal, y: vertical, z: depth (optional)
  motionVector: [number, number, number?];
  // Speed multiplier for this specific stroke
  speed?: number; // 0.1 - 5.0
  // Whether motion loops or is one-shot
  loop?: boolean;
  // Easing function for motion
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce";
  // Start/end time within the video (0-1 normalized)
  timeRange?: [number, number];
}

export interface MotionBrushMask {
  // Either base64 image or polygon points
  type: "image" | "polygon";
  // Base64 encoded grayscale image (white = affected, black = not affected)
  imageBase64?: string;
  // Polygon points in normalized coordinates (0-1)
  polygon?: Array<[number, number]>;
  // Optional: feather amount for soft edges (0-1)
  feather?: number;
}

/**
 * Camera Control Configuration - Advanced 3D camera path editor
 */
export interface CameraControlConfig {
  // Camera path defined by keyframes
  keyframes: CameraKeyframe[];
  // Path interpolation mode
  interpolation?: "linear" | "bezier" | "catmull-rom" | "smooth";
  // Default camera settings
  defaultFov?: number; // Field of view in degrees (default: 50)
  defaultNear?: number; // Near clipping plane (default: 0.1)
  defaultFar?: number; // Far clipping plane (default: 1000)
  // Camera shake / handheld simulation
  shake?: CameraShakeConfig;
  // Auto-framing: keep subject in frame
  autoFrame?: AutoFrameConfig;
  // Depth of field settings
  depthOfField?: DepthOfFieldConfig;
}

export interface CameraKeyframe {
  time: number; // 0-1 normalized time
  position: [number, number, number]; // x, y, z world position
  rotation: [number, number, number]; // pitch, yaw, roll in degrees
  fov?: number; // Field of view override
  // Target point to look at (for orbit/tracking)
  target?: [number, number, number];
  // Easing for this segment
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

export interface CameraShakeConfig {
  enabled: boolean;
  intensity: number; // 0.0 - 1.0
  frequency: number; // Hz
  // Per-axis shake amounts
  translation?: [number, number, number]; // x, y, z max offset
  rotation?: [number, number, number]; // pitch, yaw, roll max degrees
  // Seed for reproducibility
  seed?: number;
}

export interface AutoFrameConfig {
  enabled: boolean;
  // Subject to track (can be reference image index or "center")
  subject: number | "center" | "auto";
  // Padding around subject (0-1 normalized)
  padding?: number;
  // Maximum camera movement speed
  maxSpeed?: number;
  // Smoothing factor
  smoothness?: number; // 0-1
}

export interface DepthOfFieldConfig {
  enabled: boolean;
  // Focus distance in world units
  focusDistance?: number;
  // Aperture (f-stop), lower = shallower DOF
  aperture?: number; // e.g., 1.8, 2.8, 5.6, 11
  // Focus on subject automatically
  autoFocus?: boolean;
  // Subject index for auto-focus
  focusSubject?: number;
}

// ============================================
// ADVANCED GENERATION MODES (Phase 11.5)
// ============================================

/**
 * Video-to-Video Style Transfer Configuration
 * Transform video style while preserving structure/content
 */
export interface VideoToVideoStyleTransferConfig {
  // Style reference
  styleReference: string; // URL to style reference image/video or style name
  // Style strength (0.1 - 1.0)
  strength: number;
  // Style transfer mode
  mode:
    | "cinematic"
    | "anime"
    | "claymation"
    | "paper-cutout"
    | "watercolor"
    | "oil-painting"
    | "sketch"
    | "pixel-art"
    | "custom";
  // Preserve structure using ControlNet
  preserveStructure: boolean;
  // ControlNet conditioning
  controlNetConditioning?:
    "canny" | "depth" | "normal" | "openpose" | "seg" | "lineart" | "mlsd";
  // ControlNet strength
  controlNetStrength?: number; // 0.1 - 1.0
  // Temporal consistency frames
  consistencyFrames?: number; // 8, 16, 24
  // Reference images for identity preservation
  referenceImages?: ReferenceImage[];
  // Consistency config
  consistency?: ConsistencyConfig;
  // Custom LoRA/model path for style
  loraPath?: string;
  loraScale?: number; // 0.1 - 1.0
}

/**
 * Inpainting/Outpainting Configuration
 * Extend canvas, remove objects, fill regions
 */
export interface InpaintingOutpaintingConfig {
  // Operation mode
  mode: "inpaint" | "outpaint" | "both";
  // Input image/video URL
  inputUrl: string;
  // Mask for inpainting (white = inpaint area, black = keep)
  maskUrl?: string;
  // Outpaint direction and amount
  outpaint?: {
    left?: number; // pixels or percentage
    right?: number;
    top?: number;
    bottom?: number;
    // Or use aspect ratio target
    targetAspectRatio?: "9:16" | "16:9" | "1:1" | "4:3" | "3:4" | "21:9";
  };
  // Prompt for the inpainted/outpainted region
  prompt: string;
  // Negative prompt
  negativePrompt?: string;
  // Strength for inpainting (how much to change)
  strength?: number; // 0.1 - 1.0
  // Number of variations
  variations?: number; // 1-4
  // Blend mode for seamless edges
  blendMode?: "seamless" | "feather" | "poisson";
  // Feather amount for blending
  featherAmount?: number; // 0-100 pixels
  // Use ControlNet for structure guidance
  controlNetConditioning?: "canny" | "depth" | "normal" | "lineart";
  controlNetStrength?: number; // 0.1 - 1.0
}

/**
 * Depth/Normal Map Control Configuration
 * Geometric control using depth maps, normal maps, segmentation
 */
export interface DepthNormalMapConfig {
  // Input source
  inputType:
    "depth" | "normal" | "segmentation" | "canny" | "openpose" | "lineart";
  // Input URL (depth map, normal map, or source image to extract from)
  inputUrl: string;
  // Control strength
  strength: number; // 0.1 - 1.0
  // Guidance scale
  guidanceScale?: number; // 1.0 - 20.0
  // Prompt for generation
  prompt: string;
  negativePrompt?: string;
  // For video: temporal consistency
  temporalConsistency?: boolean;
  consistencyFrames?: number;
  // Reference images
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
}

/**
 * Multi-shot Storyboard Configuration
 * Generate 5-10 shots from a single prompt with auto-edit
 */
export interface MultiShotStoryboardConfig {
  // Main prompt / brief
  brief: string;
  // Number of shots to generate
  shotCount: number; // 3-10
  // Shot duration (each)
  shotDuration: number; // 3-10 seconds
  // Total duration
  totalDuration: number; // shotCount * shotDuration
  // Aspect ratio
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3" | "3:4";
  // Style preset
  style?:
    | "cinematic"
    | "commercial"
    | "social"
    | "documentary"
    | "vlog"
    | "music-video";
  // Shot types to include
  shotTypes?: Array<
    | "wide"
    | "medium"
    | "closeup"
    | "extreme-closeup"
    | "establishing"
    | "detail"
    | "pov"
    | "overhead"
  >;
  // Camera movement preferences
  cameraMovements?: Array<
    "static" | "pan" | "zoom" | "dolly" | "crane" | "handheld" | "orbit"
  >;
  // Character consistency
  characterReference?: ReferenceImage[];
  // Auto-edit settings
  autoEdit?: {
    enabled: boolean;
    transitionStyle?: "cut" | "crossfade" | "wipe" | "zoom" | "slide";
    transitionDuration?: number; // seconds
    addMusic?: boolean;
    musicPrompt?: string;
    addCaptions?: boolean;
    captionStyle?: "tiktok" | "instagram" | "youtube" | "minimal";
  };
  // Consistency across shots
  consistency?: ConsistencyConfig;
  // Output format
  outputFormat?: "individual" | "stitched" | "both";
}

// ============================================
// PHYSICS SIMULATION (Phase 11.2)
// ============================================

/**
 * Physics Simulation Configuration (Phase 11.2)
 */
export interface PhysicsConfig {
  // Cloth simulation
  cloth?: ClothPhysicsConfig;
  // Hair simulation
  hair?: HairPhysicsConfig;
  // Fluid simulation
  fluid?: FluidPhysicsConfig;
  // Rigid body dynamics
  rigidBody?: RigidBodyPhysicsConfig;
  // Global physics settings
  gravity?: [number, number, number]; // default [0, -9.81, 0]
  timeStep?: number; // simulation time step
  subSteps?: number; // sub-steps per frame
}

export interface ClothPhysicsConfig {
  enabled: boolean;
  // Mesh/material identifiers to apply cloth physics to
  targets: string[]; // material names or mesh IDs
  // Cloth properties
  stiffness?: number; // 0.0 - 1.0
  damping?: number; // 0.0 - 1.0
  mass?: number; // per vertex mass
  // Wind forces
  wind?: {
    enabled: boolean;
    direction: [number, number, number];
    strength: number; // 0.0 - 10.0
    turbulence?: number; // 0.0 - 1.0
  };
  // Collision objects
  colliders?: Array<{
    type: "sphere" | "box" | "capsule";
    position: [number, number, number];
    size: [number, number, number];
  }>;
}

export interface HairPhysicsConfig {
  enabled: boolean;
  targets: string[]; // hair strand identifiers
  stiffness?: number; // 0.0 - 1.0
  damping?: number; // 0.0 - 1.0
  length?: number; // strand length
  segments?: number; // segments per strand
  gravity?: [number, number, number];
  wind?: {
    enabled: boolean;
    direction: [number, number, number];
    strength: number;
  };
}

export interface FluidPhysicsConfig {
  enabled: boolean;
  // Fluid domain
  domain: {
    min: [number, number, number];
    max: [number, number, number];
    resolution: number; // grid resolution
  };
  // Fluid properties
  viscosity?: number; // 0.0 - 1.0
  density?: number;
  // Emitters
  emitters?: Array<{
    position: [number, number, number];
    velocity: [number, number, number];
    rate: number; // particles per second
    radius: number;
  }>;
}

export interface RigidBodyPhysicsConfig {
  enabled: boolean;
  objects: Array<{
    id: string;
    type: "box" | "sphere" | "capsule" | "convex" | "mesh";
    position: [number, number, number];
    rotation: [number, number, number];
    size?: [number, number, number];
    mass?: number;
    friction?: number;
    restitution?: number; // bounciness
    isStatic?: boolean;
    isKinematic?: boolean;
  }>;
}

// ============================================
// AUDIO & MULTI-MODAL (Phase 11.4)
// ============================================

/**
 * Text-to-Speech Configuration
 * Supports ElevenLabs, Coqui, and other TTS providers
 */
export interface TTSConfig {
  // TTS provider
  provider: "elevenlabs" | "coqui" | "azure" | "google" | "custom";
  // Text to synthesize
  text: string;
  // Voice ID or name
  voiceId: string;
  // Language (for multilingual voices)
  language?: string; // e.g., "id" for Indonesian
  // Voice settings
  stability?: number; // 0.0 - 1.0 (ElevenLabs)
  similarityBoost?: number; // 0.0 - 1.0 (ElevenLabs)
  style?: number; // 0.0 - 1.0 (ElevenLabs)
  useSpeakerBoost?: boolean; // ElevenLabs
  // Speed/pitch control
  speed?: number; // 0.5 - 2.0
  pitch?: number; // -20 to 20 semitones
  // Output format
  outputFormat?: "mp3" | "wav" | "ogg" | "flac" | "ulaw";
  sampleRate?: number; // 8000, 16000, 22050, 24000, 44100, 48000
  // Custom voice (for voice cloning)
  customVoiceId?: string;
  // Emotion/style
  emotion?: "neutral" | "happy" | "sad" | "angry" | "fearful" | "surprised";
  // Custom model path
  modelPath?: string;
}

/**
 * Sound Effects Generation Configuration
 */
export interface SoundEffectsConfig {
  // Provider
  provider: "elevenlabs" | "custom";
  // Text prompt describing the sound
  prompt: string;
  // Duration in seconds
  duration?: number; // default: 5, max: 30
  // Number of variations to generate
  variations?: number; // 1-4
  // Sound category for better prompting
  category?:
    | "foley"
    | "ambient"
    | "impact"
    | "whoosh"
    | "ui"
    | "nature"
    | "urban"
    | "mechanical"
    | "magical";
  // Intensity
  intensity?: number; // 0.1 - 1.0
  // Output format
  outputFormat?: "mp3" | "wav" | "ogg" | "flac";
  sampleRate?: number;
  // Custom model path
  modelPath?: string;
}

/**
 * Lip Sync Configuration
 * Audio-driven facial animation (SadTalker / Wav2Lip)
 */
export interface LipSyncConfig {
  // Provider
  provider: "sadtalker" | "wav2lip" | "custom";
  // Input video URL (face video)
  videoUrl: string;
  // Input audio URL (speech audio)
  audioUrl: string;
  // Face detection/enhancement
  faceEnhance?: boolean;
  // Still image mode (SadTalker)
  stillMode?: boolean;
  // Preprocess type (SadTalker)
  preprocess?: "crop" | "resize" | "full" | "extcrop" | "extfull";
  // Expression scale (SadTalker)
  expressionScale?: number; // 0.5 - 2.0
  // Batch size
  batchSize?: number;
  // Output format
  outputFormat?: "mp4" | "webm" | "mov";
  // Output quality
  outputQuality?: "low" | "medium" | "high" | "lossless";
  // Custom model path
  modelPath?: string;
}

/**
 * Background Music Generation Configuration
 * AI music generation (Suno / Udio style)
 */
export interface BackgroundMusicConfig {
  // Provider
  provider: "suno" | "udio" | "custom";
  // Text prompt describing the music
  prompt: string;
  // Duration in seconds
  duration: number; // 10 - 300
  // Genre/style
  genre?: string; // e.g., "cinematic", "ambient", "electronic", "orchestral", "lo-fi"
  // Mood
  mood?:
    | "happy"
    | "sad"
    | "energetic"
    | "calm"
    | "epic"
    | "mysterious"
    | "romantic"
    | "tense";
  // Tempo (BPM)
  tempo?: number; // 60 - 200
  // Key
  key?: string; // e.g., "C major", "A minor"
  // Instruments
  instruments?: string[]; // e.g., ["piano", "strings", "pad", "drums"]
  // Structure
  structure?:
    | "intro-verse-chorus"
    | "verse-chorus"
    | "ambient"
    | "loop"
    | "intro-build-drop";
  // Vocals
  vocals?: boolean;
  // Lyrics (if vocals=true)
  lyrics?: string;
  // Output format
  outputFormat?: "mp3" | "wav" | "flac";
  sampleRate?: number;
  // Custom model path
  modelPath?: string;
}

/**
 * Audio Job Result
 */
export interface AudioJobResult {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  outputUrl?: string;
  error?: string;
  processingTime?: number; // milliseconds
  outputMetadata?: {
    duration: number; // seconds
    sampleRate: number;
    channels: number;
    format: string;
    filesize: number;
    // For music
    bpm?: number;
    key?: string;
  };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

/**
 * Audio Provider Interface
 */
export interface AudioProvider {
  name: string;
  supportedModels: string[];
  maxDuration: number; // seconds
  maxTextLength?: number; // for TTS

  /**
   * Submit a TTS job
   */
  textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  /**
   * Submit a sound effects generation job
   */
  generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  /**
   * Submit a lip sync job
   */
  lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  /**
   * Submit a background music generation job
   */
  generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  /**
   * Get job status
   */
  getStatus(jobId: string): Promise<AudioJobResult>;

  /**
   * Cancel job
   */
  cancel(jobId: string): Promise<void>;

  /**
   * Get supported voices/models
   */
  getVoices(): Promise<
    Array<{
      id: string;
      name: string;
      language: string;
      gender: "male" | "female" | "neutral";
      previewUrl?: string;
      description?: string;
      category?: "tts" | "music" | "effects";
    }>
  >;
}

// ============================================
// UPSCALER & QUALITY ENHANCEMENT (Phase 11.3)
// ============================================

/**
 * Video Upscaler Configuration
 * Supports Real-ESRGAN, Topaz-style, and other upscaling models
 */
export interface UpscalerConfig {
  // Upscaling model to use
  model: "real-esrgan" | "real-esrgan-anime" | "topaz" | "waifu2x" | "custom";
  // Target scale factor (2x, 4x)
  scale: 2 | 4;
  // Target resolution (optional, overrides scale)
  targetResolution?: "720p" | "1080p" | "4k" | "8k";
  // Face enhancement (GFPGAN / CodeFormer)
  faceEnhance?: boolean;
  // Face enhancement strength
  faceEnhanceStrength?: number; // 0.1 - 1.0
  // Tile size for large images (to avoid OOM)
  tileSize?: number; // 0 = auto, default 512
  // Tile padding
  tilePad?: number; // default 10
  // Pre-pad for border handling
  prePad?: number; // default 0
  // FP32 precision (slower but more accurate)
  fp32?: boolean;
  // Alpha channel upscaling
  alphaUpscale?: boolean;
  // Custom model path (for custom models)
  modelPath?: string;
}

/**
 * Frame Interpolation Configuration
 * Increases frame rate (e.g., 24fps -> 60fps) using RIFE, FILM, or other models
 */
export interface FrameInterpolationConfig {
  // Interpolation model
  model: "rife" | "rife-v4" | "film" | "gmvf" | "custom";
  // Target FPS (must be multiple of source FPS)
  targetFps: 30 | 60 | 120 | 240;
  // Number of interpolation steps (for 24->60, steps=2 gives 3x = 72, steps=2.5 gives 60)
  // Actually this is multiplier: 2x = double frames, 4x = quadruple
  multiplier?: 2 | 4 | 8;
  // Scene change detection threshold (0-1)
  // Prevents interpolation across hard cuts
  sceneThreshold?: number; // default 0.3
  // Optical flow model (for RIFE)
  flowModel?: "default" | "lightweight" | "ensemble";
  // TTA (Test Time Augmentation) - slower but better quality
  tta?: boolean;
  // Upscale before interpolation (for better flow estimation)
  upscaleBeforeInterp?: boolean;
  // Custom model path
  modelPath?: string;
}

/**
 * Denoise & Sharpen Post-Processing Configuration
 */
export interface DenoiseSharpenConfig {
  // Denoising
  denoise?: {
    // Denoise strength (0-1)
    strength: number; // 0.1 - 1.0
    // Denoise model
    model?: "fast" | "high-quality" | "custom";
    // Temporal denoising (uses adjacent frames)
    temporal?: boolean;
    // Spatial denoising only
    spatialOnly?: boolean;
    // Custom model path
    modelPath?: string;
  };
  // Sharpening
  sharpen?: {
    // Sharpen strength (0-1)
    strength: number; // 0.1 - 1.0
    // Sharpen method
    method: "unsharp-mask" | "lanczos" | "ai-based" | "custom";
    // Radius for unsharp mask
    radius?: number; // default 1.0
    // Threshold for unsharp mask
    threshold?: number; // default 0
    // AI sharpen model
    model?: string;
    // Custom model path
    modelPath?: string;
  };
  // Color correction / enhancement
  colorEnhance?: {
    // Auto white balance
    autoWhiteBalance?: boolean;
    // Auto exposure
    autoExposure?: boolean;
    // Contrast adjustment (-1 to 1)
    contrast?: number;
    // Saturation adjustment (-1 to 1)
    saturation?: number;
    // Brightness adjustment (-1 to 1)
    brightness?: number;
    // Gamma correction
    gamma?: number; // default 1.0
    // LUT file path
    lutPath?: string;
  };
  // Deblocking (for compressed sources)
  deblock?: {
    enabled: boolean;
    strength?: number; // 0.1 - 1.0
  };
  // Deflicker (for timelapse/old footage)
  deflicker?: {
    enabled: boolean;
    windowSize?: number; // frames
    strength?: number;
  };
}

/**
 * Complete Post-Processing Pipeline Configuration
 */
export interface PostProcessingPipeline {
  // Upscaling (optional)
  upscaler?: UpscalerConfig;
  // Frame interpolation (optional)
  frameInterpolation?: FrameInterpolationConfig;
  // Denoise & sharpen (optional)
  denoiseSharpen?: DenoiseSharpenConfig;
  // Order of operations (default: upscale -> interpolate -> denoise/sharpen)
  // Can be customized for specific workflows
  order?: Array<"upscale" | "interpolate" | "denoise_sharpen">;
  // Output format
  outputFormat?: "mp4" | "webm" | "mov" | "gif" | "prores";
  // Output codec
  outputCodec?: "h264" | "h265" | "vp9" | "av1" | "prores";
  // Output quality/bitrate
  outputQuality?: "low" | "medium" | "high" | "lossless";
  // Custom ffmpeg args
  ffmpegArgs?: string[];
}

/**
 * Upscaler Job Result
 */
export interface UpscalerJobResult {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  inputUrl: string;
  outputUrl?: string;
  error?: string;
  processingTime?: number; // milliseconds
  inputMetadata?: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    codec: string;
    format: string;
  };
  outputMetadata?: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    codec: string;
    format: string;
    filesize: number;
  };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

/**
 * Upscaler Provider Interface
 */
export interface UpscalerProvider {
  name: string;
  supportedModels: string[];
  maxResolution: string;
  maxDuration: number; // seconds

  /**
   * Submit an upscaling job
   */
  upscale(input: {
    videoUrl: string;
    config: UpscalerConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  /**
   * Submit a frame interpolation job
   */
  interpolate(input: {
    videoUrl: string;
    config: FrameInterpolationConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  /**
   * Submit a denoise/sharpen job
   */
  denoiseSharpen(input: {
    videoUrl: string;
    config: DenoiseSharpenConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  /**
   * Submit a full post-processing pipeline job
   */
  processPipeline(input: {
    videoUrl: string;
    pipeline: PostProcessingPipeline;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  /**
   * Get job status
   */
  getStatus(jobId: string): Promise<UpscalerJobResult>;

  /**
   * Cancel job
   */
  cancel(jobId: string): Promise<void>;

  /**
   * Get supported models and their capabilities
   */
  getModels(): Promise<
    Array<{
      id: string;
      name: string;
      type: "upscale" | "interpolate" | "denoise" | "sharpen";
      maxScale?: number;
      maxFpsMultiplier?: number;
      supportedFormats: string[];
      pricing: { perSecond?: number; perFrame?: number };
    }>
  >;
}

// ============================================
// PROVIDER CAPABILITIES
// ============================================

export interface ProviderCapabilities {
  name: "seedance" | "kling" | "wan";
  supportedTypes: GenerationType[];
  maxDuration: number; // seconds
  maxResolution: string;
  pricing: { perSecond?: number; perImage?: number };
  strengths: string[]; // ['cinematic', 'physics', 'consistency']
  weaknesses: string[]; // ['slow', 'expensive']
  // NEW: Consistency feature support per provider
  consistencyFeatures?: {
    ipAdapter?: boolean; // IP-Adapter / reference image conditioning
    controlNet?: boolean; // ControlNet support
    faceId?: boolean; // FaceID / identity preservation
    subjectConsistency?: boolean; // Subject consistency (non-face)
    temporalConsistency?: boolean; // Frame-to-frame consistency
  };
  // NEW: Upscaler & Quality Enhancement support (Phase 11.3)
  upscalerFeatures?: {
    videoUpscale?: boolean;
    frameInterpolation?: boolean;
    denoise?: boolean;
    sharpen?: boolean;
    faceEnhance?: boolean;
    colorCorrect?: boolean;
    maxUpscaleFactor?: number; // 2, 4, 8
    maxInterpolationFps?: number; // 60, 120, 240
  };
}

export const PROVIDER_CAPABILITIES: ProviderCapabilities[] = [
  {
    name: "seedance",
    supportedTypes: [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.VIDEO_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
      GenerationType.IMAGE_TO_IMAGE,
      GenerationType.MOTION_CONTROL,
      // Phase 11.5: Advanced Generation Modes
      GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER,
      GenerationType.INPAINTING_OUTPAINTING,
      GenerationType.DEPTH_NORMAL_CONTROL,
      GenerationType.MULTI_SHOT_STORYBOARD,
    ],
    maxDuration: 15,
    maxResolution: "4k",
    pricing: { perSecond: 0.15, perImage: 0.02 },
    strengths: ["cinematic quality", "physics", "consistency", "storyboard"],
    weaknesses: ["slower", "higher cost"],
    consistencyFeatures: {
      ipAdapter: true,
      controlNet: true,
      faceId: true,
      subjectConsistency: true,
      temporalConsistency: true,
    },
  },
  {
    name: "kling",
    supportedTypes: [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.VIDEO_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
      GenerationType.IMAGE_TO_IMAGE,
      GenerationType.MOTION_CONTROL,
      // Phase 11.5: Advanced Generation Modes
      GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER,
      GenerationType.INPAINTING_OUTPAINTING,
      GenerationType.DEPTH_NORMAL_CONTROL,
      GenerationType.MULTI_SHOT_STORYBOARD,
    ],
    maxDuration: 15,
    maxResolution: "1080p",
    pricing: { perSecond: 0.1, perImage: 0.015 },
    strengths: ["speed", "motion control", "physics"],
    weaknesses: ["lower resolution"],
    consistencyFeatures: {
      ipAdapter: true,
      controlNet: true,
      faceId: false,
      subjectConsistency: true,
      temporalConsistency: true,
    },
  },
  {
    name: "wan",
    supportedTypes: [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
      // Phase 11.5: Wan may support limited advanced modes
      GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER,
      GenerationType.INPAINTING_OUTPAINTING,
      GenerationType.DEPTH_NORMAL_CONTROL,
    ],
    maxDuration: 15,
    maxResolution: "720p",
    pricing: { perSecond: 0.05, perImage: 0.008 },
    strengths: ["fast", "cheap"],
    weaknesses: ["limited types", "lower quality"],
    consistencyFeatures: {
      ipAdapter: false,
      controlNet: false,
      faceId: false,
      subjectConsistency: false,
      temporalConsistency: false,
    },
  },
];

// ============================================
// PIPELINE CONTEXT
// ============================================

export interface PipelineContext {
  generationId: string;
  userId: string;
  brief: string;
  type: GenerationType;
  images?: string[];
  video?: string;
  referenceImages?: ReferenceImage[]; // NEW
  userPreferences?: {
    style?: "cinematic" | "commercial" | "social" | "artistic";
    duration?: number;
    aspectRatio?: string;
  };
}

// ============================================
// PROMPT ENHANCER INPUT/OUTPUT
// ============================================

export interface PromptEnhancerInput {
  brief: string;
  type: GenerationType;
  images?: string[]; // Legacy
  video?: string; // Legacy
  referenceImages?: ReferenceImage[]; // NEW
  userPreferences?: {
    style?: "cinematic" | "commercial" | "social" | "artistic";
    duration?: number;
    aspectRatio?: string;
  };
}

export type PromptEnhancerOutput = EnhancedGenerationRequest;

// ============================================
// PROVIDER REQUEST/RESPONSE (Internal format)
// ============================================

export interface ProviderRequest {
  provider: "seedance" | "kling" | "wan";
  payload: Record<string, unknown>;
  endpoint: string;
  method: "POST" | "GET";
}

export interface ProviderResponse {
  id: string;
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Re-export GenerationType for consumers
export { GenerationType } from "@klipai/core/types";
