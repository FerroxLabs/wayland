/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1042 F1 and F2: neither backup provider may ever REJECT.
 *
 * The IPC bridge has no error channel. `buildProvider(...).provider(fn)` calls
 * `fn(data).then(emitCallback)` with no `.catch`, and the matching `invoke` is a
 * `new Promise(resolve)` with no reject and no timeout. Executed against the real
 * `@office-ai/platform` bridge with a loopback adapter, and with a resolving
 * provider established first as the known positive:
 *
 *   known-positive  probe:ok        -> {"settled":"resolved","value":{...}}
 *   UNHANDLED REJECTION IN PROVIDER: bad decrypt
 *   throwing        probe:throws    -> {"settled":"PENDING FOREVER (timed out)"}
 *   classified-fail probe:classified-> {"settled":"resolved","value":{"ok":false,...}}
 *
 * So a throwing provider is not a reported error, it is a panel that stops
 * responding for the rest of the session with nothing said. A mistyped backup
 * passphrase reached that in one keystroke, and ticking "include API keys" with
 * an empty passphrase reached it in one click.
 *
 * This drives the registered provider functions directly and asserts they RESOLVE
 * a classified failure. That is the invariant: the bridge cannot be made to carry
 * a rejection, so the provider must not produce one.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

type Handler = (params: unknown) => Promise<unknown>;
const handlers = new Map<string, Handler>();

vi.mock('@office-ai/platform', () => ({
  bridge: {
    buildProvider: (key: string) => ({
      provider: (handler: Handler) => {
        handlers.set(key, handler);
        return vi.fn();
      },
      invoke: vi.fn(),
    }),
    buildEmitter: () => ({ emit: vi.fn(), on: vi.fn() }),
  },
  storage: {
    buildStorage: () => ({
      getSync: () => undefined,
      setSync: () => {},
      get: () => Promise.resolve(undefined),
      set: () => Promise.resolve(),
    }),
  },
}));

const showOpenDialog = vi.fn();
const showSaveDialog = vi.fn();
vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/unused-by-these-tests'), relaunch: vi.fn(), quit: vi.fn() },
  dialog: {
    showOpenDialog: (...a: unknown[]) => showOpenDialog(...a),
    showSaveDialog: (...a: unknown[]) => showSaveDialog(...a),
  },
  shell: { openPath: vi.fn() },
}));

// A scratch userData, asserted below to sit inside the OS temp dir. This code
// deletes and replaces whole directories, so it must never see a real profile.
let userData = '';
vi.mock('../../../../src/process/storage/storageLocations', () => ({
  getUserDataDir: () => userData,
  getLogsDir: () => path.join(userData, 'logs'),
  getStorageDirs: () => ({ workspace: userData, cache: userData, logs: userData }),
  clearStorageDir: vi.fn(),
}));

// The safety export writes into a recovery directory; not what these tests cover.
vi.mock('../../../../src/process/storage/legacySafetyExport', () => ({
  createLegacySafetyExport: vi.fn(() => Promise.resolve('/tmp/safety.zip')),
}));

const { initStorageBridge } = await import('../../../../src/process/storage/storageIpc');
const { backupExport } = await import('../../../../src/process/storage/backupExport');

describe('storage backup providers never reject (#1042 F1, F2)', () => {
  let scratch = '';
  let archive = '';

  beforeEach(() => {
    vi.clearAllMocks();
    handlers.clear();
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-ipc-test-'));
    expect(fs.realpathSync(scratch).startsWith(fs.realpathSync(os.tmpdir()))).toBe(true);
    userData = path.join(scratch, 'userData');
    fs.mkdirSync(userData, { recursive: true });
    archive = path.join(scratch, 'legacy.zip');
    initStorageBridge();
  });

  const provider = (key: string): Handler => {
    const handler = handlers.get(key);
    // Known positive for the harness: without this the assertions below would be
    // vacuously true against an undefined handler.
    expect(handler, `provider ${key} was never registered`).toBeTypeOf('function');
    return handler as Handler;
  };

  it('resolves BAD_PASSPHRASE instead of rejecting when the passphrase is wrong', async () => {
    const src = path.join(scratch, 'src');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'keys.json'), '{"openai":"sk-test"}');
    await backupExport({ userData: src, destPath: archive, includeKeys: true, passphrase: 'right-one' });
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [archive] });

    await expect(provider('storage:importBackup')({ passphrase: 'WRONG-ONE' })).resolves.toEqual({
      ok: false,
      failed: true,
      errorCode: 'BAD_PASSPHRASE',
    });

    fs.rmSync(scratch, { recursive: true, force: true });
  });

  it('resolves BACKUP_FAILED instead of rejecting when the archive is not a backup', async () => {
    fs.writeFileSync(archive, 'not a zip at all');
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [archive] });

    const result = (await provider('storage:importBackup')({})) as { ok: boolean; errorCode?: string };
    expect(result).toEqual({ ok: false, failed: true, errorCode: 'BACKUP_FAILED' });

    fs.rmSync(scratch, { recursive: true, force: true });
  });

  it('still reports a cancelled file picker as a silent ok:false', async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
    // No `failed`, so the renderer stays silent. That distinction is the whole
    // reason `failed` exists.
    await expect(provider('storage:importBackup')({})).resolves.toEqual({ ok: false });
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  it('resolves PASSPHRASE_REQUIRED instead of rejecting on a keys export with no passphrase', async () => {
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: path.join(scratch, 'out.zip') });

    await expect(provider('storage:exportAll')({ includeKeys: true, passphrase: '' })).resolves.toEqual({
      ok: false,
      failed: true,
      errorCode: 'PASSPHRASE_REQUIRED',
    });

    fs.rmSync(scratch, { recursive: true, force: true });
  });

  it('still reports a cancelled save dialog as a silent ok:false', async () => {
    showSaveDialog.mockResolvedValue({ canceled: true, filePath: undefined });
    await expect(provider('storage:exportAll')({ includeKeys: false })).resolves.toEqual({ ok: false });
    fs.rmSync(scratch, { recursive: true, force: true });
  });
});
