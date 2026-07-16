/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The bridge between the desktop "Sign in with Claude" OAuth flow and the Claude
 * Code ACP agent (`claude-agent-acp` / the Claude Code SDK).
 *
 * A Claude *subscription* access token cannot be used as an API key against
 * `api.anthropic.com`; inference must be driven by the Claude Code engine, which
 * reads the OAuth credential from `~/.claude/.credentials.json` (the standard
 * Claude Code store, honoring `CLAUDE_CONFIG_DIR`). So after a successful in-app
 * sign-in we WRITE that file, and on sign-in we REUSE an existing one (the user
 * already ran `claude` / signed in through the CLI) - exactly mirroring how the
 * ChatGPT flow bridges `~/.codex/auth.json` and the xAI flow reuses
 * `~/.grok/auth.json`.
 *
 * The engine requires the file be owned by the user and not group/world-
 * readable, so we write mode 0o600 into a 0o700 dir.
 *
 * IMPORTANT: Anthropic blocks subscription-OAuth logins used inside third-party
 * tools. Writing this file makes the Claude Code agent ATTEMPT the subscription,
 * but a turn can still be rejected by Anthropic; the ACP auth-failure recovery
 * card surfaces that honestly.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { AnthropicPlanType, AnthropicTokens } from './anthropicOAuthCore';

/**
 * Resolve `$CLAUDE_CONFIG_DIR/.credentials.json` (default
 * `~/.claude/.credentials.json`). Claude Code reads `CLAUDE_CONFIG_DIR` verbatim
 * when set; a blank/whitespace-only value is treated as unset.
 */
export function claudeCredentialsPath(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.CLAUDE_CONFIG_DIR;
  const configDir =
    typeof override === 'string' && override.trim().length > 0 ? override.trim() : path.join(os.homedir(), '.claude');
  return path.join(configDir, '.credentials.json');
}

/** The nested OAuth object inside the Claude Code credentials file. */
export type ClaudeAiOauth = {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms. */
  expiresAt?: number;
  scopes: string[];
  subscriptionType?: string;
};

/** The subset of `~/.claude/.credentials.json` we read/write. */
export type ClaudeCredentialsDoc = {
  claudeAiOauth: ClaudeAiOauth;
};

/** Split a space-delimited scope string into the array shape Claude Code stores. */
function scopesFromString(scope: string | undefined): string[] {
  if (typeof scope !== 'string' || scope.trim().length === 0) {
    // Fall back to the inference + profile scopes so a bundle that lost its
    // scope string still declares the ones the engine checks for.
    return ['user:inference', 'user:profile'];
  }
  return scope.trim().split(/\s+/);
}

/** Build the Claude Code credentials document from our token bundle. */
export function buildClaudeCredentialsDoc(tokens: AnthropicTokens): ClaudeCredentialsDoc {
  const oauth: ClaudeAiOauth = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? '',
    scopes: scopesFromString(tokens.scope),
  };
  if (typeof tokens.expiresAt === 'number' && Number.isFinite(tokens.expiresAt)) {
    oauth.expiresAt = tokens.expiresAt;
  }
  if (tokens.planType && tokens.planType !== 'unknown') {
    oauth.subscriptionType = tokens.planType;
  }
  return { claudeAiOauth: oauth };
}

/**
 * Parse a Claude Code credentials document into our normalized bundle. Returns
 * `null` when there is no usable access token. Pure - no I/O.
 */
export function parseClaudeCredentialsDoc(doc: unknown): AnthropicTokens | null {
  if (typeof doc !== 'object' || doc === null) return null;
  const oauthVal = (doc as Record<string, unknown>).claudeAiOauth;
  if (typeof oauthVal !== 'object' || oauthVal === null) return null;
  const o = oauthVal as Record<string, unknown>;

  const accessToken = typeof o.accessToken === 'string' ? o.accessToken : '';
  if (accessToken.length === 0) return null;

  const bundle: AnthropicTokens = { accessToken };
  if (typeof o.refreshToken === 'string' && o.refreshToken.length > 0) bundle.refreshToken = o.refreshToken;
  if (typeof o.expiresAt === 'number' && Number.isFinite(o.expiresAt)) bundle.expiresAt = o.expiresAt;
  if (Array.isArray(o.scopes)) {
    const scopes = o.scopes.filter((s): s is string => typeof s === 'string');
    if (scopes.length > 0) bundle.scope = scopes.join(' ');
  }
  if (typeof o.subscriptionType === 'string' && o.subscriptionType.length > 0) {
    bundle.planType = o.subscriptionType.toLowerCase() as AnthropicPlanType;
  }
  return bundle;
}

/**
 * Write `~/.claude/.credentials.json` (dir 0o700, file 0o600) so the Claude Code
 * ACP agent can drive inference on the subscription. Atomic (temp + rename).
 * Never throws - returns whether the write succeeded so the caller can log
 * without failing sign-in.
 */
export async function writeClaudeCredentialsFile(
  tokens: AnthropicTokens,
  env: NodeJS.ProcessEnv = process.env
): Promise<boolean> {
  const file = claudeCredentialsPath(env);
  const tmp = `${file}.tmp-${process.pid}`;
  try {
    await fs.promises.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const json = JSON.stringify(buildClaudeCredentialsDoc(tokens), null, 2);
    await fs.promises.writeFile(tmp, json, { mode: 0o600 });
    await fs.promises.rename(tmp, file);
    // rename preserves the temp file's mode, but chmod again defensively in case
    // an existing target's perms lingered on some platforms.
    await fs.promises.chmod(file, 0o600);
    return true;
  } catch {
    // Best-effort cleanup so a failed write does not litter the dir with a stale
    // `.tmp-<pid>`.
    await fs.promises.rm(tmp, { force: true }).catch(() => {});
    return false;
  }
}

/**
 * Read + parse `~/.claude/.credentials.json` into a normalized bundle, or `null`
 * when the file is absent / malformed / holds no OAuth access token. Never throws.
 */
export async function readClaudeCredentialsFile(env: NodeJS.ProcessEnv = process.env): Promise<AnthropicTokens | null> {
  try {
    const raw = await fs.promises.readFile(claudeCredentialsPath(env), 'utf-8');
    return parseClaudeCredentialsDoc(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}
