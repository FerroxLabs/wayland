/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The bridge between the desktop "Sign in with X (Grok)" OAuth flow and Wayland
 * Core (the engine).
 *
 * #379: chatting with Grok returned `403 unauthenticated:bad-credentials` from
 * `api.x.ai/v1/responses` despite a green "Signed in with X". Root cause: the
 * engine's native `--provider xai` path only refreshes + presents a Grok OAuth
 * bearer when refreshable credentials live in a store it reads — the engine's
 * own `~/.wayland/oauth/xai.json` (which its `oauth/xai.rs` documents as
 * "written by the Wayland app") or the Grok CLI's `~/.grok/auth.json`. Without
 * either, the engine falls back to sending the raw, short-lived OAuth *access*
 * token (registered as the `xai` provider key → injected as `XAI_API_KEY`)
 * straight to `api.x.ai`, which rejects it (it expects either a real API key or
 * a freshly-refreshed bearer) → 403.
 *
 * The desktop previously persisted the refresh token only to its own private
 * cache (`xai-oauth.json`) + the model registry, never to the engine store. So
 * after sign-in we WRITE `~/.wayland/oauth/xai.json` here — exactly mirroring
 * how `writeCodexAuthFile` bridges the ChatGPT flow into `~/.codex/auth.json`
 * (#243). The engine then owns refresh + presents a valid bearer to api.x.ai.
 *
 * Engine contract (read-only ref: `wcore-agent/src/oauth/storage.rs` +
 * `oauth/flow.rs` `OAuthTokens`): `~/.wayland/oauth/{provider}.json` (or
 * `$WAYLAND_HOME/oauth/...`) is `serde_json` of `OAuthTokens` —
 * `access_token` (required), optional `refresh_token`, `expires_at_unix_secs`
 * (epoch SECONDS), `token_type` (defaults "Bearer"), `scope`, `id_token`. The
 * storage dir is created mode 0700; we write the file 0600.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { XAI_SCOPES, type XaiTokens } from './xaiOAuthCore';

/** Engine OAuth provider id for xAI (matches `wcore-agent` `oauth::xai::PROVIDER`). */
const XAI_ENGINE_PROVIDER = 'xai';

/**
 * Resolve the engine xAI OAuth store path: `$WAYLAND_HOME/oauth/xai.json`,
 * default `~/.wayland/oauth/xai.json`. Mirrors the engine's
 * `OAuthStorage` directory resolution so the desktop writes where the engine
 * reads.
 */
export function xaiEngineAuthPath(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.WAYLAND_HOME;
  const waylandHome =
    typeof override === 'string' && override.trim().length > 0 ? override.trim() : path.join(os.homedir(), '.wayland');
  return path.join(waylandHome, 'oauth', `${XAI_ENGINE_PROVIDER}.json`);
}

/** The subset of the engine `OAuthTokens` document we write. */
export type XaiEngineAuthDoc = {
  access_token: string;
  refresh_token?: string;
  /** Epoch SECONDS (the engine's `expires_at_unix_secs`). XaiTokens.expiresAt is ms. */
  expires_at_unix_secs?: number;
  token_type: string;
  scope?: string;
};

/** Build the engine `OAuthTokens` document from our token bundle. */
export function buildXaiEngineAuthDoc(tokens: XaiTokens): XaiEngineAuthDoc {
  const doc: XaiEngineAuthDoc = { access_token: tokens.accessToken, token_type: 'Bearer', scope: XAI_SCOPES };
  if (tokens.refreshToken) doc.refresh_token = tokens.refreshToken;
  if (typeof tokens.expiresAt === 'number' && Number.isFinite(tokens.expiresAt)) {
    doc.expires_at_unix_secs = Math.floor(tokens.expiresAt / 1000);
  }
  return doc;
}

/**
 * Write `~/.wayland/oauth/xai.json` (dir 0o700, file 0o600) so Wayland Core can
 * read + refresh the Grok OAuth bearer instead of presenting the raw access
 * token to api.x.ai. Atomic (temp + rename). Never throws — returns whether the
 * write succeeded so the caller can log without failing sign-in.
 */
export async function writeXaiEngineAuthFile(
  tokens: XaiTokens,
  env: NodeJS.ProcessEnv = process.env
): Promise<boolean> {
  try {
    const file = xaiEngineAuthPath(env);
    await fs.promises.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const json = JSON.stringify(buildXaiEngineAuthDoc(tokens), null, 2);
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
