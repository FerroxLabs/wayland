/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified Agent Logo mapping utility
 *
 * All places that need to display agent icons should use this utility instead of maintaining separate lists
 */

import WaylandLogo from '@/renderer/assets/logos/brand/wayland.svg';
import AuggieLogo from '@/renderer/assets/logos/brand/auggie.svg';
import ClaudeLogo from '@/renderer/assets/logos/ai-major/claude.svg';
import CursorLogo from '@/renderer/assets/logos/tools/coding/cursor.png';
import CodeBuddyLogo from '@/renderer/assets/logos/tools/coding/codebuddy.svg';
import CodexLogo from '@/renderer/assets/logos/tools/coding/codex.svg';
import DroidLogo from '@/renderer/assets/logos/brand/droid.svg';
import GeminiLogo from '@/renderer/assets/logos/ai-major/gemini.svg';
import GitHubLogo from '@/renderer/assets/logos/tools/github.svg';
import GooseLogo from '@/renderer/assets/logos/tools/goose.svg';
import GrokLogo from '@/renderer/assets/logos/ai-major/xai.svg';
import HermesLogo from '@/renderer/assets/logos/brand/hermes.svg';
import SnowLogo from '@/renderer/assets/logos/tools/coding/snow.png';
import KimiLogo from '@/renderer/assets/logos/ai-china/kimi.svg';
import MistralLogo from '@/renderer/assets/logos/ai-major/mistral.svg';
import NanobotLogo from '@/renderer/assets/logos/tools/nanobot.svg';
import OpenClawLogo from '@/renderer/assets/logos/tools/openclaw.svg';
import OpenCodeLogoDark from '@/renderer/assets/logos/tools/coding/opencode-dark.svg';
import OpenCodeLogoLight from '@/renderer/assets/logos/tools/coding/opencode-light.svg';
import QoderLogo from '@/renderer/assets/logos/tools/coding/qoder.png';
import QwenLogo from '@/renderer/assets/logos/ai-china/qwen.svg';

/**
 * Agent Logo mapping table
 *
 * Note: keys are lowercase, supports multiple variants (e.g., openclaw-gateway and openclaw)
 */
const AGENT_LOGO_MAP = {
  wcore: WaylandLogo,
  claude: ClaudeLogo,
  gemini: GeminiLogo,
  qwen: QwenLogo,
  codex: CodexLogo,
  grok: GrokLogo,
  codebuddy: CodeBuddyLogo,
  droid: DroidLogo,
  goose: GooseLogo,
  hermes: HermesLogo,
  snow: SnowLogo,
  auggie: AuggieLogo,
  kimi: KimiLogo,
  opencode: OpenCodeLogoLight,
  copilot: GitHubLogo,
  openclaw: OpenClawLogo,
  'openclaw-gateway': OpenClawLogo,
  vibe: MistralLogo,
  nanobot: NanobotLogo,
  remote: OpenClawLogo,
  qoder: QoderLogo,
  cursor: CursorLogo,
} as const satisfies Record<string, string>;

function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return false;
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/**
 * Get agent logo by agent name
 *
 * @param agent - Agent name (case-insensitive)
 * @returns Logo path, or null if not found
 */
export function getAgentLogo(agent: string | undefined | null): string | null {
  if (!agent) return null;
  const key = agent.toLowerCase() as keyof typeof AGENT_LOGO_MAP;
  if (key === 'opencode') {
    return isDarkTheme() ? OpenCodeLogoDark : OpenCodeLogoLight;
  }
  return AGENT_LOGO_MAP[key] || null;
}

/**
 * Backends whose logo is a monochrome black / `currentColor` mark. Loaded via
 * `<img src>` (a replaced element), `currentColor` resolves to its initial value
 * (black), so these render black-on-black and vanish on the dark theme. We force
 * them to a clean white silhouette on dark. Colored brand logos (claude, gemini,
 * codebuddy, hermes, nanobot, openclaw, vibe) are deliberately excluded so their
 * brand colour is never flattened.
 */
const MONOCHROME_DARK_AGENT_LOGOS = new Set(['codex', 'copilot', 'goose', 'auggie', 'kimi', 'grok']);

/**
 * On the dark theme, whether this agent's logo needs forcing to a white
 * silhouette (it is a monochrome/`currentColor` mark that would otherwise be
 * invisible). Returns the CSS filter to apply, or undefined when none is needed.
 */
export function agentLogoDarkFilter(agent: string | undefined | null): string | undefined {
  if (!agent) return undefined;
  const key = agent.toLowerCase();
  if (!MONOCHROME_DARK_AGENT_LOGOS.has(key)) return undefined;
  return isDarkTheme() ? 'brightness(0) invert(1)' : undefined;
}

/**
 * Resolve the best available logo for an agent.
 *
 * Priority:
 *   1. Explicit icon/avatar (if provided)
 *   2. Adapter ID from customAgentId (format `ext:extensionName:adapterId`) → built-in logo map
 *   3. Backend ID → built-in logo map
 *   4. null (caller renders its own fallback)
 */
export function resolveAgentLogo(opts: {
  icon?: string | null;
  backend?: string | null;
  customAgentId?: string | null;
  isExtension?: boolean;
}): string | null {
  if (opts.icon) return opts.icon;

  // For extension agents, extract adapter ID from customAgentId
  if (opts.isExtension && opts.customAgentId) {
    const adapterId = opts.customAgentId.split(':').pop();
    const logo = getAgentLogo(adapterId);
    if (logo) return logo;
  }

  return getAgentLogo(opts.backend);
}

/**
 * Check if agent has a corresponding logo
 *
 * @param agent - Agent name (case-insensitive)
 * @returns Whether the agent has a corresponding logo
 */
export function hasAgentLogo(agent: string | undefined | null): boolean {
  return getAgentLogo(agent) !== null;
}

/**
 * Check if a model value/label indicates it's a default/recommended model
 *
 * @param value - Model value
 * @param label - Model label
 * @returns true if the model is marked as default/recommended
 */
export const isDefaultModel = (value?: string | null, label?: string | null): boolean => {
  const text = `${value || ''} ${label || ''}`.toLowerCase();
  return text.includes('default') || text.includes('recommended') || text.includes('默认');
};

/**
 * Get display label for a model, with fallback handling
 *
 * @param selectedValue - Selected model value
 * @param selectedLabel - Selected model label
 * @param defaultModelLabel - Label to use for default models
 * @param fallbackLabel - Label to use when no label is available
 * @returns The computed display label
 */
export const getModelDisplayLabel = ({
  selectedValue,
  selectedLabel,
  defaultModelLabel,
  fallbackLabel,
}: {
  selectedValue?: string | null;
  selectedLabel?: string | null;
  defaultModelLabel: string;
  fallbackLabel: string;
}): string => {
  if (!selectedLabel) return fallbackLabel;
  return isDefaultModel(selectedValue, selectedLabel) ? defaultModelLabel : selectedLabel;
};
