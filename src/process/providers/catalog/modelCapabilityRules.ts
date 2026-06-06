import type { ProviderId, Capability } from '../types';

export type CapabilityRule = { match: RegExp; capabilities: Capability[] };

/**
 * Per-provider id-pattern → capability rules.
 * All rules are evaluated (additive); duplicates are deduped by the detector.
 */
export const CAPABILITY_RULES: Partial<Record<ProviderId, CapabilityRule[]>> = {
  openai: [
    { match: /^o\d+/i, capabilities: ['chat', 'reasoning'] },
    { match: /^gpt-4o|^gpt-5/i, capabilities: ['chat', 'vision'] },
    { match: /^gpt-4|^gpt-3\.5/i, capabilities: ['chat'] },
    { match: /^dall-e|^gpt-image/i, capabilities: ['image'] },
    { match: /^whisper|^tts-/i, capabilities: ['audio'] },
    { match: /^text-embedding|^omni-moderation/i, capabilities: ['embeddings'] },
  ],

  anthropic: [
    // claude-3, 3.5, 3.7, 4 → chat + vision
    { match: /claude-(3|3\.5|3\.7|4)/i, capabilities: ['chat', 'vision'] },
    { match: /claude-2|claude-instant/i, capabilities: ['chat'] },
  ],

  'google-gemini': [
    { match: /.*-vision.*/i, capabilities: ['chat', 'vision'] },
    { match: /imagen-/i, capabilities: ['image'] },
    { match: /embedding-/i, capabilities: ['embeddings'] },
    { match: /gemini-/i, capabilities: ['chat', 'vision'] },
  ],

  groq: [
    { match: /whisper/i, capabilities: ['audio'] },
    { match: /.+/i, capabilities: ['chat'] },
  ],

  elevenlabs: [
    { match: /.+/i, capabilities: ['audio'] },
  ],

  deepgram: [
    { match: /.+/i, capabilities: ['audio'] },
  ],

  assemblyai: [
    { match: /.+/i, capabilities: ['audio'] },
  ],

  deepseek: [
    { match: /r1|reasoner/i, capabilities: ['chat', 'reasoning'] },
    { match: /.+/i, capabilities: ['chat'] },
  ],

  mistral: [
    { match: /embed/i, capabilities: ['embeddings'] },
    { match: /.+/i, capabilities: ['chat'] },
  ],

  xai: [
    { match: /grok-vision|grok-2v/i, capabilities: ['chat', 'vision'] },
    { match: /.+/i, capabilities: ['chat'] },
  ],

  cohere: [
    { match: /embed/i, capabilities: ['embeddings'] },
    { match: /rerank/i, capabilities: ['embeddings'] },
    { match: /.+/i, capabilities: ['chat'] },
  ],

  openrouter: [
    // OpenRouter wraps anything - default to chat; API metadata takes precedence
    { match: /.+/i, capabilities: ['chat'] },
  ],

  moonshot: [
    { match: /.+/i, capabilities: ['chat'] },
  ],

  qwen: [
    { match: /qwen-vl|vl/i, capabilities: ['chat', 'vision'] },
    { match: /embed/i, capabilities: ['embeddings'] },
    { match: /audio/i, capabilities: ['audio'] },
    { match: /.+/i, capabilities: ['chat'] },
  ],

  // HuggingFace: too model-diverse; rely on API metadata
  huggingface: [],
};
