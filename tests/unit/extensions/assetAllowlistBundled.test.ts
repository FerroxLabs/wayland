/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock platform services so getBundledExtensionsDir() resolves to a known dir.
// `appRoot` is rewritten per-test to point at a real tmp dir on disk, because
// buildAssetAllowlist() walks each root for symlinked children.
const mocks = vi.hoisted(() => ({
  appRoot: '',
  dataDir: '',
  dataPath: '',
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      getDataDir: () => mocks.dataDir,
      // Non-packaged so getHubResourcesDir/getVoiceModelsDir resolve via cwd
      // (process.resourcesPath is undefined under vitest). The bundled dir then
      // resolves to <appRoot>/resources/bundled-extensions.
      isPackaged: () => false,
      getAppPath: () => mocks.appRoot,
    },
  }),
}));

vi.mock('@process/utils', () => ({
  getDataPath: () => mocks.dataPath,
}));

// Import after mocks so the mocked platform services are wired in.
import { buildAssetAllowlist, resolveAllowedAssetPath } from '../../../src/process/extensions/protocol/assetAllowlist';
import { WAYLAND_EXTENSIONS_PATH_ENV } from '../../../src/process/extensions/constants';

describe('extensions/protocol/assetAllowlist - bundled (asar) dir', () => {
  let tempDir = '';
  let bundledDir = '';
  const originalEnv = process.env[WAYLAND_EXTENSIONS_PATH_ENV];

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-asset-bundled-'));
    mocks.appRoot = path.join(tempDir, 'app-root');
    mocks.dataDir = path.join(tempDir, 'appdata');
    mocks.dataPath = path.join(tempDir, 'user-data');
    // Non-packaged bundled extensions resolve to <appRoot>/resources/bundled-extensions.
    bundledDir = path.join(mocks.appRoot, 'resources', 'bundled-extensions');
    await fs.mkdir(bundledDir, { recursive: true });
    // Avoid the real WAYLAND_EXTENSIONS_PATH leaking into the allowlist.
    delete process.env[WAYLAND_EXTENSIONS_PATH_ENV];
  });

  afterEach(async () => {
    if (originalEnv === undefined) {
      delete process.env[WAYLAND_EXTENSIONS_PATH_ENV];
    } else {
      process.env[WAYLAND_EXTENSIONS_PATH_ENV] = originalEnv;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('includes the bundled-extensions (asar) dir in the allowlist', () => {
    const allowlist = buildAssetAllowlist();
    expect(allowlist).toContain(path.resolve(bundledDir));
  });

  it('serves a packed business-pack asset under the bundled dir (no 403)', async () => {
    const icon = path.join(bundledDir, 'business-conversion', 'icons', 'dr-strategist.svg');
    await fs.mkdir(path.dirname(icon), { recursive: true });
    await fs.writeFile(icon, '<svg/>', 'utf-8');
    expect(resolveAllowedAssetPath(icon)).toBe(path.resolve(icon));
  });

  it('still rejects a path outside every allowlisted root', async () => {
    const outside = path.join(tempDir, 'outside', 'secret.txt');
    await fs.mkdir(path.dirname(outside), { recursive: true });
    await fs.writeFile(outside, 'secret', 'utf-8');
    expect(resolveAllowedAssetPath(outside)).toBeNull();
  });
});
