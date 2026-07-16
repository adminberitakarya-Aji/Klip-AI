import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, GenerationStatus, ImageToVideoOptions } from '../types';
import { BaseProvider } from './base';

export class ImageToVideoProvider extends BaseProvider implements AIProvider {
  name = 'image-to-video';

  constructor(config: ProviderConfig) {
    super(config);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const options = request.options as ImageToVideoOptions | undefined;
    
    const payload = {
      prompt: request.prompt,
      images: request.images || [],
      motion_strength: options?.motionStrength || 0.5,
      camera_motion: options?.cameraMotion || 'static',
      duration: options?.duration || 6,
      model: this.config.model || 'klip-video-v1',
    };

    const result = await this.request<{ id: string; status: string; video_url?: string }>('/v1/generate/image-to-video', {
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
      `/v1/generate/image-to-video/${id}/status`
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
    await this.request(`/v1/generate/image-to-video/${id}/cancel`, {
      method: 'POST',
    });
  }
}