/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #818 - a settings tab's external entryPoint is rendered as remote content inside the
 * app's own settings chrome (ExtensionSettingsTabContent -> WebviewHost). Cleartext
 * `http://` there is MITM-injectable: anyone on the path serves whatever they like into
 * a surface the user reads as Wayland's own UI.
 *
 * `https://` STAYS SUPPORTED - hosted settings pages are a deliberate, documented
 * capability (SettingsTabResolver's own contract comment), and the webview that renders
 * them is already hardened (contextIsolation, sandbox, nodeIntegration=no, no preload,
 * isolated partition, postMessage bridge disabled for external tabs). Dropping remote
 * support outright would be a capability loss, not a fix.
 *
 * Loopback http is exempt: it is not MITM-able and it is how an extension author
 * develops a hosted tab locally.
 */
import { mkdtemp, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveSettingsTabs } from '../../../src/process/extensions/resolvers/SettingsTabResolver';
import type { LoadedExtension } from '../../../src/process/extensions/types';

const tempDirs: string[] = [];

async function makeExtension(entryPoint: string): Promise<LoadedExtension> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wayland-settings-tab-remote-'));
  tempDirs.push(directory);
  await writeFile(path.join(directory, 'settings.html'), '<h1>Settings</h1>');

  return {
    directory,
    source: 'local',
    manifest: {
      name: 'remote-tab-extension',
      version: '1.0.0',
      displayName: 'remote tab extension',
      contributes: {
        settingsTabs: [{ id: 'settings', name: 'Settings', entryPoint, order: 100 }],
      },
    },
  } as LoadedExtension;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('resolveSettingsTabs - remote entryPoint transport (#818)', () => {
  it('REJECTS a cleartext http:// settings tab (MITM-injectable into trusted chrome)', async () => {
    const tabs = resolveSettingsTabs([await makeExtension('http://evil.example.com/panel.html')]);
    expect(tabs).toHaveLength(0);
  });

  it('rejects cleartext http:// even when the host looks trustworthy', async () => {
    const tabs = resolveSettingsTabs([await makeExtension('http://ferroxlabs.com/panel.html')]);
    expect(tabs).toHaveLength(0);
  });

  it('KEEPS https:// hosted settings tabs (documented capability, hardened webview)', async () => {
    const tabs = resolveSettingsTabs([await makeExtension('https://ferroxlabs.com/panel.html')]);
    expect(tabs).toHaveLength(1);
    expect(tabs[0].entryUrl).toBe('https://ferroxlabs.com/panel.html');
  });

  it('exempts loopback http (not MITM-able; local dev of a hosted tab)', async () => {
    const entries = ['http://localhost:5173/panel.html', 'http://127.0.0.1:5173/panel.html'];
    const resolved = await Promise.all(entries.map(async (entry) => resolveSettingsTabs([await makeExtension(entry)])));

    resolved.forEach((tabs, i) => {
      expect(tabs).toHaveLength(1);
      expect(tabs[0].entryUrl).toBe(entries[i]);
    });
  });

  it('still resolves a local (wayland-asset://) settings tab', async () => {
    const tabs = resolveSettingsTabs([await makeExtension('settings.html')]);
    expect(tabs).toHaveLength(1);
    expect(tabs[0].entryUrl).toMatch(/^wayland-asset:\/\//);
  });
});
