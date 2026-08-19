/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The renderer bridge is resolve-only - no reject path, no timeout - so a
 * provider that never answers used to leave every `await ConfigStorage.get/set`
 * pending forever. Because nothing rejected, the `.catch()` blocks already
 * written around those calls could never fire, and the failure was silent.
 *
 * Shipped consequences: a stalled write left the home page on
 * "No model configured yet" with a dead Send button, and made a preset
 * assistant's backend switch a no-op with neither a change nor an error.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const built: Record<string, unknown> = {};
vi.mock('@office-ai/platform', () => ({
  storage: { buildStorage: () => built },
  bridge: { buildProvider: () => ({}), adapter: () => ({}) },
}));

import { buildStorage } from '@/common/adapter/bridgeAllowlist';

describe('storage calls cannot hang forever', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('rejects a get that never answers, so existing catch handlers can fire', async () => {
    built.get = () => new Promise(() => undefined);
    built.set = () => new Promise(() => undefined);
    const store = buildStorage('agent.config') as unknown as {
      get: (k: string) => Promise<unknown>;
      set: (k: string, v: unknown) => Promise<unknown>;
    };

    const pending = store.get('wcore.defaultModel');
    const seen: string[] = [];
    void pending.catch((e: Error) => seen.push(e.message));

    await vi.advanceTimersByTimeAsync(15_001);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('agent.config.storage.get');
  });

  it('rejects a wedged set, which is what silently swallowed model picks', async () => {
    built.set = () => new Promise(() => undefined);
    const store = buildStorage('agent.config') as unknown as { set: (k: string, v: unknown) => Promise<unknown> };
    const seen: string[] = [];
    void store.set('wcore.defaultModel', { useModel: 'flux-auto' }).catch((e: Error) => seen.push(e.message));
    await vi.advanceTimersByTimeAsync(15_001);
    expect(seen).toHaveLength(1);
  });

  it('passes a normal call straight through and does not delay it', async () => {
    built.get = vi.fn(async (k: string) => `value-for-${k}`);
    const store = buildStorage('agent.config') as unknown as { get: (k: string) => Promise<unknown> };
    await expect(store.get('anything')).resolves.toBe('value-for-anything');
  });
});
