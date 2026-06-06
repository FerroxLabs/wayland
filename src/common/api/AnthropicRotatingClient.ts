/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { default as Anthropic, ClientOptions as AnthropicClientOptions_ } from '@anthropic-ai/sdk';
import { AuthType } from '@office-ai/aioncli-core';
import type { RotatingApiClientOptions } from './RotatingApiClient';
import { RotatingApiClient } from './RotatingApiClient';
import {
  OpenAI2AnthropicConverter,
  type OpenAIChatCompletionParams,
  type OpenAIChatCompletionResponse,
} from './OpenAI2AnthropicConverter';

export interface AnthropicClientConfig {
  model?: string;
  baseURL?: string;
  timeout?: number;
}

// Single-flight Promise cache for the @anthropic-ai/sdk module.
// Defers SDK evaluation until the first real Anthropic call so users
// who don't actively use Claude don't pay its idle RSS cost.
// Exported for cron-aware pre-warming.
let _anthropicCtorPromise: Promise<typeof Anthropic> | null = null;
export function loadAnthropic(): Promise<typeof Anthropic> {
  if (!_anthropicCtorPromise) {
    _anthropicCtorPromise = import('@anthropic-ai/sdk').then((m) => m.default);
  }
  return _anthropicCtorPromise;
}

export class AnthropicRotatingClient extends RotatingApiClient<Anthropic> {
  private readonly config: AnthropicClientConfig;
  private readonly converter: OpenAI2AnthropicConverter;
  // Shared mutable holder. The base-class createClientFn writes resolved
  // SDK config here (during construction and on key rotation);
  // ensureRealClient reads it to materialize the Anthropic instance.
  private readonly configHolder: { current: AnthropicClientOptions_ | null };

  constructor(apiKeys: string, config: AnthropicClientConfig = {}, options: RotatingApiClientOptions = {}) {
    // RotatingApiClient invokes createClientFn synchronously from its
    // constructor, so we cannot await the SDK import there. The
    // placeholder createClient only captures the resolved config; the
    // real Anthropic instance is built lazily in executeWithRetry via
    // loadAnthropic(). The holder is shared by reference with
    // this.configHolder so later writes from initializeClient() (during
    // key rotation) remain observable.
    const configHolder: { current: AnthropicClientOptions_ | null } = { current: null };

    const createClient = (apiKey: string): Anthropic => {
      const cleanedApiKey = apiKey.replace(/[\s\r\n\t]/g, '').trim();
      const clientConfig: AnthropicClientOptions_ = {
        apiKey: cleanedApiKey,
      };
      if (config.baseURL) {
        clientConfig.baseURL = config.baseURL;
      }
      if (config.timeout) {
        clientConfig.timeout = config.timeout;
      }
      configHolder.current = clientConfig;
      // Typed placeholder; the base class only uses this.client as a
      // truthy guard. The real SDK instance is built lazily.
      return {} as Anthropic;
    };

    super(apiKeys, AuthType.USE_ANTHROPIC, createClient, options);
    this.config = config;
    this.configHolder = configHolder;
    this.converter = new OpenAI2AnthropicConverter({
      defaultModel: config.model || 'claude-sonnet-4-20250514',
    });
    // Drop the placeholder so ensureRealClient builds the real SDK
    // instance on first use rather than treating the empty object as
    // initialized. configHolder.current already carries the resolved
    // config from the createClient call inside super().
    this.client = undefined;
  }

  protected getCurrentApiKey(): string | undefined {
    if (this.apiKeyManager?.hasMultipleKeys()) {
      // For Anthropic, try to get from environment first
      return process.env.ANTHROPIC_API_KEY || this.apiKeyManager.getCurrentKey();
    }
    // Use base class method for single key
    return super.getCurrentApiKey();
  }

  // Materialize the real Anthropic client on first use (and after key
  // rotation). Loads the SDK module via the single-flight Promise cache.
  private async ensureRealClient(): Promise<Anthropic> {
    if (!this.client) {
      const cfg = this.configHolder.current;
      if (!cfg) {
        throw new Error('Client not initialized - no valid API key provided');
      }
      const Ctor = await loadAnthropic();
      this.client = new Ctor(cfg);
    }
    return this.client;
  }

  // Override executeWithRetry so SDK loading is deferred until the first
  // call, while preserving the base class's retry + key-rotation semantics.
  override async executeWithRetry<R>(operation: (client: Anthropic) => Promise<R>): Promise<R> {
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

  /**
   * OpenAI-compatible createChatCompletion method for unified interface
   */
  async createChatCompletion(
    params: OpenAIChatCompletionParams,
    options?: { signal?: AbortSignal; timeout?: number }
  ): Promise<OpenAIChatCompletionResponse> {
    // Handle request cancellation
    if (options?.signal?.aborted) {
      throw new Error('Request was aborted');
    }

    return await this.executeWithRetry(async (client) => {
      // Convert OpenAI format to Anthropic format using converter
      const anthropicRequest = this.converter.convertRequest(params);

      // Call Anthropic API
      const anthropicResponse = await client.messages.create(anthropicRequest);

      // Convert Anthropic response back to OpenAI format using converter
      return this.converter.convertResponse(anthropicResponse, params.model);
    });
  }

  /**
   * Direct Anthropic API call for native usage.
   *
   * Defensively applies a prompt-cache breakpoint on the system field so
   * external callers benefit from the 5-minute ephemeral cache turn-to-turn
   * without each call site having to remember the shape. Two cases:
   *  - string system: wrap as a single TextBlockParam with cache_control.
   *  - array system: set cache_control on the LAST block, but only if no
   *    block already carries a cache_control (caller already picked their
   *    breakpoints - don't double-mark).
   * Empty / undefined system is left untouched.
   */
  async createMessage(request: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> {
    let effectiveRequest = request;
    if (typeof request.system === 'string' && request.system.length > 0) {
      const cachedSystem: Anthropic.TextBlockParam[] = [
        { type: 'text' as const, text: request.system, cache_control: { type: 'ephemeral' as const } },
      ];
      effectiveRequest = { ...request, system: cachedSystem };
    } else if (Array.isArray(request.system) && request.system.length > 0) {
      const alreadyCached = request.system.some((b) => b?.cache_control);
      if (!alreadyCached) {
        const next: Anthropic.TextBlockParam[] = request.system.slice();
        const lastIdx = next.length - 1;
        next[lastIdx] = { ...next[lastIdx], cache_control: { type: 'ephemeral' as const } };
        effectiveRequest = { ...request, system: next };
      }
    }

    return await this.executeWithRetry(async (client) => {
      return await client.messages.create(effectiveRequest);
    });
  }
}
