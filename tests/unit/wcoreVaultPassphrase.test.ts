/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #710 - per-profile engine-vault passphrase provisioning + spawn wiring.
 *
 * Three units under test, in one file because they are the three halves of one
 * fix (isolated-profile credentials no longer plaintext):
 *  1. `resolveSpawnVaultPassphrase` - keychain-backed provisioning (minted
 *     once, stable across calls, per-profile isolation) plus the migration
 *     gate: the ENGINE has no plaintext→vault import, so a profile whose
 *     `credentials.toml` already holds secrets must keep spawning without
 *     unlock material, and an established vault must never get a freshly
 *     minted (wrong) passphrase.
 *  2. `planVaultPassphraseDelivery` - fd-pipe delivery on Unix vs env-var
 *     delivery on Windows (the engine ignores `_FD` on win32 by design).
 *  3. `buildEngineSpawnEnv` - the delivery env reaches the spawn env, while
 *     stray WAYLAND_VAULT_PASSPHRASE* values from the user's shell stay
 *     excluded by the SEC-1 allowlist.
 *
 * `safeStorage` is stubbed the same way as wcore-toolKeyEnv.test.ts; the
 * desktop config dir (where the encrypted passphrase map lives) and the
 * profile homes are per-test temp dirs.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── safeStorage stub (Electron + OS keychain are unavailable under Vitest) ────
const { mockSafeStorage, configDirHolder } = vi.hoisted(() => ({
  mockSafeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((plaintext: string) => Buffer.from(`enc(${plaintext})`)),
    decryptString: vi.fn((cipher: Buffer) => {
      const raw = cipher.toString('utf8');
      const match = raw.match(/^enc\((.*)\)$/s);
      if (!match) throw new Error('decrypt failed');
      return match[1];
    }),
  },
  configDirHolder: { dir: '' },
}));

vi.mock('electron', () => ({ safeStorage: mockSafeStorage }));

// The passphrase map lives in the desktop config dir - point it at a temp dir.
vi.mock('@process/utils/utils', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getConfigPath: () => configDirHolder.dir,
}));

// Deterministic stand-in for the login-shell enhancer (same as toolKeyEnv test).
vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: (customEnv?: Record<string, string>) => ({
    ...process.env,
    ...customEnv,
    PATH: process.env.PATH ?? '/usr/bin',
  }),
}));

import { resolveSpawnVaultPassphrase } from '@process/secrets';
import { buildEngineSpawnEnv, planVaultPassphraseDelivery } from '@process/agent/wcore/envBuilder';

const PASSPHRASE_FILE = 'profile-vault-passphrases.json';

let profileHome: string;
let tempDirs: string[];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

beforeEach(() => {
  tempDirs = [];
  configDirHolder.dir = makeTempDir('wl-vault-config-');
  profileHome = makeTempDir('wl-vault-profile-');
  mockSafeStorage.encryptString.mockClear();
  mockSafeStorage.decryptString.mockClear();
});

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

describe('resolveSpawnVaultPassphrase - provisioning', () => {
  it('mints a passphrase for a fresh profile and returns the SAME one on every subsequent call', async () => {
    const first = await resolveSpawnVaultPassphrase(profileHome);
    expect(first).toBeTypeOf('string');
    expect((first as string).length).toBeGreaterThanOrEqual(32);

    const second = await resolveSpawnVaultPassphrase(profileHome);
    expect(second).toBe(first);
  });

  it('isolates profiles: two profile homes get two different passphrases, each stable', async () => {
    const otherHome = makeTempDir('wl-vault-profile-b-');

    const a = await resolveSpawnVaultPassphrase(profileHome);
    const b = await resolveSpawnVaultPassphrase(otherHome);

    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a).not.toBe(b);
    expect(await resolveSpawnVaultPassphrase(profileHome)).toBe(a);
    expect(await resolveSpawnVaultPassphrase(otherHome)).toBe(b);
  });

  it('persists the map encrypted - the plaintext passphrase never appears on disk', async () => {
    const passphrase = (await resolveSpawnVaultPassphrase(profileHome)) as string;

    const raw = await fs.readFile(path.join(configDirHolder.dir, PASSPHRASE_FILE), 'utf-8');
    expect(raw.startsWith('enc:v1:')).toBe(true);
    expect(raw).not.toContain(passphrase);
  });
});

describe('resolveSpawnVaultPassphrase - migration gate (engine has NO plaintext→vault import)', () => {
  it('returns null when credentials.toml already holds secrets (profile stays plaintext, no lockout)', async () => {
    await fs.writeFile(path.join(profileHome, 'credentials.toml'), '[secrets]\nOPENAI_API_KEY = "sk-live"\n');

    expect(await resolveSpawnVaultPassphrase(profileHome)).toBeNull();
  });

  it('fails closed on a malformed credentials.toml (might hold secrets - stay plaintext)', async () => {
    await fs.writeFile(path.join(profileHome, 'credentials.toml'), 'not [ valid toml ===');

    expect(await resolveSpawnVaultPassphrase(profileHome)).toBeNull();
  });

  it('still provisions when credentials.toml exists but its secrets table is empty (nothing to lose)', async () => {
    await fs.writeFile(path.join(profileHome, 'credentials.toml'), '[secrets]\n');

    expect(await resolveSpawnVaultPassphrase(profileHome)).not.toBeNull();
  });

  it('keeps unlocking an established vault with its ORIGINAL stored passphrase', async () => {
    const minted = await resolveSpawnVaultPassphrase(profileHome);
    // The engine materializes the vault on first credential write.
    await fs.writeFile(path.join(profileHome, 'credentials.enc'), 'ciphertext');

    expect(await resolveSpawnVaultPassphrase(profileHome)).toBe(minted);
  });

  it('never mints a NEW passphrase against an existing vault whose passphrase is lost', async () => {
    // A vault exists but this desktop has no stored passphrase for it (wiped
    // config dir / keychain rotation). Minting one would fail the engine's
    // unlock-verify on every credential op - fall back to no-material instead.
    await fs.writeFile(path.join(profileHome, 'credentials.enc'), 'ciphertext');

    expect(await resolveSpawnVaultPassphrase(profileHome)).toBeNull();
    // And nothing was written into the map for this profile.
    expect(await fs.readFile(path.join(configDirHolder.dir, PASSPHRASE_FILE), 'utf-8').catch(() => 'ENOENT')).toBe(
      'ENOENT'
    );
  });
});

describe('resolveSpawnVaultPassphrase - keychain-failure fallback (never block the spawn)', () => {
  it('returns null when the keychain write fails, instead of throwing', async () => {
    mockSafeStorage.encryptString.mockImplementationOnce(() => {
      throw new Error('keychain locked');
    });

    await expect(resolveSpawnVaultPassphrase(profileHome)).resolves.toBeNull();
  });

  it('returns null (and does not overwrite) when the stored map is undecryptable', async () => {
    // e.g. an OS keychain key rotation: the file is present but opaque.
    const opaque = `enc:v1:${Buffer.from('garbage-not-our-format').toString('base64')}`;
    await fs.writeFile(path.join(configDirHolder.dir, PASSPHRASE_FILE), opaque);

    expect(await resolveSpawnVaultPassphrase(profileHome)).toBeNull();

    // The opaque file was left byte-for-byte intact - never clobbered.
    const raw = await fs.readFile(path.join(configDirHolder.dir, PASSPHRASE_FILE), 'utf-8');
    expect(raw).toBe(opaque);
    expect(mockSafeStorage.encryptString).not.toHaveBeenCalled();
  });
});

describe('planVaultPassphraseDelivery - platform routing', () => {
  it('uses an fd pipe on Unix: WAYLAND_VAULT_PASSPHRASE_FD=3, a 4th stdio slot, payload to write', () => {
    for (const platform of ['darwin', 'linux'] as const) {
      const plan = planVaultPassphraseDelivery('pp-secret', platform);
      expect(plan).toEqual({
        mode: 'fd',
        env: { WAYLAND_VAULT_PASSPHRASE_FD: '3' },
        stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
        fdPayload: 'pp-secret',
      });
    }
  });

  it('uses the env var on Windows (the engine ignores _FD there by design)', () => {
    expect(planVaultPassphraseDelivery('pp-secret', 'win32')).toEqual({
      mode: 'env',
      env: { WAYLAND_VAULT_PASSPHRASE: 'pp-secret' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  });
});

describe('buildEngineSpawnEnv - vault passphrase env wiring', () => {
  const SAVED = { ...process.env };

  afterEach(() => {
    for (const k of Object.keys(process.env)) if (!(k in SAVED)) delete process.env[k];
    Object.assign(process.env, SAVED);
  });

  it('forwards the planned delivery env into the spawn env', () => {
    const plan = planVaultPassphraseDelivery('pp-secret', 'linux');
    const env = buildEngineSpawnEnv({ providerEnv: {}, vaultPassphraseEnv: plan.env });
    expect(env.WAYLAND_VAULT_PASSPHRASE_FD).toBe('3');

    const winPlan = planVaultPassphraseDelivery('pp-secret', 'win32');
    const winEnv = buildEngineSpawnEnv({ providerEnv: {}, vaultPassphraseEnv: winPlan.env });
    expect(winEnv.WAYLAND_VAULT_PASSPHRASE).toBe('pp-secret');
  });

  it('sets neither vault var when no delivery is supplied', () => {
    const env = buildEngineSpawnEnv({ providerEnv: {} });
    expect(env.WAYLAND_VAULT_PASSPHRASE).toBeUndefined();
    expect(env.WAYLAND_VAULT_PASSPHRASE_FD).toBeUndefined();
  });

  it('strips stray WAYLAND_VAULT_PASSPHRASE* from the user shell (not allowlisted)', () => {
    process.env.WAYLAND_VAULT_PASSPHRASE = 'stale-shell-value';
    process.env.WAYLAND_VAULT_PASSPHRASE_FD = '99';

    const env = buildEngineSpawnEnv({ providerEnv: {} });

    expect(env.WAYLAND_VAULT_PASSPHRASE).toBeUndefined();
    expect(env.WAYLAND_VAULT_PASSPHRASE_FD).toBeUndefined();
  });
});
