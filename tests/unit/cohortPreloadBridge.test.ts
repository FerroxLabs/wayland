/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

type ExposedApi = Record<string, (...args: unknown[]) => Promise<unknown>>;
const ipcRenderer = {
  invoke: vi.fn(async () => undefined),
  on: vi.fn(),
  off: vi.fn(),
  removeListener: vi.fn(),
};
let exposedApi: ExposedApi = {};

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((_key: string, api: unknown) => {
      exposedApi = api as ExposedApi;
    }),
  },
  ipcRenderer,
  webUtils: { getPathForFile: vi.fn(() => '/tmp/file') },
}));

vi.mock('../../src/common/adapter/constant', () => ({
  ADAPTER_BRIDGE_EVENT_KEY: 'adapter:bridge:event',
}));

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { dispatchEvent: vi.fn() },
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  await import('../../src/preload/main');
});

describe('cockpit preload boundary', () => {
  it('exposes only the read-only cockpit rollout status and no cohort minting aliases', async () => {
    const cohortKeys = Object.keys(exposedApi).filter((key) => key.toLowerCase().includes('cohort'));
    expect(cohortKeys).toEqual([]);

    expect(typeof exposedApi.cockpitRolloutStatus).toBe('function');
    await exposedApi.cockpitRolloutStatus();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('cohort:cockpit-rollout-status');
  });
});
