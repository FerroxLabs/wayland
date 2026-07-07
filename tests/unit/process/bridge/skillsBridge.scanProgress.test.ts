/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Library-sweep progress streaming (skill-scan hang fix): a 1,900-skill scan
 * used to resolve a single `{ rescanned }` only after the whole sweep, with
 * zero signal to the renderer - visually identical to a hang. The bridge now
 * emits `skills.scanProgress` every 10 swept skills plus a final
 * `done === total` tick, from both the `rescanAll` and `scanLibrary`
 * providers.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const providers = new Map<string, (req?: unknown) => unknown>();
  const emitted: Array<{ key: string; data: unknown }> = [];
  // Minimal ipcBridge stand-in: any `<ns>.<name>.provider(cb)` registers cb
  // under its dotted key path; any `.emit(data)` records the payload. Lets the
  // bridge module register its dozens of providers without enumerating them.
  const nodeFor = (keyPath: string): unknown =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (typeof prop !== 'string') return undefined;
          if (prop === 'provider') {
            return (cb: (req?: unknown) => unknown) => providers.set(keyPath, cb);
          }
          if (prop === 'emit') {
            return (data: unknown) => emitted.push({ key: keyPath, data });
          }
          if (prop === 'on') return () => () => {};
          return nodeFor(keyPath ? `${keyPath}.${prop}` : prop);
        },
      }
    );
  const rescanStale = vi.fn(
    async (_opts?: { onProgress?: (p: { done: number; total: number; currentName: string }) => void }) => ({
      rescanned: 0,
    })
  );
  return { providers, emitted, ipcBridge: nodeFor(''), rescanStale };
});

vi.mock('@/common', () => ({ ipcBridge: h.ipcBridge }));
vi.mock('@process/services/skills/SkillLibrary', () => ({
  SkillLibrary: { getInstance: () => ({ rescanStale: h.rescanStale }) },
}));
vi.mock('@process/services/skills/SkillGuard', () => ({ SkillGuard: { scan: vi.fn(async () => []) } }));
vi.mock('@process/services/skills/SkillImport', () => ({ SkillImport: class {} }));
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

type SweepOpts = { onProgress?: (p: { done: number; total: number; currentName: string }) => void };

/** Drive the mocked sweep: fire one progress tick per skill, 1..total. */
const sweepOf = (total: number) => async (opts?: SweepOpts) => {
  for (let done = 1; done <= total; done++) {
    opts?.onProgress?.({ done, total, currentName: `skill-${done}` });
  }
  return { rescanned: total };
};

const progressTicks = () =>
  h.emitted
    .filter((e) => e.key === 'skills.scanProgress')
    .map((e) => e.data as { done: number; total: number; currentName: string });

beforeAll(() => {
  initSkillsBridge();
});

beforeEach(() => {
  h.emitted.length = 0;
  h.rescanStale.mockReset();
  h.rescanStale.mockImplementation(async () => ({ rescanned: 0 }));
});

describe('skillsBridge - scan-progress streaming', () => {
  it('rescanAll emits a tick every 10 skills plus a final done === total tick', async () => {
    h.rescanStale.mockImplementation(sweepOf(23));

    const provider = h.providers.get('skills.rescanAll');
    expect(provider).toBeTruthy();
    const result = await provider!();

    expect(result).toEqual({ rescanned: 23 });
    const ticks = progressTicks();
    expect(ticks.map((t) => t.done)).toEqual([10, 20, 23]);
    expect(ticks[2]).toEqual({ done: 23, total: 23, currentName: 'skill-23' });
    expect(ticks.every((t) => t.total === 23)).toBe(true);
  });

  it('scanLibrary streams through the same sweep (single final tick for a small library)', async () => {
    h.rescanStale.mockImplementation(sweepOf(5));

    const provider = h.providers.get('skills.scanLibrary');
    expect(provider).toBeTruthy();
    const result = await provider!();

    expect(result).toEqual({ rescanned: 5 });
    // 5 < 10, so only the final done === total tick fires.
    expect(progressTicks()).toEqual([{ done: 5, total: 5, currentName: 'skill-5' }]);
  });

  it('a tick that is both a multiple of 10 and the final one is emitted exactly once', async () => {
    h.rescanStale.mockImplementation(sweepOf(20));

    await h.providers.get('skills.rescanAll')!();

    expect(progressTicks().map((t) => t.done)).toEqual([10, 20]);
  });
});
