import type { ProviderId } from '../types';

export type PatternRule = {
  provider: ProviderId;
  test: (key: string) => boolean;
  match: 'unique' | 'multi-field' | 'structural';
  requiredFields?: string[];
  priority: number;
};

/**
 * Ordered prefix/structural detection rules.
 * Higher priority = checked first. Within the same priority, array order wins.
 * The bare `sk-` ambiguous case is handled separately in ProviderDetector.
 */
export const PROVIDER_KEY_PATTERNS: PatternRule[] = [
  // --- Unique high-confidence prefixes (priority 100) ---
  {
    provider: 'anthropic',
    test: (k) => k.startsWith('sk-ant-'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'flux-router',
    test: (k) => k.startsWith('sk-flux-'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'openrouter',
    test: (k) => k.startsWith('sk-or-'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'openai',
    test: (k) => k.startsWith('sk-proj-'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'google-gemini',
    test: (k) => k.startsWith('AIza'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'groq',
    test: (k) => k.startsWith('gsk_'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'xai',
    test: (k) => k.startsWith('xai-'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'huggingface',
    test: (k) => k.startsWith('hf_'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'perplexity',
    test: (k) => k.startsWith('pplx-'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'replicate',
    test: (k) => k.startsWith('r8_'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'together',
    test: (k) => k.startsWith('tgp_v1_') || k.startsWith('tgp_'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'fireworks',
    test: (k) => k.startsWith('fw_'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'cerebras',
    test: (k) => k.startsWith('csk-'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'nvidia',
    test: (k) => k.startsWith('nvapi-'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'anyscale',
    test: (k) => k.startsWith('esecret_'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'deepgram',
    test: (k) => k.startsWith('dg_'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'assemblyai',
    test: (k) => k.startsWith('aai_'),
    match: 'unique',
    priority: 100,
  },
  {
    provider: 'elevenlabs',
    test: (k) => k.startsWith('xi-api-'),
    match: 'unique',
    priority: 100,
  },

  // --- Structural sk- variants (priority 95) ---
  // These are bare-sk shapes with enough structural signal to resolve to a
  // single provider without server probing. They MUST be matched before the
  // bare `sk-` fallback in ProviderDetector returns `ambiguous-sk`.
  {
    // DeepSeek issues keys shaped `sk-` + exactly 32 lowercase hex chars.
    // The OpenAI legacy shape is `sk-` + 48 mixed-case alphanumerics, so the
    // 32-hex form is unambiguously DeepSeek.
    provider: 'deepseek',
    test: (k) => /^sk-[a-f0-9]{32}$/.test(k),
    match: 'structural',
    priority: 95,
  },
  {
    // Moonshot / Kimi platform keys are `sk-` + 48 mixed-case alphanumerics.
    // OpenAI's legacy keys are the same length but always contain the
    // `T3BlbkFJ` middle segment; excluding that signature disambiguates.
    provider: 'moonshot',
    test: (k) => /^sk-[A-Za-z0-9]{48}$/.test(k) && !k.includes('T3BlbkFJ'),
    match: 'structural',
    priority: 95,
  },

  // --- Multi-field providers (priority 90) ---
  {
    provider: 'aws-bedrock',
    test: (k) => k.startsWith('AKIA') || k.startsWith('ASIA'),
    match: 'multi-field',
    requiredFields: ['region', 'secret_key'],
    priority: 90,
  },
  {
    provider: 'vertex',
    // Vertex doesn't have a key prefix - detected via multi-field only.
    // This rule is never matched by key alone; ProviderDetector returns multi-field
    // when caller signals vertex context. We include it for completeness.
    test: (_k) => false,
    match: 'multi-field',
    requiredFields: ['project_id', 'region', 'service_account_json'],
    priority: 90,
  },

  // --- Structural rules (priority 80) ---
  {
    // JWT: starts with eyJ, three base64url segments separated by dots
    provider: 'minimax',
    test: (k) => isJwt(k),
    match: 'structural',
    priority: 80,
  },
  {
    // Dot-split: two segments each ≥10 chars, not a JWT
    provider: 'zhipu-glm',
    test: (k) => isDotSplit(k),
    match: 'structural',
    priority: 80,
  },
];

// Sorted descending by priority so callers can iterate in order
export const SORTED_PATTERNS: PatternRule[] = [...PROVIDER_KEY_PATTERNS].toSorted((a, b) => b.priority - a.priority);

/** Bare sk- candidates for race resolution (ordered by likelihood) */
export const SK_BARE_CANDIDATES: ProviderId[] = [
  'openai',
  'deepseek',
  'moonshot',
  'qwen',
  'baichuan',
  'lingyiwanwu',
  'stability',
];

function isJwt(key: string): boolean {
  if (!key.startsWith('eyJ')) return false;
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return typeof header === 'object' && header !== null;
  } catch {
    return false;
  }
}

function isDotSplit(key: string): boolean {
  if (isJwt(key)) return false;
  const parts = key.split('.');
  return parts.length === 2 && parts[0].length >= 10 && parts[1].length >= 10;
}
