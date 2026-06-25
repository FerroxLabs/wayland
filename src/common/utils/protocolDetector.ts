/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Protocol Detector for WaylandRouter
 *
 * Auto-detects which protocol an API endpoint uses:
 * - OpenAI protocol (most third-party services)
 * - Gemini protocol (Google official)
 * - Anthropic protocol (Claude official)
 */

/**
 * Supported protocol types
 */
export type ProtocolType = 'openai' | 'gemini' | 'anthropic' | 'unknown';

/**
 * Protocol detection result
 */
export interface ProtocolDetectionResult {
  /** Detected protocol type */
  protocol: ProtocolType;
  /** Whether detection succeeded */
  success: boolean;
  /** Confidence level (0-100) */
  confidence: number;
  /** Response time in milliseconds */
  latency?: number;
  /** Error message */
  error?: string;
  /** Fixed base URL if needed */
  fixedBaseUrl?: string;
  /** Additional info */
  metadata?: {
    /** Model list if available */
    models?: string[];
    /** API version */
    apiVersion?: string;
    /** Provider name */
    providerName?: string;
  };
}

/**
 * Multi-key test result
 */
export interface MultiKeyTestResult {
  /** Total key count */
  total: number;
  /** Valid key count */
  valid: number;
  /** Invalid key count */
  invalid: number;
  /** Detailed result for each key */
  details: Array<{
    /** Key index */
    index: number;
    /** Masked key */
    maskedKey: string;
    /** Whether valid */
    valid: boolean;
    /** Error message */
    error?: string;
    /** Latency */
    latency?: number;
  }>;
}

/**
 * Protocol detection request parameters
 */
export interface ProtocolDetectionRequest {
  /** Base URL */
  baseUrl: string;
  /** API Key (can be comma or newline separated) */
  apiKey: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to test all keys */
  testAllKeys?: boolean;
  /** Specific protocol to test (if known) */
  preferredProtocol?: ProtocolType;
}

/**
 * Protocol detection response
 */
export interface ProtocolDetectionResponse {
  /** Whether successful */
  success: boolean;
  /** Detected protocol */
  protocol: ProtocolType;
  /** Confidence */
  confidence: number;
  /** Error message */
  error?: string;
  /** Fixed base URL */
  fixedBaseUrl?: string;
  /** Suggested action */
  suggestion?: {
    /** Suggestion type */
    type: 'switch_platform' | 'fix_url' | 'check_key' | 'none';
    /** Suggestion message */
    message: string;
    /** Suggested platform */
    suggestedPlatform?: string;
    /** i18n key for frontend */
    i18nKey?: string;
    /** i18n parameters */
    i18nParams?: Record<string, string>;
  };
  /** Multi-key test result if enabled */
  multiKeyResult?: MultiKeyTestResult;
  /** Model list */
  models?: string[];
}

/**
 * Protocol signature definitions
 */
interface ProtocolSignature {
  /** Protocol type */
  protocol: ProtocolType;
  /** Test endpoint templates */
  endpoints: Array<{
    path: string;
    method: 'GET' | 'POST';
    /** Headers */
    headers?: (apiKey: string) => Record<string, string>;
    /** Request body for POST */
    body?: object;
    /** Response validator */
    validator: (response: any, status: number) => boolean;
  }>;
  /** API Key format validation */
  keyPattern?: RegExp;
  /** URL characteristics */
  urlPatterns?: RegExp[];
}

/**
 * Protocol signature configurations
 *
 * Reference GPT-Load Channel design, each protocol defines its signatures
 */
export const PROTOCOL_SIGNATURES: ProtocolSignature[] = [
  // Gemini protocol
  {
    protocol: 'gemini',
    // Gemini API Key format: starts with AIza, followed by 35 characters
    keyPattern: /^AIza[A-Za-z0-9_-]{35}$/,
    urlPatterns: [
      /generativelanguage\.googleapis\.com/, // Standard Gemini API
      /aiplatform\.googleapis\.com/, // Vertex AI
      /gemini\.google\.com/, // Gemini web
      /aistudio\.google\.com/, // AI Studio
    ],
    endpoints: [
      {
        path: '/v1beta/models',
        method: 'GET',
        headers: () => ({}),
        validator: (response, status) => {
          if (status !== 200) return false;
          return response?.models && Array.isArray(response.models);
        },
      },
      {
        path: '/v1/models',
        method: 'GET',
        headers: () => ({}),
        validator: (response, status) => {
          if (status !== 200) return false;
          return response?.models && Array.isArray(response.models);
        },
      },
    ],
  },
  // OpenAI protocol (including compatible services)
  {
    protocol: 'openai',
    // OpenAI Key formats vary:
    // - Standard: sk-xxx
    // - Project Key: sk-proj-xxx
    // - Service account: sk-svcacct-xxx
    // - Third-party services may use other formats
    keyPattern: /^sk-[A-Za-z0-9-_]{20,}$/,
    urlPatterns: [
      /api\.openai\.com/, // OpenAI official
      /\.openai\.azure\.com/, // Azure OpenAI
      /api\.deepseek\.com/, // DeepSeek
      /api\.moonshot\.cn/, // Moonshot/Kimi China
      /api\.moonshot\.ai/, // Moonshot/Kimi Global
      /api\.mistral\.ai/, // Mistral AI
      /api\.groq\.com/, // Groq
      /openrouter\.ai/, // OpenRouter
      /api\.together\.xyz/, // Together AI
      /api\.perplexity\.ai/, // Perplexity
      /dashscope\.aliyuncs\.com/, // Alibaba Cloud DashScope
      /aip\.baidubce\.com/, // Baidu Qianfan
      /ark\.cn-beijing\.volces\.com/, // Volcano Engine
      /open\.bigmodel\.cn/, // Zhipu AI
      /api\.siliconflow\.cn/, // SiliconFlow
      /api\.siliconflow\.com/, // SiliconFlow (.com)
      /api\.lingyiwanwu\.com/, // 01.AI (Lingyiwanwu)
      /api\.minimaxi\.com/, // MiniMax China
      /api\.minimax\.io/, // MiniMax Global
      /platform\.minimaxi\.com/, // MiniMax Platform
      /api\.sakana\.ai/, // Sakana AI
      /localhost/, // Local service
      /127\.0\.0\.1/, // Local service
      /0\.0\.0\.0/, // Local service
    ],
    endpoints: [
      {
        path: '/models',
        method: 'GET',
        headers: (apiKey) => ({
          Authorization: `Bearer ${apiKey}`,
        }),
        validator: (response, status) => {
          if (status !== 200) return false;
          return response?.data && Array.isArray(response.data);
        },
      },
      {
        path: '/v1/models',
        method: 'GET',
        headers: (apiKey) => ({
          Authorization: `Bearer ${apiKey}`,
        }),
        validator: (response, status) => {
          if (status !== 200) return false;
          return response?.data && Array.isArray(response.data);
        },
      },
    ],
  },
  // Anthropic protocol
  {
    protocol: 'anthropic',
    // Anthropic Key format: starts with sk-ant-
    keyPattern: /^sk-ant-[A-Za-z0-9-]{80,}$/,
    urlPatterns: [
      /api\.anthropic\.com/, // Anthropic official
      /claude\.ai/, // Claude web
    ],
    endpoints: [
      {
        // Anthropic doesn't have a models endpoint, use messages endpoint
        path: '/v1/messages',
        method: 'POST',
        headers: (apiKey) => ({
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        }),
        body: {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        },
        validator: (_response, status) => {
          // 200 or 400 (param error but auth success) are both valid
          return status === 200 || status === 400;
        },
      },
    ],
  },
];

/**
 * Known third-party OpenAI-compatible service key patterns
 *
 * These services use OpenAI protocol but with different key formats
 */
export const THIRD_PARTY_KEY_PATTERNS: Array<{ pattern: RegExp; name: string; protocol: ProtocolType }> = [
  { pattern: /^sk-[A-Za-z0-9-_]{20,}$/, name: 'OpenAI/Compatible', protocol: 'openai' },
  { pattern: /^AIza[A-Za-z0-9_-]{35}$/, name: 'Google/Gemini', protocol: 'gemini' },
  { pattern: /^sk-ant-[A-Za-z0-9-]{80,}$/, name: 'Anthropic', protocol: 'anthropic' },
  { pattern: /^gsk_[A-Za-z0-9]{52}$/, name: 'Groq', protocol: 'openai' },
  { pattern: /^pplx-[A-Za-z0-9]{48}$/, name: 'Perplexity', protocol: 'openai' },
  { pattern: /^[A-Za-z0-9]{32}$/, name: 'DeepSeek/Moonshot', protocol: 'openai' },
  { pattern: /^[A-Za-z0-9]{64}$/, name: 'SiliconFlow/Together', protocol: 'openai' },
];

/**
 * Parse multiple API keys from string
 */
export function parseApiKeys(apiKeyString: string): string[] {
  if (!apiKeyString) return [];
  return apiKeyString
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/**
 * Mask API key for display
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '***';
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Common API path suffixes
 *
 * Used to generate candidate URL list when user enters full endpoint URL
 */
export const API_PATH_SUFFIXES = [
  // Gemini paths
  '/v1beta/models',
  '/v1/models',
  '/models',
  // OpenAI paths
  '/v1/chat/completions',
  '/chat/completions',
  '/v1/completions',
  '/completions',
  '/v1/embeddings',
  '/embeddings',
  // Anthropic paths
  '/v1/messages',
  '/messages',
];

/**
 * Normalize base URL (basic cleanup only)
 *
 * Only removes trailing slashes, does not modify path
 */
export function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return '';
  let url = baseUrl.trim();
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
}

/**
 * Remove known API path suffix from URL
 */
export function removeApiPathSuffix(baseUrl: string): string | null {
  if (!baseUrl) return null;
  const url = baseUrl.replace(/\/+$/, '');

  // Sort by length descending; match longer paths first
  const sortedSuffixes = [...API_PATH_SUFFIXES].toSorted((a, b) => b.length - a.length);
  for (const suffix of sortedSuffixes) {
    if (url.toLowerCase().endsWith(suffix.toLowerCase())) {
      return url.slice(0, -suffix.length).replace(/\/+$/, '');
    }
  }

  return null; // no matching suffix
}

/**
 * Guess protocol type from URL
 */
export function guessProtocolFromUrl(baseUrl: string): ProtocolType | null {
  const url = baseUrl.toLowerCase();

  for (const sig of PROTOCOL_SIGNATURES) {
    if (sig.urlPatterns) {
      for (const pattern of sig.urlPatterns) {
        if (pattern.test(url)) {
          return sig.protocol;
        }
      }
    }
  }

  return null;
}

/**
 * Guess protocol type from API key format
 *
 * Prioritize more specific patterns, then general patterns
 */
export function guessProtocolFromKey(apiKey: string): ProtocolType | null {
  // First try standard protocol signatures
  for (const sig of PROTOCOL_SIGNATURES) {
    if (sig.keyPattern && sig.keyPattern.test(apiKey)) {
      return sig.protocol;
    }
  }

  // Then try third-party service key formats
  for (const pattern of THIRD_PARTY_KEY_PATTERNS) {
    if (pattern.pattern.test(apiKey)) {
      return pattern.protocol;
    }
  }

  return null;
}

/**
 * Identify service provider name from API key
 */
export function identifyProviderFromKey(apiKey: string): string | null {
  for (const pattern of THIRD_PARTY_KEY_PATTERNS) {
    if (pattern.pattern.test(apiKey)) {
      return pattern.name;
    }
  }
  return null;
}

/**
 * Get display name for protocol
 */
export function getProtocolDisplayName(protocol: ProtocolType): string {
  const names: Record<ProtocolType, string> = {
    openai: 'OpenAI',
    gemini: 'Gemini',
    anthropic: 'Anthropic',
    unknown: 'Unknown',
  };
  return names[protocol] || protocol;
}

/**
 * Get recommended platform for protocol
 */
export function getRecommendedPlatform(protocol: ProtocolType): string | null {
  const platforms: Record<ProtocolType, string | null> = {
    openai: null, // OpenAI protocol is supported in the current project via custom
    gemini: 'gemini',
    anthropic: 'Anthropic',
    unknown: null,
  };
  return platforms[protocol];
}
