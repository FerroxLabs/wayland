/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProvider } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import {
  type ProtocolDetectionRequest,
  type ProtocolDetectionResponse,
  type ProtocolType,
  type MultiKeyTestResult,
  parseApiKeys,
  maskApiKey,
  normalizeBaseUrl,
  removeApiPathSuffix,
  guessProtocolFromUrl,
  guessProtocolFromKey,
  getProtocolDisplayName,
} from '@/common/utils/protocolDetector';
import { isGoogleApisHost } from '@/common/utils/urlValidation';
import type OpenAIType from 'openai';
import { isNewApiPlatform } from '@/common/utils/platformConstants';
import { ipcBridge } from '@/common';
import { ProcessConfig } from '@process/utils/initStorage';
import { ExtensionRegistry } from '@process/extensions';
import type {
  BedrockClient as BedrockClientType,
  ListInferenceProfilesCommand as ListInferenceProfilesCommandType,
} from '@aws-sdk/client-bedrock';

// Single-flight Promise caches for the AI SDK modules used here.
// Defer evaluation of the openai + @aws-sdk/client-bedrock packages
// until the first probe call. Reduces main-process idle RSS for users
// who haven't configured these providers. Exported for cron-aware
// pre-warming.
let _openaiCtorPromise: Promise<typeof OpenAIType> | null = null;
export function loadOpenAI(): Promise<typeof OpenAIType> {
  if (!_openaiCtorPromise) {
    _openaiCtorPromise = import('openai').then((m) => m.default);
  }
  return _openaiCtorPromise;
}

type BedrockModule = {
  BedrockClient: typeof BedrockClientType;
  ListInferenceProfilesCommand: typeof ListInferenceProfilesCommandType;
};
let _bedrockModulePromise: Promise<BedrockModule> | null = null;
export function loadAwsBedrock(): Promise<BedrockModule> {
  if (!_bedrockModulePromise) {
    _bedrockModulePromise = import('@aws-sdk/client-bedrock').then((m) => ({
      BedrockClient: m.BedrockClient,
      ListInferenceProfilesCommand: m.ListInferenceProfilesCommand,
    }));
  }
  return _bedrockModulePromise;
}

/**
 * Minimal completion-token request used for connectivity / auth probes.
 * Probes exist only to verify that the endpoint responds and the
 * credentials are accepted — we never read the completion content, so a
 * 1-token cap keeps the round-trip cheap and prevents the model from
 * actually doing work. Applied at every probe call site in this file.
 *
 * Extracted from three call sites (HC-4 — see audit at
 * .blackboard/audits/hard-coded-values.md).
 */
const PROBE_MAX_TOKENS = 1;

/**
 * Common path patterns for OpenAI-compatible APIs
 *
 * Used to auto-fix user-provided base URLs, easy to maintain and extend
 */
const API_PATH_PATTERNS = [
  '/v1', // Standard: OpenAI, DeepSeek, Moonshot, Mistral, SiliconFlow, Xunfei Spark, Tencent Hunyuan
  '/api/v1', // Proxy: OpenRouter
  '/openai/v1', // Groq
  '/compatible-mode/v1', // Alibaba Cloud DashScope
  '/compatibility/v1', // Cohere
  '/v2', // Baidu Qianfan
  '/api/v3', // Volcengine Ark
  '/api/paas/v4', // Zhipu
];

/**
 * Bedrock model ID to friendly name mapping
 * Maps AWS Bedrock model IDs to user-friendly display names
 */
const BEDROCK_MODEL_NAMES: Record<string, string> = {
  'anthropic.claude-opus-4-5-20251101-v1:0': 'Claude Opus 4.5',
  'anthropic.claude-sonnet-4-5-20250929-v1:0': 'Claude Sonnet 4.5',
  'anthropic.claude-haiku-4-5-20251001-v1:0': 'Claude Haiku 4.5',
  'anthropic.claude-sonnet-4-20250514-v1:0': 'Claude Sonnet 4',
  'anthropic.claude-3-7-sonnet-20250219-v1:0': 'Claude 3.7 Sonnet',
  'anthropic.claude-3-5-sonnet-20241022-v2:0': 'Claude 3.5 Sonnet v2',
  'anthropic.claude-3-5-sonnet-20240620-v1:0': 'Claude 3.5 Sonnet',
  'anthropic.claude-3-opus-20240229-v1:0': 'Claude 3 Opus',
  'anthropic.claude-3-sonnet-20240229-v1:0': 'Claude 3 Sonnet',
  'anthropic.claude-3-sonnet-20240229-v1:0:28k': 'Claude 3 Sonnet (28k)',
  'anthropic.claude-3-sonnet-20240229-v1:0:200k': 'Claude 3 Sonnet (200k)',
  'anthropic.claude-3-haiku-20240307-v1:0': 'Claude 3 Haiku',
};

/**
 * Get friendly display name for a Bedrock model ID
 * @param modelId - The Bedrock model ID
 * @returns The friendly display name, or the original ID if not found
 */
function getBedrockModelDisplayName(modelId: string): string {
  return BEDROCK_MODEL_NAMES[modelId] || modelId;
}

/**
 * Get all model providers with extension contributions merged in.
 * Shared between IPC bridge (renderer) and process-layer callers (e.g. team prompts).
 */
export async function getMergedModelProviders(): Promise<IProvider[]> {
  try {
    const data = await ProcessConfig.get('model.config');
    const sourceList = Array.isArray(data) ? data : [];

    // Handle migration from old IModel format to new IProvider format
    const normalizedProviders = sourceList.map((v: any) => {
      if ('selectedModel' in v && !('useModel' in v)) {
        return {
          ...v,
          useModel: v.selectedModel,
          id: v.id || uuid(),
          capabilities: v.capabilities || [],
          contextLimit: v.contextLimit,
        } as IProvider;
      }
      return {
        ...v,
        id: v.id || uuid(),
        useModel: v.useModel || v.selectedModel || '',
      } as IProvider;
    });

    // Merge extension-contributed model providers
    try {
      const registry = ExtensionRegistry.getInstance();
      const extensionProviders = registry.getModelProviders();
      if (!extensionProviders || extensionProviders.length === 0) {
        return normalizedProviders;
      }

      const extensionIds = new Set(extensionProviders.map((provider) => provider.id));
      const userProviders = normalizedProviders.filter((provider) => !extensionIds.has(provider.id));

      const mergedExtensionProviders: IProvider[] = extensionProviders.map((provider) => {
        const existing = normalizedProviders.find((item) => item.id === provider.id);
        return {
          ...existing,
          id: provider.id,
          platform: provider.platform,
          name: provider.name,
          baseUrl: existing?.baseUrl || provider.baseUrl || '',
          apiKey: existing?.apiKey || '',
          model: Array.isArray(existing?.model) && existing.model.length > 0 ? existing.model : provider.models,
          enabled: existing?.enabled ?? true,
        } as IProvider;
      });

      return [...userProviders, ...mergedExtensionProviders];
    } catch (error) {
      console.warn('[ModelBridge] Failed to merge extension model providers:', error);
      return normalizedProviders;
    }
  } catch {
    return [];
  }
}

export function initModelBridge(): void {
  ipcBridge.mode.fetchModelList.provider(async function fetchModelList({
    base_url,
    api_key,
    try_fix,
    platform,
    bedrockConfig,
  }): Promise<{
    success: boolean;
    msg?: string;
    data?: { mode: Array<string | { id: string; name: string }>; fix_base_url?: string };
  }> {
    // If multiple keys (comma or newline separated), use only the first one
    let actualApiKey = api_key?.trim();
    if (actualApiKey && (actualApiKey.includes(',') || actualApiKey.includes('\n'))) {
      actualApiKey = actualApiKey.split(/[,\n]/)[0].trim();
    }

    // For Vertex AI platform, return the supported model list directly
    if (platform?.includes('vertex-ai')) {
      console.log('Using Vertex AI model list');
      const vertexAIModels = ['gemini-2.5-pro', 'gemini-2.5-flash'];
      return { success: true, data: { mode: vertexAIModels } };
    }

    // MiniMax does not provide /v1/models endpoint (verified 2026-02), return hardcoded list
    // For MiniMax platform, return the supported model list directly
    if (base_url && isMiniMaxAPI(base_url)) {
      console.log('Using MiniMax model list (text models only)');
      const minimaxModels = [
        // Text/Chat Models - For conversational AI use
        'MiniMax-M2.7',
        'MiniMax-M2.5',
        'MiniMax-M2.1', // 230B params, 10B active - Best for programming & reasoning (~60 tokens/sec)
        'MiniMax-M2.1-lightning', // Same as M2.1 but faster (~100 tokens/sec)
        'MiniMax-M2', // 200k context, 128k output - Complex reasoning & function calling
        'M2-her', // Role-play & character-driven conversations
      ];
      return { success: true, data: { mode: minimaxModels } };
    }

    // DashScope Coding Plan does not provide /v1/models endpoint (returns 404)
    // Validate API key via /chat/completions probe, then return hardcoded list
    if (base_url && isDashScopeCodingAPI(base_url)) {
      const codingPlanModels = [
        'qwen3-coder-plus',
        'qwen3-coder-next',
        'qwen3.5-plus',
        'qwen3-max-2026-01-23',
        'glm-4.7',
        'glm-5',
        'MiniMax-M2.5',
        'kimi-k2.5',
      ];

      // Validate the API key by probing the chat/completions endpoint
      if (actualApiKey) {
        try {
          const probeUrl = `${base_url.replace(/\/+$/, '')}/chat/completions`;
          const probeResponse = await fetch(probeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actualApiKey}` },
            body: JSON.stringify({
              model: codingPlanModels[0],
              messages: [{ role: 'user', content: 'hi' }],
              max_tokens: PROBE_MAX_TOKENS,
            }),
          });
          if (probeResponse.status === 401) {
            const errorData = await probeResponse.json().catch(() => ({}));
            const errorMsg = errorData?.error?.message || errorData?.message || 'Invalid API key or token expired';
            return { success: false, msg: errorMsg };
          }
        } catch {
          // Network error during probe - still return model list, user will see error when chatting
        }
      }

      return { success: true, data: { mode: codingPlanModels } };
    }

    // For Anthropic/Claude platform, use Anthropic API to fetch models
    if (platform?.includes('anthropic') || platform?.includes('claude')) {
      try {
        const anthropicUrl = base_url ? `${base_url}/v1/models` : 'https://api.anthropic.com/v1/models';

        const response = await fetch(anthropicUrl, {
          headers: {
            'x-api-key': actualApiKey,
            'anthropic-version': '2023-06-01',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid response format');
        }

        // Extract model IDs from response
        const modelList = data.data.map((model: { id: string }) => model.id);

        return { success: true, data: { mode: modelList } };
      } catch (e: unknown) {
        // Fall back to default model list on API failure
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.warn('Failed to fetch Anthropic models via API, falling back to default list:', errorMessage);
        const defaultAnthropicModels = [
          'claude-sonnet-4-20250514',
          'claude-opus-4-20250514',
          'claude-3-7-sonnet-20250219',
          'claude-3-haiku-20240307',
        ];
        return { success: true, data: { mode: defaultAnthropicModels } };
      }
    }

    // For New API gateway, use OpenAI-compatible protocol to fetch model list
    // new-api exposes standard /v1/models endpoint, use OpenAI path directly
    if (isNewApiPlatform(platform)) {
      // Validate API key before creating OpenAI client to avoid unhandled 'Missing credentials' error
      if (!actualApiKey) {
        return { success: false, msg: 'API key is required. Please configure your API key in settings.' };
      }

      // Ensure base_url has /v1 suffix
      let openaiBaseUrl = base_url?.replace(/\/+$/, '') || '';
      if (openaiBaseUrl && !openaiBaseUrl.endsWith('/v1')) {
        openaiBaseUrl = `${openaiBaseUrl}/v1`;
      }

      try {
        const OpenAICtor = await loadOpenAI();
        const openai = new OpenAICtor({
          baseURL: openaiBaseUrl,
          apiKey: actualApiKey,
          defaultHeaders: {
            'User-Agent': 'Wayland/1.0',
          },
        });

        const res = await openai.models.list();
        if (res.data?.length === 0) {
          throw new Error('Invalid response: empty data');
        }
        return { success: true, data: { mode: res.data.map((v) => v.id) } };
      } catch (e: any) {
        return { success: false, msg: e.message || e.toString() };
      }
    }

    // For AWS Bedrock platform, use AWS API to dynamically fetch model list
    if (platform?.includes('bedrock') && bedrockConfig?.region) {
      try {
        const region = bedrockConfig.region;

        // Store original environment variables
        const originalEnv = {
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
          AWS_PROFILE: process.env.AWS_PROFILE,
          AWS_REGION: process.env.AWS_REGION,
        };

        try {
          // Set environment variables based on auth method
          if (bedrockConfig.authMethod === 'accessKey') {
            process.env.AWS_ACCESS_KEY_ID = bedrockConfig.accessKeyId;
            process.env.AWS_SECRET_ACCESS_KEY = bedrockConfig.secretAccessKey;
            delete process.env.AWS_PROFILE;
          } else if (bedrockConfig.authMethod === 'profile') {
            process.env.AWS_PROFILE = bedrockConfig.profile;
            delete process.env.AWS_ACCESS_KEY_ID;
            delete process.env.AWS_SECRET_ACCESS_KEY;
          }
          process.env.AWS_REGION = region;

          // Create Bedrock client (SDK module loaded lazily)
          const { BedrockClient: BedrockCtor, ListInferenceProfilesCommand: ListInferenceProfilesCmd } = await loadAwsBedrock();
          const bedrockClient = new BedrockCtor({ region });

          // List inference profiles (cross-region inference endpoints)
          const command = new ListInferenceProfilesCmd({});
          const response = await bedrockClient.send(command);

          // Filter inference profiles that contain Claude models
          const inferenceProfiles = response.inferenceProfileSummaries || [];
          const claudeProfiles = inferenceProfiles.filter((profile) =>
            profile.inferenceProfileId?.includes('anthropic.claude')
          );

          if (claudeProfiles.length === 0) {
            return {
              success: false,
              msg: `No Claude models available in region ${region}. Try a different region.`,
            };
          }

          // Map to objects with friendly names
          const modelsWithNames = claudeProfiles.map((profile) => ({
            id: profile.inferenceProfileId || '',
            name: getBedrockModelDisplayName(profile.inferenceProfileId || ''),
          }));

          return { success: true, data: { mode: modelsWithNames } };
        } finally {
          // Restore original environment variables
          if (originalEnv.AWS_ACCESS_KEY_ID !== undefined) {
            process.env.AWS_ACCESS_KEY_ID = originalEnv.AWS_ACCESS_KEY_ID;
          } else {
            delete process.env.AWS_ACCESS_KEY_ID;
          }
          if (originalEnv.AWS_SECRET_ACCESS_KEY !== undefined) {
            process.env.AWS_SECRET_ACCESS_KEY = originalEnv.AWS_SECRET_ACCESS_KEY;
          } else {
            delete process.env.AWS_SECRET_ACCESS_KEY;
          }
          if (originalEnv.AWS_PROFILE !== undefined) {
            process.env.AWS_PROFILE = originalEnv.AWS_PROFILE;
          } else {
            delete process.env.AWS_PROFILE;
          }
          if (originalEnv.AWS_REGION !== undefined) {
            process.env.AWS_REGION = originalEnv.AWS_REGION;
          } else {
            delete process.env.AWS_REGION;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          msg: `Failed to fetch Bedrock models: ${errorMessage}`,
        };
      }
    }

    // For Gemini platform, use Gemini API protocol
    if (platform?.includes('gemini')) {
      try {
        // Use custom base_url or default Gemini endpoint
        const geminiBaseUrlRaw = base_url?.replace(/\/+$/, '') || 'https://generativelanguage.googleapis.com';
        const geminiBaseUrl = geminiBaseUrlRaw.replace(/\/(v1beta|v1)$/, '');
        const geminiUrl = `${geminiBaseUrl}/v1beta/models?key=${encodeURIComponent(actualApiKey)}`;

        const response = await fetch(geminiUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.models || !Array.isArray(data.models)) {
          throw new Error('Invalid response format');
        }

        // Extract model names, remove "models/" prefix
        const modelList = data.models.map((model: { name: string }) => {
          const name = model.name;
          return name.startsWith('models/') ? name.substring(7) : name;
        });

        return { success: true, data: { mode: modelList } };
      } catch (e: any) {
        // For Gemini platform, fall back to default model list on API failure
        if (platform?.includes('gemini')) {
          console.warn('Failed to fetch Gemini models via API, falling back to default list:', e.message);
          const defaultGeminiModels = ['gemini-2.5-pro', 'gemini-2.5-flash'];
          return { success: true, data: { mode: defaultGeminiModels } };
        }
        return { success: false, msg: e.message || e.toString() };
      }
    }

    // Validate API key before creating OpenAI client to avoid unhandled 'Missing credentials' error
    if (!actualApiKey) {
      return { success: false, msg: 'API key is required. Please configure your API key in settings.' };
    }

    try {
      const OpenAICtor = await loadOpenAI();
      const openai = new OpenAICtor({
        baseURL: base_url,
        apiKey: actualApiKey,
        // Use custom User-Agent to avoid some API proxies (like packyapi) blocking OpenAI SDK's default User-Agent
        defaultHeaders: {
          'User-Agent': 'Wayland/1.0',
        },
      });

      const res = await openai.models.list();
      // Check if response data is valid, LM Studio returns empty data on failure
      if (res.data?.length === 0) {
        throw new Error('Invalid response: empty data');
      }
      return { success: true, data: { mode: res.data.map((v) => v.id) } };
    } catch (e) {
      const errRes = { success: false, msg: e.message || e.toString() };

      if (!try_fix) return errRes;

      // If it's a clear API key issue, return error directly without trying to fix URL
      // Note: 403 could be URL error (missing /v1) or permission issue, need to check error message
      const isAuthError =
        e.status === 401 ||
        e.message?.includes('401') ||
        e.message?.includes('Unauthorized') ||
        e.message?.includes('Invalid API key');
      const isPermissionError =
        e.message?.includes('已被禁用') ||
        e.message?.includes('disabled') ||
        e.message?.includes('quota') ||
        e.message?.includes('rate limit');
      if (isAuthError || isPermissionError) {
        return errRes;
      }

      // User's URL request failed, try multiple possible URL formats with priority
      let url: URL;
      try {
        url = new URL(base_url);
      } catch {
        return { success: false, msg: `Invalid URL: ${base_url}` };
      }
      const pathname = url.pathname.replace(/\/+$/, ''); // Remove trailing slashes
      const base = `${url.protocol}//${url.host}`;

      // Build prioritized candidate URL list
      // Priority 1: User path variants
      const userPathUrls = new Set<string>();
      // Priority 2: Standard API path patterns
      const standardUrls = new Set<string>();

      // 1. User path + common suffixes (for proxy scenarios)
      if (pathname && pathname !== '/') {
        userPathUrls.add(`${base}${pathname}/v1`);
        // Also try user's path itself (might just be missing trailing slash)
        userPathUrls.add(`${base}${pathname}`);
      }

      // 2. Try all known API path patterns
      API_PATH_PATTERNS.forEach((pattern) => standardUrls.add(`${base}${pattern}`));

      // Remove original URL (already tried)
      userPathUrls.delete(base_url);
      standardUrls.delete(base_url);

      const tryFetch = (candidateUrl: string) =>
        fetchModelList({ base_url: candidateUrl, api_key: api_key, try_fix: false }).then((res) => {
          if (res.success) {
            return { ...res, data: { mode: res.data.mode, fix_base_url: candidateUrl } };
          }
          return Promise.reject(res);
        });

      // Implement Promise.any: resolve on first success, reject only if all fail
      const promiseAny = <T>(promises: Promise<T>[]): Promise<T> =>
        new Promise((resolve, reject) => {
          let rejectCount = 0;
          if (promises.length === 0) {
            reject(new Error('No promises to try'));
            return;
          }
          promises.forEach((p) =>
            p.then(resolve).catch(() => {
              rejectCount++;
              if (rejectCount === promises.length) reject(new Error('All promises rejected'));
            })
          );
        });

      // Try in priority order: user path variants first, then standard patterns
      try {
        // Priority 1: Try user path variants in parallel
        if (userPathUrls.size > 0) {
          try {
            return await promiseAny([...userPathUrls].map(tryFetch));
          } catch {
            // User path variants all failed, continue to standard patterns
          }
        }

        // Priority 2: Try standard API path patterns in parallel
        if (standardUrls.size > 0) {
          return await promiseAny([...standardUrls].map(tryFetch));
        }

        return errRes;
      } catch {
        // All attempts failed, return original error
        return errRes;
      }
    }
  });

  ipcBridge.mode.saveModelConfig.provider((models) => {
    return ProcessConfig.set('model.config', models)
      .then(() => {
        return { success: true };
      })
      .catch((e) => {
        return { success: false, msg: e.message || e.toString() };
      });
  });

  ipcBridge.mode.getModelConfig.provider(() => getMergedModelProviders());

  // Protocol detection implementation
  ipcBridge.mode.detectProtocol.provider(async function detectProtocol(
    request: ProtocolDetectionRequest
  ): Promise<{ success: boolean; msg?: string; data?: ProtocolDetectionResponse }> {
    const {
      baseUrl: rawBaseUrl,
      apiKey: apiKeyString,
      timeout = 10000,
      testAllKeys = false,
      preferredProtocol,
    } = request;

    const baseUrl = normalizeBaseUrl(rawBaseUrl);
    const baseUrlCandidates = buildBaseUrlCandidates(baseUrl);
    const apiKeys = parseApiKeys(apiKeyString);

    if (!baseUrl) {
      return {
        success: false,
        msg: 'Base URL is required',
        data: {
          success: false,
          protocol: 'unknown',
          confidence: 0,
          error: 'Base URL is required',
        },
      };
    }

    if (apiKeys.length === 0) {
      return {
        success: false,
        msg: 'API Key is required',
        data: {
          success: false,
          protocol: 'unknown',
          confidence: 0,
          error: 'API Key is required',
        },
      };
    }

    const firstKey = apiKeys[0];

    // Smart prediction: guess protocol from URL and key format
    const urlGuess = guessProtocolFromUrl(baseUrl);
    const keyGuess = guessProtocolFromKey(firstKey);

    // Determine test order: prioritize guessed protocols
    const protocolsToTest: ProtocolType[] = [];

    if (preferredProtocol && preferredProtocol !== 'unknown') {
      protocolsToTest.push(preferredProtocol);
    }
    if (urlGuess && !protocolsToTest.includes(urlGuess)) {
      protocolsToTest.push(urlGuess);
    }
    if (keyGuess && !protocolsToTest.includes(keyGuess)) {
      protocolsToTest.push(keyGuess);
    }
    // Add remaining protocols
    for (const p of ['gemini', 'openai', 'anthropic'] as ProtocolType[]) {
      if (!protocolsToTest.includes(p)) {
        protocolsToTest.push(p);
      }
    }

    let detectedProtocol: ProtocolType = 'unknown';
    let confidence = 0;
    let models: string[] = [];
    let detectionError: string | undefined;
    let fixedBaseUrl: string | undefined;
    let detectedBaseUrl: string | undefined;

    // Test each protocol in order
    for (const protocol of protocolsToTest) {
      for (const candidateBaseUrl of baseUrlCandidates) {
        const result = await testProtocol(candidateBaseUrl, firstKey, protocol, timeout);

        if (result.success) {
          detectedProtocol = protocol;
          confidence = result.confidence;
          models = result.models || [];
          fixedBaseUrl = result.fixedBaseUrl;
          detectedBaseUrl = candidateBaseUrl;
          break;
        } else if (!detectionError) {
          detectionError = result.error;
        }
      }
      if (detectedProtocol !== 'unknown') {
        break;
      }
    }

    // Multi-key testing
    let multiKeyResult: MultiKeyTestResult | undefined;
    const baseUrlForTesting = detectedBaseUrl || baseUrlCandidates[0] || baseUrl;
    if (testAllKeys && apiKeys.length > 1 && detectedProtocol !== 'unknown') {
      multiKeyResult = await testMultipleKeys(baseUrlForTesting, apiKeys, detectedProtocol, timeout);
    }

    // Generate suggestion
    const suggestion = generateSuggestion(detectedProtocol, confidence, baseUrlForTesting, detectionError);

    const response: ProtocolDetectionResponse = {
      success: detectedProtocol !== 'unknown',
      protocol: detectedProtocol,
      confidence,
      error: detectedProtocol === 'unknown' ? detectionError : undefined,
      fixedBaseUrl,
      suggestion,
      multiKeyResult,
      models,
    };

    return {
      success: true,
      data: response,
    };
  });
}

/**
 * Build candidate URL list
 *
 * Strategy:
 * 1. Try user's original URL first
 * 2. If original URL contains known API path suffix, add suffix-removed version as fallback
 * 3. Use whichever succeeds first
 */
function buildBaseUrlCandidates(baseUrl: string): string[] {
  if (!baseUrl) return [];

  const candidates: string[] = [];

  // Handle protocol prefix
  const hasProtocol = /^https?:\/\//i.test(baseUrl);
  const urlsToProcess = hasProtocol ? [baseUrl] : [`https://${baseUrl}`, `http://${baseUrl}`];

  for (const url of urlsToProcess) {
    // 1. Original URL first
    candidates.push(url);

    // 2. If it contains a known path suffix, add the version with the suffix removed
    const strippedUrl = removeApiPathSuffix(url);
    if (strippedUrl && strippedUrl !== url && !candidates.includes(strippedUrl)) {
      candidates.push(strippedUrl);
    }
  }

  return candidates;
}

/**
 * Test a single protocol
 */
async function testProtocol(
  baseUrl: string,
  apiKey: string,
  protocol: ProtocolType,
  timeout: number
): Promise<{
  success: boolean;
  confidence: number;
  error?: string;
  models?: string[];
  fixedBaseUrl?: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    switch (protocol) {
      case 'gemini':
        return await testGeminiProtocol(baseUrl, apiKey, controller.signal);
      case 'openai':
        return await testOpenAIProtocol(baseUrl, apiKey, controller.signal);
      case 'anthropic':
        return await testAnthropicProtocol(baseUrl, apiKey, controller.signal);
      default:
        return { success: false, confidence: 0, error: 'Unknown protocol' };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, confidence: 0, error: 'Request timeout' };
    }
    return { success: false, confidence: 0, error: error.message || String(error) };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Test Gemini protocol
 */
async function testGeminiProtocol(
  baseUrl: string,
  apiKey: string,
  signal: AbortSignal
): Promise<{ success: boolean; confidence: number; error?: string; models?: string[]; fixedBaseUrl?: string }> {
  // Gemini API Key format: AIza...
  // Try several possible endpoints
  const endpoints = [
    { url: `${baseUrl}/v1beta/models?key=${encodeURIComponent(apiKey)}`, version: 'v1beta' },
    { url: `${baseUrl}/v1/models?key=${encodeURIComponent(apiKey)}`, version: 'v1' },
    { url: `${baseUrl}/models?key=${encodeURIComponent(apiKey)}`, version: 'root' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          const models = data.models.map((m: any) => {
            const name = m.name || '';
            return name.startsWith('models/') ? name.substring(7) : name;
          });
          return {
            success: true,
            confidence: 95,
            models,
            fixedBaseUrl: endpoint.version !== 'v1beta' ? baseUrl : undefined,
          };
        }
      }

      // Check for specific Gemini error responses
      if (response.status === 400 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.message?.includes('API key')) {
          // API key format is wrong but it is confirmed as Gemini protocol
          return { success: false, confidence: 80, error: 'Invalid API key format for Gemini' };
        }
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }

  return { success: false, confidence: 0, error: 'Not a Gemini API endpoint' };
}

/**
 * Test OpenAI protocol
 */
async function testOpenAIProtocol(
  baseUrl: string,
  apiKey: string,
  signal: AbortSignal
): Promise<{ success: boolean; confidence: number; error?: string; models?: string[]; fixedBaseUrl?: string }> {
  // Try several possible endpoints
  const endpoints = [
    { url: `${baseUrl}/models`, path: '' },
    { url: `${baseUrl}/v1/models`, path: '/v1' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          const models = data.data.map((m: any) => m.id);
          return {
            success: true,
            confidence: 95,
            models,
            fixedBaseUrl: endpoint.path ? `${baseUrl}${endpoint.path}` : undefined,
          };
        }
        // Some OpenAI-compatible APIs return `models` instead of `data`
        if (data.models && Array.isArray(data.models)) {
          const models = data.models.map((m: any) => m.id || m.name);
          return {
            success: true,
            confidence: 85,
            models,
            fixedBaseUrl: endpoint.path ? `${baseUrl}${endpoint.path}` : undefined,
          };
        }
      }

      // 401 means it is the OpenAI protocol but the key is invalid
      if (response.status === 401) {
        return { success: false, confidence: 70, error: 'Invalid API key for OpenAI protocol' };
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }

  // /models endpoints all failed (e.g. 404). Probe /chat/completions to confirm
  // the endpoint is OpenAI-compatible even when it doesn't support model listing
  // (DashScope Coding Plan, some proxies, etc.)
  const chatProbeEndpoints = [
    { url: `${baseUrl}/chat/completions`, path: '' },
    { url: `${baseUrl}/v1/chat/completions`, path: '/v1' },
  ];

  for (const endpoint of chatProbeEndpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: '_probe', messages: [{ role: 'user', content: '' }], max_tokens: PROBE_MAX_TOKENS }),
      });

      if (response.status === 401) {
        return { success: false, confidence: 70, error: 'Invalid API key for OpenAI protocol' };
      }

      const data = await response.json().catch((): null => null);
      if (data?.error && typeof data.error === 'object' && 'message' in data.error) {
        // OpenAI-style error response confirms the protocol
        return {
          success: true,
          confidence: 75,
          fixedBaseUrl: endpoint.path ? `${baseUrl}${endpoint.path}` : undefined,
        };
      }
      if (data?.choices && Array.isArray(data.choices)) {
        return {
          success: true,
          confidence: 85,
          fixedBaseUrl: endpoint.path ? `${baseUrl}${endpoint.path}` : undefined,
        };
      }
    } catch {
      // Continue
    }
  }

  return { success: false, confidence: 0, error: 'Not an OpenAI-compatible API endpoint' };
}

/**
 * Check if response is in Anthropic format
 *
 * Anthropic response/error format characteristics:
 * - Success response: { id: "msg_...", type: "message", ... }
 * - Error response: { type: "error", error: { type: "...", message: "..." } }
 */
function isAnthropicResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  // Success response format
  if (obj.type === 'message' && typeof obj.id === 'string' && obj.id.startsWith('msg_')) {
    return true;
  }

  // Error response format
  if (obj.type === 'error' && obj.error && typeof obj.error === 'object') {
    const errorObj = obj.error as Record<string, unknown>;
    // Anthropic error types: invalid_request_error, authentication_error, etc.
    if (typeof errorObj.type === 'string' && typeof errorObj.message === 'string') {
      return true;
    }
  }

  return false;
}

/**
 * Test Anthropic protocol
 */
async function testAnthropicProtocol(
  baseUrl: string,
  apiKey: string,
  signal: AbortSignal
): Promise<{ success: boolean; confidence: number; error?: string; models?: string[]; fixedBaseUrl?: string }> {
  // Anthropic has no models endpoint, test via the messages endpoint
  // Send a minimal request to validate authentication
  const endpoints = [
    { url: `${baseUrl}/v1/messages`, path: '/v1' },
    { url: `${baseUrl}/messages`, path: '' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: PROBE_MAX_TOKENS,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });

      // Try to parse response body
      let responseData: unknown;
      try {
        responseData = await response.json();
      } catch {
        // Cannot parse JSON; not Anthropic protocol
        continue;
      }

      // 200 means success
      if (response.ok && isAnthropicResponse(responseData)) {
        const models = [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
          'claude-3-5-sonnet-20241022',
        ];
        return {
          success: true,
          confidence: 95,
          models,
          fixedBaseUrl: endpoint.path ? `${baseUrl}${endpoint.path}` : undefined,
        };
      }

      // 400/401 needs verification that it is an Anthropic-formatted error response
      if ((response.status === 400 || response.status === 401) && isAnthropicResponse(responseData)) {
        if (response.status === 401) {
          return { success: false, confidence: 70, error: 'Invalid API key for Anthropic protocol' };
        }
        // 400 param error but auth succeeded (Anthropic format validation passes)
        const models = [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
          'claude-3-5-sonnet-20241022',
        ];
        return {
          success: true,
          confidence: 90,
          models,
          fixedBaseUrl: endpoint.path ? `${baseUrl}${endpoint.path}` : undefined,
        };
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }

  return { success: false, confidence: 0, error: 'Not an Anthropic API endpoint' };
}

/**
 * Test connectivity for multiple keys (concurrent execution)
 *
 * Reference GPT-Load design, use concurrent testing for efficiency
 */
async function testMultipleKeys(
  baseUrl: string,
  apiKeys: string[],
  protocol: ProtocolType,
  timeout: number,
  concurrency: number = 5 // Max concurrency to avoid rate limiting
): Promise<MultiKeyTestResult> {
  const results: MultiKeyTestResult['details'] = [];

  // Execute in batches concurrently
  for (let batchStart = 0; batchStart < apiKeys.length; batchStart += concurrency) {
    const batchEnd = Math.min(batchStart + concurrency, apiKeys.length);
    const batch = apiKeys.slice(batchStart, batchEnd);

    const batchPromises = batch.map(async (key, batchIndex) => {
      const globalIndex = batchStart + batchIndex;
      const startTime = Date.now();

      try {
        const result = await testProtocol(baseUrl, key, protocol, timeout);
        return {
          index: globalIndex,
          maskedKey: maskApiKey(key),
          valid: result.success,
          error: result.error,
          latency: Date.now() - startTime,
        };
      } catch (e: unknown) {
        return {
          index: globalIndex,
          maskedKey: maskApiKey(key),
          valid: false,
          error: e instanceof Error ? e.message : String(e),
          latency: Date.now() - startTime,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // Sort by original index
  results.sort((a, b) => a.index - b.index);

  return {
    total: apiKeys.length,
    valid: results.filter((r) => r.valid).length,
    invalid: results.filter((r) => !r.valid).length,
    details: results,
  };
}

/**
 * Check if it's MiniMax API
 *
 * Use URL parsing to ensure only real MiniMax domains match, preventing URL injection attacks
 */
function isMiniMaxAPI(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname.toLowerCase();
    // Exact match minimaxi.com, minimax.io or their subdomains
    return (
      hostname === 'minimaxi.com' ||
      hostname.endsWith('.minimaxi.com') ||
      hostname === 'minimax.io' ||
      hostname.endsWith('.minimax.io')
    );
  } catch {
    return false;
  }
}

/**
 * Check if it's DashScope Coding Plan API (coding.dashscope.aliyuncs.com or coding-intl.dashscope.aliyuncs.com)
 *
 * DashScope Coding Plan does not provide /v1/models endpoint (returns 404), needs hardcoded model list
 */
function isDashScopeCodingAPI(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname.toLowerCase();
    return hostname === 'coding.dashscope.aliyuncs.com' || hostname === 'coding-intl.dashscope.aliyuncs.com';
  } catch {
    return false;
  }
}

/**
 * Check if it's PackyAPI proxy service
 *
 * Use URL parsing to ensure only real packyapi.com domain matches, preventing URL injection attacks
 */
function isPackyAPI(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname.toLowerCase();
    // Exact match packyapi.com or its subdomains
    return hostname === 'packyapi.com' || hostname.endsWith('.packyapi.com');
  } catch {
    return false;
  }
}

/**
 * Generate suggestion
 *
 * Return i18n key and params, frontend handles translation
 */
function generateSuggestion(
  protocol: ProtocolType,
  _confidence: number,
  baseUrl: string,
  error?: string
): ProtocolDetectionResponse['suggestion'] {
  if (protocol === 'unknown') {
    if (error?.includes('timeout') || error?.includes('Timeout')) {
      return {
        type: 'check_key',
        message: 'Connection timeout, please check network or API URL',
        i18nKey: 'settings.protocolTimeout',
      };
    }
    if (error?.includes('API key') || error?.includes('401') || error?.includes('Unauthorized')) {
      return {
        type: 'check_key',
        message: 'Invalid API Key, please check your key',
        i18nKey: 'settings.protocolInvalidKey',
      };
    }
    return {
      type: 'check_key',
      message: 'Unable to identify API protocol, please check configuration',
      i18nKey: 'settings.protocolCheckConfig',
    };
  }

  const displayName = getProtocolDisplayName(protocol);

  // Special handling for PackyAPI
  // PackyAPI supports two protocol formats via different URLs
  if (isPackyAPI(baseUrl)) {
    if (protocol === 'openai' && baseUrl.includes('/v1')) {
      // Detected OpenAI format (with /v1), suggest Claude format (without /v1) is also available
      return {
        type: 'none',
        message:
          'PackyAPI: Detected OpenAI format. For Claude format, use URL without /v1 and select Anthropic platform',
        i18nKey: 'settings.packyapiOpenAIDetected',
      };
    }
    if (protocol === 'anthropic') {
      // Detected Anthropic format (without /v1), suggest OpenAI format (with /v1) is also available
      return {
        type: 'none',
        message:
          'PackyAPI: Detected Claude format. For OpenAI format, add /v1 to URL and select OpenAI/Custom platform',
        i18nKey: 'settings.packyapiAnthropicDetected',
      };
    }
  }

  // Detected Gemini protocol but user may have selected a different platform
  if (protocol === 'gemini' && !isGoogleApisHost(baseUrl)) {
    return {
      type: 'switch_platform',
      message: `Detected ${displayName} protocol, consider switching to Gemini for better support`,
      suggestedPlatform: 'gemini',
      i18nKey: 'settings.protocolSwitchSuggestion',
      i18nParams: { protocol: displayName, platform: 'Gemini' },
    };
  }

  // Detected Anthropic protocol
  if (protocol === 'anthropic') {
    return {
      type: 'switch_platform',
      message: `Detected ${displayName} protocol, using custom mode`,
      suggestedPlatform: 'Anthropic',
      i18nKey: 'settings.protocolSwitchSuggestion',
      i18nParams: { protocol: displayName, platform: 'Anthropic' },
    };
  }

  // OpenAI protocol is supported by default
  if (protocol === 'openai') {
    return {
      type: 'none',
      message: `Detected ${displayName}-compatible protocol, configuration is correct`,
      i18nKey: 'settings.protocolOpenAICompatible',
    };
  }

  return {
    type: 'none',
    message: `Identified as ${displayName} protocol`,
    i18nKey: 'settings.protocolDetected',
    i18nParams: { protocol: displayName },
  };
}
