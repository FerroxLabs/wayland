/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Reset module + ProcessConfig mocks per test so the cache + storage
// adapter start clean. We mock ProcessConfig at the source - there is no
// public reset hook for the JsonFileBuilder cache layer that ProcessConfig
// uses, and we don't want the test touching real $HOME files.

const storageState: { value?: string } = {};

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async (key: string) => (key === 'app.installUuid' ? storageState.value : undefined)),
    set: vi.fn(async (key: string, value: string) => {
      if (key === 'app.installUuid') storageState.value = value;
    }),
  },
}));

beforeEach(async () => {
  storageState.value = undefined;
  const mod = await import('@process/services/kickoff/installUuid');
  mod.__resetInstallUuidCacheForTests();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('getInstallUuid', () => {
  it('mints a fresh UUID on first call and persists it', async () => {
    const { getInstallUuid } = await import('@process/services/kickoff/installUuid');
    const first = await getInstallUuid();
    expect(typeof first).toBe('string');
    expect(first.length).toBeGreaterThan(0);
    expect(storageState.value).toBe(first);
  });

  it('returns the same value on subsequent calls (cache + storage round-trip)', async () => {
    const { getInstallUuid, __resetInstallUuidCacheForTests } = await import(
      '@process/services/kickoff/installUuid'
    );
    const first = await getInstallUuid();
    __resetInstallUuidCacheForTests();
    const second = await getInstallUuid();
    expect(second).toBe(first);
  });

  it('coalesces concurrent first-call invocations to a single mint', async () => {
    const { getInstallUuid } = await import('@process/services/kickoff/installUuid');
    const [a, b, c] = await Promise.all([getInstallUuid(), getInstallUuid(), getInstallUuid()]);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  // v0.4.7.1 (E-M-5 / IPC-1) - ProcessConfig.set failure falls back to
  // host-stable seed so the value stays stable across launches even though
  // we can't persist anything.
  it('falls back to host-stable seed when ProcessConfig.set throws (persistent storage failure)', async () => {
    const { ProcessConfig } = await import('@process/utils/initStorage');
    vi.mocked(ProcessConfig.set).mockImplementationOnce(async () => {
      throw new Error('EROFS');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getInstallUuid } = await import('@process/services/kickoff/installUuid');
    const value = await getInstallUuid();
    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
    // Storage was never written successfully - storage state stays undefined.
    expect(storageState.value).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('persist failed'),
      expect.anything()
    );
    warnSpy.mockRestore();
  });

  it('host-stable seed: second call returns the same value via cache (without re-running fallback)', async () => {
    const { ProcessConfig } = await import('@process/utils/initStorage');
    vi.mocked(ProcessConfig.set).mockImplementationOnce(async () => {
      throw new Error('EROFS');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getInstallUuid } = await import('@process/services/kickoff/installUuid');
    const first = await getInstallUuid();
    const second = await getInstallUuid();
    expect(second).toBe(first);
    // Storage never got written - second call uses the in-process cache.
    expect(storageState.value).toBeUndefined();
    warnSpy.mockRestore();
  });
});
