/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Per-workspace trust axis (#671, desktop half of #657).
 *
 * A workspace is either 'chat' (gated — prompt on every tool) or 'cowork'
 * (trusted — auto-approve read/edit tools, STILL prompt on exec + network).
 * Persisted per workspace (survives restart). The composer Chat<->Cowork toggle
 * is the UI surface. This is an axis ORTHOGONAL to the per-agent permission mode
 * (default/acceptEdits/autopilot), not a new mode value.
 *
 * This module holds ONLY the pure decision logic + the level type, so both the
 * renderer (toggle) and every process-side approval gate share one source of
 * truth for what "trusted" means on each backend. The persisted store lives in
 * the main process (`@process/permissions/workspaceTrust`).
 */

export type WorkspaceTrustLevel = 'chat' | 'cowork';

export const DEFAULT_WORKSPACE_TRUST_LEVEL: WorkspaceTrustLevel = 'chat';

/**
 * Normalize an undefined/unknown persisted value to the fail-safe default.
 * An empty/uninitialized store therefore reads as 'chat' (prompt), never as
 * trusted — the failure direction is always "prompt more", never "auto-approve".
 */
export function coerceWorkspaceTrustLevel(value: unknown): WorkspaceTrustLevel {
  return value === 'cowork' ? 'cowork' : DEFAULT_WORKSPACE_TRUST_LEVEL;
}

/**
 * Raw ACP `toolCall.kind` values a trusted workspace auto-approves. These are
 * matched against the RAW 10-value ACP kind (read/search/edit/delete/move/
 * execute/think/fetch/switch_mode/other), NOT the collapsed 3-value kind — the
 * manager gate has the raw kind in hand (mirroring `shouldAutoApproveAcpEdit`,
 * which compares raw `toolKind === 'edit'`).
 *
 * Deliberately NON-destructive and NON-network:
 * - read / search  → read-only.
 * - edit           → in-place file edit (same as acceptEdits mode).
 * `delete` and `move` are EXCLUDED — destructive file ops always prompt. `fetch`
 * (network), `execute`, `think`, `switch_mode`, `other` are EXCLUDED — exec +
 * network always prompt. MCP tool calls surface as `execute`/`other` and so also
 * prompt, never riding the trusted auto-approve.
 */
const TRUSTED_AUTO_APPROVE_ACP_KINDS: ReadonlySet<string> = new Set(['read', 'search', 'edit']);

/**
 * True when a trusted (cowork) workspace should auto-approve this raw ACP tool
 * kind. Used by the ACP + OpenClaw manager gates.
 */
export function trustedWorkspaceAutoApprovesAcpKind(kind: string | undefined | null): boolean {
  return typeof kind === 'string' && TRUSTED_AUTO_APPROVE_ACP_KINDS.has(kind);
}

/**
 * True when a trusted (cowork) workspace should auto-approve this Gemini/WCore
 * confirmation `type`. ONLY `'edit'` is auto-approved on these backends.
 *
 * `'info'` is deliberately NOT auto-approved: unlike the ACP `read` kind, the
 * Gemini/WCore `info` category is an engine-assigned CATCH-ALL (WCore routes
 * unrecognized categories to `info`; Gemini's info-confirmation shape carries
 * `urls` for network fetches). Auto-approving `info` under trust would silently
 * auto-approve network/unclassified tools — exactly the "prompt on network"
 * contract we must keep. Genuine file reads on these backends generally do not
 * raise a confirmation at all, so restricting to `edit` costs little and keeps
 * trust conservative (stricter than the user-chosen auto_edit mode, by design).
 */
export function trustedWorkspaceAutoApprovesConfirmationType(type: string | undefined | null): boolean {
  return type === 'edit';
}
