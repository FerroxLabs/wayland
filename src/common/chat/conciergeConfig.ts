/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Concierge Phase 2b — conversational config (propose → confirm → apply).
 *
 * SHARED CONTRACT. This module is the single source of truth for the
 * [CONCIERGE_PROPOSE] flow, imported by every layer so they cannot drift:
 *   - the detector (`ConciergeProposeDetector.ts`) parses a block into a {@link ConciergeProposal}
 *   - MessageMiddleware stores it as a `concierge_propose` message ({@link IConciergeConfigContent})
 *   - `ConciergeConfigCard.tsx` renders the confirm UI from that content
 *   - `conciergeConfigBridge.ts` (MAIN) applies it on accept via the real write paths
 *
 * SECURITY MODEL (mirrors the cron propose/confirm/apply flow, plus secret hygiene):
 *   - The agent NEVER puts secrets in the block. `provider_connect` carries only the
 *     provider id + label; the API key is entered in the confirm CARD and travels
 *     card → MAIN at accept time ({@link ConciergeConfirmParams.secret}). It is never
 *     stored in the message, never sent to the model, never written to the chat DB.
 *   - `add_mcp` env VALUES are masked (last-4) in the card display; they are written to
 *     `mcp.config` on accept (the app's existing storage convention for MCP env).
 *   - Nothing applies without an explicit `accept`. The confirm card IS the consent.
 *   - After apply, MAIN verifies and reports the result back into the card.
 *
 * Block format (documented for the model in the concierge SKILL.md):
 *   [CONCIERGE_PROPOSE]
 *   kind: provider_connect | set_default_model | add_mcp | edit_assistant
 *   <kind-specific key: value lines>
 *   [/CONCIERGE_PROPOSE]
 */

/**
 * The config mutations the Concierge can propose, plus `file_bug_report` (#464) —
 * a non-mutating action that opens a pre-filled GitHub issue (screenshot +
 * diagnostics) when the diag/flow surfaces a serious problem.
 */
export type ConciergeProposalKind =
  | 'provider_connect'
  | 'set_default_model'
  | 'add_mcp'
  | 'edit_assistant'
  | 'file_bug_report';

/** The default-model engines a `set_default_model` proposal can target. */
export type ConciergeDefaultModelEngine = 'wcore' | 'gemini';

/**
 * A parsed [CONCIERGE_PROPOSE] block. Discriminated on `kind`. NO field here ever
 * holds a raw secret (see the security model above).
 */
export type ConciergeProposal =
  | {
      kind: 'provider_connect';
      /** Catalog provider id, e.g. `openai`, `anthropic`. */
      providerId: string;
      /** Human label for the card, e.g. `OpenAI`. */
      label: string;
      /** Optional custom base URL (non-secret). */
      baseUrl?: string;
    }
  | {
      kind: 'set_default_model';
      engine: ConciergeDefaultModelEngine;
      /** Canonical model id stored in config. */
      modelId: string;
      /** The provider-native model name passed to the engine. */
      useModel: string;
      /** Human label for the card. */
      label: string;
    }
  | {
      kind: 'add_mcp';
      /** MCP server name (unique key in mcp.config). */
      name: string;
      /** stdio command, e.g. `npx`. */
      command: string;
      /** Command args. */
      args: string[];
      /** Optional env vars (values are masked in the card). */
      env?: Record<string, string>;
    }
  | {
      kind: 'edit_assistant';
      /** Runtime assistant id, e.g. `builtin-concierge`. */
      assistantId: string;
      /** Human label for the card. */
      label: string;
      /** New rules/persona markdown body. */
      rules: string;
    }
  | {
      kind: 'file_bug_report';
      /** Short, non-secret summary of the problem for the card header. */
      summary?: string;
    };

/** Lifecycle of a proposal card (mirrors the cron propose state machine). */
export type ConciergeConfigStatus = 'pending' | 'processing' | 'accepted' | 'cancelled' | 'error';

/**
 * The stored `concierge_propose` message content: the proposal plus UI/lifecycle
 * state. Persisted in the conversation DB and broadcast to the renderer — therefore
 * it must contain NO secret (enforced by {@link ConciergeProposal}).
 */
export type IConciergeConfigContent = ConciergeProposal & {
  status: ConciergeConfigStatus;
  /** Backend that emitted the proposal (for context; not trusted for authorization). */
  agentType?: string;
  /** Human-readable result written by MAIN after a successful apply ("verify + report"). */
  resultSummary?: string;
  /** Error message when status === 'error'. */
  error?: string;
};

/** Confirm-card actions. */
export type ConciergeConfirmAction = 'accept' | 'cancel';

/**
 * Payload for `ipcBridge.conciergeConfig.confirmProposal`. The optional `secret`
 * carries credentials the user typed into the card (provider_connect) — it exists
 * ONLY on this in-process IPC call and is never persisted to the message.
 */
export type ConciergeConfirmParams = {
  conversationId: string;
  msgId: string;
  action: ConciergeConfirmAction;
  /** provider_connect only: the API key + optional base URL entered in the card. */
  secret?: { apiKey?: string; baseUrl?: string };
};

/** Result of a confirm action. */
export type ConciergeConfirmResult = {
  ok: boolean;
  /** Failure reason (machine-readable), e.g. `message_not_found`, `unauthorized`. */
  reason?: string;
  /** Human-readable success summary (also stored as resultSummary). */
  summary?: string;
};

/** Fenced-tag constants (single source for detector + stripper + SKILL docs). */
export const CONCIERGE_PROPOSE_OPEN = '[CONCIERGE_PROPOSE]';
export const CONCIERGE_PROPOSE_CLOSE = '[/CONCIERGE_PROPOSE]';

/** All valid proposal kinds (runtime guard for the parser). */
export const CONCIERGE_PROPOSAL_KINDS: readonly ConciergeProposalKind[] = [
  'provider_connect',
  'set_default_model',
  'add_mcp',
  'edit_assistant',
  'file_bug_report',
];

/** Hard cap on the rules body an `edit_assistant` proposal may carry. */
export const CONCIERGE_RULES_MAX_CHARS = 100_000;

/** True when this proposal kind requires a secret entered in the card to apply. */
export function proposalNeedsCardSecret(kind: ConciergeProposalKind): boolean {
  return kind === 'provider_connect';
}

/** Mask a secret-ish value to its last 4 chars for display (e.g. `••••f00b`). */
export function maskSecretValue(value: string): string {
  if (!value) return '';
  const last4 = value.slice(-4);
  return `••••${last4}`;
}

/** One-line human summary of a proposal for the card header / logs (no secrets). */
export function summarizeProposal(p: ConciergeProposal): string {
  switch (p.kind) {
    case 'provider_connect':
      return `Connect provider ${p.label}${p.baseUrl ? ` (${p.baseUrl})` : ''}`;
    case 'set_default_model':
      return `Set ${p.engine} default model to ${p.label}`;
    case 'add_mcp':
      return `Add MCP server "${p.name}" (${p.command} ${p.args.join(' ')})`;
    case 'edit_assistant':
      return `Update ${p.label} instructions`;
    case 'file_bug_report':
      return p.summary ? `File a bug report: ${p.summary}` : 'File a bug report';
  }
}
