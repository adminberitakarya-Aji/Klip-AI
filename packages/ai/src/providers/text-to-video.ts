import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, GenerationStatus, TextToVideoOptions } from '../types';
import { BaseProvider } from './base';

export class TextToVideoProvider extends BaseProvider implements AIProvider {
  name = 'text-to-video';

  constructor(config: ProviderConfig) {
    super(config);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const options = request.options as TextToVideoOptions | undefined;
    
    const payload = {
      prompt: request.prompt,
      duration: options?.duration || 6,
      aspect_ratio: options?.aspectRatio || '16:9',
      resolution: options?.resolution || '720p',
      fps: options?.fps || 24,
      camera_motion: options?.cameraMotion || 'static',
      seed: options?.seed,
      model: this.config.model || 'klip-video-v1',
    };

    const result = await this.request<{ id: string; status: string; video_url?: string }>('/v1/generate/text-to-video', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.status === 'completed' ? 100 : result.status === 'processing' ? 50 : 0,
      resultUrl: result.video_url,
      error: result.status === 'failed' ? 'Generation failed' : undefined,
    };
  }

  async getStatus(id: string): Promise<GenerationResponse> {
    const result = await this.request<{ id: string; status: string; progress: number; video_url?: string; error?: string }>(
      `/v1/generate/text-to-video/${id}/status`
    );

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.progress,
      resultUrl: result.video_url,
      error: result.error,
    };
  }

  async cancel(id: string): Promise<void> {
    await this.request(`/v1/generate/text-to-video/${id}/cancel`, {
      method: 'POST',
    });
  }
}