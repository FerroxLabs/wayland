/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Skill imports must SETTLE, never reject.
 *
 * The IPC bridge has no error channel: a provider that throws becomes an
 * unhandledRejection in main and a renderer `await` that never settles.
 * Measured on Windows against 0.13.0: importing the TC-TIDE pack a second time
 * logged `[unhandledRejection] Rejected: a skill named "tide-morning-brief" is
 * already installed` and the caller waited forever, so the Import dialog spins.
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const providers = new Map<string, (req?: unknown) => unknown>();
  const nodeFor = (keyPath: string): unknown =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (typeof prop !== 'string') return undefined;
          if (prop === 'provider') return (cb: (req?: unknown) => unknown) => providers.set(keyPath, cb);
          if (prop === 'emit') return () => {};
          if (prop === 'on') return () => () => {};
          return nodeFor(keyPath ? `${keyPath}.${prop}` : prop);
        },
      }
    );
  const importZip = vi.fn();
  const importFolder = vi.fn();
  return { providers, ipcBridge: nodeFor(''), importZip, importFolder };
});

vi.mock('@/common', () => ({ ipcBridge: h.ipcBridge }));
// initSkillsBridge starts a library sweep on registration.
vi.mock('@process/services/skills/SkillLibrary', () => ({
  SkillLibrary: { getInstance: () => ({ rescanStale: vi.fn(async () => ({ rescanned: 0 })) }) },
}));
vi.mock('@process/services/skills/SkillGuard', () => ({ SkillGuard: { scan: vi.fn(async () => []) } }));
vi.mock('@process/services/skills/SkillImport', () => ({
  SkillImport: class {
    importZip = h.importZip;
    importFolder = h.importFolder;
    importGit = vi.fn();
    importSingleSkillMd = vi.fn();
  },
}));
vi.mock('@process/services/skills/SkillQuarantine', () => ({ SkillQuarantine: {} }));
vi.mock('@process/services/skills/agentProfileImport', () => ({ importAgentProfile: vi.fn() }));
vi.mock('@process/task/AcpSkillManager', () => ({ parseFrontmatter: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(), set: vi.fn() },
  getAssistantsDir: vi.fn(() => '/fake/assistants'),
}));
vi.mock('@process/extensions/data/bundle-vendored/teamSkillMerge', () => ({ loadTeamSkills: vi.fn() }));
vi.mock('@process/services/skills/CliSkillDiscovery', () => ({ loadCliSkills: vi.fn(async () => {}) }));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn() }));

import { initSkillsBridge } from '@process/bridge/skillsBridge';

beforeAll(() => {
  initSkillsBridge();
});

const provider = (key: string) => {
  const cb = h.providers.get(key);
  if (!cb) throw new Error(`provider ${key} not registered`);
  return cb;
};

describe('skills import providers settle instead of rejecting', () => {
  it('returns the importer rejection for a pack that is already installed', async () => {
    const rejection =
      'Rejected: a skill named "tide-morning-brief" is already installed. Remove it first, or rename the folder you are importing.';
    h.importZip.mockRejectedValueOnce(new Error(rejection));

    await expect(provider('skills.import.zip')({ zipPath: 'D:/pack.zip' })).resolves.toEqual({ error: rejection });
  });

  it('reduces any other failure to a generic message so no raw error crosses the bridge', async () => {
    h.importFolder.mockRejectedValueOnce(new Error("EACCES: permission denied, open 'C:\\Users\\someone\\secret'"));

    await expect(provider('skills.import.folder')({ srcPath: 'C:/x' })).resolves.toEqual({ error: 'Import failed' });
  });

  it('passes a successful import result through unchanged', async () => {
    const result = { imported: [], quarantined: [], warnings: ['w'] };
    h.importZip.mockResolvedValueOnce(result);

    await expect(provider('skills.import.zip')({ zipPath: 'D:/ok.zip' })).resolves.toBe(result);
  });
});
