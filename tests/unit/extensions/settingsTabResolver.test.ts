import { mkdtemp, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveSettingsTabs } from '../../../src/process/extensions/resolvers/SettingsTabResolver';
import type { ExtensionSource, LoadedExtension } from '../../../src/process/extensions/types';

const tempDirs: string[] = [];

async function makeExtension(source: ExtensionSource): Promise<LoadedExtension> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wayland-settings-tab-'));
  tempDirs.push(directory);
  await writeFile(path.join(directory, 'settings.html'), '<h1>Settings</h1>');

  return {
    directory,
    source,
    manifest: {
      name: `${source}-extension`,
      version: '1.0.0',
      displayName: `${source} extension`,
      contributes: {
        settingsTabs: [
          {
            id: 'settings',
            name: 'Settings',
            entryPoint: 'settings.html',
            order: 100,
          },
        ],
      },
    },
  } as LoadedExtension;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('resolveSettingsTabs', () => {
  it('resolves settings tabs for bundled first-party extensions', async () => {
    const tabs = resolveSettingsTabs([await makeExtension('bundled')]);

    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toMatchObject({
      id: 'ext-bundled-extension-settings',
      name: 'Settings',
      _extensionName: 'bundled-extension',
    });
    expect(tabs[0].entryUrl).toMatch(/^wayland-asset:\/\//);
  });

  // REGRESSION GUARD (#817). A `source === 'bundled'` gate here silently removes the
  // settings UI of every local/appdata/env extension that contributes a tab - a
  // capability that works on main. Relocating the tabs out of the settings sidebar
  // into the Extensions page is fine; dropping non-bundled sources on the way is not.
  // Assert the tabs RESOLVE, not merely that the array is non-empty.
  it('resolves settings tabs from non-bundled extensions too (local / appdata / env)', async () => {
    for (const source of ['local', 'appdata', 'env'] as const) {
      const tabs = resolveSettingsTabs([await makeExtension(source)]);

      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toMatchObject({ name: 'Settings' });
      expect(tabs[0].entryUrl).toMatch(/^wayland-asset:\/\//);
    }
  });

  it('resolves tabs from bundled and non-bundled extensions together', async () => {
    const tabs = resolveSettingsTabs([await makeExtension('bundled'), await makeExtension('local')]);

    expect(tabs).toHaveLength(2);
  });
});
