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
 *         | file_bug_report | install_agent | enable_routine | install_skill
 *   <kind-specific key: value lines>
 *   [/CONCIERGE_PROPOSE]
 *
 * Block keys per kind (the detector reads exactly these):
 *   install_agent  → agent: <id>  package: <npm name>  version: <exact>  [label: <text>]
 *   enable_routine → routine: <routineId>  [label: <text>]
 *   install_skill  → name: <dir>  url: <https URL>  sha256: <64 hex>  [label: <text>]
 *
 * `install_skill` carries a SHA256 because the URL alone is advisory: a
 * [CONCIERGE_PROPOSE] block can be prompt-injected, and a skill is instructions
 * the model later obeys. The hash is what makes ANY host safe, which is also why
 * no host is hard-coded anywhere in this path.
 */

/**
 * The config mutations the Concierge can propose, plus `file_bug_report` (#464) —
 * a non-mutating action that opens a pre-filled GitHub issue (screenshot +
 * diagnostics) when the diag/flow surfaces a serious problem.
 */
export type ConciergeProposalKind =
  | 'install_skill'
  | 'provider_connect'
  | 'set_default_model'
  | 'add_mcp'
  | 'edit_assistant'
  | 'file_bug_report'
  | 'install_agent'
  | 'enable_routine';

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
    }
  | {
      kind: 'install_agent';
      /**
       * Catalogue agent id (a key of AGENT_PACKAGES, e.g. `kimi`, `codex`).
       *
       * This is the ONLY authoritative field. It becomes a path segment
       * (`<userData>/agents/<agentId>`), so it is held to the same closed
       * alphabet the installer enforces — see {@link CONCIERGE_AGENT_ID_PATTERN}.
       */
      agentId: string;
      /**
       * npm package the model BELIEVES is pinned for `agentId`, shown in the card
       * so the user consents to a named package rather than a bare agent name.
       *
       * ADVISORY, NEVER AUTHORITATIVE. The apply handler resolves the real
       * package from the pinned catalogue by `agentId` and installs THAT; it must
       * first refuse any proposal whose claim disagrees, via
       * {@link installAgentProposalMatchesPin}. Trusting this field would let a
       * prompt-injected block install an arbitrary npm package.
       */
      npmPackage: string;
      /** Exact pinned version the model believes applies. Advisory, as above. */
      version: string;
      /** Human label for the card, e.g. `Kimi`. Falls back to `agentId`. */
      label?: string;
    }
  | {
      kind: 'install_skill';
      /**
       * Directory name the skill installs under (`<userData>/config/skills/<name>`),
       * so it is held to the same closed alphabet as an agent id. It must also
       * match the pack's own `SKILL.md` frontmatter `name:` - the apply handler
       * refuses a mismatch rather than trusting either side alone.
       */
      name: string;
      /**
       * HTTPS URL of the pack archive.
       *
       * ADVISORY ON ITS OWN. A [CONCIERGE_PROPOSE] block can be prompt-injected,
       * and a skill is INSTRUCTIONS THE MODEL LATER OBEYS, so a URL by itself is
       * not a sufficient authorisation. `sha256` is what pins the bytes: the
       * apply handler hashes what it downloaded and refuses on any mismatch, so
       * a hijacked host or a swapped archive cannot change what the user
       * consented to on the card.
       */
      url: string;
      /** Lowercase hex SHA-256 of the archive. REQUIRED - see `url`. */
      sha256: string;
      /** Human label for the card, e.g. `TC-TIDE Morning Brief`. Falls back to `name`. */
      label?: string;
    }
  | {
      kind: 'enable_routine';
      /**
       * Id of a SEEDED built-in routine (`routines.json`), e.g.
       * `friday-weekly-review`. Routines seed disabled; accepting flips exactly
       * one of them to enabled.
       *
       * The apply handler must look the job up among crons tagged
       * `configOptions.kind === 'routine'` and refuse when no seeded routine
       * matches, so this can never reach a user-created cron.
       */
      routineId: string;
      /** Human label for the card, e.g. `Friday weekly review`. Falls back to `routineId`. */
      label?: string;
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
  'install_agent',
  'enable_routine',
  'install_skill',
];

/** Hard cap on the rules body an `edit_assistant` proposal may carry. */
export const CONCIERGE_RULES_MAX_CHARS = 100_000;

/**
 * Agent ids are install directory names. Deliberately mirrors
 * `AGENT_ID_PATTERN` in `src/process/services/agentInstaller/installPrefix.ts`
 * (duplicated rather than imported: this module is bundled into the renderer and
 * must not reach into `process/`). Lowercase alphanumerics and hyphens only — no
 * dots (blocks `.`/`..`), no separators, no colon, no whitespace.
 */
export const CONCIERGE_AGENT_ID_PATTERN = /^[a-z0-9-]+$/;

/** Routine ids as authored in `routines.json` (kebab-case). */
export const CONCIERGE_ROUTINE_ID_PATTERN = /^[a-z0-9-]+$/;

/** npm package name, optionally scoped. Length capped at npm's own 214 limit. */
const NPM_PACKAGE_PATTERN = /^(?:@[a-z0-9-][a-z0-9-._]*\/)?[a-z0-9-][a-z0-9-._]*$/;

/**
 * An EXACT published version: `1.2.3`, optionally with a prerelease/build tail.
 * Ranges (`^1.2.3`, `~1.2`, `1.x`, `*`) and dist-tags (`latest`) are rejected —
 * the installer pins exact bytes and the card must name what it will fetch.
 */
const EXACT_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)*$/;

/** Trimmed non-empty string, or undefined. */
function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Loosely-typed fields as the detector reads them off a block body. */
type RawFields = Record<string, unknown>;

/**
 * Validate an `install_agent` block's fields into a proposal, or null when the
 * block is malformed. Called by the detector; also the contract the apply
 * handler is written against.
 */
export function validateInstallAgentProposal(
  raw: RawFields
): Extract<ConciergeProposal, { kind: 'install_agent' }> | null {
  const agentId = str(raw.agentId);
  const npmPackage = str(raw.npmPackage);
  const version = str(raw.version);
  if (!agentId || !npmPackage || !version) return null;
  if (!CONCIERGE_AGENT_ID_PATTERN.test(agentId)) return null;
  if (npmPackage.length > 214 || !NPM_PACKAGE_PATTERN.test(npmPackage)) return null;
  if (!EXACT_VERSION_PATTERN.test(version)) return null;
  const label = str(raw.label);
  return label
    ? { kind: 'install_agent', agentId, npmPackage, version, label }
    : { kind: 'install_agent', agentId, npmPackage, version };
}

/** A skill name becomes a path segment, so it uses the same closed alphabet as an agent id. */
export const CONCIERGE_SKILL_NAME_PATTERN = /^[a-z0-9-]+$/;
/** Lowercase hex SHA-256, exactly 64 chars. */
export const CONCIERGE_SHA256_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Validate an `install_skill` block's fields into a proposal, or null when the
 * block is malformed.
 *
 * Every rule here is a REFUSAL, never a repair. A block that names a plausible
 * pack but carries a bad hash, a plain-http URL, or a name that would escape the
 * skills directory is not a typo to be corrected - it is the shape an attack
 * takes, and correcting it would install something the user never saw.
 */
export function validateInstallSkillProposal(
  raw: RawFields
): Extract<ConciergeProposal, { kind: 'install_skill' }> | null {
  const name = str(raw.name);
  const url = str(raw.url);
  const sha256 = str(raw.sha256);
  if (!name || !url || !sha256) return null;
  if (name.length > 64 || !CONCIERGE_SKILL_NAME_PATTERN.test(name)) return null;
  if (!CONCIERGE_SHA256_PATTERN.test(sha256)) return null;
  // https only: the hash pins the bytes, but plain http leaks which pack a
  // customer bought and invites a downgrade attempt on the download itself.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  const label = str(raw.label);
  return label ? { kind: 'install_skill', name, url, sha256, label } : { kind: 'install_skill', name, url, sha256 };
}

/**
 * Validate an `enable_routine` block's fields into a proposal, or null when the
 * block is malformed.
 */
export function validateEnableRoutineProposal(
  raw: RawFields
): Extract<ConciergeProposal, { kind: 'enable_routine' }> | null {
  const routineId = str(raw.routineId);
  if (!routineId || !CONCIERGE_ROUTINE_ID_PATTERN.test(routineId)) return null;
  const label = str(raw.label);
  return label ? { kind: 'enable_routine', routineId, label } : { kind: 'enable_routine', routineId };
}

/**
 * Does an `install_agent` proposal agree with the pinned catalogue entry for its
 * `agentId`? The apply handler MUST call this and abort on false.
 *
 * The proposal's package/version are model-authored display values; the catalogue
 * is the only source of truth for what gets installed. A mismatch means the card
 * showed the user one package and the install would fetch another, so it is a
 * refusal, not a silent correction.
 *
 * @param pinned The catalogue entry for `p.agentId`, or undefined when the agent
 *   is not catalogued at all (also a refusal).
 */
export function installAgentProposalMatchesPin(
  p: Extract<ConciergeProposal, { kind: 'install_agent' }>,
  pinned: { npmPackage: string; version: string } | undefined
): boolean {
  if (!pinned) return false;
  return p.npmPackage === pinned.npmPackage && p.version === pinned.version;
}

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
    case 'install_agent':
      return `Install ${p.label ?? p.agentId} (${p.npmPackage}@${p.version})`;
    case 'install_skill':
      return `Install skill ${p.label || p.name}`;
    case 'enable_routine':
      return `Enable routine "${p.label ?? p.routineId}"`;
  }
}
