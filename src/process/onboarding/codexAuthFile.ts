/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The bridge between the desktop "Sign in with ChatGPT" OAuth flow and Wayland
 * Core (the engine) / the Codex CLI.
 *
 * A ChatGPT *subscription* access token cannot hit `api.openai.com`; inference
 * must route through the Codex `/responses` backend, which the engine already
 * implements. The engine (and the `codex` CLI) read the credential from
 * `$CODEX_HOME/auth.json` (default `~/.codex/auth.json`) - the standard Codex
 * CLI store. So after a successful in-app sign-in we WRITE that file, and on
 * sign-in we REUSE an existing one (the user already ran `codex login`),
 * exactly mirroring how the xAI flow reuses `~/.grok/auth.json`.
 *
 * Engine contract (read-only ref: `wcore-agent/src/oauth/chatgpt.rs`
 * `import_codex_cli_tokens`): a JSON doc with a `tokens` object holding
 * `access_token` (required), `refresh_token`, `id_token`; `chatgpt_account_id`
 * is derived from the access-token JWT. The engine requires the file be owned
 * by the user and not group/world-writable, so we write mode 0o600.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { parseIdToken, type ChatGptTokens } from './chatgptOAuthCore';

/** Resolve `$CODEX_HOME/auth.json` (default `~/.codex/auth.json`). */
export function codexAuthPath(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.CODEX_HOME;
  const codexHome =
    typeof override === 'string' && override.trim().length > 0 ? override.trim() : path.join(os.homedir(), '.codex');
  return path.join(codexHome, 'auth.json');
}

/** The subset of the Codex CLI `auth.json` document we read/write. */
export type CodexAuthDoc = {
  OPENAI_API_KEY: string | null;
  tokens: {
    id_token: string;
    access_token: string;
    refresh_token: string;
    account_id: string;
  };
  last_refresh: string;
};

/** Build the standard Codex `auth.json` document from our token bundle. */
export function buildCodexAuthDoc(tokens: ChatGptTokens, nowIso: string): CodexAuthDoc {
  return {
    OPENAI_API_KEY: null,
    tokens: {
      id_token: tokens.idToken ?? '',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken ?? '',
      account_id: tokens.accountId ?? '',
    },
    last_refresh: nowIso,
  };
}

/**
 * Parse a Codex `auth.json` document into our normalized bundle, enriching the
 * identity (account id, plan, expiry) from the id_token when present. Returns
 * `null` when there is no usable access token. Pure - no I/O.
 */
export function parseCodexAuthDoc(doc: unknown): ChatGptTokens | null {
  if (typeof doc !== 'object' || doc === null) return null;
  const tokensVal = (doc as Record<string, unknown>).tokens;
  if (typeof tokensVal !== 'object' || tokensVal === null) return null;
  const t = tokensVal as Record<string, unknown>;

  const accessToken = typeof t.access_token === 'string' ? t.access_token : '';
  if (accessToken.length === 0) return null;

  const bundle: ChatGptTokens = { accessToken };
  if (typeof t.refresh_token === 'string' && t.refresh_token.length > 0) bundle.refreshToken = t.refresh_token;
  if (typeof t.id_token === 'string' && t.id_token.length > 0) bundle.idToken = t.id_token;
  if (typeof t.account_id === 'string' && t.account_id.length > 0) bundle.accountId = t.account_id;

  // The id_token is authoritative for identity + real expiry.
  if (bundle.idToken) {
    const identity = parseIdToken(bundle.idToken);
    if (identity) {
      if (!bundle.accountId && identity.accountId) bundle.accountId = identity.accountId;
      if (identity.planType) bundle.planType = identity.planType;
      if (identity.userId) bundle.userId = identity.userId;
      if (typeof identity.expiresAt === 'number') bundle.expiresAt = identity.expiresAt;
    }
  }
  return bundle;
}

/**
 * Write `~/.codex/auth.json` (dir 0o700, file 0o600) so Wayland Core / the Codex
 * CLI can read the ChatGPT credential. Atomic (temp + rename). Never throws -
 * returns whether the write succeeded.
 */
export async function writeCodexAuthFile(
  tokens: ChatGptTokens,
  nowIso: string = new Date().toISOString(),
  env: NodeJS.ProcessEnv = process.env
): Promise<boolean> {
  try {
    const file = codexAuthPath(env);
    await fs.promises.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const json = JSON.stringify(buildCodexAuthDoc(tokens, nowIso), null, 2);
    const tmp = `${file}.tmp-${process.pid}`;
    await fs.promises.writeFile(tmp, json, { mode: 0o600 });
    await fs.promises.rename(tmp, file);
    // rename preserves the temp file's mode, but chmod again defensively in case
    // an existing target's perms lingered on some platforms.
    await fs.promises.chmod(file, 0o600);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read + parse `~/.codex/auth.json` into a normalized bundle, or `null` when the
 * file is absent / malformed / API-key-only. Never throws.
 */
export async function readCodexAuthFile(env: NodeJS.ProcessEnv = process.env): Promise<ChatGptTokens | null> {
  try {
    const raw = await fs.promises.readFile(codexAuthPath(env), 'utf-8');
    return parseCodexAuthDoc(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}
