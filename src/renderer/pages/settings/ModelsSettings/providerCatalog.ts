/**
 * Renderer-safe provider metadata for the Models settings surface.
 *
 * The main-process `ProviderDetector` / `providerKeyPatterns` modules use Node
 * APIs (`Buffer`) and cannot be imported into the renderer. This file mirrors
 * the same key-prefix recognition rules as a pure, browser-safe function, plus
 * the display name / avatar styling each provider needs in the UI.
 */
import type { ProviderId } from '@process/providers/types';

/**
 * A Browse-modal group (prototype `#overlay-browse`, spec §4.6). Every provider
 * belongs to exactly one. Group order here is the render order in the grid.
 */
export type ProviderGroup = 'frontier' | 'cloud' | 'open' | 'chinese' | 'voice';

/** The cloud `ProviderId`s - these need the multi-field `CloudCredentialForm`. */
export const CLOUD_PROVIDER_IDS = ['aws-bedrock', 'vertex', 'azure'] as const satisfies readonly ProviderId[];

/** True if a provider connects via the multi-field cloud credential form. */
export function isCloudProvider(id: ProviderId): boolean {
  return (CLOUD_PROVIDER_IDS as readonly ProviderId[]).includes(id);
}

/** Visual + label metadata for one provider. */
export type ProviderMeta = {
  id: ProviderId;
  /** Human label. Mirrors the Browse picker list. */
  displayName: string;
  /** Short avatar monogram. */
  mono: string;
  /** Avatar background color. Provider brand colors are intentional literals. */
  bg: string;
  /** Avatar foreground - true = dark text on a light avatar. */
  darkText: boolean;
  /** Browse-modal group this provider belongs to (spec §4.6). */
  group: ProviderGroup;
};

/** Provider metadata keyed by id. Display names mirror the Browse picker. */
export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  anthropic: { id: 'anthropic', displayName: 'Anthropic', mono: 'A', bg: '#d4a27f', darkText: true, group: 'frontier' },
  openai: { id: 'openai', displayName: 'OpenAI', mono: 'O', bg: '#10a37f', darkText: false, group: 'frontier' },
  'google-gemini': {
    id: 'google-gemini',
    displayName: 'Google Gemini',
    mono: 'G',
    bg: '#1a73e8',
    darkText: false,
    group: 'frontier',
  },
  'aws-bedrock': {
    id: 'aws-bedrock',
    displayName: 'AWS Bedrock',
    mono: 'aws',
    bg: '#ff9900',
    darkText: true,
    group: 'cloud',
  },
  vertex: { id: 'vertex', displayName: 'Google Vertex AI', mono: 'V', bg: '#1a73e8', darkText: false, group: 'cloud' },
  openrouter: {
    id: 'openrouter',
    displayName: 'OpenRouter',
    mono: 'OR',
    bg: '#6566f1',
    darkText: false,
    group: 'open',
  },
  groq: { id: 'groq', displayName: 'Groq', mono: 'Gq', bg: '#f55036', darkText: false, group: 'open' },
  xai: { id: 'xai', displayName: 'xAI Grok', mono: 'x', bg: '#1a1a1a', darkText: false, group: 'frontier' },
  mistral: { id: 'mistral', displayName: 'Mistral', mono: 'M', bg: '#fa5111', darkText: false, group: 'frontier' },
  cohere: { id: 'cohere', displayName: 'Cohere', mono: 'C', bg: '#39594d', darkText: false, group: 'frontier' },
  perplexity: {
    id: 'perplexity',
    displayName: 'Perplexity',
    mono: 'P',
    bg: '#20808d',
    darkText: false,
    group: 'open',
  },
  together: { id: 'together', displayName: 'Together AI', mono: 'T', bg: '#0f6fff', darkText: false, group: 'open' },
  fireworks: {
    id: 'fireworks',
    displayName: 'Fireworks AI',
    mono: 'Fw',
    bg: '#5a3df0',
    darkText: false,
    group: 'open',
  },
  cerebras: { id: 'cerebras', displayName: 'Cerebras', mono: 'Cb', bg: '#f97316', darkText: false, group: 'open' },
  replicate: {
    id: 'replicate',
    displayName: 'Replicate',
    mono: 'R',
    bg: '#1a1a1a',
    darkText: false,
    group: 'open',
  },
  huggingface: {
    id: 'huggingface',
    displayName: 'Hugging Face',
    mono: 'HF',
    bg: '#ffd21e',
    darkText: true,
    group: 'open',
  },
  nvidia: { id: 'nvidia', displayName: 'NVIDIA NIM', mono: 'N', bg: '#76b900', darkText: true, group: 'open' },
  anyscale: { id: 'anyscale', displayName: 'Anyscale', mono: 'As', bg: '#1444f0', darkText: false, group: 'open' },
  deepseek: { id: 'deepseek', displayName: 'DeepSeek', mono: 'DS', bg: '#4d6bfe', darkText: false, group: 'chinese' },
  moonshot: {
    id: 'moonshot',
    displayName: 'Moonshot',
    mono: 'K',
    bg: '#16151a',
    darkText: false,
    group: 'chinese',
  },
  qwen: { id: 'qwen', displayName: 'Qwen', mono: 'Q', bg: '#6d4aff', darkText: false, group: 'chinese' },
  baichuan: {
    id: 'baichuan',
    displayName: 'Baichuan',
    mono: 'Bc',
    bg: '#ff6a00',
    darkText: false,
    group: 'chinese',
  },
  lingyiwanwu: { id: 'lingyiwanwu', displayName: 'Yi', mono: 'Yi', bg: '#003425', darkText: false, group: 'chinese' },
  'zhipu-glm': {
    id: 'zhipu-glm',
    displayName: 'Zhipu GLM',
    mono: 'GLM',
    bg: '#3859ff',
    darkText: false,
    group: 'chinese',
  },
  minimax: { id: 'minimax', displayName: 'MiniMax', mono: 'Mm', bg: '#e8472b', darkText: false, group: 'chinese' },
  stability: {
    id: 'stability',
    displayName: 'Stability AI',
    mono: 'S',
    bg: '#330033',
    darkText: false,
    group: 'open',
  },
  deepgram: { id: 'deepgram', displayName: 'Deepgram', mono: 'Dg', bg: '#13ef93', darkText: true, group: 'voice' },
  assemblyai: {
    id: 'assemblyai',
    displayName: 'AssemblyAI',
    mono: 'Ai',
    bg: '#2545fd',
    darkText: false,
    group: 'voice',
  },
  elevenlabs: {
    id: 'elevenlabs',
    displayName: 'ElevenLabs',
    mono: '11',
    bg: '#1a1a1a',
    darkText: false,
    group: 'voice',
  },
  azure: { id: 'azure', displayName: 'Azure OpenAI', mono: 'Az', bg: '#0078d4', darkText: false, group: 'cloud' },
  'flux-router': {
    id: 'flux-router',
    displayName: 'Flux Router',
    mono: 'Fx',
    bg: '#5a3df0',
    darkText: false,
    group: 'open',
  },
  'openai-compatible': {
    id: 'openai-compatible',
    displayName: 'OpenAI-compatible',
    mono: 'API',
    bg: '#5a3df0',
    darkText: false,
    group: 'open',
  },
};

/** Look up provider metadata, falling back to a generic tile for unknown ids. */
export function providerMeta(id: ProviderId): ProviderMeta {
  return (
    PROVIDER_META[id] ?? {
      id,
      displayName: id,
      mono: id.charAt(0).toUpperCase(),
      bg: '#5a3df0',
      darkText: false,
      group: 'open',
    }
  );
}

/** Browse-modal group render order (spec §4.6). */
export const PROVIDER_GROUP_ORDER: readonly ProviderGroup[] = ['frontier', 'cloud', 'open', 'chinese', 'voice'];

/** All provider metadata in a stable order (frontier → voice, declaration order within). */
export const ALL_PROVIDERS: readonly ProviderMeta[] = Object.values(PROVIDER_META);

/** Providers belonging to one Browse group, in declaration order. */
export function providersInGroup(group: ProviderGroup): ProviderMeta[] {
  return ALL_PROVIDERS.filter((p) => p.group === group);
}

/** Result of recognizing a provider from a pasted API key. */
export type KeyRecognition =
  | { kind: 'recognized'; provider: ProviderId }
  | { kind: 'cloud'; provider: ProviderId }
  | { kind: 'ambiguous'; candidates: ProviderId[] }
  | { kind: 'unknown' };

/**
 * Browser-safe JWT *shape* check - mirrors `providerKeyPatterns.isJwt`, minus
 * the base64-decode validation (which needs Node `Buffer`). A JWT-shaped key
 * starts with `eyJ` and has exactly three `.`-separated segments. The
 * main-process `connect` does the full decode; this is enough for live UI
 * recognition.
 */
function isJwtShape(key: string): boolean {
  return key.startsWith('eyJ') && key.split('.').length === 3;
}

/**
 * Browser-safe dot-split *shape* check - mirrors `providerKeyPatterns.isDotSplit`.
 * Two `.`-separated segments, each ≥10 chars, and not a JWT.
 */
function isDotSplitShape(key: string): boolean {
  if (isJwtShape(key)) return false;
  const parts = key.split('.');
  return parts.length === 2 && parts[0].length >= 10 && parts[1].length >= 10;
}

/**
 * Pure, browser-safe key recognition. Mirrors the prefix + structural rules in
 * the main-process `providerKeyPatterns` - kept in sync intentionally so the UI
 * can show live recognition without an IPC round-trip on every keystroke. The
 * `recognizeKey` parity test (`modelsSettings.dom.test.tsx`) fails CI if a
 * renderer prefix drifts out of `PROVIDER_KEY_PATTERNS`.
 * A bare `sk-` key is `ambiguous`; the connect call confirms it main-side.
 */
export function recognizeKey(raw: string): KeyRecognition {
  const key = raw.trim();
  if (!key) return { kind: 'unknown' };

  // Unique high-confidence prefixes (priority 100).
  if (key.startsWith('sk-ant-')) return { kind: 'recognized', provider: 'anthropic' };
  if (key.startsWith('sk-flux-')) return { kind: 'recognized', provider: 'flux-router' };
  if (key.startsWith('sk-or-')) return { kind: 'recognized', provider: 'openrouter' };
  if (key.startsWith('sk-proj-')) return { kind: 'recognized', provider: 'openai' };
  if (key.startsWith('AIza')) return { kind: 'recognized', provider: 'google-gemini' };
  if (key.startsWith('gsk_')) return { kind: 'recognized', provider: 'groq' };
  if (key.startsWith('xai-')) return { kind: 'recognized', provider: 'xai' };
  if (key.startsWith('hf_')) return { kind: 'recognized', provider: 'huggingface' };
  if (key.startsWith('pplx-')) return { kind: 'recognized', provider: 'perplexity' };
  if (key.startsWith('r8_')) return { kind: 'recognized', provider: 'replicate' };
  if (key.startsWith('tgp_')) return { kind: 'recognized', provider: 'together' };
  if (key.startsWith('fw_')) return { kind: 'recognized', provider: 'fireworks' };
  if (key.startsWith('csk-')) return { kind: 'recognized', provider: 'cerebras' };
  if (key.startsWith('nvapi-')) return { kind: 'recognized', provider: 'nvidia' };
  if (key.startsWith('esecret_')) return { kind: 'recognized', provider: 'anyscale' };
  if (key.startsWith('dg_')) return { kind: 'recognized', provider: 'deepgram' };
  if (key.startsWith('aai_')) return { kind: 'recognized', provider: 'assemblyai' };
  if (key.startsWith('xi-api-')) return { kind: 'recognized', provider: 'elevenlabs' };

  // Multi-field cloud provider (priority 90) - needs the credential form, not a
  // bare key.
  if (key.startsWith('AKIA') || key.startsWith('ASIA')) return { kind: 'cloud', provider: 'aws-bedrock' };

  // Structural sk- variants (priority 95) - bare-sk shapes that carry enough
  // signal to resolve to one provider without a server probe. Must be matched
  // before the bare `sk-` fallback below.
  // DeepSeek: `sk-` + exactly 32 lowercase hex chars (distinct from OpenAI's
  // 48-mixed-case legacy shape).
  if (/^sk-[a-f0-9]{32}$/.test(key)) return { kind: 'recognized', provider: 'deepseek' };
  // Moonshot / Kimi: `sk-` + 48 mixed-case alphanumerics, minus OpenAI's
  // `T3BlbkFJ` middle signature.
  if (/^sk-[A-Za-z0-9]{48}$/.test(key) && !key.includes('T3BlbkFJ')) {
    return { kind: 'recognized', provider: 'moonshot' };
  }

  // Bare `sk-` - could be several providers. Confirmed main-side on connect.
  if (key.startsWith('sk-')) {
    return {
      kind: 'ambiguous',
      candidates: ['openai', 'deepseek', 'moonshot', 'qwen', 'baichuan', 'lingyiwanwu', 'stability'],
    };
  }

  // Structural rules (priority 80) - checked last, after all prefixes.
  if (isJwtShape(key)) return { kind: 'recognized', provider: 'minimax' };
  if (isDotSplitShape(key)) return { kind: 'recognized', provider: 'zhipu-glm' };

  return { kind: 'unknown' };
}
