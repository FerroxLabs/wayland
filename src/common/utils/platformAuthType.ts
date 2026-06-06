/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@office-ai/aioncli-core';
import { isNewApiPlatform } from './platformConstants';

/**
 * Returns the authentication type corresponding to the given platform name.
 * @param platform Platform name
 * @returns The corresponding AuthType
 */
export function getAuthTypeFromPlatform(platform: string): AuthType {
  const platformLower = platform?.toLowerCase() || '';

  // Gemini-related platforms
  if (platformLower.includes('gemini-with-google-auth')) {
    return AuthType.LOGIN_WITH_GOOGLE;
  }
  if (platformLower.includes('gemini-vertex-ai') || platformLower.includes('vertex-ai')) {
    return AuthType.USE_VERTEX_AI;
  }
  if (platformLower.includes('gemini') || platformLower.includes('google')) {
    return AuthType.USE_GEMINI;
  }

  // Anthropic/Claude-related platforms
  if (platformLower.includes('anthropic') || platformLower.includes('claude')) {
    return AuthType.USE_ANTHROPIC;
  }

  // AWS Bedrock platform
  if (platformLower.includes('bedrock')) {
    return AuthType.USE_BEDROCK;
  }

  // New API gateway defaults to OpenAI-compatible protocol (per-model protocol handled by getProviderAuthType)
  // All other platforms default to OpenAI-compatible protocol
  // Includes: OpenRouter, OpenAI, DeepSeek, new-api, etc.
  return AuthType.USE_OPENAI;
}

/**
 * Returns the auth type for a provider, preferring an explicitly set authType and
 * falling back to inference from the platform name.
 * For the new-api platform, supports per-model protocol overrides.
 * @param provider Provider config containing platform and optional authType
 * @returns The authentication type
 */
export function getProviderAuthType(provider: {
  platform: string;
  authType?: AuthType;
  modelProtocols?: Record<string, string>;
  useModel?: string;
}): AuthType {
  // If authType is explicitly specified, use it directly
  if (provider.authType) {
    return provider.authType;
  }

  // new-api platform: look up per-model protocol override
  if (isNewApiPlatform(provider.platform) && provider.useModel && provider.modelProtocols) {
    const protocol = provider.modelProtocols[provider.useModel];
    if (protocol) {
      return getAuthTypeFromPlatform(protocol);
    }
  }

  // Otherwise infer from platform
  return getAuthTypeFromPlatform(provider.platform);
}
