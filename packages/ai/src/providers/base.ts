import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, GenerationStatus } from '../types';
import { env } from '@klipai/config';

export abstract class BaseProvider implements AIProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      baseUrl: env.AI_PROVIDER_BASE_URL,
      timeout: 300000,
      ...config,
    };
  }

  abstract name: string;
  abstract generate(request: GenerationRequest): Promise<GenerationResponse>;
  abstract getStatus(id: string): Promise<GenerationResponse>;
  abstract cancel(id: string): Promise<void>;

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected mapStatus(providerStatus: string): GenerationStatus {
    const statusMap: Record<string, GenerationStatus> = {
      'pending': GenerationStatus.QUEUED,
      'queued': GenerationStatus.QUEUED,
      'processing': GenerationStatus.PROCESSING,
      'running': GenerationStatus.PROCESSING,
      'completed': GenerationStatus.COMPLETED,
      'succeeded': GenerationStatus.COMPLETED,
      'failed': GenerationStatus.FAILED,
      'error': GenerationStatus.FAILED,
      'cancelled': GenerationStatus.FAILED,
    };
    return statusMap[providerStatus.toLowerCase()] || GenerationStatus.FAILED;
  }
}
