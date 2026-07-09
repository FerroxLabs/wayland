import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isPackaged: vi.fn(() => true),
  appPath: { value: '' },
  dataDir: { value: '' },
  dataPath: { value: '' },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      getDataDir: () => mocks.dataDir.value,
      isPackaged: () => mocks.isPackaged(),
      getAppPath: () => mocks.appPath.value,
    },
  }),
}));

vi.mock('@process/utils', () => ({
  getDataPath: () => mocks.dataPath.value,
}));

// Must import after mocks
import { cleanupLegacyBundledExtensionCopies } from '../../../src/process/extensions/lifecycle/legacyBundledCopyCleanup';
import { EXTENSION_MANIFEST_FILE } from '../../../src/process/extensions/constants';

describe('cleanupLegacyBundledExtensionCopies (#718)', () => {
  let tmpRoot: string;
  let bundledRoot: string;
  let legacyRoot: string;

  const addBundledPack = (name: string) => {
    const dir = path.join(bundledRoot, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, EXTENSION_MANIFEST_FILE), JSON.stringify({ name }));
  };

  const addLegacyCopy = (name: string, withManifest = true) => {
    const dir = path.join(legacyRoot, name);
    mkdirSync(dir, { recursive: true });
    if (withManifest) {
      writeFileSync(path.join(dir, EXTENSION_MANIFEST_FILE), JSON.stringify({ name }));
    }
    return dir;
  };

  beforeEach(() => {
    tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'wayland-718-'));
    mocks.appPath.value = path.join(tmpRoot, 'app.asar');
    mocks.dataDir.value = path.join(tmpRoot, 'userData');
    mocks.dataPath.value = path.join(tmpRoot, 'userData', 'wayland');
    // Packaged layout: bundled packs live at <appPath>/bundled-extensions
    bundledRoot = path.join(mocks.appPath.value, 'bundled-extensions');
    legacyRoot = path.join(mocks.dataDir.value, 'extensions');
    mkdirSync(bundledRoot, { recursive: true });
    mkdirSync(legacyRoot, { recursive: true });
    mocks.isPackaged.mockReturnValue(true);
  });

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('removes stale copies of bundled packs from the legacy appdata dir', async () => {
    addBundledPack('business-commerce');
    addBundledPack('business-content');
    const staleA = addLegacyCopy('business-commerce');
    const staleB = addLegacyCopy('business-content');

    await expect(cleanupLegacyBundledExtensionCopies()).resolves.toBe(true);
    expect(existsSync(staleA)).toBe(false);
    expect(existsSync(staleB)).toBe(false);
  });

  it('leaves user-installed extensions with non-bundled names untouched', async () => {
    addBundledPack('business-commerce');
    addLegacyCopy('business-commerce');
    const userExt = addLegacyCopy('my-custom-extension');

    await expect(cleanupLegacyBundledExtensionCopies()).resolves.toBe(true);
    expect(existsSync(userExt)).toBe(true);
  });

  it('leaves same-named dirs without an extension manifest untouched', async () => {
    addBundledPack('business-commerce');
    const bareDir = addLegacyCopy('business-commerce', false);

    await expect(cleanupLegacyBundledExtensionCopies()).resolves.toBe(true);
    expect(existsSync(bareDir)).toBe(true);
  });

  it('skips symlinked pack dirs (dev/user mounts)', async () => {
    addBundledPack('business-commerce');
    const realTarget = path.join(tmpRoot, 'elsewhere', 'business-commerce');
    mkdirSync(realTarget, { recursive: true });
    writeFileSync(path.join(realTarget, EXTENSION_MANIFEST_FILE), JSON.stringify({ name: 'business-commerce' }));
    const link = path.join(legacyRoot, 'business-commerce');
    symlinkSync(realTarget, link);

    await expect(cleanupLegacyBundledExtensionCopies()).resolves.toBe(true);
    expect(existsSync(link)).toBe(true);
    expect(existsSync(realTarget)).toBe(true);
  });

  it('is a no-op in dev (the pre-#275 copy-out was packaged-only)', async () => {
    mocks.isPackaged.mockReturnValue(false);
    addBundledPack('business-commerce');
    const stale = addLegacyCopy('business-commerce');

    await expect(cleanupLegacyBundledExtensionCopies()).resolves.toBe(true);
    expect(existsSync(stale)).toBe(true);
  });

  it('returns true when the legacy extensions dir does not exist', async () => {
    rmSync(legacyRoot, { recursive: true, force: true });
    addBundledPack('business-commerce');

    await expect(cleanupLegacyBundledExtensionCopies()).resolves.toBe(true);
  });
});
