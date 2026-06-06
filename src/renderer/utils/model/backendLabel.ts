// src/renderer/utils/model/backendLabel.ts
//
// Shared backend display-label map. Extracted per W2c code review - the same
// table was duplicated in TeamRightRail.tsx + TeamHeaderBadges.tsx, and W2d
// would have added a third copy. Single source of truth lives here.
//
// Adding a new backend: add it to BACKEND_LABEL below. `getBackendLabel`
// falls back to capitalizing the raw `agentType` string when no mapping
// exists, so an unrecognized backend still renders sanely.

export const BACKEND_LABEL: Record<string, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
  codex: 'Codex',
  qwen: 'Qwen',
  codebuddy: 'CodeBuddy',
  goose: 'Goose',
  auggie: 'Augment',
  kimi: 'Kimi',
  wcore: 'Wayland Core',
};

/**
 * Resolve a human-readable label for a backend `agentType`.
 *
 * Returns the mapped label when known; otherwise capitalizes the first
 * letter of `agentType` so unknown backends still display reasonably
 * instead of leaking lower-case ids into the UI.
 */
export const getBackendLabel = (agentType: string): string => {
  const mapped = BACKEND_LABEL[agentType];
  if (mapped) return mapped;
  if (!agentType) return '';
  return agentType.charAt(0).toUpperCase() + agentType.slice(1);
};
