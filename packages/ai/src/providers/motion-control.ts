import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, GenerationStatus, MotionControlOptions } from '../types';
import { BaseProvider } from './base';

export class MotionControlProvider extends BaseProvider implements AIProvider {
  name = 'motion-control';

  constructor(config: ProviderConfig) {
    super(config);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const options = request.options as MotionControlOptions | undefined;
    
    const payload = {
      prompt: request.prompt,
      trajectory: options?.trajectory || 'linear',
      keyframes: options?.keyframes || [],
      model: this.config.model || 'klip-motion-v1',
    };

    const result = await this.request<{ id: string; status: string; video_url?: string }>('/v1/generate/motion-control', {
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
      `/v1/generate/motion-control/${id}/status`
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
    await this.request(`/v1/generate/motion-control/${id}/cancel`, {
      method: 'POST',
    });
  }
}