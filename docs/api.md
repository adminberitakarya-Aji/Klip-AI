# Klip-AI API Documentation

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.klip.ai`

## Authentication

All generation endpoints require authentication via NextAuth v5 (JWT in cookie or Bearer token).

```bash
Authorization: Bearer <session-token>
# or cookie-based (default for browser)
```

---

## Generation Endpoints

### Dynamic Route (Recommended)

```
POST /api/generate/[type]
```

**Path Parameters:**

| Parameter | Type   | Values                                                                                                                                                                                                               |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | string | `text-to-video`, `image-to-video`, `video-to-video`, `text-to-image`, `image-to-image`, `motion-control`, `video-to-video-style-transfer`, `inpainting-outpainting`, `depth-normal-control`, `multi-shot-storyboard` |

**Request Body:**

```typescript
interface GenerationRequest {
  prompt: string; // Required, 1-4000 chars
  type: GenerationType; // Must match path parameter
  options?: Record<string, unknown>; // Type-specific options
  images?: string[]; // URLs/base64 for I2V, V2V, I2I (max 4)
  video?: string; // URL for V2V
  referenceImages?: ReferenceImage[]; // Phase 11.1: Character/Object consistency
  cameraControl?: CameraControlConfig; // Phase 11.2: 3D camera path
  motionBrush?: MotionBrushConfig; // Phase 11.2: Regional motion
  physics?: PhysicsConfig; // Phase 11.2: Cloth/hair/fluid/rigid-body
  postProcessing?: PostProcessingPipeline; // Phase 11.3: Upscale/interpolate/denoise
}
```

**Response:**

```typescript
interface GenerationResponse {
  success: boolean;
  data: {
    id: string; // Generation ID (CUID)
    status: "QUEUED";
    progress: 0;
    createdAt: number; // Unix timestamp
  };
}
```

**Rate Limits:**

- Per IP: 10 requests/minute
- Per User: 30 requests/minute
- Returns `429` with `Retry-After` header when exceeded

---

### Legacy Explicit Routes (Deprecated)

```
POST /api/generate/text-to-video
POST /api/generate/image-to-video
POST /api/generate/video-to-video
POST /api/generate/text-to-image
POST /api/generate/image-to-image
POST /api/generate/motion-control
POST /api/generate/video-to-video-style-transfer
POST /api/generate/inpainting-outpainting
POST /api/generate/depth-normal-control
POST /api/generate/multi-shot-storyboard
```

---

## Status & History Endpoints

### Get Generation Status

```
GET /api/generate/[id]/status
```

**Response:**

```typescript
interface StatusResponse {
  success: boolean;
  data: {
    id: string;
    status: "IDLE" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
    progress: number; // 0-100
    resultUrl?: string; // CDN URL when completed
    error?: string; // Error message if failed
    createdAt: number;
    completedAt?: number;
  };
}
```

**Polling:** Client should poll every 2-5 seconds until `COMPLETED` or `FAILED`.

---

### List User Generations

```
GET /api/user/generations?page=1&limit=20&status=COMPLETED
```

**Query Parameters:**

| Param    | Type   | Default | Description              |
| -------- | ------ | ------- | ------------------------ |
| `page`   | number | 1       | Page number              |
| `limit`  | number | 20      | Items per page (max 100) |
| `status` | string | all     | Filter by status         |

**Response:**

```typescript
interface GenerationsListResponse {
  success: boolean;
  data: {
    items: GenerationRecord[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}
```

---

## Type-Specific Options

### Text-to-Video (`text-to-video`)

```typescript
interface TextToVideoOptions {
  duration: 6 | 12 | 15; // seconds
  aspectRatio: "9:16" | "16:9" | "1:1";
  resolution: "720p" | "1080p" | "4k";
  fps: 24 | 30;
  cameraMotion: "static" | "pan" | "zoom" | "orbit" | "handheld";
  seed?: number;
  scenes?: SceneDescription[]; // Storyboard mode
}
```

### Image-to-Video (`image-to-video`)

```typescript
interface ImageToVideoOptions {
  motionStrength: number; // 0.1 - 1.0
  cameraMotion: "static" | "pan" | "zoom" | "orbit";
  duration: 6 | 12 | 15;
  endImage?: string; // Optional end frame
}
```

### Video-to-Video (`video-to-video`)

```typescript
interface VideoToVideoOptions {
  style: string; // Target style prompt
  strength: number; // 0.1 - 1.0
  preserveStructure: boolean; // ControlNet-style preservation
  consistencyFrames?: number; // Temporal consistency window
}
```

### Text-to-Image (`text-to-image`)

```typescript
interface TextToImageOptions {
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3" | "3:4";
  resolution: "512" | "768" | "1024" | "2048";
  style?: string;
  negativePrompt?: string;
  batchSize?: number; // 1-4
}
```

### Image-to-Image (`image-to-image`)

```typescript
interface ImageToImageOptions {
  strength: number; // 0.1 - 1.0
  preserveStructure: boolean;
  style?: string;
  mask?: string; // Base64 for inpainting
}
```

### Motion Control (`motion-control`)

```typescript
interface MotionControlOptions {
  trajectory:
    "linear" | "circular" | "spiral" | "custom" | "orbit" | "dolly" | "crane";
  keyframes: Keyframe[];
  subjectPosition?: [number, number, number];
}

interface Keyframe {
  time: number; // 0-1 normalized
  position: [number, number, number];
  rotation: [number, number, number];
  fov?: number;
}
```

---

## Advanced Generation Types (Phase 11.5)

### Video-to-Video Style Transfer (`video-to-video-style-transfer`)

```typescript
interface StyleTransferOptions {
  styleReference: string; // Style image/video URL
  strength: number; // 0.1 - 1.0
  controlNetConditioning?: {
    type: "canny" | "depth" | "normal" | "openpose";
    image: string; // Conditioning image URL
    strength: number;
  };
  ipAdapter?: {
    referenceImage: string;
    strength: number;
  };
}
```

### Inpainting/Outpainting (`inpainting-outpainting`)

```typescript
interface InpaintingOutpaintingOptions {
  mode: "inpaint" | "outpaint" | "both";
  mask: string; // Base64 mask (white = inpaint area)
  prompt: string; // What to generate in masked area
  outpaintDirection?: "left" | "right" | "top" | "bottom" | "all";
  outpaintRatio?: number; // 0.1 - 2.0 (expansion factor)
}
```

### Depth/Normal Control (`depth-normal-control`)

```typescript
interface DepthNormalControlOptions {
  controlType: "depth" | "normal" | "both";
  depthMap?: string; // URL or base64
  normalMap?: string; // URL or base64
  strength: number; // 0.1 - 1.0
  guidanceStart: number; // 0.0 - 1.0
  guidanceEnd: number; // 0.0 - 1.0
}
```

### Multi-Shot Storyboard (`multi-shot-storyboard`)

```typescript
interface MultiShotStoryboardOptions {
  shots: ShotDescription[];
  autoEdit: boolean; // Auto stitch shots
  transitionType?: "cut" | "crossfade" | "morph";
  totalDuration: number; // Target total seconds
}

interface ShotDescription {
  prompt: string;
  duration: number; // seconds
  camera?: MotionControlOptions;
  style?: string;
}
```

---

## Audio Endpoints (Phase 11.4)

### Text-to-Speech

```
POST /api/audio/tts
```

```typescript
interface TTSRequest {
  text: string;
  voice:
    | "indonesian-female-1"
    | "indonesian-male-1"
    | "english-female-1"
    | "english-male-1";
  model?: "elevenlabs" | "coqui";
  speed?: number; // 0.5 - 2.0
  pitch?: number; // -12 - 12 semitones
}
```

### Sound Effects

```
POST /api/audio/sound-effects
```

```typescript
interface SoundEffectsRequest {
  prompt: string; // "explosion", "footsteps on gravel", etc.
  duration?: number; // seconds, max 30
  style?: "realistic" | "cartoon" | "cinematic";
}
```

### Background Music

```
POST /api/audio/music
```

```typescript
interface MusicRequest {
  prompt: string; // "upbeat corporate background music"
  duration: number; // seconds
  genre?: "corporate" | "cinematic" | "lofi" | "electronic" | "ambient";
  mood?: "happy" | "serious" | "energetic" | "calm" | "epic";
}
```

### Lip Sync

```
POST /api/audio/lip-sync
```

```typescript
interface LipSyncRequest {
  videoUrl: string; // Video with face
  audioUrl: string; // Audio to sync
  model?: "sadtalker" | "wav2lip";
}
```

### List Voices

```
GET /api/audio/voices
```

---

## Error Responses

All endpoints return consistent error format:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // Error code
    message: string; // Human-readable message
  };
}
```

**Common Error Codes:**

| Code                   | HTTP Status | Description             |
| ---------------------- | ----------- | ----------------------- |
| `UNAUTHORIZED`         | 401         | Invalid/missing session |
| `INSUFFICIENT_CREDITS` | 402         | User has 0 credits      |
| `VALIDATION_ERROR`     | 400         | Request body invalid    |
| `INVALID_TYPE`         | 400         | Unknown generation type |
| `RATE_LIMITED`         | 429         | Too many requests       |
| `INTERNAL_ERROR`       | 500         | Server/provider error   |
| `PROVIDER_UNAVAILABLE` | 503         | All AI providers down   |

---

## Webhooks (Future)

Configure in dashboard to receive:

- `generation.completed` - Result ready
- `generation.failed` - Error occurred
- `credits.low` - Balance < threshold

```typescript
interface WebhookPayload {
  event: "generation.completed" | "generation.failed" | "credits.low";
  timestamp: string; // ISO 8601
  data: GenerationRecord | { userId: string; credits: number };
}
```
