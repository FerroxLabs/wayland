/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #824 - the sibling of #818/#823. A workspace-panel / file-preview-action external
 * `entryPoint` resolves through `NativeHookResolver.resolveEntryUrl` into
 * `entryUrl`, a document surface destined for a webview/iframe. That resolver
 * accepted any `http(s)://` verbatim with NO loopback guard - the same cleartext
 * MITM shape #823 closed for settings tabs, left open here. The guard now lives in
 * the SHARED `resolveExternalEntryUrl`, so both surfaces reject cleartext http to a
 * non-loopback host while keeping https and loopback-http (local dev).
 */
import { mkdtemp, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  resolveWorkspacePanels,
  resolveFilePreviewActions,
} from '../../../src/process/extensions/resolvers/NativeHookResolver';
import type { LoadedExtension } from '../../../src/process/extensions/types';

const tempDirs: string[] = [];

async function makeExtension(entryPoint: string): Promise<LoadedExtension> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wayland-native-hook-remote-'));
  tempDirs.push(directory);
  await writeFile(path.join(directory, 'panel.html'), '<h1>Panel</h1>');

  return {
    directory,
    source: 'local',
    manifest: {
      name: 'remote-hook-extension',
      version: '1.0.0',
      displayName: 'remote hook extension',
      contributes: {
        workspacePanels: [{ id: 'panel', name: 'Panel', entryPoint, order: 100 }],
        filePreviewActions: [{ id: 'preview', name: 'Preview', entryPoint, order: 100 }],
      },
    },
  } as LoadedExtension;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('NativeHookResolver - remote entryPoint transport (#824)', () => {
  it('REJECTS a cleartext http:// workspace panel (was accepted before the shared gate)', async () => {
    const panels = resolveWorkspacePanels([await makeExtension('http://evil.example.com/panel.html')]);
    expect(panels).toHaveLength(0);
  });

  it('REJECTS a cleartext http:// file preview action', async () => {
    const actions = resolveFilePreviewActions([await makeExtension('http://evil.example.com/panel.html')]);
    expect(actions).toHaveLength(0);
  });

  it('rejects cleartext http:// even when the host looks trustworthy', async () => {
    const ext = await makeExtension('http://ferroxlabs.com/panel.html');
    expect(resolveWorkspacePanels([ext])).toHaveLength(0);
    expect(resolveFilePreviewActions([ext])).toHaveLength(0);
  });

  it('KEEPS https:// hosted panels/actions (documented capability)', async () => {
    const ext = await makeExtension('https://ferroxlabs.com/panel.html');
    const panels = resolveWorkspacePanels([ext]);
    const actions = resolveFilePreviewActions([ext]);
    expect(panels).toHaveLength(1);
    expect(panels[0].entryUrl).toBe('https://ferroxlabs.com/panel.html');
    expect(actions).toHaveLength(1);
    expect(actions[0].entryUrl).toBe('https://ferroxlabs.com/panel.html');
  });

  it('exempts loopback http (not MITM-able; local dev of a hosted panel)', async () => {
    for (const entry of ['http://localhost:5173/panel.html', 'http://127.0.0.1:5173/panel.html']) {
      const ext = await makeExtension(entry);
      const panels = resolveWorkspacePanels([ext]);
      expect(panels).toHaveLength(1);
      expect(panels[0].entryUrl).toBe(entry);
    }
  });

  it('still resolves a local (wayland-asset://) workspace panel', async () => {
    const panels = resolveWorkspacePanels([await makeExtension('panel.html')]);
    expect(panels).toHaveLength(1);
    expect(panels[0].entryUrl).toMatch(/^wayland-asset:\/\//);
  });

  it('a file preview action with NO entryPoint still resolves (entryPoint is optional)', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'wayland-native-hook-noentry-'));
    tempDirs.push(directory);
    const ext = {
      directory,
      source: 'local',
      manifest: {
        name: 'no-entry-extension',
        version: '1.0.0',
        displayName: 'no entry',
        contributes: {
          filePreviewActions: [{ id: 'promptonly', name: 'Prompt Only', promptTemplate: 'summarize', order: 100 }],
        },
      },
    } as LoadedExtension;
    expect(resolveFilePreviewActions([ext])).toHaveLength(1);
  });
});
