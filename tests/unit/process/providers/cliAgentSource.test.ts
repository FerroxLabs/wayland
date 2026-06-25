/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `CliAgentSource` shells out via `safeExecFile`. The unit tests must NOT touch
// real CLIs, so the whole module is mocked and each test drives its behavior.
vi.mock('@process/utils/safeExec', () => ({
  safeExecFile: vi.fn(),
  safeExec: vi.fn(),
}));

import { CliAgentSource, isEnumerableCliAgent } from '@process/providers/sources/CliAgentSource';
import { safeExecFile } from '@process/utils/safeExec';

const execFileMock = vi.mocked(safeExecFile);

/** A successful `codex debug models` payload with two visible models + one hidden. */
const CODEX_DEBUG_MODELS_JSON = JSON.stringify({
  models: [
    { slug: 'gpt-5.5', display_name: 'GPT-5.5', visibility: 'list', supported_in_api: true },
    { slug: 'gpt-5.4-mini', display_name: 'GPT-5.4-Mini', visibility: 'list', supported_in_api: true },
    { slug: 'codex-auto-review', display_name: 'Codex Auto Review', visibility: 'hide', supported_in_api: true },
  ],
});

beforeEach(() => {
  execFileMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Contract surface ─────────────────────────────────────────────────────────

describe('CliAgentSource - contract surface', () => {
  it('exposes the cli kind and the agent key it was constructed with', () => {
    const source = new CliAgentSource('codex');
    expect(source.kind).toBe('cli');
    expect(source.providerId).toBe('codex');
  });

  it('maps each CLI agent to its underlying model providerId', () => {
    expect(new CliAgentSource('codex').underlyingProviderId).toBe('openai');
    expect(new CliAgentSource('claude').underlyingProviderId).toBe('anthropic');
    expect(new CliAgentSource('gemini').underlyingProviderId).toBe('google-gemini');
  });
});

// ─── Enumerability signal ─────────────────────────────────────────────────────

describe('CliAgentSource - enumerable signal', () => {
  it('marks Codex as enumerable - it has `codex debug models`', () => {
    expect(new CliAgentSource('codex').enumerable).toBe(true);
    expect(isEnumerableCliAgent('codex')).toBe(true);
  });

  it('marks Claude Code as not enumerable - it has no model-list mechanism', () => {
    expect(new CliAgentSource('claude').enumerable).toBe(false);
    expect(isEnumerableCliAgent('claude')).toBe(false);
  });

  it('marks Gemini CLI as not enumerable - it has no model-list mechanism', () => {
    expect(new CliAgentSource('gemini').enumerable).toBe(false);
    expect(isEnumerableCliAgent('gemini')).toBe(false);
  });
});

// ─── Enumerable CLI: Codex ────────────────────────────────────────────────────

describe('CliAgentSource - enumerable CLI (Codex)', () => {
  it('parses `codex debug models` output into RawModel[] with the openai providerId', async () => {
    execFileMock.mockResolvedValue({ stdout: CODEX_DEBUG_MODELS_JSON, stderr: '' });

    const models = await new CliAgentSource('codex').listModels();

    expect(models).toEqual([
      { id: 'gpt-5.5', providerId: 'openai', rawName: 'GPT-5.5' },
      { id: 'gpt-5.4-mini', providerId: 'openai', rawName: 'GPT-5.4-Mini' },
    ]);
  });

  it('excludes models whose visibility is not "list" (e.g. hidden internal models)', async () => {
    execFileMock.mockResolvedValue({ stdout: CODEX_DEBUG_MODELS_JSON, stderr: '' });

    const models = await new CliAgentSource('codex').listModels();

    expect(models.some((m) => m.id === 'codex-auto-review')).toBe(false);
  });

  it('returns [] without throwing when the codex CLI emits unparseable output (both paths)', async () => {
    execFileMock.mockResolvedValue({ stdout: 'not json at all', stderr: '' });

    await expect(new CliAgentSource('codex').listModels()).resolves.toEqual([]);
  });

  it('returns [] without throwing when both commands emit a model-less payload', async () => {
    execFileMock.mockResolvedValue({ stdout: JSON.stringify({ models: [] }), stderr: '' });

    await expect(new CliAgentSource('codex').listModels()).resolves.toEqual([]);
  });

  it('returns [] without throwing when `models` is valid JSON but not an array', async () => {
    execFileMock.mockResolvedValue({ stdout: JSON.stringify({ models: 'wat' }), stderr: '' });

    await expect(new CliAgentSource('codex').listModels()).resolves.toEqual([]);
  });

  it('returns [] without throwing when the payload is a top-level JSON array', async () => {
    execFileMock.mockResolvedValue({ stdout: JSON.stringify([1, 2, 3]), stderr: '' });

    await expect(new CliAgentSource('codex').listModels()).resolves.toEqual([]);
  });

  it('drops malformed model entries (missing slug) instead of throwing', async () => {
    execFileMock.mockResolvedValue({
      stdout: JSON.stringify({
        models: [
          { slug: 'gpt-5.5', visibility: 'list' },
          { display_name: 'no slug', visibility: 'list' },
        ],
      }),
      stderr: '',
    });

    const models = await new CliAgentSource('codex').listModels();

    expect(models).toEqual([{ id: 'gpt-5.5', providerId: 'openai' }]);
  });
});

// ─── Account-aware preference + graceful bundled fallback (issue #22) ──────────

/** Account-scoped catalog: ONE entitled model (what the subscription can call). */
const CODEX_ACCOUNT_MODELS_JSON = JSON.stringify({
  models: [{ slug: 'gpt-5.5', display_name: 'GPT-5.5', visibility: 'list', supported_in_api: true }],
});

/** Offline bundled catalog: a BROADER set incl. models the account can't call. */
const CODEX_BUNDLED_MODELS_JSON = JSON.stringify({
  models: [
    { slug: 'gpt-5.5', display_name: 'GPT-5.5', visibility: 'list', supported_in_api: true },
    { slug: 'gpt-5.2', display_name: 'GPT-5.2', visibility: 'list', supported_in_api: true },
    { slug: 'gpt-5.3-codex', display_name: 'GPT-5.3-Codex', visibility: 'list', supported_in_api: true },
  ],
});

describe('CliAgentSource - account-aware vs bundled (Codex, issue #22)', () => {
  it('tries the account-aware `debug models` (no --bundled) FIRST', async () => {
    execFileMock.mockResolvedValue({ stdout: CODEX_ACCOUNT_MODELS_JSON, stderr: '' });

    await new CliAgentSource('codex').listModels();

    const [file, args, options] = execFileMock.mock.calls[0];
    expect(file).toBe('codex');
    expect(args).toEqual(['debug', 'models']);
    expect(options?.timeout).toBeGreaterThan(0);
  });

  it('uses the account-aware result and does NOT call the bundled fallback when it yields models', async () => {
    execFileMock.mockResolvedValue({ stdout: CODEX_ACCOUNT_MODELS_JSON, stderr: '' });

    const models = await new CliAgentSource('codex').listModels();

    // Scoped to the one entitled model - the broad bundled set is never consulted.
    expect(models).toEqual([{ id: 'gpt-5.5', providerId: 'openai', rawName: 'GPT-5.5' }]);
    expect(execFileMock).toHaveBeenCalledTimes(1);
    expect(execFileMock.mock.calls[0][1]).toEqual(['debug', 'models']);
  });

  it('falls back to `--bundled` when the account-aware probe errors - list is NOT blank', async () => {
    execFileMock
      .mockRejectedValueOnce(Object.assign(new Error('refresh failed: network'), { code: 1 }))
      .mockResolvedValueOnce({ stdout: CODEX_BUNDLED_MODELS_JSON, stderr: '' });

    const models = await new CliAgentSource('codex').listModels();

    expect(execFileMock).toHaveBeenCalledTimes(2);
    expect(execFileMock.mock.calls[0][1]).toEqual(['debug', 'models']);
    expect(execFileMock.mock.calls[1][1]).toEqual(['debug', 'models', '--bundled']);
    expect(models.map((m) => m.id)).toEqual(['gpt-5.5', 'gpt-5.2', 'gpt-5.3-codex']);
  });

  it('falls back to `--bundled` when the account-aware probe returns an empty catalog - list is NOT blank', async () => {
    execFileMock
      .mockResolvedValueOnce({ stdout: JSON.stringify({ models: [] }), stderr: '' })
      .mockResolvedValueOnce({ stdout: CODEX_BUNDLED_MODELS_JSON, stderr: '' });

    const models = await new CliAgentSource('codex').listModels();

    expect(execFileMock).toHaveBeenCalledTimes(2);
    expect(execFileMock.mock.calls[1][1]).toEqual(['debug', 'models', '--bundled']);
    expect(models.length).toBe(3);
  });

  it('returns [] only when BOTH the account-aware and bundled commands fail (CLI missing)', async () => {
    execFileMock.mockRejectedValue(Object.assign(new Error('spawn codex ENOENT'), { code: 'ENOENT' }));

    const models = await new CliAgentSource('codex').listModels();

    expect(execFileMock).toHaveBeenCalledTimes(2);
    expect(models).toEqual([]);
  });
});

// ─── Non-enumerable CLIs: Claude Code and Gemini CLI ──────────────────────────

describe('CliAgentSource - non-enumerable CLIs', () => {
  it('returns [] for Claude Code without invoking any CLI', async () => {
    const models = await new CliAgentSource('claude').listModels();

    expect(models).toEqual([]);
    expect(execFileMock).not.toHaveBeenCalled();
  });

  it('returns [] for Gemini CLI without invoking any CLI', async () => {
    const models = await new CliAgentSource('gemini').listModels();

    expect(models).toEqual([]);
    expect(execFileMock).not.toHaveBeenCalled();
  });
});
