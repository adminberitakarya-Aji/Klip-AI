import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, GenerationStatus, VideoToVideoOptions } from '../types';
import { BaseProvider } from './base';

export class VideoToVideoProvider extends BaseProvider implements AIProvider {
  name = 'video-to-video';

  constructor(config: ProviderConfig) {
    super(config);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const options = request.options as VideoToVideoOptions | undefined;
    
    const payload = {
      prompt: request.prompt,
      video: request.video,
      style: options?.style || 'cinematic',
      strength: options?.strength || 0.7,
      preserve_structure: options?.preserveStructure ?? true,
      model: this.config.model || 'klip-video-v1',
    };

    const result = await this.request<{ id: string; status: string; video_url?: string }>('/v1/generate/video-to-video', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.status === 'completed' ? 100 : result.status === 'processing' ? 50 : 0,
      resultUrl: result.video_url,
      error: result.status === 'failed' ? 'Generation failed' : undefined,
      createdAt: Date.now(),
    };
  }

  async getStatus(id: string): Promise<GenerationResponse> {
    const result = await this.request<{ id: string; status: string; progress: number; video_url?: string; error?: string }>(
      `/v1/generate/video-to-video/${id}/status`
    );

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.progress,
      resultUrl: result.video_url,
      error: result.error,
      createdAt: Date.now(),
    };
  }

  async cancel(id: string): Promise<void> {
    await this.request(`/v1/generate/video-to-video/${id}/cancel`, {
      method: 'POST',
    });
  }
}