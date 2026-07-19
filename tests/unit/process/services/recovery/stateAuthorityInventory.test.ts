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
    fs.mkdirSync(path.join(userDataRoot, 'constitution'), { recursive: true });
    fs.mkdirSync(defaultCore, { recursive: true });
    fs.mkdirSync(path.join(namedCore, 'research'), { recursive: true });
    fs.mkdirSync(workspace, { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite-state');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'wayland-config.txt'), 'config-state');
    fs.writeFileSync(path.join(userDataRoot, '.secret-key'), 'secret-key-state');
    fs.writeFileSync(path.join(userDataRoot, 'constitution', 'revision-authority.enc'), 'os-vault-envelope');
    fs.writeFileSync(path.join(userDataRoot, 'pending-update.json'), '{}');
    fs.writeFileSync(path.join(defaultCore, 'config.toml'), 'model = "local"');
    fs.writeFileSync(path.join(namedCore, 'research', 'memory.db'), 'core-memory');

    const before = fs.readFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'));
    const inventory = await inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: path.join(root, 'constitution-filesystem'),
      coreDefaultProfileRoot: defaultCore,
      coreNamedProfilesRoot: namedCore,
      sourceReleaseTrack: 'preview',
      externalAgentConfigs: [{ backendId: 'codex', path: path.join(root, 'codex-config.toml') }],
      externalWorkspaces: [{ projectId: 'project-book', path: workspace }],
    });

    expect(inventory.readOnly).toBe(true);
    expect(inventory.authorities).toHaveLength(12);
    expect(inventory.logicalState).toHaveLength(11);
    expect(inventory.sourceReleaseTrack).toBe('preview');
    expect(inventory.authorities.find((item) => item.id === 'desktop.database')).toMatchObject({
      state: 'partial',
      recommendedCoverage: 'encrypted-copy',
      requiredConsistency: 'sqlite-online-backup',
    });
    expect(inventory.authorities.find((item) => item.id === 'credentials.key-material')).toMatchObject({
      state: 'partial',
      recommendedCoverage: 'encrypted-copy',
    });
    expect(inventory.authorities.find((item) => item.id === 'credentials.os-keychain')).toMatchObject({
      state: 'external',
      recommendedCoverage: 'excluded',
    });
    expect(inventory.authorities.find((item) => item.id === 'constitution.revision-authority')).toMatchObject({
      state: 'present',
      recommendedCoverage: 'encrypted-copy',
      requiredConsistency: 'quiesced-copy',
      requiredForRestore: true,
      credentialBinding: {
        scope: 'same-device',
        backend: 'electron-safe-storage',
        envelope: 'constitution-revision-authority/v3',
      },
    });
    expect(inventory.logicalState.find((item) => item.id === 'credentials.secrets')?.authorityIds).toContain(
      'constitution.revision-authority'
    );
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
      constitutionRoot: path.join(root, 'constitution-filesystem'),
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

  it('classifies a hard-linked file as unsafe authority evidence', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-authority-hardlink-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const configRoot = path.join(userDataRoot, 'config');
    const outside = path.join(root, 'outside.json');
    fs.mkdirSync(configRoot, { recursive: true });
    fs.writeFileSync(outside, '{}');
    fs.linkSync(outside, path.join(configRoot, 'linked.json'));

    const inventory = await inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: path.join(root, 'constitution'),
      coreDefaultProfileRoot: path.join(root, 'core-default'),
      coreNamedProfilesRoot: path.join(root, 'core-profiles'),
    });
    const config = inventory.authorities.find(({ id }) => id === 'desktop.config')!;

    expect(config.state).toBe('symlink-risk');
    expect(config.evidence[0].hardlinkCount).toBe(1);
  });

  it('keeps production ~/.wayland profiles and unrelated trees out of Constitution ownership and scan budget', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-authority-production-topology-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const waylandRoot = path.join(root, '.wayland');
    const namedProfiles = path.join(waylandRoot, 'profiles');
    const outside = path.join(root, 'outside-oauth');
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(path.join(namedProfiles, 'research'), { recursive: true });
    fs.mkdirSync(outside, { recursive: true });
    fs.writeFileSync(path.join(waylandRoot, 'CONSTITUTION.md'), '# owned');
    fs.writeFileSync(path.join(namedProfiles, '.active'), 'research');
    fs.writeFileSync(path.join(namedProfiles, 'research', 'config.toml'), 'model = "research"');
    fs.writeFileSync(path.join(namedProfiles, 'research', 'memory.db'), 'core memory');
    fs.symlinkSync(outside, path.join(waylandRoot, 'oauth-cache'));

    const inventory = await inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: waylandRoot,
      coreDefaultProfileRoot: path.join(root, 'core-default'),
      coreNamedProfilesRoot: namedProfiles,
      maxEntriesPerRoot: 2,
    });
    const constitution = inventory.authorities.find(({ id }) => id === 'constitution.filesystem')!;
    const named = inventory.authorities.find(({ id }) => id === 'core.named-profiles')!;

    expect(constitution.state).toBe('partial');
    expect(constitution.evidence.some(({ truncated }) => truncated)).toBe(false);
    expect(constitution.evidence.some(({ symlinkCount }) => symlinkCount > 0)).toBe(false);
    expect(constitution.evidence.map(({ authorityRelativePath }) => authorityRelativePath)).toEqual([
      'CONSTITUTION.md',
      'SOUL.md',
      'specialists',
      '.constitution-keys.enc',
      'archives/constitution-history',
    ]);
    expect(named.evidence[0].truncated).toBe(true);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 0, 1.5, 20_001, '100' as unknown as number])(
    'rejects an invalid inventory budget before traversal: %s',
    async (maxEntriesPerRoot) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-authority-budget-'));
      roots.push(root);
      await expect(
        inventoryRecoveryAuthorities({
          userDataRoot: path.join(root, 'user-data'),
          constitutionRoot: path.join(root, 'constitution'),
          coreDefaultProfileRoot: path.join(root, 'core-default'),
          coreNamedProfilesRoot: path.join(root, 'core-profiles'),
          maxEntriesPerRoot,
        })
      ).rejects.toThrow('maxEntriesPerRoot must be a safe integer');
    }
  );

  it('emits deterministic root and evidence order regardless of creation order', async () => {
    const rootsByCreationOrder = ['zeta.json', 'alpha.json'];
    const inventories = await Promise.all(
      [rootsByCreationOrder, rootsByCreationOrder.toReversed()].map(async (order) => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-authority-order-'));
        roots.push(root);
        const userDataRoot = path.join(root, 'user-data');
        fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
        fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
        fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite');
        for (const name of order) fs.writeFileSync(path.join(userDataRoot, name), '{}');
        return inventoryRecoveryAuthorities({
          userDataRoot,
          constitutionRoot: path.join(root, 'constitution'),
          coreDefaultProfileRoot: path.join(root, 'core-default'),
          coreNamedProfilesRoot: path.join(root, 'core-profiles'),
        });
      })
    );

    expect(inventories[0].userDataRoots.map(({ relativePath }) => relativePath)).toEqual(
      inventories[1].userDataRoots.map(({ relativePath }) => relativePath)
    );
    expect(inventories[0].userDataRoots.map(({ relativePath }) => relativePath)).toEqual([
      'alpha.json',
      'config',
      'wayland',
      'zeta.json',
    ]);
  });

  it('does not let an unknown file hide inside the database authority directory', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-authority-database-child-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite');
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'unowned-state.bin'), 'mutable');

    const inventory = await inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: path.join(root, 'constitution'),
      coreDefaultProfileRoot: path.join(root, 'core-default'),
      coreNamedProfilesRoot: path.join(root, 'core-profiles'),
    });

    expect(inventory.userDataRoots).toContainEqual(
      expect.objectContaining({ relativePath: 'wayland/unowned-state.bin', disposition: 'unknown' })
    );
  });

  it('classifies shipped Weixin and Gemini writers with explicit recovery consequences', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-authority-channel-writers-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'weixin-monitor'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'weixin-uploads'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'runtime', 'gemini-websearch'), { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite');
    fs.writeFileSync(path.join(userDataRoot, 'weixin-monitor', 'account.buf'), 'cursor');
    fs.writeFileSync(path.join(userDataRoot, 'weixin-monitor', 'account.uin'), 'uin');
    fs.writeFileSync(path.join(userDataRoot, 'weixin-uploads', 'temporary.bin'), 'cache');
    fs.writeFileSync(path.join(userDataRoot, 'runtime', 'gemini-websearch', 'session.json'), '{}');

    const inventory = await inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: path.join(root, 'constitution'),
      coreDefaultProfileRoot: path.join(root, 'core-default'),
      coreNamedProfilesRoot: path.join(root, 'core-profiles'),
    });
    const runtime = inventory.authorities.find(({ id }) => id === 'desktop.runtime-files')!;

    expect(runtime.evidence.map(({ authorityRelativePath }) => authorityRelativePath)).toEqual(
      expect.arrayContaining(['runtime', 'weixin-monitor'])
    );
    expect(inventory.userDataRoots).toContainEqual(
      expect.objectContaining({ relativePath: 'weixin-monitor', disposition: 'captured' })
    );
    expect(inventory.userDataRoots).toContainEqual(
      expect.objectContaining({
        relativePath: 'weixin-uploads',
        disposition: 'excluded',
        restoreConsequence: expect.stringContaining('delivery cache'),
      })
    );
    expect(inventory.userDataRoots).toContainEqual(
      expect.objectContaining({ relativePath: 'runtime', disposition: 'captured' })
    );
  });
});
