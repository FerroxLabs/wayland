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
const showMessageBox = vi.hoisted(() => vi.fn(async () => ({ response: 1 })));
const translate = vi.hoisted(() =>
  vi.fn((key: string, options?: { cohort?: string }) =>
    key === 'settings.navigationPage.cohort.knowledge-work'
      ? 'Localized knowledge work'
      : options?.cohort
        ? `${key}:${options.cohort}`
        : key
  )
);

vi.mock('keytar', () => ({ getPassword, setPassword }));
vi.mock('electron', () => ({
  app: {
    getPath: () => '/test/wayland-user-data',
    getVersion: () => '0.12.0-test',
    isPackaged: true,
  },
  dialog: { showMessageBox },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: configGet, update: configUpdate },
}));
vi.mock('@process/services/i18n', () => ({
  default: { t: translate },
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

    expect(setPassword).toHaveBeenCalledTimes(4);
    expect([...vault.keys()].some((key) => key.endsWith(':installation'))).toBe(true);
    expect([...vault.keys()].some((key) => key.endsWith(':lineage'))).toBe(true);
    expect([...vault.keys()].some((key) => key.endsWith(':migration-consumed'))).toBe(true);
    expect(configUpdate).toHaveBeenCalledTimes(3);

    vi.clearAllMocks();
    const restarted = await createProductionCohortController();
    await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: null });
    expect(setPassword).not.toHaveBeenCalled();
    expect(configGet).not.toHaveBeenCalled();
    expect(configUpdate).not.toHaveBeenCalled();
  });

  it('[HF-02] anchors migration consumption in the stable installation credential', async () => {
    await createProductionCohortController();
    const installationKey = [...vault.keys()].find((key) => key.endsWith(':installation'))!;
    const installationCredential = JSON.parse(vault.get(installationKey)!) as {
      installIdentity: string;
      legacyMigrationConsumed: boolean;
    };
    expect(installationCredential).toMatchObject({ legacyMigrationConsumed: true });

    for (const suffix of [':authority', ':lineage', ':migration-consumed']) {
      const key = [...vault.keys()].find((candidate) => candidate.endsWith(suffix));
      if (key) vault.delete(key);
    }
    configGet.mockImplementation(async (key: string) =>
      key === 'cohort.evidenceConsent'
        ? {
            schemaVersion: 1,
            enabled: false,
            acceptedAtMs: null,
            windowStartMs: null,
            windowEndMs: null,
          }
        : {
            schemaVersion: 1,
            cohort: 'developer',
            classifiedAtMs: Date.UTC(2026, 6, 19),
            windowStartMs: null,
            windowEndMs: null,
          }
    );
    vi.clearAllMocks();

    const restarted = await createProductionCohortController();
    await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: null });
    expect(configGet).not.toHaveBeenCalled();
    expect(showMessageBox).not.toHaveBeenCalled();
    expect(JSON.parse(vault.get(installationKey)!)).toEqual(installationCredential);
  });

  it('[LF-03] renders the native confirmation with the localized cohort label', async () => {
    const controller = await createProductionCohortController();

    await expect(controller.requestAssignment('knowledge-work')).resolves.toMatchObject({ status: 'classified' });

    expect(translate).toHaveBeenCalledWith('settings.navigationPage.cohort.knowledge-work');
    expect(translate).toHaveBeenCalledWith('settings.navigationPage.cohortConfirmationMessage', {
      cohort: 'Localized knowledge work',
    });
    expect(showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'settings.navigationPage.cohortConfirmationMessage:Localized knowledge work',
      })
    );
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
      const controller = await createProductionCohortController();
      await controller.requestAssignment('novice');
      const authorityKey = [...vault.keys()].find((key) => key.endsWith(':authority'))!;
      vault.set(authorityKey, foreignValue);
      vi.clearAllMocks();

      const restarted = await createProductionCohortController();
      await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: null });
      expect(configGet).not.toHaveBeenCalled();
    }
  );
});
