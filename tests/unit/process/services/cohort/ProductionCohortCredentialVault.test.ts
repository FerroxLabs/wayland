/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const vault = vi.hoisted(() => new Map<string, string>());
const getPassword = vi.hoisted(() =>
  vi.fn(async (service: string, account: string) => vault.get(`${service}:${account}`) ?? null)
);
const setPassword = vi.hoisted(() =>
  vi.fn(async (service: string, account: string, value: string) => {
    vault.set(`${service}:${account}`, value);
  })
);
const configGet = vi.hoisted(() => vi.fn(async () => undefined));
const configUpdate = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('keytar', () => ({ getPassword, setPassword }));
vi.mock('electron', () => ({
  app: {
    getPath: () => '/test/wayland-user-data',
    getVersion: () => '0.12.0-test',
    isPackaged: true,
  },
  dialog: { showMessageBox: vi.fn() },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: configGet, update: configUpdate },
}));
vi.mock('@process/services/i18n', () => ({
  default: { t: (key: string) => key },
  i18nReady: Promise.resolve(),
}));

import { createProductionCohortController } from '@process/services/cohort/ProductionCohortController';

describe('production cohort OS credential vault', () => {
  beforeEach(() => {
    vault.clear();
    vi.clearAllMocks();
    Object.defineProperty(process, 'resourcesPath', { configurable: true, value: '/test/resources' });
  });

  it('[HF-01][HF-02][MF-02] keeps identity, migration marker, and current authority outside mutable config', async () => {
    const first = await createProductionCohortController();
    await expect(first.authorityStatus()).resolves.toMatchObject({ generation: null });

    expect(setPassword).toHaveBeenCalledTimes(2);
    expect([...vault.keys()].some((key) => key.endsWith(':installation'))).toBe(true);
    expect([...vault.keys()].some((key) => key.endsWith(':authority'))).toBe(true);
    expect(configUpdate).toHaveBeenCalledTimes(3);

    vi.clearAllMocks();
    const restarted = await createProductionCohortController();
    await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: null });
    expect(setPassword).not.toHaveBeenCalled();
    expect(configGet).not.toHaveBeenCalled();
    expect(configUpdate).not.toHaveBeenCalled();
  });

  it('[MF-01] fails closed when the OS credential vault is unavailable', async () => {
    getPassword.mockRejectedValueOnce(new Error('credential vault unavailable'));
    await expect(createProductionCohortController()).rejects.toThrow('credential vault unavailable');
    expect(configGet).not.toHaveBeenCalled();
    expect(configUpdate).not.toHaveBeenCalled();
  });

  it.each(['file:v1:fallback', 'enc:v1:old-backend', '{"schemaVersion":1}'])(
    '[MF-01] never activates config/file/safe-storage material as vault authority: %s',
    async (foreignValue) => {
      await createProductionCohortController();
      const authorityKey = [...vault.keys()].find((key) => key.endsWith(':authority'))!;
      vault.set(authorityKey, foreignValue);
      vi.clearAllMocks();

      const restarted = await createProductionCohortController();
      await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: null });
      expect(configGet).not.toHaveBeenCalled();
    }
  );
});
