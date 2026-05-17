export type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'google-gemini'
  | 'aws-bedrock'
  | 'vertex'
  | 'openrouter'
  | 'groq'
  | 'xai'
  | 'mistral'
  | 'cohere'
  | 'perplexity'
  | 'together'
  | 'fireworks'
  | 'cerebras'
  | 'replicate'
  | 'huggingface'
  | 'nvidia'
  | 'anyscale'
  | 'deepseek'
  | 'moonshot'
  | 'qwen'
  | 'baichuan'
  | 'lingyiwanwu'
  | 'zhipu-glm'
  | 'minimax'
  | 'stability'
  | 'deepgram'
  | 'assemblyai'
  | 'elevenlabs'
  | 'openai-compatible';

export type ModelTier = 'flagship' | 'everyday' | 'fast' | 'reasoning' | 'legacy';

export type Capability = 'chat' | 'vision' | 'image' | 'audio' | 'embeddings' | 'reasoning';

export type ProviderModel = {
  id: string;
  displayName: string;
  userDisplayName?: string;
  tier: ModelTier;
  capabilities: Capability[];
  enabled: boolean;
  deprecated?: boolean;
  deprecatedAt?: number;
  contextWindow?: number;
  pricing?: { inUSDPerMillion?: number; outUSDPerMillion?: number };
};

export type DetectionResult =
  | { kind: 'unique'; provider: ProviderId; confidence: 'high' }
  | { kind: 'ambiguous-sk'; candidates: ProviderId[] }
  | { kind: 'structural'; provider: ProviderId; confidence: 'medium' }
  | { kind: 'multi-field'; provider: ProviderId; requiredFields: string[] }
  | { kind: 'unknown' };
