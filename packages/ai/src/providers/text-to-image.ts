import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, GenerationStatus, TextToImageOptions } from '../types';
import { BaseProvider } from './base';

export class TextToImageProvider extends BaseProvider implements AIProvider {
  name = 'text-to-image';

  constructor(config: ProviderConfig) {
    super(config);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const options = request.options as TextToImageOptions | undefined;
    
    const payload = {
      prompt: request.prompt,
      aspect_ratio: options?.aspectRatio || '1:1',
      resolution: options?.resolution || '1024',
      style: options?.style || 'photorealistic',
      negative_prompt: options?.negativePrompt,
      model: this.config.model || 'klip-image-v1',
    };

    const result = await this.request<{ id: string; status: string; image_url?: string }>('/v1/generate/text-to-image', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.status === 'completed' ? 100 : result.status === 'processing' ? 50 : 0,
      resultUrl: result.image_url,
      error: result.status === 'failed' ? 'Generation failed' : undefined,
    };
  }

  async getStatus(id: string): Promise<GenerationResponse> {
    const result = await this.request<{ id: string; status: string; progress: number; image_url?: string; error?: string }>(
      `/v1/generate/text-to-image/${id}/status`
    );

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.progress,
      resultUrl: result.image_url,
      error: result.error,
    };
  }

  async cancel(id: string): Promise<void> {
    await this.request(`/v1/generate/text-to-image/${id}/cancel`, {
      method: 'POST',
    });
  }
}