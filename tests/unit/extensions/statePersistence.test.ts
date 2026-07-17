import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadPersistedStates,
  savePersistedStates,
  markExtensionForReinstall,
} from '../../../src/process/extensions/lifecycle/statePersistence';

const originalEnv = { ...process.env };
const tempRoots: string[] = [];

function createTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(dir);
  return dir;
}

async function waitForCondition(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs: number = 3000,
  intervalMs: number = 50
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Timed out waiting for persisted extension state');
}

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };

  for (const root of tempRoots.splice(0, tempRoots.length)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('extensions/statePersistence', () => {
  it('reads and writes extension states from WAYLAND_EXTENSION_STATES_FILE when provided', async () => {
    const sandbox = createTempDir('wayland-state-');
    const statesFile = path.join(sandbox, 'isolated', 'extension-states.json');
    process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

    const disabledAt = new Date('2026-03-08T00:00:00.000Z');
    const states = new Map<
      string,
      { enabled: boolean; disabledAt?: Date; disabledReason?: string; installed?: boolean; lastVersion?: string }
    >([
      [
        'ext-feishu',
        {
          enabled: false,
          disabledAt,
          disabledReason: 'review-test',
          installed: true,
          lastVersion: '1.2.3',
        },
      ],
    ]);

    savePersistedStates(states);
    await waitForCondition(() => fs.existsSync(statesFile));

    expect(fs.existsSync(statesFile)).toBe(true);

    const loaded = await loadPersistedStates();
    expect(loaded.get('ext-feishu')).toEqual({
      enabled: false,
      disabledAt,
      disabledReason: 'review-test',
      installed: true,
      lastVersion: '1.2.3',
    });
  });

  it('loadPersistedStates returns empty map without warning when file does not exist (ENOENT)', async () => {
    const sandbox = createTempDir('wayland-enoent-');
    const statesFile = path.join(sandbox, 'nonexistent', 'extension-states.json');
    process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const loaded = await loadPersistedStates();
    expect(loaded.size).toBe(0);

    // ENOENT should NOT produce a console.warn
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('loadPersistedStates warns for non-ENOENT errors', async () => {
    const sandbox = createTempDir('wayland-bad-json-');
    const statesFile = path.join(sandbox, 'extension-states.json');
    process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

    // Write invalid JSON
    fs.writeFileSync(statesFile, '{{{invalid json', 'utf-8');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const loaded = await loadPersistedStates();
    expect(loaded.size).toBe(0);

    // Should warn because it's a parse error, not ENOENT
    expect(warnSpy).toHaveBeenCalledWith('[Extensions] Failed to load persisted states:', expect.any(String));

    warnSpy.mockRestore();
  });

  it('savePersistedStates debounces rapid writes', async () => {
    const sandbox = createTempDir('wayland-debounce-');
    const statesFile = path.join(sandbox, 'extension-states.json');
    process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

    // Save three times rapidly
    const states1 = new Map([['ext-a', { enabled: true }]]) as any;
    const states2 = new Map([['ext-b', { enabled: false }]]) as any;
    const states3 = new Map([['ext-c', { enabled: true }]]) as any;

    savePersistedStates(states1);
    savePersistedStates(states2);
    savePersistedStates(states3);

    // Wait for debounce to flush
    await waitForCondition(async () => {
      const loaded = await loadPersistedStates();
      return loaded.has('ext-c');
    });

    // Only the last save should persist
    const loaded = await loadPersistedStates();
    expect(loaded.has('ext-c')).toBe(true);
    expect(loaded.has('ext-a')).toBe(false);
    expect(loaded.has('ext-b')).toBe(false);
  });

  describe('markExtensionForReinstall', () => {
    it('retries a transient Windows rename failure without losing the previous state', async () => {
      const sandbox = createTempDir('wayland-rename-retry-');
      const statesFile = path.join(sandbox, 'extension-states.json');
      process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

      savePersistedStates(new Map([['ext-retry', { enabled: true, installed: true }]]));
      await waitForCondition(() => fs.existsSync(statesFile));

      const originalRename = fs.promises.rename.bind(fs.promises);
      let renameAttempts = 0;
      const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
        renameAttempts += 1;
        if (renameAttempts === 1) {
          throw Object.assign(new Error('destination temporarily locked'), { code: 'EPERM' });
        }
        await originalRename(oldPath, newPath);
      });

      savePersistedStates(new Map([['ext-retry', { enabled: false, installed: true }]]));
      await waitForCondition(async () => (await loadPersistedStates()).get('ext-retry')?.enabled === false);

      expect(renameSpy).toHaveBeenCalledTimes(2);
      expect((await loadPersistedStates()).get('ext-retry')?.enabled).toBe(false);
    });

    it('serializes overlapping retries so an older save cannot overwrite newer state', async () => {
      const sandbox = createTempDir('wayland-rename-order-');
      const statesFile = path.join(sandbox, 'extension-states.json');
      process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

      savePersistedStates(
        new Map([['ext-order', { enabled: true, installed: true, disabledReason: 'initial-state' }]])
      );
      await waitForCondition(() => fs.existsSync(statesFile));

      const originalRename = fs.promises.rename.bind(fs.promises);
      let olderAttempts = 0;
      let resolveOlder!: () => void;
      let resolveNewer!: () => void;
      const olderDone = new Promise<void>((resolve) => {
        resolveOlder = resolve;
      });
      const newerDone = new Promise<void>((resolve) => {
        resolveNewer = resolve;
      });

      vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
        const body = JSON.parse(await fs.promises.readFile(oldPath, 'utf-8')) as {
          extensions: Record<string, { disabledReason?: string }>;
        };
        const reason = body.extensions['ext-order']?.disabledReason;
        if (reason === 'older-delayed') {
          olderAttempts += 1;
          if (olderAttempts <= 5) {
            throw Object.assign(new Error('destination temporarily locked'), { code: 'EPERM' });
          }
          await originalRename(oldPath, newPath);
          resolveOlder();
          return;
        }

        await originalRename(oldPath, newPath);
        if (reason === 'newer-final') resolveNewer();
      });

      savePersistedStates(
        new Map([['ext-order', { enabled: false, installed: true, disabledReason: 'older-delayed' }]])
      );
      await waitForCondition(() => olderAttempts > 0);
      expect((await loadPersistedStates()).get('ext-order')?.disabledReason).toBe('initial-state');

      savePersistedStates(new Map([['ext-order', { enabled: true, installed: true, disabledReason: 'newer-final' }]]));
      await Promise.all([olderDone, newerDone]);

      expect((await loadPersistedStates()).get('ext-order')?.disabledReason).toBe('newer-final');
    });

    it('preserves the prior file and removes its temp file after retry exhaustion', async () => {
      const sandbox = createTempDir('wayland-rename-exhausted-');
      const statesFile = path.join(sandbox, 'extension-states.json');
      process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

      savePersistedStates(
        new Map([['ext-exhausted', { enabled: true, installed: true, disabledReason: 'prior-state' }]])
      );
      await waitForCondition(() => fs.existsSync(statesFile));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const renameSpy = vi
        .spyOn(fs.promises, 'rename')
        .mockRejectedValue(Object.assign(new Error('destination remains locked'), { code: 'EPERM' }));

      savePersistedStates(
        new Map([['ext-exhausted', { enabled: false, installed: true, disabledReason: 'must-not-land' }]])
      );
      await waitForCondition(() => errorSpy.mock.calls.some(([message]) => String(message).includes('Failed to save')));

      expect(renameSpy).toHaveBeenCalledTimes(6);
      expect((await loadPersistedStates()).get('ext-exhausted')?.disabledReason).toBe('prior-state');
      expect(fs.readdirSync(sandbox).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    });

    it('should set installed to false for an existing extension', async () => {
      const sandbox = createTempDir('wayland-reinstall-');
      const statesFile = path.join(sandbox, 'extension-states.json');
      process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

      const states = new Map([['ext-claude', { enabled: true, installed: true, lastVersion: '1.0.0' }]]);
      savePersistedStates(states);
      await waitForCondition(() => fs.existsSync(statesFile));

      await markExtensionForReinstall('ext-claude');
      await waitForCondition(async () => (await loadPersistedStates()).get('ext-claude')?.installed === false);

      const loaded = await loadPersistedStates();
      expect(loaded.get('ext-claude')?.installed).toBe(false);
      // Other fields should be preserved
      expect(loaded.get('ext-claude')?.enabled).toBe(true);
      expect(loaded.get('ext-claude')?.lastVersion).toBe('1.0.0');
    });

    it('should be a no-op for an unknown extension', async () => {
      const sandbox = createTempDir('wayland-reinstall-noop-');
      const statesFile = path.join(sandbox, 'extension-states.json');
      process.env.WAYLAND_EXTENSION_STATES_FILE = statesFile;

      const states = new Map([['ext-other', { enabled: true, installed: true }]]);
      savePersistedStates(states);
      await waitForCondition(() => fs.existsSync(statesFile));

      await markExtensionForReinstall('ext-nonexistent');
      await waitForCondition(async () => (await loadPersistedStates()).get('ext-other')?.installed === true);

      const loaded = await loadPersistedStates();
      // ext-other should be unchanged
      expect(loaded.get('ext-other')?.installed).toBe(true);
      // ext-nonexistent should not exist
      expect(loaded.has('ext-nonexistent')).toBe(false);
    });
  });
});
