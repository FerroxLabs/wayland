/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  buildAssetAllowlist,
  resolveAllowedAssetPath,
} from '../../../src/process/extensions/protocol/assetAllowlist';
import { WAYLAND_EXTENSIONS_PATH_ENV } from '../../../src/process/extensions/constants';

describe('extensions/protocol/assetAllowlist', () => {
  let tempDir = '';
  let envRoot = '';
  const originalEnv = process.env[WAYLAND_EXTENSIONS_PATH_ENV];

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-asset-allowlist-'));
    envRoot = path.join(tempDir, 'allowed-ext');
    await fs.mkdir(envRoot, { recursive: true });
    process.env[WAYLAND_EXTENSIONS_PATH_ENV] = envRoot;
  });

  afterEach(async () => {
    if (originalEnv === undefined) {
      delete process.env[WAYLAND_EXTENSIONS_PATH_ENV];
    } else {
      process.env[WAYLAND_EXTENSIONS_PATH_ENV] = originalEnv;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('includes the env-configured extension directory in the allowlist', () => {
    const allowlist = buildAssetAllowlist();
    expect(allowlist).toContain(path.resolve(envRoot));
  });

  it('allows files inside an allowlisted extension directory', async () => {
    const file = path.join(envRoot, 'icon.svg');
    await fs.writeFile(file, '<svg/>', 'utf-8');
    const resolved = resolveAllowedAssetPath(file);
    expect(resolved).toBe(path.resolve(file));
  });

  it('allows nested files inside an allowlisted extension directory', async () => {
    const nested = path.join(envRoot, 'pkg-a', 'assets', 'logo.png');
    await fs.mkdir(path.dirname(nested), { recursive: true });
    await fs.writeFile(nested, 'fake-png', 'utf-8');
    expect(resolveAllowedAssetPath(nested)).toBe(path.resolve(nested));
  });

  it('rejects /etc/passwd (the canonical arbitrary-read attack)', () => {
    expect(resolveAllowedAssetPath('/etc/passwd')).toBeNull();
  });

  it('rejects absolute paths outside any allowlisted root', async () => {
    const outside = path.join(tempDir, 'outside', 'secret.txt');
    await fs.mkdir(path.dirname(outside), { recursive: true });
    await fs.writeFile(outside, 'secret', 'utf-8');
    expect(resolveAllowedAssetPath(outside)).toBeNull();
  });

  it('rejects path-traversal that escapes an allowlisted root via ..', async () => {
    const outside = path.join(tempDir, 'outside.txt');
    await fs.writeFile(outside, 'secret', 'utf-8');
    const traversal = path.join(envRoot, '..', 'outside.txt');
    expect(resolveAllowedAssetPath(traversal)).toBeNull();
  });

  it('rejects symlink escapes out of an allowlisted root', async () => {
    const outsideDir = path.join(tempDir, 'outside-sym');
    const outsideFile = path.join(outsideDir, 'secret.txt');
    await fs.mkdir(outsideDir, { recursive: true });
    await fs.writeFile(outsideFile, 'secret', 'utf-8');
    const linkPath = path.join(envRoot, 'linked');
    await fs.symlink(outsideDir, linkPath, 'dir');
    expect(resolveAllowedAssetPath(path.join(linkPath, 'secret.txt'))).toBeNull();
  });

  it('rejects prefix-attack siblings of an allowlisted root', async () => {
    const evilSibling = path.join(tempDir, 'allowed-ext-evil', 'payload.txt');
    await fs.mkdir(path.dirname(evilSibling), { recursive: true });
    await fs.writeFile(evilSibling, 'evil', 'utf-8');
    expect(resolveAllowedAssetPath(evilSibling)).toBeNull();
  });

  it('rejects an empty path', () => {
    expect(resolveAllowedAssetPath('')).toBeNull();
  });

  it('rejects ~/.ssh/id_rsa-style dotfile reads', () => {
    const home = os.homedir();
    const sshKey = path.join(home, '.ssh', 'id_rsa');
    // Either it doesn't exist or it's outside any extension dir - both must reject.
    expect(resolveAllowedAssetPath(sshKey)).toBeNull();
  });

  it('allows assets reached via a symlinked extension dev-mount (manifest gated)', async () => {
    // Simulate the dev-mount pattern:
    //   ln -s /path/to/repo  ~/.wayland-dev/extensions/my-bundle
    // The bundle dir contains aion-extension.json, so widening the
    // allowlist to its canonical target is safe.
    const realBundle = path.join(tempDir, 'real-bundle');
    await fs.mkdir(path.join(realBundle, 'icons'), { recursive: true });
    await fs.writeFile(
      path.join(realBundle, 'aion-extension.json'),
      JSON.stringify({ name: 'my-bundle', displayName: 'My Bundle', version: '0.1.0', contributes: {} }),
      'utf-8'
    );
    const iconFile = path.join(realBundle, 'icons', 'avatar.svg');
    await fs.writeFile(iconFile, '<svg/>', 'utf-8');

    const symlink = path.join(envRoot, 'my-bundle');
    await fs.symlink(realBundle, symlink, 'dir');

    // Request the asset via the symlink path - Electron will canonicalise
    // before serving, so the resolved path is realBundle/icons/avatar.svg.
    const resolved = resolveAllowedAssetPath(path.join(symlink, 'icons', 'avatar.svg'));
    expect(resolved).not.toBeNull();
    expect(resolved).toContain('icons');
    expect(resolved).toContain('avatar.svg');
  });
});
