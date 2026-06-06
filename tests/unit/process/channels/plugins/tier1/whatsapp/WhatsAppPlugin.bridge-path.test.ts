/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verifies WhatsAppPlugin.resolveBridgeEntryPath() picks the right location
 * for dev vs packaged Electron builds. Regression guard for the production
 * ENOENT we hit when the bridge wasn't bundled into the app at all (v0.2.0).
 *
 * Packaged: bridge ships under <process.resourcesPath>/whatsapp-bridge/
 *           via electron-builder extraResources, so the fork path must point
 *           there - anything inside app.asar throws ENOENT for fork().
 * Dev:     bridge lives in the source tree relative to this file's compiled
 *           location; resolution must end with whatsapp-bridge/bridge.js.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';

// `electron` is mocked per-test via vi.doMock so we can flip `isPackaged`
// without re-importing or re-running the whole module graph.
// `existsSimulator` lets each test decide which candidate paths "exist" so
// resolveBridgeEntryPath's first-existing-wins loop can be exercised.
const { isPackagedRef, existsSimulator } = vi.hoisted(() => ({
  isPackagedRef: { value: false },
  existsSimulator: { fn: (_p: string): boolean => true },
}));

vi.mock('electron', () => ({
  app: {
    get isPackaged() {
      return isPackagedRef.value;
    },
    getAppPath: () => '/test/app',
  },
}));

// child_process is unused by resolveBridgeEntryPath but the module imports it
// at top-level. Stub so vitest does not pull in the real implementation.
vi.mock('child_process', () => ({
  fork: vi.fn(),
  ChildProcess: class {},
}));

// fs.existsSync gates the candidate path loop in dev mode. Default to true so
// the first candidate (source-tree path) wins unless a test overrides.
vi.mock('fs', () => ({
  default: {
    existsSync: (p: string) => existsSimulator.fn(p),
  },
  existsSync: (p: string) => existsSimulator.fn(p),
}));

// resolveBridgeEntryPath builds paths with path.join (packaged) and
// path.resolve (dev candidates), which emit native separators - and on win32
// path.resolve also prefixes the cwd drive letter. Every expectation below is
// built with the SAME primitive prod uses (path.join vs path.resolve), so the
// assertions are platform-correct by construction and this block runs on
// windows as well as posix - no skip.
describe('WhatsAppPlugin.resolveBridgeEntryPath', () => {
  const originalResourcesPath = process.resourcesPath;

  beforeEach(() => {
    vi.resetModules();
    isPackagedRef.value = false;
    existsSimulator.fn = () => true;
    Object.defineProperty(process, 'resourcesPath', {
      value: '/test/resources',
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(process, 'resourcesPath', {
      value: originalResourcesPath,
      configurable: true,
      writable: true,
    });
  });

  it('resolves to <process.resourcesPath>/whatsapp-bridge/bridge.js when packaged', async () => {
    isPackagedRef.value = true;
    const mod = await import('@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin');
    const resolved = mod.resolveBridgeEntryPath();
    expect(resolved).toBe(path.join('/test/resources', 'whatsapp-bridge', 'bridge.js'));
  });

  it('resolves to the source-tree path in dev (isPackaged=false)', async () => {
    isPackagedRef.value = false;
    const mod = await import('@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin');
    const resolved = mod.resolveBridgeEntryPath();
    expect(resolved.endsWith(path.join('whatsapp-bridge', 'bridge.js'))).toBe(true);
    expect(resolved).not.toContain(path.join('/test/resources'));
    // Walks up from the WhatsAppPlugin source location; must contain the
    // channels segment somewhere upstream.
    expect(resolved).toContain('whatsapp-bridge');
  });

  it('falls back to app.getAppPath() candidate when source-tree path missing (electron-vite layout)', async () => {
    isPackagedRef.value = false;
    // Simulate electron-vite output: only the app.getAppPath()-based candidate
    // exists on disk; the source-tree __dirname walk lands on a non-existent
    // path because runtime __dirname is out/main/.
    const candidate2 = path.resolve('/test/app', 'src/process/channels/whatsapp-bridge/bridge.js');
    existsSimulator.fn = (p: string) => p === candidate2;
    const mod = await import('@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin');
    const resolved = mod.resolveBridgeEntryPath();
    expect(resolved).toBe(candidate2);
  });
});
