/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Encrypted persistence for the xAI OAuth refresh token (main process).
 *
 * The model registry stores the short-lived *access* token as the `xai`
 * provider's inference key. The *refresh* token is the long-lived secret that
 * mints new access tokens on a 401; it is NOT an inference credential and must
 * not live in the registry creds row. We persist it on its own, encrypted with
 * the same OS-keychain-backed `safeStorage` the registry uses, in a 0600 JSON
 * file in the config dir.
 *
 * The whole file is opaque ciphertext (no plaintext token ever hits disk). All
 * functions are defensive: a missing/corrupt file reads as "no token", and a
 * write failure is swallowed (the access token is already persisted in the
 * registry, so a lost refresh token only costs the user a re-auth later).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getConfigPath } from '@process/utils/utils';
import { decryptString, encryptString, isEncryptionAvailable } from '@process/secrets/safeStorage';

/** Filename for the encrypted refresh-token bundle inside the config dir. */
const TOKEN_FILE = 'xai-oauth.json';

/** The refresh-token bundle persisted between sessions. */
export type XaiTokenBundle = {
  /** The OAuth refresh token (long-lived; mints new access tokens). */
  refreshToken: string;
  /** Epoch ms when the current access token expires, if known. */
  expiresAt?: number;
};

/** Absolute path to the encrypted token file. */
function tokenFilePath(): string {
  return path.join(getConfigPath(), TOKEN_FILE);
}

/**
 * Persist the refresh-token bundle, encrypted. A no-op when no refresh token is
 * present (a flow that returned only an access token has nothing to store).
 * Never throws - a write failure is logged at debug and swallowed.
 */
export async function saveXaiTokens(bundle: XaiTokenBundle): Promise<void> {
  if (!bundle.refreshToken) return;
  // Refuse to persist without a real encryption backend - never write plaintext.
  if (!isEncryptionAvailable()) return;
  try {
    const cipher = encryptString(JSON.stringify(bundle));
    await fs.writeFile(tokenFilePath(), cipher, { encoding: 'utf-8', mode: 0o600 });
  } catch (e) {
    console.debug('[xaiAuth] failed to persist refresh token:', e);
  }
}

/**
 * Read the persisted refresh-token bundle. Returns `null` when the file is
 * missing, unreadable, or the ciphertext cannot be decrypted (e.g. a rotated
 * keychain). Never throws.
 */
export async function loadXaiTokens(): Promise<XaiTokenBundle | null> {
  try {
    const cipher = await fs.readFile(tokenFilePath(), 'utf-8');
    const json = decryptString(cipher.trim());
    const parsed = JSON.parse(json) as Partial<XaiTokenBundle>;
    if (!parsed || typeof parsed.refreshToken !== 'string' || parsed.refreshToken.length === 0) {
      return null;
    }
    const bundle: XaiTokenBundle = { refreshToken: parsed.refreshToken };
    if (typeof parsed.expiresAt === 'number') bundle.expiresAt = parsed.expiresAt;
    return bundle;
  } catch {
    return null;
  }
}

/** Delete the persisted refresh token (re-auth path / sign-out). Never throws. */
export async function clearXaiTokens(): Promise<void> {
  try {
    await fs.rm(tokenFilePath(), { force: true });
  } catch {
    // Already gone / unlink failed - nothing to do.
  }
}
