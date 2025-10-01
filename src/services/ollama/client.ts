/**
 * T024: Ollama API client
 * HTTP client for communicating with Ollama service
 */

import { logger } from '../../lib/logger.js';
import { AIModelError } from '../../lib/errors.js';

export interface OllamaConfig {
  host: string;
  timeout?: number;
}

const DEFAULT_CONFIG: OllamaConfig = {
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
  timeout: 120000, // 2 minutes
};

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  images?: string[]; // Base64 encoded images
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaListResponse {
  models: OllamaModel[];
}

/**
 * Ollama API client class
 */
export class OllamaClient {
  private config: OllamaConfig;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info('Ollama client initialized', { host: this.config.host });
  }

  /**
   * Generates a response from a model
   */
  async generate(
    request: OllamaGenerateRequest,
    requestId?: string
  ): Promise<OllamaGenerateResponse> {
    logger.info('Ollama generate request', {
      model: request.model,
      hasImages: !!request.images?.length,
      requestId,
    });

    try {
      const response = await fetch(`${this.config.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, stream: false }),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIModelError(
          request.model,
          `HTTP ${response.status}: ${errorText}`,
          requestId
        );
      }

      const data = (await response.json()) as OllamaGenerateResponse;

      logger.info('Ollama generate response received', {
        model: request.model,
        responseLength: data.response.length,
        totalDuration: data.total_duration,
        requestId,
      });

      return data;
    } catch (error) {
      logger.error('Ollama generate failed', {
        model: request.model,
        error,
        requestId,
      });

      if (error instanceof AIModelError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new AIModelError(
            request.model,
            'Request timeout - model may be loading or overloaded',
            requestId
          );
        }

        if (error.message.includes('ECONNREFUSED')) {
          throw new AIModelError(
            request.model,
            'Cannot connect to Ollama service - ensure it is running',
            requestId
          );
        }
      }

      throw new AIModelError(
        request.model,
        error instanceof Error ? error.message : String(error),
        requestId
      );
    }
  }

  /**
   * Lists available models
   */
  async listModels(requestId?: string): Promise<OllamaModel[]> {
    logger.debug('Listing Ollama models', { requestId });

    try {
      const response = await fetch(`${this.config.host}/api/tags`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as OllamaListResponse;
      logger.debug('Ollama models listed', { count: data.models.length, requestId });

      return data.models;
    } catch (error) {
      logger.error('Failed to list Ollama models', { error, requestId });

      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new AIModelError(
          'ollama',
          'Cannot connect to Ollama service',
          requestId
        );
      }

      throw new AIModelError(
        'ollama',
        error instanceof Error ? error.message : String(error),
        requestId
      );
    }
  }

  /**
   * Checks if a specific model is available
   */
  async isModelAvailable(modelName: string, requestId?: string): Promise<boolean> {
    try {
      const models = await this.listModels(requestId);
      return models.some((model) => model.name === modelName);
    } catch (error) {
      logger.warn('Failed to check model availability', { modelName, error, requestId });
      return false;
    }
  }

  /**
   * Health check for Ollama service
   */
  async healthCheck(requestId?: string): Promise<{
    available: boolean;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.host}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        logger.debug('Ollama health check passed', { responseTime, requestId });
        return { available: true, responseTime };
      }

      return {
        available: false,
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.warn('Ollama health check failed', { responseTime, error, requestId });

      return {
        available: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Gets model information
   */
  async getModelInfo(modelName: string, requestId?: string): Promise<OllamaModel | null> {
    try {
      const models = await this.listModels(requestId);
      return models.find((model) => model.name === modelName) || null;
    } catch (error) {
      logger.error('Failed to get model info', { modelName, error, requestId });
      return null;
    }
  }
}

// Export singleton instance
export const ollamaClient = new OllamaClient();
