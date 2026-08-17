/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { CODEX_MODE_FULL_AUTO } from '@/common/types/codex/codexModes';

/**
 * Full-auto (YOLO) mode ID per backend.
 * Shared by renderer (cron task creation) and process (SessionLifecycle).
 */
/**
 * Wayland-internal "guarded auto" ACP session mode for unattended runs
 * (scheduled tasks, workflows). The agent proceeds without per-tool prompts for
 * the tool kinds the guardrail allows, but Wayland still surfaces the rest -
 * strictly safer than 'bypassPermissions', which runs everything blind. The
 * claude bridge does not understand this value: `mapModeForAcpBridge` translates
 * it to the bridge's 'default' mode (which escalates risky tool calls as
 * permission requests), and `AcpAgentManager` runs each escalated request
 * through `classifyAutopilotToolCall` (see destructiveCommand.ts): only
 * read/search/edit/think, plus an `execute` whose command passes the
 * catastrophic-command classifier, are auto-approved. Everything else surfaces
 * a confirmation.
 *
 * Because that enforcement is entirely client-side, a guarded-auto session must
 * never be given the blanket `yoloMode`/`autoApproveAll` flag - that short-
 * circuits inside PermissionResolver before the guardrail is ever consulted.
 * `AcpAgentManager` clears it for this mode on every path that sets it,
 * including the scheduled-task executor, which builds every task with
 * `yoloMode: true`.
 */
export const ACP_AUTO_GUARDED_MODE = 'autoGuarded';

const FULL_AUTO_MODE: Record<string, string> = {
  claude: ACP_AUTO_GUARDED_MODE,
  qwen: 'yolo',
  opencode: 'build',
  gemini: 'yolo',
  wcore: 'yolo',
  codex: CODEX_MODE_FULL_AUTO,
  cursor: 'agent',
  snow: 'yolo',
};

/** True when a session is in the Wayland-internal guarded-auto mode. */
export function isAutoGuardedMode(mode: string | undefined): boolean {
  return mode === ACP_AUTO_GUARDED_MODE;
}

/**
 * Resolve the blanket auto-approve flag ("yolo" / `autoApproveAll`) for a session.
 *
 * This is the invariant that makes guarded-auto mean anything: guarded-auto is
 * enforced ENTIRELY client-side by the Autopilot guardrail in `AcpAgentManager`,
 * which can only run if permission requests actually reach it. The blanket flag
 * short-circuits inside `PermissionResolver` before any classifier runs and
 * without invoking the UI callback, so no permission signal is ever emitted and
 * the guardrail is skipped completely.
 *
 * `requested` is whatever the caller would otherwise have used - including
 * `data.yoloMode`, which the scheduled-task executor sets to true on EVERY task
 * it builds. Guarded-auto overrides it. Every other mode passes through, so an
 * explicitly chosen Autopilot ('bypassPermissions') session is unaffected.
 */
export function resolveBlanketAutoApprove(mode: string | undefined, requested: boolean): boolean {
  return isAutoGuardedMode(mode) ? false : requested;
}

/**
 * Translate a Wayland-internal session mode into the value the ACP bridge
 * understands before `session/set_mode`. Only 'autoGuarded' needs translation
 * (-> 'default', so the bridge escalates risky tool calls as permission requests
 * that Wayland's guardrail can then auto-approve-or-veto). Every real bridge mode
 * passes through unchanged.
 */
export function mapModeForAcpBridge(mode: string): string {
  return mode === ACP_AUTO_GUARDED_MODE ? 'default' : mode;
}

/**
 * Resolve the effective `session/set_mode` modeId to send to an ACP agent,
 * validated against the modes the agent actually advertised (in session/new or
 * initialize).
 *
 * The requested mode is first translated to the bridge vocabulary via
 * `mapModeForAcpBridge` (e.g. 'autoGuarded' -> 'default'). The result is then
 * checked against the agent's advertised modes: some backends do not expose a
 * 'default' agent - opencode's primary mode is 'build' - so sending an
 * unadvertised modeId makes the agent reject the request ("Agent not found:
 * default") and the session never becomes usable (issue #298). When the agent
 * advertised modes and the mapped id is not among them, fall back to the agent's
 * advertised current/primary mode (or the first advertised mode).
 *
 * When the agent advertised no modes (e.g. the Claude bridge, which honors
 * 'default'/'acceptEdits' without listing them in a top-level `modes` object),
 * the mapped id is trusted as-is so existing backends are unaffected.
 */
export function resolveAcpSessionModeId(
  mode: string,
  availableModes: ReadonlyArray<{ id: string }> | undefined,
  currentModeId: string | null | undefined
): string {
  const bridgeModeId = mapModeForAcpBridge(mode);
  if (!availableModes || availableModes.length === 0) return bridgeModeId;
  if (availableModes.some((m) => m.id === bridgeModeId)) return bridgeModeId;
  if (currentModeId && availableModes.some((m) => m.id === currentModeId)) return currentModeId;
  return availableModes[0].id;
}

/**
 * Get the full-auto mode value for a given backend.
 * Falls back to 'yolo' for unknown backends.
 */
export function getFullAutoMode(backend: string | undefined): string {
  if (!backend) return 'yolo';
  return FULL_AUTO_MODE[backend] || 'yolo';
}

/**
 * ACP session mode that auto-approves file edits while still prompting for
 * commands (Claude's "Accept Edits"). Other ACP backends (Gemini/WCore) enforce
 * their own auto-edit mode at the manager layer; this constant covers the ACP
 * `session/set_mode` modeId surfaced by the claude bridge.
 */
const ACP_ACCEPT_EDITS_MODE = 'acceptEdits';

/**
 * Decide whether an ACP permission request should be auto-approved at the manager
 * layer because the session is in "Accept Edits" mode and the tool is a file edit.
 *
 * The claude ACP bridge still forwards a `session/request_permission` for edit
 * tools even after `session/set_mode` -> `acceptEdits`, so Wayland must honor the
 * mode itself (mirroring GeminiAgentManager.autoEdit and WCoreManager.auto_edit).
 * Read/execute tools are intentionally NOT auto-approved here: the "Accept Edits"
 * contract is "auto-approve file edits, prompt for commands".
 *
 * @param mode - The current ACP session mode (e.g. 'default', 'acceptEdits').
 * @param toolKind - The ACP toolCall.kind (e.g. 'edit', 'read', 'execute').
 * @returns true when the edit should be auto-approved without prompting.
 */
export function shouldAutoApproveAcpEdit(mode: string | undefined, toolKind: string | undefined): boolean {
  return mode === ACP_ACCEPT_EDITS_MODE && toolKind === 'edit';
}
