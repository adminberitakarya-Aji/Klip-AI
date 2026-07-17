import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, GenerationStatus, ImageToImageOptions } from '../types';
import { BaseProvider } from './base';

export class ImageToImageProvider extends BaseProvider implements AIProvider {
  name = 'image-to-image';

  constructor(config: ProviderConfig) {
    super(config);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const options = request.options as ImageToImageOptions | undefined;
    
    const payload = {
      prompt: request.prompt,
      images: request.images || [],
      strength: options?.strength || 0.7,
      preserve_structure: options?.preserveStructure ?? true,
      style: options?.style || 'photorealistic',
      model: this.config.model || 'klip-image-v1',
    };

    const result = await this.request<{ id: string; status: string; image_url?: string }>('/v1/generate/image-to-image', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.status === 'completed' ? 100 : result.status === 'processing' ? 50 : 0,
      resultUrl: result.image_url,
      error: result.status === 'failed' ? 'Generation failed' : undefined,
      createdAt: Date.now(),
    };
  }

  async getStatus(id: string): Promise<GenerationResponse> {
    const result = await this.request<{ id: string; status: string; progress: number; image_url?: string; error?: string }>(
      `/v1/generate/image-to-image/${id}/status`
    );

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.progress,
      resultUrl: result.image_url,
      error: result.error,
      createdAt: Date.now(),
    };
  }

  async cancel(id: string): Promise<void> {
    await this.request(`/v1/generate/image-to-image/${id}/cancel`, {
      method: 'POST',
    });
  }
}