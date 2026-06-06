import type OpenAIType from 'openai';
import { AuthType } from '@office-ai/aioncli-core';
import type { RotatingApiClientOptions } from './RotatingApiClient';
import { RotatingApiClient } from './RotatingApiClient';

export interface OpenAIClientConfig {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  httpAgent?: unknown;
}

// Single-flight Promise cache so the OpenAI SDK module is evaluated at most
// once, and only after the first provider call. Defers ~MB of module
// evaluation from main-process startup. Exported for the cron-aware
// pre-warm wiring.
let _openaiCtorPromise: Promise<typeof OpenAIType> | null = null;
export function loadOpenAI(): Promise<typeof OpenAIType> {
  if (!_openaiCtorPromise) {
    _openaiCtorPromise = import('openai').then((m) => m.default);
  }
  return _openaiCtorPromise;
}

export class OpenAIRotatingClient extends RotatingApiClient<OpenAIType> {
  private readonly baseConfig: OpenAIClientConfig;
  private _ensureClientPromise: Promise<void> | null = null;

  constructor(apiKeys: string, config: OpenAIClientConfig = {}, options: RotatingApiClientOptions = {}) {
    // The createClient fn is invoked lazily from ensureClient(); the synchronous
    // path in the base class's initializeClient() is suppressed via the override
    // below, so this closure runs only after the SDK module has loaded.
    let CtorRef: typeof OpenAIType | null = null;
    const createClient = (apiKey: string) => {
      if (!CtorRef) {
        throw new Error('OpenAI SDK not loaded - ensureClient() must run before createClient()');
      }
      const cleanedApiKey = apiKey.replace(/[\s\r\n\t]/g, '').trim();
      const openaiConfig: any = {
        baseURL: config.baseURL,
        apiKey: cleanedApiKey,
        defaultHeaders: config.defaultHeaders,
      };

      if (config.httpAgent) {
        openaiConfig.httpAgent = config.httpAgent;
      }

      return new CtorRef(openaiConfig);
    };

    super(apiKeys, AuthType.USE_OPENAI, createClient, options);
    this.baseConfig = config;

    // Stash the Ctor setter so ensureClient() can populate it before
    // invoking the (already-stored) createClientFn from the base class.
    (this as any)._setCtor = (C: typeof OpenAIType) => {
      CtorRef = C;
    };
  }

  // Suppress the base class's synchronous initializeClient() - we defer
  // SDK evaluation and client construction to the first executeWithRetry().
  protected override initializeClient(): void {
    // no-op; lazy init happens in ensureClient()
  }

  private ensureClient(): Promise<void> {
    if (this.client) return Promise.resolve();
    if (!this._ensureClientPromise) {
      this._ensureClientPromise = (async () => {
        const Ctor = await loadOpenAI();
        (this as any)._setCtor(Ctor);
        // Delegate to the base class's sync initializer now that Ctor is set.
        super.initializeClient();
      })();
    }
    return this._ensureClientPromise;
  }

  override async executeWithRetry<R>(operation: (client: OpenAIType) => Promise<R>): Promise<R> {
    await this.ensureClient();
    return super.executeWithRetry(operation);
  }

  protected getCurrentApiKey(): string | undefined {
    if (this.apiKeyManager?.hasMultipleKeys()) {
      // For OpenAI, try to get from environment first
      return process.env.OPENAI_API_KEY || this.apiKeyManager.getCurrentKey();
    }
    // Use base class method for single key
    return super.getCurrentApiKey();
  }

  // Convenience methods for common OpenAI operations
  async createChatCompletion(
    params: OpenAIType.Chat.Completions.ChatCompletionCreateParams,
    options?: OpenAIType.RequestOptions
  ): Promise<OpenAIType.Chat.Completions.ChatCompletion> {
    return await this.executeWithRetry(async (client) => {
      const result = await client.chat.completions.create(params, options);
      return result as OpenAIType.Chat.Completions.ChatCompletion;
    });
  }

  async createImage(
    params: OpenAIType.Images.ImageGenerateParams,
    options?: OpenAIType.RequestOptions
  ): Promise<OpenAIType.Images.ImagesResponse> {
    return await this.executeWithRetry((client) => {
      return client.images.generate(params, options) as Promise<OpenAIType.Images.ImagesResponse>;
    });
  }

  async createEmbedding(
    params: OpenAIType.Embeddings.EmbeddingCreateParams,
    options?: OpenAIType.RequestOptions
  ): Promise<OpenAIType.Embeddings.CreateEmbeddingResponse> {
    return await this.executeWithRetry((client) => {
      return client.embeddings.create(params, options);
    });
  }
}
