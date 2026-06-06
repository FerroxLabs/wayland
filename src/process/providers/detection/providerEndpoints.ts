import type { ProviderId } from '../types';

/**
 * /v1/models (or equivalent) endpoint per provider.
 * Used by SkRaceResolver and ModelCatalog for live model fetching.
 */
export const PROVIDER_ENDPOINTS: Partial<Record<ProviderId, string>> = {
  openai: 'https://api.openai.com/v1/models',
  deepseek: 'https://api.deepseek.com/v1/models',
  // International Moonshot/Kimi endpoint (`.ai`); the mainland `.cn` host 401s
  // international keys, so probing `.ai` matches the global audience.
  moonshot: 'https://api.moonshot.ai/v1/models',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
  baichuan: 'https://api.baichuan-ai.com/v1/models',
  lingyiwanwu: 'https://api.lingyiwanwu.com/v1/models',
  stability: 'https://api.stability.ai/v1/engines/list',
  anthropic: 'https://api.anthropic.com/v1/models',
  'google-gemini': 'https://generativelanguage.googleapis.com/v1beta/models',
  openrouter: 'https://openrouter.ai/api/v1/models',
  groq: 'https://api.groq.com/openai/v1/models',
  xai: 'https://api.x.ai/v1/models',
  mistral: 'https://api.mistral.ai/v1/models',
  cohere: 'https://api.cohere.com/v1/models',
  perplexity: 'https://api.perplexity.ai/models',
  together: 'https://api.together.xyz/v1/models',
  fireworks: 'https://api.fireworks.ai/inference/v1/models',
  cerebras: 'https://api.cerebras.ai/v1/models',
  replicate: 'https://api.replicate.com/v1/models',
  huggingface: 'https://huggingface.co/api/models',
  nvidia: 'https://integrate.api.nvidia.com/v1/models',
  anyscale: 'https://api.endpoints.anyscale.com/v1/models',
  'zhipu-glm': 'https://open.bigmodel.cn/api/paas/v4/models',
  minimax: 'https://api.minimax.chat/v1/models',
  deepgram: 'https://api.deepgram.com/v1/models',
  assemblyai: 'https://api.assemblyai.com/v1/models',
  elevenlabs: 'https://api.elevenlabs.io/v1/models',
  'flux-router': 'https://api.fluxrouter.ai/v1/models',
};
