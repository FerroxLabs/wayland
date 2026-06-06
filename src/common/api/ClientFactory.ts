/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@office-ai/aioncli-core';
import type { TProviderWithModel } from '../config/storage';
import { OpenAIRotatingClient, type OpenAIClientConfig } from './OpenAIRotatingClient';
import { GeminiRotatingClient, type GeminiClientConfig } from './GeminiRotatingClient';
import { AnthropicRotatingClient, type AnthropicClientConfig } from './AnthropicRotatingClient';
import type { RotatingApiClientOptions } from './RotatingApiClient';
import { getProviderAuthType } from '../utils/platformAuthType';
import { isNewApiPlatform } from '../utils/platformConstants';

export interface ClientOptions {
  timeout?: number;
  proxy?: string;
  baseConfig?: OpenAIClientConfig | GeminiClientConfig | AnthropicClientConfig;
  rotatingOptions?: RotatingApiClientOptions;
}

export type RotatingClient = OpenAIRotatingClient | GeminiRotatingClient | AnthropicRotatingClient;

/**
 * Normalize base URL for new-api gateway based on target protocol.
 *
 * Strategy: strip all known API path suffixes to get root URL, then add the correct suffix for the target protocol.
 *
 * @param baseUrl Original base URL
 * @param authType Target auth type
 * @returns Normalized base URL
 */
export function normalizeNewApiBaseUrl(baseUrl: string, authType: AuthType): string {
  if (!baseUrl) return baseUrl;

  // 1. Remove trailing slashes, strip all known API path suffixes to get root URL
  const rootUrl = baseUrl
    .replace(/\/+$/, '')
    .replace(/\/v1$/, '')
    .replace(/\/v1beta$/, '');

  // 2. Add the correct path suffix for the target protocol
  switch (authType) {
    case AuthType.USE_OPENAI:
      // OpenAI SDK expects a URL with the /v1 path
      return `${rootUrl}/v1`;
    case AuthType.USE_GEMINI:
    case AuthType.USE_ANTHROPIC:
      // Gemini/Anthropic SDKs need the root URL (they append their own paths)
      return rootUrl;
    default:
      return rootUrl;
  }
}

export class ClientFactory {
  static async createRotatingClient(
    provider: TProviderWithModel,
    options: ClientOptions = {}
  ): Promise<RotatingClient> {
    const authType = getProviderAuthType(provider);
    const rotatingOptions = options.rotatingOptions || { maxRetries: 3, retryDelay: 1000 };

    // Normalize URL for new-api gateway
    const isNewApi = isNewApiPlatform(provider.platform);
    const baseUrl = isNewApi ? normalizeNewApiBaseUrl(provider.baseUrl, authType) : provider.baseUrl;

    switch (authType) {
      case AuthType.USE_OPENAI: {
        const clientConfig: OpenAIClientConfig = {
          baseURL: baseUrl,
          timeout: options.timeout,
          defaultHeaders: {
            'HTTP-Referer': 'https://getwayland.com',
            'X-Title': 'Wayland',
          },
          ...(options.baseConfig as OpenAIClientConfig),
        };

        // Add proxy configuration if provided
        if (options.proxy) {
          const { HttpsProxyAgent } = await import('https-proxy-agent');
          clientConfig.httpAgent = new HttpsProxyAgent(options.proxy);
        }

        return new OpenAIRotatingClient(provider.apiKey, clientConfig, rotatingOptions);
      }

      case AuthType.USE_GEMINI: {
        const clientConfig: GeminiClientConfig = {
          model: provider.useModel,
          baseURL: baseUrl,
          ...(options.baseConfig as GeminiClientConfig),
        };

        return new GeminiRotatingClient(provider.apiKey, clientConfig, rotatingOptions, authType);
      }

      case AuthType.USE_VERTEX_AI: {
        const clientConfig: GeminiClientConfig = {
          model: provider.useModel,
          // Note: Don't set baseURL for Vertex AI - it uses Google's built-in endpoints
          ...(options.baseConfig as GeminiClientConfig),
        };

        return new GeminiRotatingClient(provider.apiKey, clientConfig, rotatingOptions, authType);
      }

      case AuthType.USE_ANTHROPIC: {
        const clientConfig: AnthropicClientConfig = {
          model: provider.useModel,
          baseURL: baseUrl,
          timeout: options.timeout,
          ...(options.baseConfig as AnthropicClientConfig),
        };

        return new AnthropicRotatingClient(provider.apiKey, clientConfig, rotatingOptions);
      }

      default: {
        // Default to OpenAI-compatible protocol
        const clientConfig: OpenAIClientConfig = {
          baseURL: baseUrl,
          timeout: options.timeout,
          defaultHeaders: {
            'HTTP-Referer': 'https://getwayland.com',
            'X-Title': 'Wayland',
          },
          ...(options.baseConfig as OpenAIClientConfig),
        };

        // Add proxy configuration if provided
        if (options.proxy) {
          const { HttpsProxyAgent } = await import('https-proxy-agent');
          clientConfig.httpAgent = new HttpsProxyAgent(options.proxy);
        }

        return new OpenAIRotatingClient(provider.apiKey, clientConfig, rotatingOptions);
      }
    }
  }
}
