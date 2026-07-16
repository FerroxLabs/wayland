/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Encrypted persistence for the Claude subscription OAuth bundle (main process).
 *
 * Like the ChatGPT subscription store, a Claude subscription has no long-lived
 * inference key: inference uses the short-lived `access_token`, refreshed via the
 * `refresh_token`. So this store holds the FULL bundle the refresh path needs:
 * the refresh token, the current access token + its expiry, the plan tier
 * (surfaced in the UI), and the granted scope (echoed to the Claude Code
 * credential file).
 *
 * The whole file is opaque ciphertext (no plaintext token ever hits disk),
 * encrypted with the same OS-keychain-backed `safeStorage` the registry uses, in
 * a 0600 JSON file in the config dir. All functions are defensive: a
 * missing/corrupt file reads as "no token", and a write failure is swallowed.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getConfigPath } from '@process/utils/utils';
import { decryptString, encryptString, isEncryptionAvailable } from '@process/secrets/safeStorage';
import type { AnthropicPlanType } from './anthropicOAuthCore';

/** Filename for the encrypted bundle inside the config dir. */
const TOKEN_FILE = 'anthropic-oauth.json';

/** The Claude OAuth bundle persisted between sessions. */
export type AnthropicTokenBundle = {
  /** The OAuth refresh token (long-lived; mints new access tokens). */
  refreshToken: string;
  /** The current access token (short-lived; the inference bearer). */
  accessToken?: string;
  /** Epoch ms when the current access token expires, if known. */
  expiresAt?: number;
  /** The user's Claude plan tier. */
  planType?: AnthropicPlanType;
  /** The granted scope string. */
  scope?: string;
};

/** Absolute path to the encrypted token file. */
function tokenFilePath(): string {
  return path.join(getConfigPath(), TOKEN_FILE);
}

/**
 * Persist the bundle, encrypted. A no-op when no refresh token is present.
 * Never throws - a write failure is logged at debug and swallowed.
 */
export async function saveAnthropicTokens(bundle: AnthropicTokenBundle): Promise<void> {
  if (!bundle.refreshToken) return;
  // Refuse to persist without a real encryption backend - never write plaintext.
  if (!isEncryptionAvailable()) return;
  try {
    const cipher = encryptString(JSON.stringify(bundle));
    await fs.writeFile(tokenFilePath(), cipher, { encoding: 'utf-8', mode: 0o600 });
  } catch (e) {
    console.debug('[anthropicAuth] failed to persist tokens:', e);
  }
}

/**
 * Read the persisted bundle. Returns `null` when the file is missing,
 * unreadable, or the ciphertext cannot be decrypted (e.g. a rotated keychain).
 * Never throws.
 */
export async function loadAnthropicTokens(): Promise<AnthropicTokenBundle | null> {
  try {
    const cipher = await fs.readFile(tokenFilePath(), 'utf-8');
    const json = decryptString(cipher.trim());
    const parsed = JSON.parse(json) as Partial<AnthropicTokenBundle>;
    if (!parsed || typeof parsed.refreshToken !== 'string' || parsed.refreshToken.length === 0) {
      return null;
    }
    const bundle: AnthropicTokenBundle = { refreshToken: parsed.refreshToken };
    if (typeof parsed.accessToken === 'string') bundle.accessToken = parsed.accessToken;
    if (typeof parsed.expiresAt === 'number') bundle.expiresAt = parsed.expiresAt;
    if (typeof parsed.planType === 'string') bundle.planType = parsed.planType as AnthropicPlanType;
    if (typeof parsed.scope === 'string') bundle.scope = parsed.scope;
    return bundle;
  } catch {
    return null;
  }
}

/** Delete the persisted bundle (re-auth path / sign-out). Never throws. */
export async function clearAnthropicTokens(): Promise<void> {
  try {
    await fs.rm(tokenFilePath(), { force: true });
  } catch {
    // Already gone / unlink failed - nothing to do.
  }
}
