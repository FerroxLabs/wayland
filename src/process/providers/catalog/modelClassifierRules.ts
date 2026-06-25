import type { ProviderId, ModelTier } from '../types';

export type ClassifierRule = { match: RegExp; tier: ModelTier };

/**
 * Per-provider ordered rule sets. First match wins; fallback is 'everyday'.
 * More specific patterns (model versions) must appear before generic family names.
 */
export const CLASSIFIER_RULES: Partial<Record<ProviderId, ClassifierRule[]>> = {
  anthropic: [
    { match: /opus/i, tier: 'flagship' },
    { match: /sonnet-(4|5|6)/i, tier: 'flagship' },
    { match: /sonnet/i, tier: 'everyday' },
    { match: /haiku-4/i, tier: 'fast' },
    { match: /haiku/i, tier: 'fast' },
    { match: /claude-3-(haiku|sonnet|opus)/i, tier: 'legacy' },
    { match: /claude-2/i, tier: 'legacy' },
    { match: /claude-instant/i, tier: 'legacy' },
  ],

  openai: [
    // o-series (reasoning)
    { match: /^o\d+/i, tier: 'reasoning' },
    // GPT-5 and GPT-4.5 → flagship
    { match: /gpt-5/i, tier: 'flagship' },
    { match: /gpt-4\.5/i, tier: 'flagship' },
    // GPT-4o → flagship
    { match: /gpt-4o/i, tier: 'flagship' },
    // GPT-4 turbo → everyday
    { match: /gpt-4-turbo/i, tier: 'everyday' },
    // GPT-4 base → everyday
    { match: /gpt-4/i, tier: 'everyday' },
    // GPT-3.5 → legacy
    { match: /gpt-3\.5/i, tier: 'legacy' },
    // Mini/nano variants → fast
    { match: /mini|nano/i, tier: 'fast' },
    // Embedding / image / audio → everyday (catch-all)
  ],

  'google-gemini': [
    { match: /ultra/i, tier: 'flagship' },
    { match: /gemini-2\.5-pro/i, tier: 'flagship' },
    { match: /gemini-2\.0-pro/i, tier: 'flagship' },
    { match: /gemini-1\.5-pro/i, tier: 'everyday' },
    { match: /gemini-2\.0-flash-thinking/i, tier: 'reasoning' },
    { match: /gemini-2\.5-flash/i, tier: 'fast' },
    { match: /gemini-2\.0-flash/i, tier: 'fast' },
    { match: /gemini-1\.5-flash/i, tier: 'fast' },
    { match: /gemini-1\.0/i, tier: 'legacy' },
    { match: /gemini-pro/i, tier: 'everyday' },
    { match: /imagen/i, tier: 'everyday' },
  ],

  deepseek: [
    { match: /r1|reasoner/i, tier: 'reasoning' },
    { match: /deepseek-v3/i, tier: 'flagship' },
    { match: /deepseek-v2/i, tier: 'everyday' },
    { match: /coder/i, tier: 'everyday' },
    { match: /chat/i, tier: 'everyday' },
  ],

  moonshot: [
    { match: /moonshot-v1-128k/i, tier: 'flagship' },
    { match: /moonshot-v1-32k/i, tier: 'everyday' },
    { match: /moonshot-v1-8k/i, tier: 'fast' },
  ],

  qwen: [
    { match: /qwen-max/i, tier: 'flagship' },
    { match: /qwen-plus/i, tier: 'everyday' },
    { match: /qwen-turbo/i, tier: 'fast' },
    { match: /qwen-long/i, tier: 'everyday' },
    { match: /qwen2\.5/i, tier: 'everyday' },
    { match: /qwen2/i, tier: 'legacy' },
    { match: /qwen1/i, tier: 'legacy' },
  ],

  mistral: [
    { match: /mistral-large/i, tier: 'flagship' },
    { match: /mistral-medium/i, tier: 'everyday' },
    { match: /mistral-small/i, tier: 'fast' },
    { match: /mistral-tiny|mistral-7b/i, tier: 'fast' },
    { match: /codestral/i, tier: 'everyday' },
    { match: /mixtral/i, tier: 'everyday' },
    { match: /open-mistral/i, tier: 'everyday' },
  ],

  groq: [
    { match: /llama-3\.3/i, tier: 'flagship' },
    { match: /llama-3\.1-70b|llama-3\.1-405b/i, tier: 'flagship' },
    { match: /llama-3\.1-8b|llama-3\.2/i, tier: 'fast' },
    { match: /gemma2/i, tier: 'fast' },
    { match: /mixtral/i, tier: 'everyday' },
    { match: /whisper/i, tier: 'everyday' },
  ],

  xai: [
    { match: /grok-4|grok-build/i, tier: 'flagship' },
    { match: /grok-composer/i, tier: 'fast' },
    { match: /grok-3/i, tier: 'flagship' },
    { match: /grok-2/i, tier: 'everyday' },
    { match: /grok-beta/i, tier: 'everyday' },
    { match: /grok-vision/i, tier: 'everyday' },
    { match: /grok-1/i, tier: 'legacy' },
  ],

  cohere: [
    { match: /command-r-plus/i, tier: 'flagship' },
    { match: /command-r/i, tier: 'everyday' },
    { match: /command-light/i, tier: 'fast' },
    { match: /command/i, tier: 'everyday' },
    { match: /embed/i, tier: 'everyday' },
    { match: /rerank/i, tier: 'everyday' },
  ],
};
