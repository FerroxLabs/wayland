/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for ijfwSystemService.startHealthWatcher() - emits not_installed
 * when the mcp-server tree disappears and shuts down the MCP client.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FSWatcher } from 'node:fs';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpHome: string;
let lastWatcherCallback: ((eventType: string, filename: string | null) => void) | null = null;
const closeSpy = vi.fn();

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.3',
    getPath: (key: string) => `/tmp/wayland-test-${key}`,
  },
}));

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    watch: vi.fn((_path: string, cb: (eventType: string, filename: string | null) => void) => {
      lastWatcherCallback = cb;
      return { close: closeSpy } as unknown as FSWatcher;
    }),
  };
});

const emitSpy = vi.fn();
vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: { onStatusChanged: { emit: (payload: unknown) => emitSpy(payload) } },
  },
}));

const applyPreludeForStatusSpy = vi.fn();
const discoverTargetsSpy = vi.fn().mockResolvedValue([]);
vi.mock('@process/services/ijfw/preludeManager', () => ({
  applyPreludeForStatus: (...args: unknown[]) => applyPreludeForStatusSpy(...args),
  discoverTargets: (dirs: unknown) => discoverTargetsSpy(dirs),
}));

// #716: getActiveProjectDirs lazily reads persisted project workspaces.
// Mocked so unit tests never open a real SQLite database.
vi.mock('@process/services/database/SqliteProjectRepository', () => ({
  SqliteProjectRepository: class {
    listProjects() {
      return Promise.resolve([]);
    }
  },
}));

const mcpShutdownSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('@process/services/ijfw/ijfwMcpClient', () => ({
  ijfwMcpClient: {
    shutdown: () => mcpShutdownSpy(),
    waitForExit: async () => true,
    getMode: () => 'degraded',
    invoke: () => Promise.resolve({ ok: false, errorReason: 'unavailable' }),
  },
}));

// eslint-disable-next-line import/first
import { ijfwSystemService } from '@process/services/ijfwSystemService';

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('ijfwSystemService.startHealthWatcher', () => {
  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-health-'));
    fs.mkdirSync(path.join(tmpHome, '.ijfw'), { recursive: true });
    lastWatcherCallback = null;
    closeSpy.mockClear();
    emitSpy.mockClear();
    applyPreludeForStatusSpy.mockReset();
    discoverTargetsSpy.mockReset().mockResolvedValue([]);
    mcpShutdownSpy.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('returns a disposer function', () => {
    const dispose = ijfwSystemService.startHealthWatcher();
    expect(typeof dispose).toBe('function');
    dispose();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('emits not_installed when mcp-server disappears', async () => {
    fs.mkdirSync(path.join(tmpHome, '.ijfw', 'mcp-server'), { recursive: true });
    const dispose = ijfwSystemService.startHealthWatcher();
    // simulate disappearance
    fs.rmSync(path.join(tmpHome, '.ijfw', 'mcp-server'), { recursive: true, force: true });
    lastWatcherCallback!('rename', 'mcp-server');
    for (let i = 0; i < 5; i++) await flush();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'not_installed', reason: 'install_removed' })
    );
    expect(mcpShutdownSpy).toHaveBeenCalled();
    dispose();
  });

  it('does not re-emit not_installed for repeated absent events (debounce)', async () => {
    const dispose = ijfwSystemService.startHealthWatcher();
    // first absent event
    lastWatcherCallback!('rename', 'mcp-server');
    lastWatcherCallback!('rename', 'mcp-server');
    lastWatcherCallback!('rename', 'mcp-server');
    for (let i = 0; i < 5; i++) await flush();
    expect(
      emitSpy.mock.calls.filter((c) => (c[0] as { status: string }).status === 'not_installed').length
    ).toBeLessThanOrEqual(1);
    dispose();
  });
});
