/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `KeyDiscovery` reads config files from the user's home directory. The unit
// tests must NOT touch the real machine, so `node:fs` and `node:os` are mocked
// and each test drives the filesystem it sees.
vi.mock('node:fs', () => ({
  default: { readFileSync: vi.fn(), existsSync: vi.fn() },
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));
vi.mock('node:os', () => ({
  default: { homedir: vi.fn(() => '/home/test') },
  homedir: vi.fn(() => '/home/test'),
}));

import fs from 'node:fs';
import path from 'node:path';

import { KeyDiscovery, PROVIDER_ENV_VARS } from '@process/providers/detection/KeyDiscovery';

const readFileSyncMock = vi.mocked(fs.readFileSync);
const existsSyncMock = vi.mocked(fs.existsSync);

/** Snapshot of `process.env` restored after every test. */
const ORIGINAL_ENV = process.env;

/** Replace `process.env` with a known set of keys for a single test. */
function setEnv(vars: Record<string, string>): void {
  process.env = { ...vars };
}

/** Configure the mocked filesystem so no config files exist. */
function noConfigFiles(): void {
  existsSyncMock.mockReturnValue(false);
  readFileSyncMock.mockImplementation(() => {
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
  });
}

beforeEach(() => {
  readFileSyncMock.mockReset();
  existsSyncMock.mockReset();
  setEnv({});
  noConfigFiles();
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.restoreAllMocks();
});

// ─── Environment-variable scan ────────────────────────────────────────────────

describe('KeyDiscovery - environment-variable scan', () => {
  it('discovers a provider when its well-known env var is set, tagged with the env source', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-proj-abc123' });

    const found = await new KeyDiscovery().scan();

    expect(found).toEqual([{ providerId: 'openai', source: 'env:OPENAI_API_KEY' }]);
  });

  it('discovers Moonshot from MOONSHOT_API_KEY (issue #25)', async () => {
    setEnv({ MOONSHOT_API_KEY: 'sk-moonshot-abc' });

    const found = await new KeyDiscovery().scan();

    expect(found).toEqual([{ providerId: 'moonshot', source: 'env:MOONSHOT_API_KEY' }]);
  });

  it('discovers NVIDIA from NVIDIA_API_KEY (issue #25)', async () => {
    setEnv({ NVIDIA_API_KEY: 'nvapi-abc' });

    const found = await new KeyDiscovery().scan();

    expect(found).toEqual([{ providerId: 'nvidia', source: 'env:NVIDIA_API_KEY' }]);
  });

  it('discovers multiple distinct providers from multiple env vars', async () => {
    setEnv({
      OPENAI_API_KEY: 'sk-proj-abc',
      ANTHROPIC_API_KEY: 'sk-ant-xyz',
      GROQ_API_KEY: 'gsk_qqq',
    });

    const found = await new KeyDiscovery().scan();
    const ids = found.map((d) => d.providerId).toSorted();

    expect(ids).toEqual(['anthropic', 'groq', 'openai']);
  });

  it('emits a provider only once when found via two different env vars (first match wins)', async () => {
    setEnv({ GEMINI_API_KEY: 'AIza-one', GOOGLE_API_KEY: 'AIza-two' });

    const found = await new KeyDiscovery().scan();
    const geminiHits = found.filter((d) => d.providerId === 'google-gemini');

    expect(geminiHits).toHaveLength(1);
    // PROVIDER_ENV_VARS lists GEMINI_API_KEY before GOOGLE_API_KEY → first wins.
    expect(geminiHits[0]?.source).toBe('env:GEMINI_API_KEY');
  });

  it('ignores an env var that is set but empty', async () => {
    setEnv({ OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '   ' });

    const found = await new KeyDiscovery().scan();

    expect(found).toEqual([]);
  });

  it('returns an empty array when no provider env vars and no config files are present', async () => {
    setEnv({ PATH: '/usr/bin', HOME: '/home/test' });

    const found = await new KeyDiscovery().scan();

    expect(found).toEqual([]);
  });

  it('produces a deterministic order across runs for the same environment', async () => {
    setEnv({ XAI_API_KEY: 'xai-1', OPENAI_API_KEY: 'sk-proj-1', MISTRAL_API_KEY: 'm-1' });

    const first = await new KeyDiscovery().scan();
    const second = await new KeyDiscovery().scan();

    expect(first).toEqual(second);
  });
});

// ─── CLI config-file scan ─────────────────────────────────────────────────────

// The scan reconstructs config paths via path.join(os.homedir(), '.codex',
// 'auth.json') - native separators (backslashes on win32). Every mock matcher
// and expected source below is built with the SAME path.join, so they match
// prod's construction on both platforms and this block runs on windows too.
// `codexAuthTail` = `.codex/auth.json` (posix) / `.codex\auth.json` (win32);
// `codexAuthPath` is the full mocked-homedir path the scan emits.
const codexAuthTail = path.join('.codex', 'auth.json');
const codexAuthPath = path.join('/home/test', '.codex', 'auth.json');
describe('KeyDiscovery - CLI config-file scan', () => {
  it('discovers an OpenAI key from ~/.codex/auth.json when it stores a raw key', async () => {
    existsSyncMock.mockImplementation((p) => String(p).endsWith(codexAuthTail));
    readFileSyncMock.mockImplementation((p) => {
      if (String(p).endsWith(codexAuthTail)) {
        return JSON.stringify({ auth_mode: 'apikey', OPENAI_API_KEY: 'sk-proj-from-codex' });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    const found = await new KeyDiscovery().scan();

    expect(found).toEqual([{ providerId: 'openai', source: `file:${codexAuthPath}#OPENAI_API_KEY` }]);
  });

  it('does not discover a key when ~/.codex/auth.json is in OAuth mode (OPENAI_API_KEY is null)', async () => {
    existsSyncMock.mockImplementation((p) => String(p).endsWith(codexAuthTail));
    readFileSyncMock.mockImplementation((p) => {
      if (String(p).endsWith(codexAuthTail)) {
        return JSON.stringify({
          auth_mode: 'chatgpt',
          OPENAI_API_KEY: null,
          tokens: { access_token: 'oauth-token' },
        });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    const found = await new KeyDiscovery().scan();

    expect(found).toEqual([]);
  });

  it('prefers the env source when the same provider is found in both env and a config file', async () => {
    setEnv({ OPENAI_API_KEY: 'sk-proj-from-env' });
    existsSyncMock.mockImplementation((p) => String(p).endsWith(codexAuthTail));
    readFileSyncMock.mockImplementation((p) => {
      if (String(p).endsWith(codexAuthTail)) {
        return JSON.stringify({ auth_mode: 'apikey', OPENAI_API_KEY: 'sk-proj-from-codex' });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    const found = await new KeyDiscovery().scan();
    const openaiHits = found.filter((d) => d.providerId === 'openai');

    expect(openaiHits).toHaveLength(1);
    expect(openaiHits[0]?.source).toBe('env:OPENAI_API_KEY');
  });

  it('never throws when a config file is present but unreadable - degrades to not-found', async () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockImplementation(() => {
      throw Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
    });

    await expect(new KeyDiscovery().scan()).resolves.toEqual([]);
  });

  it('never throws when a config file contains malformed JSON - degrades to not-found', async () => {
    existsSyncMock.mockImplementation((p) => String(p).endsWith(codexAuthTail));
    readFileSyncMock.mockImplementation((p) => {
      if (String(p).endsWith(codexAuthTail)) return '{ not valid json';
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    await expect(new KeyDiscovery().scan()).resolves.toEqual([]);
  });
});

// ─── Value resolution (for Packet 1F) ─────────────────────────────────────────

describe('KeyDiscovery - readValue', () => {
  it('re-reads the actual key value from an env source on demand', () => {
    setEnv({ ANTHROPIC_API_KEY: 'sk-ant-secret-value' });

    const value = new KeyDiscovery().readValue({
      providerId: 'anthropic',
      source: 'env:ANTHROPIC_API_KEY',
    });

    expect(value).toBe('sk-ant-secret-value');
  });

  it('re-reads the actual key value from a config-file source on demand', () => {
    existsSyncMock.mockImplementation((p) => String(p).endsWith('.codex/auth.json'));
    readFileSyncMock.mockImplementation((p) => {
      if (String(p).endsWith('.codex/auth.json')) {
        return JSON.stringify({ auth_mode: 'apikey', OPENAI_API_KEY: 'sk-proj-resolved' });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    const value = new KeyDiscovery().readValue({
      providerId: 'openai',
      source: 'file:/home/test/.codex/auth.json#OPENAI_API_KEY',
    });

    expect(value).toBe('sk-proj-resolved');
  });

  it('returns null when an env source has been unset since the scan', () => {
    setEnv({});

    const value = new KeyDiscovery().readValue({
      providerId: 'openai',
      source: 'env:OPENAI_API_KEY',
    });

    expect(value).toBeNull();
  });

  it('returns null when a file source no longer exists', () => {
    noConfigFiles();

    const value = new KeyDiscovery().readValue({
      providerId: 'openai',
      source: 'file:/home/test/.codex/auth.json#OPENAI_API_KEY',
    });

    expect(value).toBeNull();
  });

  it('returns null for an unrecognized source scheme', () => {
    const value = new KeyDiscovery().readValue({
      providerId: 'openai',
      source: 'keychain:something',
    });

    expect(value).toBeNull();
  });

  it('returns null without throwing when a file source is unreadable', () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockImplementation(() => {
      throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
    });

    const value = new KeyDiscovery().readValue({
      providerId: 'openai',
      source: 'file:/home/test/.codex/auth.json#OPENAI_API_KEY',
    });

    expect(value).toBeNull();
  });
});

// ─── Static env-var map ───────────────────────────────────────────────────────

describe('KeyDiscovery - PROVIDER_ENV_VARS map', () => {
  it('covers every provider named in the packet requirements', () => {
    const required: string[] = [
      'openai',
      'anthropic',
      'google-gemini',
      'groq',
      'openrouter',
      'mistral',
      'deepseek',
      'xai',
      'together',
      'fireworks',
      'perplexity',
      'cohere',
      'cerebras',
    ];

    for (const id of required) {
      expect(PROVIDER_ENV_VARS[id as keyof typeof PROVIDER_ENV_VARS]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('lists GEMINI_API_KEY and GOOGLE_API_KEY as candidates for google-gemini', () => {
    expect(PROVIDER_ENV_VARS['google-gemini']).toContain('GEMINI_API_KEY');
    expect(PROVIDER_ENV_VARS['google-gemini']).toContain('GOOGLE_API_KEY');
  });

  it('covers moonshot and nvidia with their canonical env vars (issue #25)', () => {
    expect(PROVIDER_ENV_VARS.moonshot).toEqual(['MOONSHOT_API_KEY']);
    expect(PROVIDER_ENV_VARS.nvidia).toEqual(['NVIDIA_API_KEY']);
  });

  it('covers minimax with its canonical env var (issue #135)', () => {
    expect(PROVIDER_ENV_VARS.minimax).toEqual(['MINIMAX_API_KEY']);
  });
});
