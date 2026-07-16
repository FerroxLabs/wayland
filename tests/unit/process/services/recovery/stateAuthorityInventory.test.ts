import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { inventoryRecoveryAuthorities } from '@process/services/recovery/stateAuthorityInventory';

describe('state authority inventory', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  it('discovers Desktop, Core, credentials, updater, and workspace authorities without reading file contents', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-authority-inventory-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const defaultCore = path.join(root, 'core-default');
    const namedCore = path.join(root, 'core-profiles');
    const workspace = path.join(root, 'book');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(defaultCore, { recursive: true });
    fs.mkdirSync(path.join(namedCore, 'research'), { recursive: true });
    fs.mkdirSync(workspace, { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite-state');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'wayland-config.txt'), 'config-state');
    fs.writeFileSync(path.join(userDataRoot, '.secret-key'), 'secret-key-state');
    fs.writeFileSync(path.join(userDataRoot, 'pending-update.json'), '{}');
    fs.writeFileSync(path.join(defaultCore, 'config.toml'), 'model = "local"');
    fs.writeFileSync(path.join(namedCore, 'research', 'memory.db'), 'core-memory');

    const before = fs.readFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'));
    const inventory = await inventoryRecoveryAuthorities({
      userDataRoot,
      coreDefaultProfileRoot: defaultCore,
      coreNamedProfilesRoot: namedCore,
      sourceReleaseTrack: 'preview',
      externalAgentConfigs: [{ backendId: 'codex', path: path.join(root, 'codex-config.toml') }],
      externalWorkspaces: [{ projectId: 'project-book', path: workspace }],
    });

    expect(inventory.readOnly).toBe(true);
    expect(inventory.authorities).toHaveLength(10);
    expect(inventory.logicalState).toHaveLength(11);
    expect(inventory.sourceReleaseTrack).toBe('preview');
    expect(inventory.authorities.find((item) => item.id === 'desktop.database')).toMatchObject({
      state: 'partial',
      recommendedCoverage: 'encrypted-copy',
      requiredConsistency: 'sqlite-online-backup',
    });
    expect(inventory.authorities.find((item) => item.id === 'credentials.key-material')).toMatchObject({
      state: 'present',
      recommendedCoverage: 'encrypted-copy',
    });
    expect(inventory.authorities.find((item) => item.id === 'credentials.os-keychain')).toMatchObject({
      state: 'external',
      recommendedCoverage: 'excluded',
    });
    expect(inventory.logicalState.find((item) => item.id === 'desktop.scheduler')).toMatchObject({
      authorityIds: ['desktop.database'],
      state: 'mapped',
    });
    expect(inventory.externalAgentConfigs).toEqual([
      { backendId: 'codex', path: path.join(root, 'codex-config.toml'), state: 'absent' },
    ]);
    expect(inventory.authorities.find((item) => item.id === 'external.workspaces')?.evidence[0]).toMatchObject({
      state: 'directory',
      fileCount: 0,
    });
    expect(fs.readFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'))).toEqual(before);
  });

  it('reports symlinks without following them and bounds recursive discovery', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-authority-symlink-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const outside = path.join(root, 'outside');
    const defaultCore = path.join(root, 'core-default');
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(defaultCore, { recursive: true });
    fs.mkdirSync(outside, { recursive: true });
    fs.writeFileSync(path.join(outside, 'must-not-count'), 'outside');
    fs.symlinkSync(outside, path.join(defaultCore, 'linked-profile'));
    fs.writeFileSync(path.join(defaultCore, 'one'), '1');
    fs.writeFileSync(path.join(defaultCore, 'two'), '2');

    const inventory = await inventoryRecoveryAuthorities({
      userDataRoot,
      coreDefaultProfileRoot: defaultCore,
      coreNamedProfilesRoot: path.join(root, 'core-profiles'),
      maxEntriesPerRoot: 2,
    });
    const core = inventory.authorities.find((item) => item.id === 'core.default-profile')!;

    expect(core.state).toBe('symlink-risk');
    expect(core.evidence[0].symlinkCount).toBe(1);
    expect(core.evidence[0].fileCount).toBeLessThanOrEqual(1);
    expect(core.evidence[0].truncated).toBe(true);
  });
});
