/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CODEX_MODE_AUTO_EDIT,
  CODEX_MODE_FULL_AUTO,
  CODEX_MODE_FULL_AUTO_NO_SANDBOX,
} from '@/common/types/codex/codexModes';

/**
 * Agent mode option interface
 */
export interface AgentModeOption {
  /** Mode value sent to agent */
  value: string;
  /** Display label matching CLI display */
  label: string;
  /** Optional description */
  description?: string;
}

/**
 * Agent modes configuration
 * Maps backend type to available modes
 * Labels match CLI display text exactly - no i18n.
 *
 * Note:
 * - Claude: supports session/set_mode via ACP
 *   - Modes: default, acceptEdits, plan, auto, bypassPermissions (Autopilot), dontAsk
 * - Qwen: ACP session/set_mode returns success but does not enforce plan mode behavior.
 *   Plan mode disabled until upstream fix. See https://github.com/QwenLM/qwen-code/issues/1806
 * - OpenCode: plan/build modes via ACP session/set_mode (no autopilot support)
 * - Gemini: supports default/autoEdit/autopilot (auto-approve at manager layer, not via ACP)
 * - Codex: default modes stay sandboxed; a dedicated unsafe full-auto mode disables the sandbox
 * - Goose: mode set at startup only, not during session
 * - Cursor: agent/plan/ask modes via ACP session/set_mode (verified via `agent acp` session/new response)
 *
 * Note: internal mode values stay as 'yolo' / 'bypassPermissions' because they
 * are persisted in storage and wired into agent CLIs. Only the user-facing label
 * was renamed to 'Autopilot' to drop the upstream-AionUI YOLO branding.
 */
export const AGENT_MODES: Record<string, AgentModeOption[]> = {
  claude: [
    { value: 'default', label: 'Default' },
    { value: 'acceptEdits', label: 'Accept Edits', description: 'Auto-approve file edits, prompt for commands' },
    { value: 'plan', label: 'Plan' },
    { value: 'bypassPermissions', label: 'Autopilot' },
    { value: 'dontAsk', label: "Don't Ask", description: 'Block all actions except pre-approved rules' },
  ],
  // Qwen: ACP session/set_mode returns success but does not enforce plan mode behavior.
  // Plan mode disabled until upstream fix. See https://github.com/QwenLM/qwen-code/issues/1806
  qwen: [
    { value: 'default', label: 'Default' },
    { value: 'yolo', label: 'Autopilot' },
  ],
  opencode: [
    { value: 'build', label: 'Build' },
    { value: 'plan', label: 'Plan' },
  ],
  gemini: [
    { value: 'default', label: 'Default' },
    { value: 'autoEdit', label: 'Auto-Accept Edits' },
    { value: 'yolo', label: 'Autopilot' },
  ],
  wcore: [
    { value: 'default', label: 'Default' },
    { value: 'auto_edit', label: 'Auto-Accept Edits' },
    { value: 'yolo', label: 'Autopilot' },
  ],
  codex: [
    { value: 'default', label: 'Plan' },
    { value: CODEX_MODE_AUTO_EDIT, label: 'Auto Edit' },
    { value: CODEX_MODE_FULL_AUTO, label: 'Full Auto' },
    { value: CODEX_MODE_FULL_AUTO_NO_SANDBOX, label: 'Full Auto (No Sandbox)' },
  ],
  cursor: [
    { value: 'agent', label: 'Agent', description: 'Full agent capabilities with tool access' },
    { value: 'plan', label: 'Plan', description: 'Read-only mode for planning and designing before implementation' },
    { value: 'ask', label: 'Ask', description: 'Q&A mode - no edits or command execution' },
  ],
  snow: [
    { value: 'default', label: 'Agent', description: 'Full agent mode with tool access' },
    { value: 'yolo', label: 'Autopilot', description: 'Auto-approve all operations without prompting' },
  ],
};

/**
 * Get available modes for a given backend
 * Returns empty array if backend doesn't support mode switching
 *
 * @param backend - Agent backend type
 * @returns Array of available modes
 */
export function getAgentModes(backend: string | undefined): AgentModeOption[] {
  if (!backend) return [];
  return AGENT_MODES[backend] || [];
}

/**
 * Convert a snake_case mode value to a title-cased label.
 * e.g. 'auto_edit' -> 'Auto Edit', 'plan' -> 'Plan'
 */
function toTitleCase(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Merge static mode definitions with dynamic capabilities from the agent.
 * - If capabilityModes is null/empty, return static modes (fallback).
 * - Otherwise, return only modes reported by capabilities, preserving
 *   static labels when available and title-casing unknown modes.
 *
 * @param backend - Agent backend type
 * @param capabilityModes - Dynamic modes from capabilities.modes (null = not available)
 */
export function mergeWithCapabilities(
  backend: string | undefined,
  capabilityModes: string[] | null
): AgentModeOption[] {
  const staticModes = getAgentModes(backend);
  if (!capabilityModes || capabilityModes.length === 0) {
    return staticModes;
  }

  const staticMap = new Map(staticModes.map((m) => [m.value, m]));
  return capabilityModes.map((value) => staticMap.get(value) ?? { value, label: toTitleCase(value) });
}

/**
 * Check if a backend supports mode switching during session
 *
 * @param backend - Agent backend type
 * @returns true if mode switching is supported
 */
export function supportsModeSwitch(backend: string | undefined): boolean {
  if (!backend) return false;
  return backend in AGENT_MODES && AGENT_MODES[backend].length > 0;
}

/**
 * Full-auto mode value per backend.
 * Re-exported from common for backward compatibility.
 */
export { getFullAutoMode } from '@/common/types/agentModes';
