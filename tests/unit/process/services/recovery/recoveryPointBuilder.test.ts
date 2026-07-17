import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildRecoveryPoint,
  RecoveryPointBuildBlockedError,
  type RecoveryPointBuilderDependencies,
} from '@process/services/recovery/recoveryPointBuilder';
import { verifyRecoverySnapshot } from '@process/services/recovery/recoveryManifest';
import { materializeIsolatedRecovery } from '@process/services/recovery/isolatedRecovery';
import { inventoryRecoveryAuthorities } from '@process/services/recovery/stateAuthorityInventory';
import { ConstitutionRevisionAuthority } from '@process/services/constitution/constitutionRevisionAuthority';

describe('recovery point builder', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  async function fixture(options: { core?: boolean } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-builder-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const coreDefaultProfileRoot = path.join(root, 'core-default');
    const workspace = path.join(root, 'book');
    const agentConfig = path.join(root, 'codex-config.json');
    const destinationRoot = path.join(root, 'recovery-points');
    const constitutionRoot = path.join(root, 'constitution-filesystem');
    const coreNamedProfilesRoot = path.join(constitutionRoot, 'profiles');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'constitution'), { recursive: true });
    fs.mkdirSync(path.join(constitutionRoot, 'specialists'), { recursive: true });
    fs.mkdirSync(workspace, { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'live-sqlite-with-wal-state');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'preferences.json'), '{"theme":"dark"}');
    fs.writeFileSync(path.join(userDataRoot, 'webui.config.json'), '{"enabled":true}');
    fs.writeFileSync(path.join(constitutionRoot, 'CONSTITUTION.md'), '# User Constitution');
    fs.writeFileSync(path.join(constitutionRoot, 'specialists', 'research.md'), '# Research overlay');
    const revisionSecretBackend = {
      encryptString: (plaintext: string): string => `safe-storage:${Buffer.from(plaintext, 'utf8').toString('base64')}`,
      decryptString: (ciphertext: string): string =>
        Buffer.from(ciphertext.slice('safe-storage:'.length), 'base64').toString('utf8'),
    };
    const generatedAuthorityPath = path.join(root, 'revision-authority-source.enc');
    const authority = ConstitutionRevisionAuthority.loadOrCreate(generatedAuthorityPath, revisionSecretBackend);
    const retiredRevisionKeyId = authority.keyId();
    const rotationReceipt = authority.rotate();
    const activeRevisionKeyId = authority.keyId();
    const revisionAuthorityEnvelope = fs.readFileSync(generatedAuthorityPath);
    fs.writeFileSync(path.join(userDataRoot, 'constitution', 'revision-authority.enc'), revisionAuthorityEnvelope);
    fs.writeFileSync(agentConfig, '{"provider":"flux"}');
    if (options.core) {
      fs.mkdirSync(coreDefaultProfileRoot, { recursive: true });
      fs.writeFileSync(path.join(coreDefaultProfileRoot, 'memory.db'), 'core-memory');
      fs.mkdirSync(path.join(coreNamedProfilesRoot, 'research'), { recursive: true });
      fs.writeFileSync(path.join(coreNamedProfilesRoot, '.active'), 'research');
      fs.writeFileSync(path.join(coreNamedProfilesRoot, 'research', 'memory.db'), 'named-core-memory');
    }

    const inventory = await inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot,
      coreDefaultProfileRoot,
      coreNamedProfilesRoot,
      externalWorkspaces: [{ projectId: 'book-project', path: workspace }],
      externalAgentConfigs: [{ backendId: 'codex', path: agentConfig }],
      sourceReleaseTrack: 'preview',
    });

    return {
      root,
      userDataRoot,
      destinationRoot,
      inventory,
      revisionAuthorityEnvelope,
      revisionSecretBackend,
      retiredRevisionKeyId,
      activeRevisionKeyId,
      rotationReceipt,
    };
  }

  function dependencies(overrides: Partial<RecoveryPointBuilderDependencies> = {}) {
    const desktopRelease = vi.fn(async () => undefined);
    const coreRelease = vi.fn(async () => undefined);
    const base: RecoveryPointBuilderDependencies = {
      captureSqliteOnline: async (source, destination) => {
        fs.copyFileSync(source, destination);
      },
      sealFile: async (source, destination) => {
        fs.writeFileSync(destination, Buffer.concat([Buffer.from('sealed:'), fs.readFileSync(source)]));
      },
      acquireDesktopQuiescence: async () => ({ release: desktopRelease }),
      acquireCoreQuiescence: async () => ({ release: coreRelease }),
      readMutationEpoch: async () => 'epoch-12',
      now: () => new Date('2026-07-15T12:00:00.000Z'),
      createSnapshotId: () => 'snapshot-test',
      ...overrides,
    };
    return { dependencies: base, desktopRelease, coreRelease };
  }

  it('publishes a verified bundle only after sealed capture and releases the leases', async () => {
    const data = await fixture({ core: true });
    const deps = dependencies();

    const result = await buildRecoveryPoint(
      {
        inventory: data.inventory,
        destinationRoot: data.destinationRoot,
        reason: 'recovery-test',
        sourceAppVersion: '0.11.18',
        targetAppVersion: '0.12.0',
        desktopSchemaVersion: 53,
      },
      deps.dependencies
    );

    expect(result.snapshotPath).toBe(path.join(data.destinationRoot, 'snapshot-test'));
    expect(fs.existsSync(result.manifestPath)).toBe(true);
    expect(result.manifest.state).toBe('complete');
    expect(result.manifest.externalWorkspaces).toEqual([
      expect.objectContaining({ projectId: 'book-project', state: 'directory', copyPolicy: 'reference-only' }),
    ]);
    expect(result.manifest.externalAgentConfigs).toEqual([
      expect.objectContaining({ backendId: 'codex', state: 'file', copyPolicy: 'reference-only' }),
    ]);
    expect(result.manifest.files.every((file) => !file.snapshotPath.endsWith('-wal'))).toBe(true);
    const database = result.manifest.files.find((file) => file.authority === 'desktop.database')!;
    expect(fs.readFileSync(path.join(result.snapshotPath, database.snapshotPath), 'utf8')).toBe(
      'sealed:live-sqlite-with-wal-state'
    );
    const revisionAuthority = result.manifest.files.find(
      (file) => file.authority === 'constitution.revision-authority'
    )!;
    expect(revisionAuthority).toMatchObject({
      restorePath: 'desktop/constitution/revision-authority.enc',
      sensitive: true,
      copyPolicy: 'encrypted-copy',
    });
    expect(
      result.manifest.authorities.find(({ id }) => id === 'constitution.revision-authority')?.credentialBinding
    ).toEqual({
      scope: 'same-device',
      backend: 'electron-safe-storage',
      envelope: 'constitution-revision-authority/v3',
    });
    expect(fs.readFileSync(path.join(result.snapshotPath, revisionAuthority.snapshotPath))).toEqual(
      Buffer.concat([Buffer.from('sealed:'), data.revisionAuthorityEnvelope])
    );
    const constitutionFile = result.manifest.files.find(
      (file) => file.authority === 'constitution.filesystem' && file.restorePath.endsWith('/CONSTITUTION.md')
    )!;
    expect(constitutionFile).toMatchObject({
      restorePath: 'constitution/files/CONSTITUTION.md',
      sensitive: true,
      copyPolicy: 'encrypted-copy',
    });
    expect(
      result.manifest.files.some(
        (file) => file.authority === 'constitution.filesystem' && file.restorePath.includes('/profiles/')
      )
    ).toBe(false);
    expect(
      result.manifest.files.some(
        (file) => file.authority === 'core.named-profiles' && file.restorePath === 'core/profiles/research/memory.db'
      )
    ).toBe(true);
    await expect(verifyRecoverySnapshot(result.manifest, result.snapshotPath)).resolves.toMatchObject({ valid: true });
    const isolatedRoot = path.join(data.root, 'isolated-restore');
    const isolated = await materializeIsolatedRecovery(result.snapshotPath, isolatedRoot, {
      unsealFile: async (source, destination) => {
        const sealed = fs.readFileSync(source);
        expect(sealed.subarray(0, 7).toString()).toBe('sealed:');
        fs.writeFileSync(destination, sealed.subarray(7), { flag: 'wx' });
      },
      validateDesktopDatabase: async (databasePath, expectedSchemaVersion) => {
        expect(fs.readFileSync(databasePath, 'utf8')).toBe('live-sqlite-with-wal-state');
        return { schemaVersion: expectedSchemaVersion, integrity: 'ok' };
      },
      now: () => new Date('2026-07-15T12:01:00.000Z'),
    });
    expect(isolated.receipt.liveStateTouched).toBe(false);
    expect(isolated.receipt.files.map(({ restorePath }) => restorePath)).toEqual(
      expect.arrayContaining([
        'desktop/database/wayland.db',
        'desktop/config/preferences.json',
        'core/default/memory.db',
      ])
    );
    expect(fs.existsSync(path.join(isolatedRoot, 'desktop/config/preferences.json'))).toBe(true);
    expect(fs.readFileSync(path.join(isolatedRoot, 'desktop/constitution/revision-authority.enc'))).toEqual(
      data.revisionAuthorityEnvelope
    );
    const recoveredAuthority = ConstitutionRevisionAuthority.load(
      path.join(isolatedRoot, 'desktop/constitution/revision-authority.enc'),
      data.revisionSecretBackend
    )!;
    expect(recoveredAuthority.keyId()).toBe(data.activeRevisionKeyId);
    expect(recoveredAuthority.key(data.retiredRevisionKeyId)).toHaveLength(32);
    expect(recoveredAuthority.lastRotationReceipt()).toEqual(data.rotationReceipt);
    expect(deps.desktopRelease).toHaveBeenCalledOnce();
    expect(deps.coreRelease).toHaveBeenCalledOnce();
    expect(fs.readdirSync(data.destinationRoot)).toEqual(['snapshot-test']);
  });

  it('fails closed on epoch drift, removes partial output, and leaves live state untouched', async () => {
    const data = await fixture();
    const originalDatabase = fs.readFileSync(path.join(data.userDataRoot, 'wayland', 'wayland.db'));
    const readMutationEpoch = vi.fn().mockResolvedValueOnce('epoch-12').mockResolvedValueOnce('epoch-13');
    const deps = dependencies({ readMutationEpoch });

    await expect(
      buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          reason: 'pre-update',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      )
    ).rejects.toThrow('State changed during recovery capture');

    expect(fs.readFileSync(path.join(data.userDataRoot, 'wayland', 'wayland.db'))).toEqual(originalDatabase);
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
    expect(deps.desktopRelease).toHaveBeenCalledOnce();
  });

  it('does not publish a partial point when sealing fails', async () => {
    const data = await fixture();
    const deps = dependencies({ sealFile: async () => Promise.reject(new Error('sealer unavailable')) });

    await expect(
      buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          reason: 'manual',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      )
    ).rejects.toThrow('sealer unavailable');

    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
    expect(deps.desktopRelease).toHaveBeenCalledOnce();
  });

  it('removes partial isolated output when authenticated unsealing fails', async () => {
    const data = await fixture();
    const deps = dependencies();
    const result = await buildRecoveryPoint(
      {
        inventory: data.inventory,
        destinationRoot: data.destinationRoot,
        reason: 'recovery-test',
        sourceAppVersion: '0.11.18',
        desktopSchemaVersion: 53,
      },
      deps.dependencies
    );
    const isolatedRoot = path.join(data.root, 'failed-isolated-restore');

    await expect(
      materializeIsolatedRecovery(result.snapshotPath, isolatedRoot, {
        unsealFile: async () => Promise.reject(new Error('authentication tag mismatch')),
        validateDesktopDatabase: async () => ({ schemaVersion: 53, integrity: 'ok' }),
      })
    ).rejects.toThrow('authentication tag mismatch');

    expect(fs.existsSync(isolatedRoot)).toBe(false);
    await expect(verifyRecoverySnapshot(result.manifest, result.snapshotPath)).resolves.toMatchObject({ valid: true });
  });

  it('fails closed when distinct source names sanitize to the same snapshot path', async () => {
    const data = await fixture();
    const configRoot = path.join(data.userDataRoot, 'config');
    fs.writeFileSync(path.join(configRoot, 'theme one.json'), '{"theme":"light"}');
    fs.writeFileSync(path.join(configRoot, 'theme#one.json'), '{"theme":"dark"}');
    data.inventory = await inventoryRecoveryAuthorities({
      userDataRoot: data.userDataRoot,
      constitutionRoot: path.join(data.root, 'constitution-filesystem'),
      coreDefaultProfileRoot: path.join(data.root, 'core-default'),
      coreNamedProfilesRoot: path.join(data.root, 'core-profiles'),
      sourceReleaseTrack: 'preview',
    });
    const deps = dependencies();

    await expect(
      buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          reason: 'recovery-test',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      )
    ).rejects.toThrow('Recovery sources collide at snapshot path');

    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
    expect(deps.desktopRelease).toHaveBeenCalledOnce();
  });

  it('blocks before capture when Core state exists without a Core quiescence lease', async () => {
    const data = await fixture({ core: true });
    const deps = dependencies();
    deps.dependencies.acquireCoreQuiescence = undefined;

    await expect(
      buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          reason: 'manual',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      )
    ).rejects.toBeInstanceOf(RecoveryPointBuildBlockedError);
    expect(fs.existsSync(data.destinationRoot)).toBe(false);
  });
});
