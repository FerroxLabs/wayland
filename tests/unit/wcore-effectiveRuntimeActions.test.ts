/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import {
  createSerializedPreferenceStore,
  isValidOutputBudgetPreference,
  openEffectiveRuntimeFolder,
  readOutputBudgetPreference,
  readRawEngineModePreference,
  setRawEngineModeTransactional,
} from '@process/agent/wcore/effectiveRuntimeActions';
import type { IWcoreEffectiveRuntime } from '@/common/adapter/ipcBridge';
import { MAX_FIXED_BUDGET, MIN_FIXED_BUDGET } from '@/common/config/outputBudget';

const RUNTIME: IWcoreEffectiveRuntime = {
  mode: 'desktop-managed',
  profile: 'client-work',
  profileApplied: true,
  waylandHomeInjected: true,
  desktopModelOverrideApplied: true,
  desktopPromptOverlayApplied: true,
  selectedConnectorsAuthority: 'desktop',
  teamBridgePolicy: 'host-preserved',
  toolCredentialPolicy: 'allowlisted-host-forwarding',
  hostProtocolAuthority: 'desktop',
  engineConfigDir: '/authoritative/core',
  engineConfigPath: '/authoritative/core/config.toml',
  desktopConfigDir: '/authoritative/desktop',
  desktopConfigPath: '/authoritative/desktop/wayland-config.txt',
};

describe('setRawEngineModeTransactional', () => {
  it('persists a successful preference update', async () => {
    const store = { get: vi.fn().mockResolvedValue(false), set: vi.fn().mockResolvedValue(undefined), remove: vi.fn() };

    await expect(setRawEngineModeTransactional(true, store)).resolves.toEqual({ ok: true });
    expect(store.set).toHaveBeenCalledTimes(1);
    expect(store.set).toHaveBeenCalledWith(true);
    expect(store.remove).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'restores the previous cached value when persistence rejects (previous=%s)',
    async (previous) => {
      let cached = previous;
      let first = true;
      const store = {
        get: vi.fn(async () => cached),
        set: vi.fn(async (value: boolean) => {
          cached = value;
          if (first) {
            first = false;
            throw new Error('disk denied');
          }
        }),
        remove: vi.fn(),
      };

      await expect(setRawEngineModeTransactional(!previous, store)).resolves.toEqual({
        ok: false,
        error: 'disk denied',
      });
      expect(store.set).toHaveBeenNthCalledWith(1, !previous);
      expect(store.set).toHaveBeenNthCalledWith(2, previous);
      expect(cached).toBe(previous);
    }
  );

  it('restores absence when a first write fails', async () => {
    let cached: boolean | undefined;
    const store = {
      get: vi.fn(async () => cached),
      set: vi.fn(async (value: boolean) => {
        cached = value;
        throw new Error('disk denied');
      }),
      remove: vi.fn(async () => {
        cached = undefined;
      }),
    };

    await expect(setRawEngineModeTransactional(true, store)).resolves.toEqual({ ok: false, error: 'disk denied' });
    expect(store.remove).toHaveBeenCalledTimes(1);
    expect(cached).toBeUndefined();
  });

  it('does not mutate an unknown previous value when the initial read fails', async () => {
    const store = {
      get: vi.fn().mockRejectedValue(new Error('read denied')),
      set: vi.fn(),
      remove: vi.fn(),
    };

    await expect(setRawEngineModeTransactional(true, store)).resolves.toEqual({ ok: false, error: 'read denied' });
    expect(store.set).not.toHaveBeenCalled();
    expect(store.remove).not.toHaveBeenCalled();
  });

  it('preserves the original failure when rollback persistence also rejects', async () => {
    let cached = false;
    let writes = 0;
    const store = {
      get: vi.fn(async () => cached),
      set: vi.fn(async (value: boolean) => {
        cached = value;
        writes += 1;
        throw new Error(writes === 1 ? 'original write' : 'rollback write');
      }),
      remove: vi.fn(),
    };

    await expect(setRawEngineModeTransactional(true, store)).resolves.toEqual({ ok: false, error: 'original write' });
    expect(store.set).toHaveBeenNthCalledWith(2, false);
    expect(cached).toBe(false);
  });

  it('serializes cross-key writes through rollback failure before the sibling can persist', async () => {
    const cached = new Map<string, unknown>([
      ['wcore.rawEngineMode', false],
      ['wcore.outputBudget', { mode: 'auto' }],
    ]);
    let writes = 0;
    let rejectFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      rejectFirst = resolve;
    });
    const store = {
      get: vi.fn(async (key: string) => cached.get(key)),
      set: vi.fn(async (key: string, value: unknown) => {
        cached.set(key, value); // mirrors ProcessConfig cache mutation before disk IO
        writes += 1;
        if (writes === 1) {
          await firstGate;
          throw new Error('older write failed');
        }
        if (writes === 2) throw new Error('rollback persistence failed');
      }),
      remove: vi.fn(async (key: string) => {
        cached.delete(key);
      }),
    };
    const preferences = createSerializedPreferenceStore(store);

    const raw = preferences.set('wcore.rawEngineMode', true);
    await vi.waitFor(() => expect(store.set).toHaveBeenCalledTimes(1));
    const output = preferences.set('wcore.outputBudget', { mode: 'fixed', value: 16000 });
    expect(store.get).toHaveBeenCalledTimes(1);

    rejectFirst();
    await expect(raw).resolves.toEqual({ ok: false, error: 'older write failed' });
    await expect(output).resolves.toEqual({ ok: true });
    expect(store.set).toHaveBeenNthCalledWith(2, 'wcore.rawEngineMode', false);
    expect(store.set).toHaveBeenNthCalledWith(3, 'wcore.outputBudget', { mode: 'fixed', value: 16000 });
    expect(cached.get('wcore.rawEngineMode')).toBe(false);
    expect(cached.get('wcore.outputBudget')).toEqual({ mode: 'fixed', value: 16000 });
  });

  it('does not CAS-rollback a newer same-key value installed outside the transaction', async () => {
    let cached = false;
    const store = {
      get: vi.fn(async () => cached),
      set: vi.fn(async (value: boolean) => {
        cached = value;
        cached = false; // external successor wins before the rejection returns
        throw new Error('older write failed');
      }),
      remove: vi.fn(),
    };

    await expect(setRawEngineModeTransactional(true, store)).resolves.toEqual({
      ok: false,
      error: 'older write failed',
    });
    expect(store.set).toHaveBeenCalledTimes(1);
    expect(cached).toBe(false);
  });
});

describe('isValidOutputBudgetPreference', () => {
  it.each([{ mode: 'auto' }, { mode: 'fixed', value: MIN_FIXED_BUDGET }, { mode: 'fixed', value: MAX_FIXED_BUDGET }])(
    'accepts a valid launch budget: %j',
    (value) => expect(isValidOutputBudgetPreference(value)).toBe(true)
  );

  it.each([
    undefined,
    null,
    {},
    { mode: 'auto', value: 1000 },
    { mode: 'fixed' },
    { mode: 'fixed', value: MIN_FIXED_BUDGET - 1 },
    { mode: 'fixed', value: MAX_FIXED_BUDGET + 1 },
    { mode: 'fixed', value: 1000.5 },
    { mode: 'other', value: 1000 },
    { mode: 'auto', unexpected: true },
    { mode: 'fixed', value: 1000, unexpected: true },
    ['fixed', 1000],
  ])('rejects malformed or out-of-range launch input: %j', (value) => {
    expect(isValidOutputBudgetPreference(value)).toBe(false);
  });

  it('fails closed for accessor and hostile proxy inputs', () => {
    const accessor = Object.defineProperty({}, 'mode', { enumerable: true, get: () => 'auto' });
    const hostile = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('hostile persisted object');
        },
      }
    );
    expect(isValidOutputBudgetPreference(accessor)).toBe(false);
    expect(isValidOutputBudgetPreference(hostile)).toBe(false);
  });
});

describe('persisted runtime preference recovery', () => {
  it.each([null, 'true', 1, {}, []])('removes malformed raw mode %# and recovers to managed', async (value) => {
    const store = {
      get: vi.fn().mockResolvedValue(value),
      set: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    await expect(readRawEngineModePreference(store)).resolves.toBe(false);
    expect(store.remove).toHaveBeenCalledWith('wcore.rawEngineMode');
  });

  it('removes hostile output budget data without evaluating an accessor', async () => {
    const mode = vi.fn(() => 'auto');
    const hostile = Object.defineProperty({}, 'mode', { enumerable: true, get: mode });
    const store = {
      get: vi.fn().mockResolvedValue(hostile),
      set: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    await expect(readOutputBudgetPreference(store)).resolves.toBeUndefined();
    expect(mode).not.toHaveBeenCalled();
    expect(store.remove).toHaveBeenCalledWith('wcore.outputBudget');
  });

  it('fails closed when malformed preference removal fails', async () => {
    const store = {
      get: vi.fn().mockResolvedValue('corrupt'),
      set: vi.fn(),
      remove: vi.fn().mockRejectedValue(new Error('repair denied')),
    };
    await expect(readRawEngineModePreference(store)).rejects.toThrow('repair denied');
  });

  it('serializes recovery with a successor write so repair cannot delete the successor', async () => {
    let value: unknown = 'corrupt';
    let releaseRemove!: () => void;
    const removeGate = new Promise<void>((resolve) => {
      releaseRemove = resolve;
    });
    const store = {
      get: vi.fn(async () => value),
      set: vi.fn(async (_key: string, next: unknown) => {
        value = next;
      }),
      remove: vi.fn(async () => {
        await removeGate;
        value = undefined;
      }),
    };
    const preferences = createSerializedPreferenceStore(store);
    const recovery = readRawEngineModePreference(store);
    await vi.waitFor(() => expect(store.remove).toHaveBeenCalledTimes(1));
    const successor = preferences.set('wcore.rawEngineMode', true);
    expect(store.set).not.toHaveBeenCalled();
    releaseRemove();
    await expect(recovery).resolves.toBe(false);
    await expect(successor).resolves.toEqual({ ok: true });
    expect(value).toBe(true);
  });
});

describe('openEffectiveRuntimeFolder', () => {
  it.each([
    ['core-config' as const, RUNTIME.engineConfigDir],
    ['desktop-config' as const, RUNTIME.desktopConfigDir],
  ])('opens the recomputed authoritative %s directory', async (target, expectedPath) => {
    const deps = {
      resolveRuntime: vi.fn().mockResolvedValue(RUNTIME),
      ensureDirectory: vi.fn().mockResolvedValue(undefined),
      openPath: vi.fn().mockResolvedValue(''),
    };

    await expect(openEffectiveRuntimeFolder(target, deps)).resolves.toEqual({ ok: true });
    expect(deps.resolveRuntime).toHaveBeenCalledTimes(1);
    expect(deps.ensureDirectory).toHaveBeenCalledWith(expectedPath);
    expect(deps.openPath).toHaveBeenCalledWith(expectedPath);
  });

  it('recomputes runtime identity for every action instead of trusting a renderer snapshot', async () => {
    const second = { ...RUNTIME, engineConfigDir: '/authoritative/core-after-profile-switch' };
    const deps = {
      resolveRuntime: vi.fn().mockResolvedValueOnce(RUNTIME).mockResolvedValueOnce(second),
      ensureDirectory: vi.fn().mockResolvedValue(undefined),
      openPath: vi.fn().mockResolvedValue(''),
    };

    await openEffectiveRuntimeFolder('core-config', deps);
    await openEffectiveRuntimeFolder('core-config', deps);
    expect(deps.openPath).toHaveBeenNthCalledWith(1, RUNTIME.engineConfigDir);
    expect(deps.openPath).toHaveBeenNthCalledWith(2, second.engineConfigDir);
  });

  it('fails closed for an unknown target before resolving or opening anything', async () => {
    const deps = {
      resolveRuntime: vi.fn().mockResolvedValue(RUNTIME),
      ensureDirectory: vi.fn(),
      openPath: vi.fn(),
    };

    await expect(openEffectiveRuntimeFolder('arbitrary-path' as never, deps)).resolves.toEqual({
      ok: false,
      error: 'unknown runtime folder target',
    });
    expect(deps.resolveRuntime).not.toHaveBeenCalled();
    expect(deps.openPath).not.toHaveBeenCalled();
  });

  it('returns OS open failures for visible renderer reporting', async () => {
    const deps = {
      resolveRuntime: vi.fn().mockResolvedValue(RUNTIME),
      ensureDirectory: vi.fn().mockResolvedValue(undefined),
      openPath: vi.fn().mockResolvedValue('No application can open this path'),
    };

    await expect(openEffectiveRuntimeFolder('core-config', deps)).resolves.toEqual({
      ok: false,
      error: 'No application can open this path',
    });
  });

  it('uses one resolved snapshot while the OS open remains pending', async () => {
    let releaseOpen!: () => void;
    let authorityLocked = false;
    const openGate = new Promise<void>((resolve) => {
      releaseOpen = resolve;
    });
    const deps = {
      resolveRuntime: vi.fn(async () => {
        authorityLocked = true;
        const snapshot = RUNTIME;
        authorityLocked = false;
        return snapshot;
      }),
      ensureDirectory: vi.fn(async () => {
        expect(authorityLocked).toBe(false);
      }),
      openPath: vi.fn(async () => {
        expect(authorityLocked).toBe(false);
        await openGate;
        return '';
      }),
    };
    const opening = openEffectiveRuntimeFolder('core-config', deps);
    await vi.waitFor(() => expect(deps.openPath).toHaveBeenCalledWith(RUNTIME.engineConfigDir));
    expect(deps.resolveRuntime).toHaveBeenCalledTimes(1);
    releaseOpen();
    await expect(opening).resolves.toEqual({ ok: true });
  });
});
