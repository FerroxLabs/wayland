/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verifies the waylandteams catalog ships and loads as a NATIVE built-in -
 * the regression that left packaged builds with 0 teams. Unlike
 * teamsBundleSmoke (which only runs when the dev symlink is mounted and loads
 * via the `env` source), this exercises the `builtin` scan source against the
 * committed resources/builtin-extensions tree, so it runs in CI with no mount.
 */
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  WAYLAND_EXTENSIONS_PATH_ENV,
  getBuiltinExtensionsDir,
  getExtensionScanSources,
} from '@process/extensions/constants';
import { buildAssetAllowlist } from '@process/extensions/protocol/assetAllowlist';

const REPO_BUILTIN_DIR = path.resolve(process.cwd(), 'resources/builtin-extensions');
const BUNDLE_NAME = 'waylandteams-specialist-bundle';

const originalEnv = process.env[WAYLAND_EXTENSIONS_PATH_ENV];
const originalE2E = process.env.WAYLAND_E2E_TEST;

function restore(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe('builtin waylandteams bundle - ships + loads natively', () => {
  afterEach(() => {
    restore(WAYLAND_EXTENSIONS_PATH_ENV, originalEnv);
    restore('WAYLAND_E2E_TEST', originalE2E);
  });

  it('registers a lowest-priority builtin scan source at resources/builtin-extensions', () => {
    delete process.env[WAYLAND_EXTENSIONS_PATH_ENV];
    delete process.env.WAYLAND_E2E_TEST;

    const sources = getExtensionScanSources();
    const builtin = sources.find((s) => s.source === 'builtin');
    expect(builtin, 'a builtin scan source must exist').toBeDefined();
    expect(builtin!.dir).toBe(getBuiltinExtensionsDir());
    // Must be last so a dev symlink / installed copy with the same extension
    // name wins via ExtensionLoader name-dedup (first occurrence kept).
    expect(sources[sources.length - 1].source).toBe('builtin');
  });

  it('omits the builtin source under E2E hermetic mode', () => {
    process.env.WAYLAND_E2E_TEST = '1';
    const sources = getExtensionScanSources();
    expect(sources.find((s) => s.source === 'builtin')).toBeUndefined();
  });

  it('includes the builtin dir in the wayland-asset allowlist (icons resolve)', () => {
    delete process.env.WAYLAND_E2E_TEST;
    expect(buildAssetAllowlist()).toContain(getBuiltinExtensionsDir());
  });

  it('loads the shipped tree and resolves all 88 records with context + icons', async () => {
    // Point the env source at the real committed tree so the assertion is
    // hermetic (independent of the user's local extension dirs).
    process.env[WAYLAND_EXTENSIONS_PATH_ENV] = REPO_BUILTIN_DIR;
    delete process.env.WAYLAND_E2E_TEST;

    const { ExtensionLoader } = await import('@process/extensions/ExtensionLoader');
    const { resolveAssistants } = await import('@process/extensions/resolvers/AssistantResolver');

    const loader = new ExtensionLoader();
    const exts = await loader.loadAll();
    const bundle = exts.find((e) => e.manifest.name === BUNDLE_NAME);
    expect(bundle, 'shipped builtin tree must load + pass schema validation').toBeDefined();
    expect(bundle!.manifest.contributes.assistants!.length).toBe(88);

    const resolved = await resolveAssistants([bundle!]);
    expect(resolved.length).toBe(88);
    expect(resolved.filter((a) => a._kind === 'team').length).toBe(60);
    expect(resolved.filter((a) => a._kind === 'specialist').length).toBe(28);

    for (const a of resolved) {
      expect(typeof a.context === 'string' && (a.context as string).length > 0).toBe(true);
      expect(String(a.avatar).startsWith('wayland-asset://')).toBe(true);
    }
  });

  it('lets a higher-priority same-named copy override the builtin (dev symlink wins)', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-builtin-override-'));
    try {
      const stubDir = path.join(tmp, BUNDLE_NAME);
      await fs.mkdir(stubDir, { recursive: true });
      await fs.writeFile(
        path.join(stubDir, 'aion-extension.json'),
        JSON.stringify({
          name: BUNDLE_NAME,
          displayName: 'Override Stub',
          version: '9.9.9',
          contributes: { assistants: [] },
        })
      );
      process.env[WAYLAND_EXTENSIONS_PATH_ENV] = tmp;
      delete process.env.WAYLAND_E2E_TEST;

      const { ExtensionLoader } = await import('@process/extensions/ExtensionLoader');
      const loader = new ExtensionLoader();
      const exts = await loader.loadAll();
      const bundle = exts.find((e) => e.manifest.name === BUNDLE_NAME)!;

      // env source (priority 0) must override the builtin copy by name-dedup.
      expect(bundle.source).toBe('env');
      expect(bundle.manifest.version).toBe('9.9.9');
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
