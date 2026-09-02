/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Concierge Phase 2b detector: parse `[CONCIERGE_PROPOSE]…[/CONCIERGE_PROPOSE]`
 * blocks emitted by the agent into validated {@link ConciergeProposal}s.
 *
 * Mirrors `CronCommandDetector.ts`: code blocks are stripped first (so the
 * block format documented in the skill/persona is never executed as a real
 * proposal), each block is parsed by `key: value` lines, and a block that is
 * missing a required field for its kind is SKIPPED (omitted from the result).
 *
 * SECURITY: an `api_key:`/`key:` line is deliberately IGNORED — secrets never
 * travel through the proposal block; the key is entered in the confirm card.
 * See `src/common/chat/conciergeConfig.ts` for the full contract + format.
 */

import {
  type ConciergeProposal,
  type ConciergeProposalKind,
  CONCIERGE_PROPOSAL_KINDS,
  validateInstallSkillProposal,
  CONCIERGE_RULES_MAX_CHARS,
} from '@/common/chat/conciergeConfig';

/** Remove fenced code blocks so documentation examples aren't parsed as real proposals. */
function stripCodeBlocks(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '');
}

/** Read a single-line `name: value` field from a block body (case-insensitive). */
function field(body: string, name: string): string | undefined {
  const match = body.match(new RegExp(`^\\s*${name}\\s*:\\s*(.+)$`, 'im'));
  const value = match?.[1]?.trim();
  return value ? value : undefined;
}

/** Parse `KEY=val` pairs (comma- or newline-separated) into an env map. */
function parseEnv(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  const out: Record<string, string> = {};
  for (const pair of raw.split(/[,\n]/)) {
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    const key = pair.slice(0, eq).trim();
    const val = pair.slice(eq + 1).trim();
    if (key) out[key] = val;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Parse one block body into a ConciergeProposal, or null when the block is
 * malformed / missing a required field for its kind.
 */
function parseProposalBody(body: string): ConciergeProposal | null {
  if (!body) return null;
  const kind = field(body, 'kind') as ConciergeProposalKind | undefined;
  if (!kind || !CONCIERGE_PROPOSAL_KINDS.includes(kind)) return null;

  switch (kind) {
    case 'provider_connect': {
      const providerId = field(body, 'provider');
      const label = field(body, 'label');
      if (!providerId || !label) return null;
      const baseUrl = field(body, 'base_url');
      // NOTE: any api_key/key line is intentionally NOT read - secrets are
      // entered in the confirm card, never carried in the block.
      return baseUrl ? { kind, providerId, label, baseUrl } : { kind, providerId, label };
    }
    case 'set_default_model': {
      const engine = field(body, 'engine');
      const modelId = field(body, 'model_id');
      const useModel = field(body, 'use_model');
      const label = field(body, 'label');
      if ((engine !== 'wcore' && engine !== 'gemini') || !modelId || !useModel || !label) return null;
      return { kind, engine, modelId, useModel, label };
    }
    case 'add_mcp': {
      const name = field(body, 'name');
      const command = field(body, 'command');
      if (!name || !command) return null;
      const argsRaw = field(body, 'args');
      const args = argsRaw ? argsRaw.split(/\s+/).filter(Boolean) : [];
      const env = parseEnv(field(body, 'env'));
      return env ? { kind, name, command, args, env } : { kind, name, command, args };
    }
    case 'install_skill': {
      // Field extraction only; every rule lives in validateInstallSkillProposal
      // so the parser and any other caller cannot drift apart on what is legal.
      return validateInstallSkillProposal({
        name: field(body, 'name'),
        url: field(body, 'url'),
        sha256: field(body, 'sha256'),
        label: field(body, 'label'),
      });
    }
    case 'file_bug_report': {
      // Non-mutating: opens a pre-filled GitHub issue on accept. Optional `summary`
      // is a short, non-secret problem description for the card header (#464).
      const summary = field(body, 'summary');
      return summary ? { kind, summary } : { kind };
    }
    case 'edit_assistant': {
      const assistantId = field(body, 'assistant');
      const label = field(body, 'label');
      // `rules:` is multi-line: everything after it to the end of the block, so
      // it MUST be the last field in the block (documented in the skill).
      const rulesMatch = body.match(/^\s*rules\s*:\s*([\s\S]*)$/im);
      const rules = rulesMatch?.[1]?.trim();
      if (!assistantId || !label || !rules) return null;
      // SECURITY: the apply path writes a file named from assistantId. Reject any
      // id with path separators, parent-traversal, a leading dot, or reserved
      // characters so a prompt-injected proposal cannot escape the assistants dir
      // (defense-in-depth with sanitizeSkillName at the writer).
      if (/[\\/:*?"<>| ]/.test(assistantId) || assistantId.includes('..') || assistantId.startsWith('.')) {
        return null;
      }
      if (rules.length > CONCIERGE_RULES_MAX_CHARS) return null;
      return { kind, assistantId, label, rules };
    }
    default:
      return null;
  }
}

/**
 * Detect every well-formed [CONCIERGE_PROPOSE] block in the content. Malformed
 * blocks are omitted. Commands inside markdown code fences are ignored.
 */
export function detectConciergeProposals(content: string): ConciergeProposal[] {
  if (!content || typeof content !== 'string') return [];
  const clean = stripCodeBlocks(content);
  const proposals: ConciergeProposal[] = [];

  const matches = clean.matchAll(/\[CONCIERGE_PROPOSE\]\s*\n?([\s\S]*?)\[\/CONCIERGE_PROPOSE\]/gi);
  for (const match of matches) {
    const parsed = parseProposalBody(match[1]);
    if (parsed) proposals.push(parsed);
  }

  // Fallback: a single unclosed block (agent forgot the closing tag).
  if (proposals.length === 0) {
    const hasOpen = /\[CONCIERGE_PROPOSE\]/i.test(clean);
    const hasClose = /\[\/CONCIERGE_PROPOSE\]/i.test(clean);
    if (hasOpen && !hasClose) {
      const fallback = clean.match(/\[CONCIERGE_PROPOSE\]\s*\n?([\s\S]*)$/i);
      const parsed = fallback ? parseProposalBody(fallback[1]) : null;
      if (parsed) proposals.push(parsed);
    }
  }

  return proposals;
}

/** Quick check for a proposal block before full parsing. */
export function hasConciergeProposals(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  return /\[CONCIERGE_PROPOSE\]/i.test(content);
}

/** Strip proposal blocks from content for a clean display message. */
export function stripConciergeProposals(content: string): string {
  if (!content || typeof content !== 'string') return content;
  return content
    .replace(/\[CONCIERGE_PROPOSE\][\s\S]*?\[\/CONCIERGE_PROPOSE\]/gi, '')
    .replace(/\[CONCIERGE_PROPOSE\][\s\S]*$/gi, '') // unclosed trailing block
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
