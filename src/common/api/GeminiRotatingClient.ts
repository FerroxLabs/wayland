import type { GoogleGenAI as GoogleGenAIType } from '@google/genai';
import { AuthType } from '@office-ai/aioncli-core';
import type { RotatingApiClientOptions } from './RotatingApiClient';
import { RotatingApiClient } from './RotatingApiClient';
import {
  OpenAI2GeminiConverter,
  type OpenAIChatCompletionParams,
  type OpenAIChatCompletionResponse,
} from './OpenAI2GeminiConverter';

export interface GeminiClientConfig {
  model?: string;
  baseURL?: string;
  requestOptions?: Record<string, unknown>;
}

// Single-flight Promise cache for the @google/genai SDK module.
// Defers SDK evaluation (and its ~tens-of-MB heap cost) until the first
// real Gemini call. Exported for cron-aware pre-warming.
let _genaiCtorPromise: Promise<typeof GoogleGenAIType> | null = null;
export function loadGoogleGenAI(): Promise<typeof GoogleGenAIType> {
  if (!_genaiCtorPromise) {
    _genaiCtorPromise = import('@google/genai').then((m) => m.GoogleGenAI);
  }
  return _genaiCtorPromise;
}

type GoogleGenAIClientConfig = {
  apiKey?: string;
  vertexai: boolean;
  baseURL?: string;
};

export class GeminiRotatingClient extends RotatingApiClient<GoogleGenAIType> {
  private readonly config: GeminiClientConfig;
  private readonly converter: OpenAI2GeminiConverter;
  // Shared mutable holder. The base-class createClientFn writes the
  // resolved SDK config here (during construction and on key rotation);
  // ensureRealClient reads it to materialize the GoogleGenAI instance.
  private readonly configHolder: { current: GoogleGenAIClientConfig | null };

  constructor(
    apiKeys: string,
    config: GeminiClientConfig = {},
    options: RotatingApiClientOptions = {},
    authType: AuthType = AuthType.USE_GEMINI
  ) {
    // The base class invokes createClientFn synchronously from its
    // constructor, so we cannot await the SDK import there. The
    // placeholder createClient only captures the resolved config; the
    // real GoogleGenAI instance is built lazily in executeWithRetry via
    // loadGoogleGenAI(). The holder object is shared by reference with
    // `this.configHolder` (assigned after super), so later writes from
    // initializeClient() during key rotation remain observable.
    const configHolder: { current: GoogleGenAIClientConfig | null } = { current: null };

    const createClient = (apiKey: string): GoogleGenAIType => {
      const cleanedApiKey = apiKey.replace(/[\s\r\n\t]/g, '').trim();
      const clientConfig: GoogleGenAIClientConfig = {
        apiKey: cleanedApiKey === '' ? undefined : cleanedApiKey,
        vertexai: authType === AuthType.USE_VERTEX_AI,
      };
      if (config.baseURL) {
        clientConfig.baseURL = config.baseURL;
      }
      configHolder.current = clientConfig;
      // Return a typed placeholder; the base class only uses `this.client`
      // as a truthy guard. The real instance is built lazily.
      return {} as GoogleGenAIType;
    };

    super(apiKeys, authType, createClient, options);
    this.config = config;
    this.configHolder = configHolder;
    this.converter = new OpenAI2GeminiConverter({
      defaultModel: config.model || 'gemini-1.5-flash',
    });
    // Drop the placeholder so ensureRealClient builds the real SDK
    // instance on first use rather than treating the empty object as
    // initialized. configHolder.current already carries the resolved
    // config from the createClient call inside super().
    this.client = undefined;
  }

  protected getCurrentApiKey(): string | undefined {
    if (this.apiKeyManager?.hasMultipleKeys()) {
      // For Gemini, try to get from environment first
      return process.env.GEMINI_API_KEY || this.apiKeyManager.getCurrentKey();
    }
    // Use base class method for single key
    return super.getCurrentApiKey();
  }

  // Materialize the real GoogleGenAI client on first use (and after key
  // rotation). Loads the SDK module via the single-flight Promise cache.
  private async ensureRealClient(): Promise<GoogleGenAIType> {
    if (!this.client) {
      const cfg = this.configHolder.current;
      if (!cfg) {
        throw new Error('Client not initialized - no valid API key provided');
      }
      const Ctor = await loadGoogleGenAI();
      this.client = new Ctor(cfg);
    }
    return this.client;
  }

  // Override executeWithRetry so SDK loading is deferred until the first
  // call, while preserving the base class's retry + key-rotation semantics.
  override async executeWithRetry<R>(operation: (client: GoogleGenAIType) => Promise<R>): Promise<R> {
    let lastError: unknown;

    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        const client = await this.ensureRealClient();
        return await operation(client);
      } catch (error) {
        lastError = error;

        const isLastAttempt = attempt === this.options.maxRetries - 1;
        const canRotateKey = this.apiKeyManager?.hasMultipleKeys() && this.isRetryableError(error) && !isLastAttempt;

        if (canRotateKey && this.apiKeyManager.rotateKey()) {
          // initializeClient calls createClientFn under the hood, which
          // refreshes configHolder.current for the new key. Drop the
          // cached client so the next ensureRealClient rebuilds it.
          this.initializeClient();
          this.client = undefined;
          await this.delay(this.options.retryDelay * (attempt + 1));
          continue;
        }

        if (!this.isRetryableError(error) || isLastAttempt) {
          break;
        }

        await this.delay(this.options.retryDelay * (attempt + 1));
      }
    }

    throw lastError;
  }

  // Basic method for Gemini operations - can be extended as needed
  async generateContent(prompt: string, config?: Record<string, unknown>): Promise<unknown> {
    return await this.executeWithRetry(async (client) => {
      // client is GoogleGenAI, we need client.models to get the content generator
      const model = await client.models.generateContent({
        model: this.config.model || 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        ...config,
      });
      return model;
    });
  }

  // OpenAI-compatible createChatCompletion method for unified interface
  async createChatCompletion(
    params: OpenAIChatCompletionParams,
    options?: { signal?: AbortSignal; timeout?: number }
  ): Promise<OpenAIChatCompletionResponse> {
    // Handle request cancellation
    if (options?.signal?.aborted) {
      throw new Error('Request was aborted');
    }

    return await this.executeWithRetry(async (client) => {
      // Convert OpenAI format to Gemini format using converter
      const geminiRequest = this.converter.convertRequest(params);

      // Call Gemini API
      const geminiResponse = await client.models.generateContent(geminiRequest);

      // Convert Gemini response back to OpenAI format using converter
      return this.converter.convertResponse(geminiResponse, params.model);
    });
  }
}
