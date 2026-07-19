import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildRecoveryPoint,
  recoveryFilesystemSafetyModeForPlatform,
  RecoveryPointBuildBlockedError,
  type RecoveryPointBuilderDependencies,
} from '@process/services/recovery/recoveryPointBuilder';
import { assertRecoveryDestinationDisjoint } from '@process/services/recovery/recoveryCapture';
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
      captureSqliteOnline: async (source) => ({ bytes: await fs.promises.readFile(source), schemaVersion: 53 }),
      sealBytes: async (plaintext) => Buffer.concat([Buffer.from('sealed:'), plaintext]),
      acquireDesktopQuiescence: async () => ({ release: desktopRelease }),
      acquireCoreQuiescence: async () => ({ release: coreRelease }),
      readMutationEpoch: async () => 'epoch-12',
      now: () => new Date('2026-07-15T12:00:00.000Z'),
      createSnapshotId: () => 'snapshot-test',
      allowUnsafePathFallbackForTests: true,
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

  it.runIf(process.platform === 'darwin')(
    'fails closed before creating output when identity-bound publication is unavailable on Darwin',
    async () => {
      const data = await fixture();
      const deps = dependencies({ allowUnsafePathFallbackForTests: false });

      await expect(
        buildRecoveryPoint(
          {
            inventory: data.inventory,
            destinationRoot: data.destinationRoot,
            protectedRoots: [data.userDataRoot],
            reason: 'recovery-test',
            sourceAppVersion: '0.11.18',
            desktopSchemaVersion: 53,
          },
          deps.dependencies
        )
      ).rejects.toThrow('identity-bound filesystem publication is unsupported');

      expect(recoveryFilesystemSafetyModeForPlatform('darwin')).toBe('unsupported');
      expect(fs.existsSync(data.destinationRoot)).toBe(false);
    }
  );

  it('selects explicit safe-path strategies for every production platform', () => {
    expect(recoveryFilesystemSafetyModeForPlatform('linux')).toBe('descriptor-relative');
    expect(recoveryFilesystemSafetyModeForPlatform('darwin')).toBe('unsupported');
    expect(recoveryFilesystemSafetyModeForPlatform('win32')).toBe('unsupported');
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

  it('fails closed when the online SQLite image reports a different schema than the pinned connection', async () => {
    const data = await fixture();
    const capturedBytes = Buffer.from('SQLite format 3\0wrong-schema');
    const deps = dependencies({
      captureSqliteOnline: async () => ({ bytes: capturedBytes, schemaVersion: 54 }),
    });

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
    ).rejects.toThrow('SQLite schema changed during recovery capture (53 -> 54)');

    expect(capturedBytes).toEqual(Buffer.alloc(capturedBytes.length));
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
  });

  it('detects equal-epoch ABA mutation by re-hashing the admitted source bytes after capture', async () => {
    const data = await fixture();
    const configPath = path.join(data.userDataRoot, 'config', 'preferences.json');
    const original = '{"theme":"dark"}';
    const transient = '{"theme":"evil"}';
    expect(Buffer.byteLength(transient)).toBe(Buffer.byteLength(original));
    let injected = false;
    let restored = false;
    const deps = dependencies({
      readMutationEpoch: async () => 'epoch-stable-but-insufficient',
      beforeSourceEntryOpen: async (relativePath) => {
        if (!injected && relativePath === 'preferences.json') {
          injected = true;
          fs.writeFileSync(configPath, transient);
        }
      },
      sealBytes: async (plaintext) => {
        if (!restored && plaintext.toString('utf8') === transient) {
          restored = true;
          fs.writeFileSync(configPath, original);
        }
        return Buffer.concat([Buffer.from('sealed:'), plaintext]);
      },
    });

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
    ).rejects.toThrow('Recovery source bytes changed after capture');

    expect(injected).toBe(true);
    expect(restored).toBe(true);
    expect(fs.readFileSync(configPath, 'utf8')).toBe(original);
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
  });

  it('rejects a source pathname replacement after handle admission but before the first mutation epoch', async () => {
    const data = await fixture();
    const authorityPath = path.join(data.userDataRoot, 'constitution', 'revision-authority.enc');
    const retiredAuthorityPath = path.join(data.userDataRoot, 'constitution', 'revision-authority.retired.enc');
    const admittedBytes = fs.readFileSync(authorityPath);
    const replacementBytes = Buffer.alloc(admittedBytes.length, 0x61);
    let epochReads = 0;
    const deps = dependencies({
      readMutationEpoch: async () => {
        if (epochReads++ === 0) {
          fs.renameSync(authorityPath, retiredAuthorityPath);
          fs.writeFileSync(authorityPath, replacementBytes);
        }
        return 'epoch-replacement-stable';
      },
    });

    let published = false;
    let capturedRetiredAuthority = false;
    try {
      const result = await buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          reason: 'manual',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      );
      published = true;
      const captured = result.manifest.files.find(({ authority }) => authority === 'constitution.revision-authority')!;
      capturedRetiredAuthority = fs
        .readFileSync(path.join(result.snapshotPath, captured.snapshotPath))
        .equals(Buffer.concat([Buffer.from('sealed:'), admittedBytes]));
    } catch {
      // The authority invariant requires this branch.
    }

    expect({
      published,
      capturedRetiredAuthority,
      currentPathIsReplacement: fs.readFileSync(authorityPath).equals(replacementBytes),
    }).toEqual({
      published: false,
      capturedRetiredAuthority: false,
      currentPathIsReplacement: true,
    });
  });

  it('rejects a source directory replacement after handle admission but before the first mutation epoch', async () => {
    const data = await fixture();
    const configRoot = path.join(data.userDataRoot, 'config');
    const retiredConfigRoot = path.join(data.userDataRoot, 'config.retired');
    const replacementPreferences = '{"theme":"replacement"}';
    let epochReads = 0;
    const deps = dependencies({
      readMutationEpoch: async () => {
        if (epochReads++ === 0) {
          fs.renameSync(configRoot, retiredConfigRoot);
          fs.mkdirSync(configRoot);
          fs.writeFileSync(path.join(configRoot, 'preferences.json'), replacementPreferences);
        }
        return 'epoch-directory-replacement-stable';
      },
    });

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
    ).rejects.toThrow('Recovery source pathname identity changed after admission');

    expect(fs.readFileSync(path.join(configRoot, 'preferences.json'), 'utf8')).toBe(replacementPreferences);
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
  });

  it('rejects replacement of an admitted source parent even when every descendant inode is moved back', async () => {
    const data = await fixture();
    const originalRootIdentity = fs.statSync(data.userDataRoot);
    const retiredUserDataRoot = `${data.userDataRoot}.retired`;
    let epochReads = 0;
    const deps = dependencies({
      readMutationEpoch: async () => {
        if (epochReads++ === 0) {
          fs.renameSync(data.userDataRoot, retiredUserDataRoot);
          fs.mkdirSync(data.userDataRoot);
          for (const entry of fs.readdirSync(retiredUserDataRoot)) {
            fs.renameSync(path.join(retiredUserDataRoot, entry), path.join(data.userDataRoot, entry));
          }
        }
        return 'epoch-parent-replacement-stable';
      },
    });

    let published = false;
    try {
      await buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          reason: 'manual',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      );
      published = true;
    } catch {
      // The admitted source path must remain rooted in the original parent identity.
    }

    const currentRootIdentity = fs.statSync(data.userDataRoot);
    expect({
      published,
      parentIdentityChanged:
        currentRootIdentity.dev !== originalRootIdentity.dev || currentRootIdentity.ino !== originalRootIdentity.ino,
    }).toEqual({ published: false, parentIdentityChanged: true });
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
  });

  it('rejects an equal-byte descendant replacement during the final mutation epoch', async () => {
    const data = await fixture();
    const preferencesPath = path.join(data.userDataRoot, 'config', 'preferences.json');
    const retiredPreferencesPath = path.join(data.userDataRoot, 'preferences.retired.json');
    const originalBytes = fs.readFileSync(preferencesPath);
    let epochReads = 0;
    const deps = dependencies({
      readMutationEpoch: async () => {
        if (epochReads++ === 1) {
          fs.renameSync(preferencesPath, retiredPreferencesPath);
          fs.writeFileSync(preferencesPath, originalBytes);
        }
        return 'epoch-descendant-replacement-stable';
      },
    });

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
    ).rejects.toThrow('Recovery source identity changed after capture');

    expect(fs.readFileSync(preferencesPath)).toEqual(originalBytes);
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
  });

  it('does not publish a partial point when sealing fails', async () => {
    const data = await fixture();
    const deps = dependencies({ sealBytes: async () => Promise.reject(new Error('sealer unavailable')) });

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

  it('preserves the capture error and removes staging when lease cleanup also fails', async () => {
    const data = await fixture();
    const desktopRelease = vi.fn(async () => Promise.reject(new Error('lease release unavailable')));
    const deps = dependencies({
      sealBytes: async () => Promise.reject(new Error('capture sealing failed')),
      acquireDesktopQuiescence: async () => ({ release: desktopRelease }),
    });

    let observed: unknown;
    try {
      await buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          reason: 'manual',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      );
    } catch (error) {
      observed = error;
    }

    expect(observed).toBeInstanceOf(AggregateError);
    expect((observed as AggregateError).errors.map((error) => (error as Error).message)).toEqual(
      expect.arrayContaining(['capture sealing failed', 'Recovery cleanup failed for Desktop quiescence lease.'])
    );
    expect(desktopRelease).toHaveBeenCalledOnce();
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
  });

  it('preserves an artifact failure when nested handle cleanup also fails', async () => {
    const data = await fixture();
    let injectedCloseFailure = false;
    const deps = dependencies({
      beforeFirstArtifactWrite: async () => Promise.reject(new Error('artifact operation failed')),
      closeFileHandle: async (handle, role) => {
        await handle.close();
        if (role === 'artifact-parent' && !injectedCloseFailure) {
          injectedCloseFailure = true;
          throw new Error('nested artifact parent close failed');
        }
      },
    });

    let observed: unknown;
    try {
      await buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          reason: 'manual',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      );
    } catch (error) {
      observed = error;
    }

    const messages: string[] = [];
    const collectMessages = (error: unknown): void => {
      if (!(error instanceof Error)) return;
      messages.push(error.message);
      if (error instanceof AggregateError) error.errors.forEach(collectMessages);
    };
    collectMessages(observed);

    expect(observed).toBeInstanceOf(AggregateError);
    expect(messages).toEqual(
      expect.arrayContaining(['artifact operation failed', 'Recovery cleanup failed for artifact-parent.'])
    );
    expect(injectedCloseFailure).toBe(true);
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
  });

  it('passes sensitive source bytes directly to the sealer inside private staging', async () => {
    const data = await fixture();
    const sealedInputs: Buffer[] = [];
    const deps = dependencies({
      sealBytes: async (plaintext) => {
        sealedInputs.push(Buffer.from(plaintext));
        return Buffer.concat([Buffer.from('sealed:'), plaintext]);
      },
    });

    await buildRecoveryPoint(
      {
        inventory: data.inventory,
        destinationRoot: data.destinationRoot,
        reason: 'recovery-test',
        sourceAppVersion: '0.11.18',
        desktopSchemaVersion: 53,
      },
      deps.dependencies
    );

    expect(sealedInputs.some((bytes) => bytes.toString('utf8') === '{"theme":"dark"}')).toBe(true);
    expect(
      fs
        .readdirSync(data.destinationRoot, { recursive: true })
        .map(String)
        .some((entry) => entry.includes('.transient') || entry.startsWith('source-'))
    ).toBe(false);
  });

  it('never materializes the SQLite snapshot as crash-strandable plaintext', async () => {
    const data = await fixture();
    const databaseBytes = Buffer.from('SQLite format 3\0application-consistent-image');
    const observedEntries: string[][] = [];
    const inspectStaging = (): string[] =>
      fs.existsSync(data.destinationRoot)
        ? fs.readdirSync(data.destinationRoot, { recursive: true }).map(String).toSorted()
        : [];
    const deps = dependencies({
      captureSqliteOnline: async () => {
        observedEntries.push(inspectStaging());
        return { bytes: Buffer.from(databaseBytes), schemaVersion: 53 };
      },
      sealBytes: async (plaintext) => {
        if (plaintext.equals(databaseBytes)) observedEntries.push(inspectStaging());
        return Buffer.concat([Buffer.from('sealed:'), plaintext]);
      },
    });

    await buildRecoveryPoint(
      {
        inventory: data.inventory,
        destinationRoot: data.destinationRoot,
        reason: 'recovery-test',
        sourceAppVersion: '0.11.18',
        desktopSchemaVersion: 53,
      },
      deps.dependencies
    );

    expect(observedEntries).toHaveLength(2);
    expect(observedEntries.flat().some((entry) => entry.includes('.transient') || entry.endsWith('wayland.db'))).toBe(
      false
    );
  });

  it('seals bytes from the admitted source handle when an authority directory is swapped during sealing', async () => {
    const data = await fixture();
    const configRoot = path.join(data.userDataRoot, 'config');
    const admittedConfigRoot = path.join(data.userDataRoot, 'config-admitted');
    const attackerRoot = path.join(data.root, 'attacker-config');
    fs.mkdirSync(attackerRoot);
    fs.writeFileSync(path.join(attackerRoot, 'preferences.json'), 'attacker-controlled');
    let swapped = false;
    const deps = dependencies({
      sealBytes: async (bytes) => {
        if (!swapped && bytes.toString('utf8') === '{"theme":"dark"}') {
          swapped = true;
          fs.renameSync(configRoot, admittedConfigRoot);
          fs.symlinkSync(attackerRoot, configRoot, 'dir');
        }
        if (swapped && fs.lstatSync(configRoot).isSymbolicLink()) {
          fs.unlinkSync(configRoot);
          fs.renameSync(admittedConfigRoot, configRoot);
        }
        return Buffer.concat([Buffer.from('sealed:'), bytes]);
      },
    });

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
    const config = result.manifest.files.find(
      ({ authority, restorePath }) => authority === 'desktop.config' && restorePath.endsWith('/preferences.json')
    )!;

    expect(swapped).toBe(true);
    expect(fs.readFileSync(path.join(result.snapshotPath, config.snapshotPath), 'utf8')).toBe(
      'sealed:{"theme":"dark"}'
    );
  });

  it.runIf(process.platform === 'linux')(
    'fails closed when a nested source component is replaced before descriptor-relative open',
    async () => {
      const data = await fixture();
      const constitutionRoot = path.join(data.root, 'constitution-filesystem');
      const researchPath = path.join(constitutionRoot, 'specialists', 'research.md');
      const admittedResearchPath = path.join(constitutionRoot, 'specialists', 'research-admitted.md');
      let replaced = false;
      const deps = dependencies({
        allowUnsafePathFallbackForTests: false,
        beforeSourceEntryOpen: async (relativePath) => {
          if (!replaced && relativePath === path.join('specialists', 'research.md')) {
            replaced = true;
            fs.renameSync(researchPath, admittedResearchPath);
            fs.writeFileSync(researchPath, '# Replacement overlay');
          }
        },
      });

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
      ).rejects.toThrow('identity changed during descendant admission');

      expect(replaced).toBe(true);
      expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
    }
  );

  it('blocks when an admitted destination ancestor is swapped for a protected-root symlink', async () => {
    const data = await fixture();
    const admittedAncestor = path.join(data.root, 'admitted-destination');
    const retiredAncestor = path.join(data.root, 'retired-destination');
    const protectedRoot = path.join(data.root, 'protected-live-state');
    const destinationRoot = path.join(admittedAncestor, 'recovery-points');
    fs.mkdirSync(admittedAncestor);
    fs.mkdirSync(protectedRoot);

    await assertRecoveryDestinationDisjoint(destinationRoot, [protectedRoot]);
    fs.renameSync(admittedAncestor, retiredAncestor);
    fs.symlinkSync(protectedRoot, admittedAncestor, 'dir');

    const deps = dependencies();
    let outcome: 'blocked' | 'published' = 'published';
    try {
      await buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot,
          protectedRoots: [protectedRoot],
          reason: 'hostile-ancestor-swap',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      );
    } catch {
      outcome = 'blocked';
    }

    expect({
      outcome,
      wroteOutsideAdmittedRoot: fs.existsSync(path.join(protectedRoot, 'recovery-points')),
    }).toEqual({
      outcome: 'blocked',
      wroteOutsideAdmittedRoot: false,
    });
  });

  it('fails closed when a destination ancestor is swapped after admission but before the first write', async () => {
    const data = await fixture();
    const admittedAncestor = path.join(data.root, 'race-admitted');
    const retiredAncestor = path.join(data.root, 'race-retired');
    const protectedRoot = path.join(data.root, 'race-protected');
    const destinationRoot = path.join(admittedAncestor, 'recovery-points');
    fs.mkdirSync(admittedAncestor);
    fs.mkdirSync(protectedRoot);
    const deps = dependencies({
      beforeFirstArtifactWrite: async () => {
        fs.renameSync(admittedAncestor, retiredAncestor);
        fs.symlinkSync(protectedRoot, admittedAncestor, 'dir');
      },
    });

    await expect(
      buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot,
          protectedRoots: [protectedRoot],
          reason: 'hostile-write-race',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      )
    ).rejects.toThrow('identity changed after admission');

    expect(fs.readdirSync(protectedRoot)).toEqual([]);
    expect(fs.existsSync(path.join(retiredAncestor, 'recovery-points', 'snapshot-test'))).toBe(false);
  });

  it.runIf(process.platform === 'linux')(
    'keeps final publication bound to the admitted destination after an ancestor replacement',
    async () => {
      const data = await fixture();
      const admittedAncestor = path.join(data.root, 'publish-admitted');
      const retiredAncestor = path.join(data.root, 'publish-retired');
      const protectedRoot = path.join(data.root, 'publish-protected');
      const destinationRoot = path.join(admittedAncestor, 'recovery-points');
      fs.mkdirSync(admittedAncestor);
      fs.mkdirSync(protectedRoot);
      const deps = dependencies({
        allowUnsafePathFallbackForTests: false,
        beforePublication: async () => {
          fs.renameSync(admittedAncestor, retiredAncestor);
          fs.symlinkSync(protectedRoot, admittedAncestor, 'dir');
        },
      });

      await expect(
        buildRecoveryPoint(
          {
            inventory: data.inventory,
            destinationRoot,
            protectedRoots: [protectedRoot],
            reason: 'hostile-publication-race',
            sourceAppVersion: '0.11.18',
            desktopSchemaVersion: 53,
          },
          deps.dependencies
        )
      ).rejects.toThrow('identity changed after admission');

      expect(fs.readdirSync(protectedRoot)).toEqual([]);
      expect(fs.readdirSync(path.join(retiredAncestor, 'recovery-points'))).toEqual([]);
    }
  );

  it.runIf(process.platform === 'linux')(
    'keeps failed-output cleanup bound to the admitted destination after an ancestor replacement',
    async () => {
      const data = await fixture();
      const admittedAncestor = path.join(data.root, 'cleanup-admitted');
      const retiredAncestor = path.join(data.root, 'cleanup-retired');
      const protectedRoot = path.join(data.root, 'cleanup-protected');
      const destinationRoot = path.join(admittedAncestor, 'recovery-points');
      fs.mkdirSync(admittedAncestor);
      fs.mkdirSync(protectedRoot);
      const deps = dependencies({
        allowUnsafePathFallbackForTests: false,
        sealBytes: async () => Promise.reject(new Error('capture failed before cleanup')),
        beforeOutputCleanup: async () => {
          fs.renameSync(admittedAncestor, retiredAncestor);
          fs.symlinkSync(protectedRoot, admittedAncestor, 'dir');
        },
      });

      await expect(
        buildRecoveryPoint(
          {
            inventory: data.inventory,
            destinationRoot,
            protectedRoots: [protectedRoot],
            reason: 'hostile-cleanup-race',
            sourceAppVersion: '0.11.18',
            desktopSchemaVersion: 53,
          },
          deps.dependencies
        )
      ).rejects.toThrow('capture failed before cleanup');

      expect(fs.readdirSync(protectedRoot)).toEqual([]);
      expect(fs.readdirSync(path.join(retiredAncestor, 'recovery-points'))).toEqual([]);
    }
  );

  it('never writes through a replaced staging descendant into protected live state', async () => {
    const data = await fixture();
    const protectedRoot = path.join(data.root, 'protected-live-state');
    fs.mkdirSync(protectedRoot);
    let replaced = false;
    const deps = dependencies({
      beforeFirstArtifactWrite: async () => {
        const stagingName = fs
          .readdirSync(data.destinationRoot)
          .find((entry) => entry.startsWith('.snapshot-test.incomplete-'))!;
        const stagingRoot = path.join(data.destinationRoot, stagingName);
        const admittedParent = path.join(stagingRoot, 'state', 'desktop.database');
        const retiredParent = path.join(stagingRoot, 'state', 'desktop.database-admitted');
        fs.renameSync(admittedParent, retiredParent);
        fs.symlinkSync(protectedRoot, admittedParent, 'dir');
        replaced = true;
      },
    });

    await expect(
      buildRecoveryPoint(
        {
          inventory: data.inventory,
          destinationRoot: data.destinationRoot,
          protectedRoots: [data.userDataRoot, protectedRoot],
          reason: 'recovery-test',
          sourceAppVersion: '0.11.18',
          desktopSchemaVersion: 53,
        },
        deps.dependencies
      )
    ).rejects.toThrow(/artifact parent identity changed|staging identity changed/);

    expect(replaced).toBe(true);
    expect(fs.readdirSync(protectedRoot)).toEqual([]);
    expect(fs.readdirSync(data.destinationRoot)).toEqual([]);
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
