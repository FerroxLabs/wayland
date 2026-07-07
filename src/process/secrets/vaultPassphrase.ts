/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Per-profile engine vault passphrases (#710).
 *
 * When the desktop spawns the engine with `WAYLAND_HOME` set (directory-isolated
 * profiles, Design B), the engine refuses the OS keyring (it would bleed secrets
 * across profiles) and - without a vault passphrase - persists credentials as a
 * plaintext-0600 `credentials.toml` inside the profile home, warning on every
 * boot. The engine already ships an encrypted store (Argon2id + XChaCha20,
 * `credentials.enc` + `credentials.kdf.json` beside the plaintext path) that it
 * selects whenever unlock material arrives via `WAYLAND_VAULT_PASSPHRASE_FD`
 * (Unix) or `WAYLAND_VAULT_PASSPHRASE` (all platforms) - see wayland-core
 * `crates/wcore-config/src/credentials.rs` (`open_store` / `read_passphrase`).
 *
 * This module provisions that unlock material: one random 32-byte passphrase
 * per profile home, generated once and persisted encrypted-at-rest through the
 * same OS-keychain-backed `safeStorage` rail as every other desktop credential
 * (the `chatgptTokenStore` pattern: the whole file is opaque ciphertext in a
 * 0600 JSON file under the desktop's own config dir - never inside the profile
 * home the engine reads).
 *
 * ── Migration gate (verified against the engine source) ─────────────────────
 * The engine has NO plaintext→vault migration: with unlock material present,
 * `open_store` returns the encrypted store, which reads ONLY `credentials.enc`
 * and never imports an existing `credentials.toml` (credentials.rs documents
 * the migration entrypoint as "wired in a later wave"). Supplying a passphrase
 * to a profile that already holds plaintext secrets would therefore make those
 * secrets invisible to the engine - apparent credential loss. So
 * {@link resolveSpawnVaultPassphrase} gates:
 *
 *  - vault already established (`credentials.enc` exists) → unlock it with the
 *    STORED passphrase only; if the stored passphrase is gone (keychain
 *    rotation, wiped config dir), return `null` rather than minting a fresh one
 *    that would fail the engine's unlock-verify on every credential op.
 *  - plaintext `credentials.toml` holds secrets (and no vault) → return `null`;
 *    the profile stays on the warned plaintext fallback until the engine ships
 *    its own migration. Never half-migrate desktop-side.
 *  - fresh profile (neither file, or an empty plaintext table) → mint + persist
 *    a passphrase; the engine creates the vault on first credential write.
 *
 * SAFETY: every failure path returns `null` (= spawn without a passphrase, the
 * engine's current warned-plaintext behavior). Vault provisioning must never
 * block or break an engine spawn.
 */

import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';

import { getConfigPath } from '@process/utils/utils';
import { decryptString, encryptString } from './safeStorage';

/** Filename of the encrypted passphrase map inside the desktop config dir. */
const PASSPHRASE_FILE = 'profile-vault-passphrases.json';

/** Child-process fd number the passphrase pipe occupies (stdio index 3). */
export const VAULT_PASSPHRASE_CHILD_FD = 3;

/** Absolute path to the encrypted passphrase-map file. */
function passphraseFilePath(): string {
  return path.join(getConfigPath(), PASSPHRASE_FILE);
}

/**
 * Decrypt and parse the on-disk passphrase map (`profile home dir → passphrase`).
 *
 * Discriminates "file absent" (`{}` - safe to mint into) from "file present but
 * unreadable/undecryptable" (`null` - e.g. an OS keychain rotation; minting
 * over it could orphan an existing vault, so callers must not write).
 */
async function loadPassphraseMap(): Promise<Record<string, string> | null> {
  let cipher: string;
  try {
    cipher = await fs.readFile(passphraseFilePath(), 'utf-8');
  } catch {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(decryptString(cipher.trim()));
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // Fall through - present but unreadable.
  }
  return null;
}

/** Encrypt and persist the passphrase map (0600, whole file is ciphertext). */
async function savePassphraseMap(map: Record<string, string>): Promise<void> {
  await fs.writeFile(passphraseFilePath(), encryptString(JSON.stringify(map)), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

/**
 * Whether the profile's plaintext `credentials.toml` currently holds at least
 * one secret. A parse failure reads as `true` (fail closed: an unreadable
 * store might hold secrets, so do not switch the engine away from it).
 */
async function plaintextStoreHasSecrets(credentialsTomlPath: string): Promise<boolean> {
  let raw: string;
  try {
    raw = await fs.readFile(credentialsTomlPath, 'utf-8');
  } catch {
    return false;
  }
  try {
    const table = parseToml(raw) as Record<string, unknown>;
    const secrets = table.secrets;
    if (typeof secrets !== 'object' || secrets === null) return false;
    return Object.keys(secrets).length > 0;
  } catch {
    return true;
  }
}

/**
 * Resolve the vault passphrase to hand the engine for a spawn whose
 * `WAYLAND_HOME` is `waylandHome`, applying the migration gate documented in
 * the module JSDoc. Returns `null` whenever the spawn should proceed WITHOUT
 * unlock material (current warned-plaintext behavior). Never throws.
 */
export async function resolveSpawnVaultPassphrase(waylandHome: string): Promise<string | null> {
  try {
    const vaultExists = await fileExists(path.join(waylandHome, 'credentials.enc'));
    const map = await loadPassphraseMap();

    if (vaultExists) {
      // An established vault is unlocked ONLY by its original passphrase. When
      // that is unavailable (undecryptable map, missing entry), fall back to
      // no-material: the engine uses the plaintext store and the vault stays
      // intact on disk - degraded but recoverable, and never a hard failure.
      const stored = map?.[waylandHome];
      if (typeof stored === 'string' && stored.length > 0) return stored;
      console.warn(
        '[vaultPassphrase] profile has an established vault but its stored passphrase is unavailable; ' +
          'spawning without unlock material (engine falls back to plaintext store)'
      );
      return null;
    }

    // No vault yet. If the plaintext store already holds secrets, enabling the
    // vault would hide them (the engine has no auto-migration) - stay plaintext.
    if (await plaintextStoreHasSecrets(path.join(waylandHome, 'credentials.toml'))) {
      return null;
    }

    // Fresh profile. Reuse a previously minted passphrase (e.g. the vault has
    // no writes yet, so credentials.enc does not exist) or mint a new one.
    if (map === null) return null; // unreadable map - do not overwrite it
    const existing = map[waylandHome];
    if (typeof existing === 'string' && existing.length > 0) return existing;

    const fresh = randomBytes(32).toString('base64url');
    map[waylandHome] = fresh;
    await savePassphraseMap(map);
    return fresh;
  } catch (err) {
    console.warn('[vaultPassphrase] provisioning failed; engine will use its plaintext fallback:', err);
    return null;
  }
}

/** `true` when `p` exists (any file type). */
async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
