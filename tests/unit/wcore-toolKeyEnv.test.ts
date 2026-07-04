/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * T0.4 - tool-backend key storage + allowlist engine-spawn env.
 *
 * Two units under test, in one file because they are two halves of one feature:
 *  1. `ToolKeyStore` - encrypted-at-rest storage of web-search backend keys,
 *     reusing the existing `ProviderRepository` creds rail under a `tool:<id>`
 *     provider id. The round-trip test runs against a real in-memory SQLite DB
 *     (native-module gated) with `safeStorage` stubbed - the same pattern as
 *     `modelRegistryIpc.test.ts`.
 *  2. `buildEngineSpawnEnv` - the SEC-1 allowlist env builder that replaces the
 *     blanket `getEnhancedEnv(env)` (full `process.env` spread) at the wcore
 *     spawn seam. `getEnhancedEnv` is mocked to a deterministic passthrough
 *     that mirrors its real contract (spreads `process.env`, sets PATH) so the
 *     allowlist filtering is exercised without a real login-shell spawn.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── safeStorage stub (Electron + OS keychain are unavailable under Vitest) ────
// Mirrors safeStorage's prefix/base64 contract so the real `@process/secrets`
// wrapper produces an `enc:v1:`-prefixed, plaintext-free ciphertext.
const { mockSafeStorage } = vi.hoisted(() => ({
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
}));

vi.mock('electron', () => ({ safeStorage: mockSafeStorage }));

// Deterministic stand-in for the real shell-env enhancer. The real one is
// covered by shellEnv.test.ts; here we only need its contract: spread the live
// `process.env` (the SEC-1 leak source) and overlay the caller's provider env.
vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: (customEnv?: Record<string, string>) => ({
    ...process.env,
    ...customEnv,
    PATH: process.env.PATH ?? '/usr/bin',
  }),
}));

import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { describeNativeSqlite } from './helpers/nativeSqlite';
import { ToolKeyStore, TOOL_KEY_ENV_MAP } from '@process/agent/wcore/toolKeyStore';
import { buildEngineSpawnEnv } from '@process/agent/wcore/envBuilder';

// The exact marker set the engine sandbox uses to strip secret-named env vars
// from the agent's bash-tool context. Every forwarded tool-key env NAME must
// match one of these, or the key would leak into agent-visible tool output.
const ENGINE_SECRET_MARKERS = [
  'API_KEY',
  'APIKEY',
  'SECRET',
  'TOKEN',
  'PASSWORD',
  'PASSWD',
  'PASSPHRASE',
  'PRIVATE_KEY',
  'ACCESS_KEY',
  'CREDENTIAL',
  'SESSION_KEY',
  'AUTH',
] as const;

describe('TOOL_KEY_ENV_MAP - SEC-5 secret-marker invariant', () => {
  it('every forwarded env NAME carries a sandbox secret marker so it is stripped from agent context', () => {
    for (const envName of Object.values(TOOL_KEY_ENV_MAP)) {
      const upper = envName.toUpperCase();
      const matched = ENGINE_SECRET_MARKERS.some((marker) => upper.includes(marker));
      expect(matched, `${envName} must contain a sandbox secret marker`).toBe(true);
    }
  });

  it('maps the canonical tool backends to marker-bearing names', () => {
    expect(TOOL_KEY_ENV_MAP).toEqual({
      brave: 'BRAVE_SEARCH_API_KEY',
      tavily: 'TAVILY_API_KEY',
      exa: 'EXA_API_KEY',
      firecrawl: 'FIRECRAWL_API_KEY',
      elevenlabs: 'ELEVENLABS_API_KEY',
      groq: 'GROQ_API_KEY',
      fal: 'FAL_API_KEY',
      huggingface: 'HF_API_KEY',
    });
  });
});

describe('buildEngineSpawnEnv - SEC-1 allowlist', () => {
  const SAVED = { ...process.env };

  beforeEach(() => {
    // Guarantee the two always-required vars exist for the assertions below.
    process.env.PATH = process.env.PATH ?? '/usr/bin';
    process.env.HOME = process.env.HOME ?? '/home/test';
  });

  afterEach(() => {
    // Restore process.env to its pre-test shape (drop injected keys).
    for (const k of Object.keys(process.env)) if (!(k in SAVED)) delete process.env[k];
    Object.assign(process.env, SAVED);
  });

  it('drops an unrelated secret that exists in process.env but keeps PATH and HOME', () => {
    process.env.SOME_UNRELATED_CHANNEL_TOKEN = 'leak-me';

    const env = buildEngineSpawnEnv({ providerEnv: {} });

    expect(env.SOME_UNRELATED_CHANNEL_TOKEN).toBeUndefined();
    expect(env.PATH).toBeDefined();
    expect(env.HOME).toBe(process.env.HOME);
  });

  it('forwards WAYLAND_BASH_SHELL so the GUI-spawned engine inherits the shell selection (#197)', () => {
    process.env.WAYLAND_BASH_SHELL = '/opt/homebrew/bin/fish';

    const env = buildEngineSpawnEnv({ providerEnv: {} });

    expect(env.WAYLAND_BASH_SHELL).toBe('/opt/homebrew/bin/fish');
  });

  it('forwards LD_LIBRARY_PATH so the engine resolves OpenSSL 1.1 on ARM64 Ubuntu 24.04 (#233)', () => {
    process.env.LD_LIBRARY_PATH = '/opt/openssl-1.1/lib:/usr/lib/aarch64-linux-gnu';

    const env = buildEngineSpawnEnv({ providerEnv: {} });

    expect(env.LD_LIBRARY_PATH).toBe('/opt/openssl-1.1/lib:/usr/lib/aarch64-linux-gnu');
  });

  it('forwards NVM_DIR and VOLTA_HOME so the engine bash tool can run version-manager node (#628)', () => {
    // getEnhancedEnv captures these on a Finder/Dock launch; without the
    // allowlist entry the engine spawn would strip them and volta's shims (which
    // resolve node via VOLTA_HOME) would break even with the bin dir on PATH.
    process.env.NVM_DIR = '/home/tester/.nvm';
    process.env.VOLTA_HOME = '/home/tester/.volta';

    const env = buildEngineSpawnEnv({ providerEnv: {} });

    expect(env.NVM_DIR).toBe('/home/tester/.nvm');
    expect(env.VOLTA_HOME).toBe('/home/tester/.volta');
  });

  it('always preserves the provider auth env even though it is a secret name', () => {
    const env = buildEngineSpawnEnv({ providerEnv: { ANTHROPIC_API_KEY: 'sk-ant-123' } });
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-123');
  });

  it('forwards a present tool key under its mapped env NAME', () => {
    const env = buildEngineSpawnEnv({ providerEnv: {}, toolKeys: { BRAVE_SEARCH_API_KEY: 'xyz' } });
    expect(env.BRAVE_SEARCH_API_KEY).toBe('xyz');
  });

  it('does not invent an env var for an absent tool key', () => {
    const env = buildEngineSpawnEnv({ providerEnv: {} });
    expect(env.BRAVE_SEARCH_API_KEY).toBeUndefined();
    expect(env.TAVILY_API_KEY).toBeUndefined();
  });

  it('opts the bundled engine into honoring a wire set_mode (WAYLAND_ALLOW_WIRE_FORCE, #495/GHSA-8r7g)', () => {
    // Engine >=0.12.19 ignores a permission-loosening wire `set_mode` unless
    // launched with this env. The desktop is the engine's trusted local
    // operator, so the bundled spawn always opts in - otherwise the composer's
    // Autopilot/Force selector would silently no-op after the bundle bump.
    const env = buildEngineSpawnEnv({ providerEnv: {} });
    expect(env.WAYLAND_ALLOW_WIRE_FORCE).toBe('1');
  });
});

describeNativeSqlite('ToolKeyStore - encrypted at rest (real DB round-trip)', () => {
  let driver: BetterSqlite3Driver;
  let store: ToolKeyStore;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    store = new ToolKeyStore(new ProviderRepository(driver));
  });

  afterEach(() => {
    driver.close();
  });

  it('round-trips a stored key and persists it encrypted (not plaintext)', () => {
    store.setToolKey('brave', 'secret-xyz');

    expect(store.getToolKey('brave')).toBe('secret-xyz');

    const row = driver
      .prepare(`SELECT creds_encrypted FROM model_registry_providers WHERE provider_id = ?`)
      .get('tool:brave') as { creds_encrypted: string };
    expect(row.creds_encrypted).not.toContain('secret-xyz');
    expect(row.creds_encrypted.startsWith('enc:v1:')).toBe(true);
  });

  it('returns undefined for an absent key and after deletion', () => {
    expect(store.getToolKey('tavily')).toBeUndefined();

    store.setToolKey('tavily', 'tav-key');
    expect(store.getToolKey('tavily')).toBe('tav-key');

    store.deleteToolKey('tavily');
    expect(store.getToolKey('tavily')).toBeUndefined();
  });

  it('collectForwardedEnv emits only present keys, under their mapped names', () => {
    store.setToolKey('brave', 'b1');
    store.setToolKey('exa', 'e1');

    expect(store.collectForwardedEnv()).toEqual({
      BRAVE_SEARCH_API_KEY: 'b1',
      EXA_API_KEY: 'e1',
    });
  });
});
