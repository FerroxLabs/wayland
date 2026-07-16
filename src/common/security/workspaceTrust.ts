/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Per-workspace access axis (#671, desktop half of #657).
 *
 * A workspace is either `ask` (prompt on every gated tool) or `trusted-edits`
 * (auto-approve read/edit tools, STILL prompt on exec + network). This axis is
 * orthogonal to the Cowork assistant and to per-agent permission modes.
 *
 * This module holds ONLY the pure decision logic + the level type, so both the
 * renderer and every process-side approval gate share one source of truth for
 * what "trusted edits" means on each backend. The persisted store lives in
 * the main process (`@process/permissions/workspaceTrust`).
 *
 * `chat` / `cowork` are accepted only as legacy serialized inputs. They must
 * never be used as product-facing authority labels: selecting Cowork does not
 * and must not widen workspace access.
 */

export type WorkspaceAccessLevel = 'ask' | 'trusted-edits';
export type LegacyWorkspaceTrustLevel = 'chat' | 'cowork';
export type WorkspaceAccessInput = WorkspaceAccessLevel | LegacyWorkspaceTrustLevel;

export const DEFAULT_WORKSPACE_ACCESS_LEVEL: WorkspaceAccessLevel = 'ask';

/**
 * Normalize an undefined/unknown persisted value to the fail-safe default.
 * An empty/uninitialized store therefore reads as `ask` (prompt), never as
 * trusted — the failure direction is always "prompt more", never "auto-approve".
 */
export function coerceWorkspaceAccessLevel(value: unknown): WorkspaceAccessLevel {
  return value === 'trusted-edits' || value === 'cowork' ? 'trusted-edits' : DEFAULT_WORKSPACE_ACCESS_LEVEL;
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
 * True when a trusted-edits workspace should auto-approve this raw ACP tool
 * kind. Used by the ACP + OpenClaw manager gates.
 */
export function trustedWorkspaceAutoApprovesAcpKind(kind: string | undefined | null): boolean {
  return typeof kind === 'string' && TRUSTED_AUTO_APPROVE_ACP_KINDS.has(kind);
}

/**
 * True when a trusted-edits workspace should auto-approve this Gemini/WCore
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
