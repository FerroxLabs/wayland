/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

const CODEX_REASONING_EFFORTS = new Set([
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
  'ultra',
  'ultracode',
  'auto',
]);

export type ParsedCodexModelId = {
  baseModelId: string;
  effort?: string;
};

/**
 * Split Codex's effort-qualified ACP model IDs while leaving every unknown
 * suffix untouched as part of the provider-owned model ID.
 */
export function parseCodexModelId(modelId: string): ParsedCodexModelId {
  const bracketIndex = modelId.lastIndexOf('[');
  if (bracketIndex > 0 && modelId.endsWith(']')) {
    const effort = modelId.slice(bracketIndex + 1, -1);
    if (CODEX_REASONING_EFFORTS.has(effort)) {
      return { baseModelId: modelId.slice(0, bracketIndex), effort };
    }
  }

  const slashIndex = modelId.lastIndexOf('/');
  if (slashIndex > 0) {
    const effort = modelId.slice(slashIndex + 1);
    if (CODEX_REASONING_EFFORTS.has(effort)) {
      return { baseModelId: modelId.slice(0, slashIndex), effort };
    }
  }

  return { baseModelId: modelId };
}
