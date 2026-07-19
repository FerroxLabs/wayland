/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertDesktopOnlyRecoveryCaptureReady,
  assertRecoveryDestinationDisjoint,
  captureProductionRecoveryPoint,
  fingerprintDesktopRecoveryState,
  provisionHealthyV2ExternalRecoveryAuthority,
} from '@process/services/recovery/recoveryCapture';
import { resolveExternalRecoveryAuthorityRoot } from '@process/services/recovery/externalRecoveryAuthority';
import type { ExternalRecoveryVaultBackend } from '@process/services/recovery/externalRecoveryAuthority';
import {
  inventoryRecoveryAuthorities,
  type RecoveryInventory,
} from '@process/services/recovery/stateAuthorityInventory';
import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';

const roots: string[] = [];

function inventory(configPath: string): RecoveryInventory {
  return {
    observedAt: new Date(0).toISOString(),
    readOnly: true,
    sourceReleaseTrack: 'stable',
    authorities: [
      {
        id: 'desktop.config',
        state: 'present',
        evidence: [
          {
            path: configPath,
            state: 'directory',
            size: 0,
            fileCount: 1,
            directoryCount: 1,
            symlinkCount: 0,
            hardlinkCount: 0,
            truncated: false,
          },
        ],
        recommendedCoverage: 'encrypted-copy',
        requiredConsistency: 'quiesced-copy',
        requiredForRestore: true,
        sensitive: true,
        note: 'test',
      },
    ],
    logicalState: [],
    externalWorkspaces: [],
    externalAgentConfigs: [],
    userDataRoots: [],
  };
}

function healthyV2Inventory(configPath: string): RecoveryInventory {
  const value = inventory(configPath);
  value.authorities.push({
    id: 'constitution.revision-authority',
    state: 'present',
    evidence: [
      {
        path: path.join(path.dirname(configPath), 'constitution', 'revision-authority.enc'),
        state: 'file',
        size: 1,
        fileCount: 1,
        directoryCount: 0,
        symlinkCount: 0,
        hardlinkCount: 0,
        truncated: false,
      },
    ],
    recommendedCoverage: 'encrypted-copy',
    requiredConsistency: 'quiesced-copy',
    requiredForRestore: true,
    sensitive: true,
    note: 'healthy v2 test authority',
  });
  return value;
}

class TestVault implements ExternalRecoveryVaultBackend {
  readonly provider = 'test-os-vault';
  wrapCalls = 0;

  async wrap(input: { secret: Buffer; keyId: string }): Promise<{ vaultRef: string; wrappedSecret: Uint8Array }> {
    this.wrapCalls += 1;
    return {
      vaultRef: `test-vault:${input.keyId}`,
      wrappedSecret: Buffer.from(input.secret.map((byte) => byte ^ 0x3c)),
    };
  }

  async unwrap(input: { keyId: string; vaultRef: string; wrappedSecret: Buffer }): Promise<Uint8Array> {
    if (input.vaultRef !== `test-vault:${input.keyId}`) throw new Error('test vault reference mismatch');
    return Buffer.from(input.wrappedSecret.map((byte) => byte ^ 0x3c));
  }
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('Desktop recovery mutation epoch', () => {
  it('is deterministic and changes when copied Desktop state changes', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-epoch-'));
    roots.push(root);
    const config = path.join(root, 'config');
    fs.mkdirSync(config);
    fs.writeFileSync(path.join(config, 'settings.json'), '{"theme":"dark"}');

    const first = await fingerprintDesktopRecoveryState(inventory(config));
    const second = await fingerprintDesktopRecoveryState(inventory(config));
    expect(second).toBe(first);

    fs.writeFileSync(path.join(config, 'settings.json'), '{"theme":"light"}');
    await expect(fingerprintDesktopRecoveryState(inventory(config))).resolves.not.toBe(first);
  });

  it('fails closed instead of following a symlink', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-epoch-'));
    roots.push(root);
    const config = path.join(root, 'config');
    fs.mkdirSync(config);
    fs.writeFileSync(path.join(root, 'outside.json'), '{}');
    fs.symlinkSync(path.join(root, 'outside.json'), path.join(config, 'linked.json'));

    await expect(fingerprintDesktopRecoveryState(inventory(config))).rejects.toThrow('refuses symlink');
  });

  it('fails closed on hard-linked state that can mutate outside the authority path', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-epoch-'));
    roots.push(root);
    const config = path.join(root, 'config');
    fs.mkdirSync(config);
    const outside = path.join(root, 'outside.json');
    fs.writeFileSync(outside, '{}');
    fs.linkSync(outside, path.join(config, 'linked.json'));

    await expect(fingerprintDesktopRecoveryState(inventory(config))).rejects.toThrow('refuses hard-linked');
  });
});

describe('Desktop-only production capture boundary', () => {
  function productionDriver(sourcePath: string, onOpen?: () => void): ISqliteDriver {
    onOpen?.();
    return {
      prepare: () => {
        throw new Error('prepare is not used by recovery capture');
      },
      exec: () => undefined,
      pragma: () => 53,
      transaction: (fn) => fn,
      backup: async (destinationPath) => fs.promises.copyFile(sourcePath, destinationPath),
      close: () => undefined,
    };
  }

  async function productionInventory(root: string, includeCore = false): Promise<RecoveryInventory> {
    const userDataRoot = path.join(root, 'user-data');
    const coreDefaultProfileRoot = path.join(root, 'core-default');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'preferences.json'), '{}');
    if (includeCore) {
      fs.mkdirSync(coreDefaultProfileRoot, { recursive: true });
      fs.writeFileSync(path.join(coreDefaultProfileRoot, 'memory.db'), 'core-state');
    }
    return inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: path.join(root, 'constitution'),
      coreDefaultProfileRoot,
      coreNamedProfilesRoot: path.join(root, 'core-profiles'),
    });
  }

  it('accepts only a complete Desktop-only authority inventory', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-desktop-only-'));
    roots.push(root);

    expect(assertDesktopOnlyRecoveryCaptureReady(await productionInventory(root))).toMatchObject({
      readyToCapture: true,
      dryRunOnly: true,
    });
  });

  it('captures conversation state instead of silently omitting it', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-unknown-authority-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const conversationsRoot = path.join(userDataRoot, 'conversations');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(conversationsRoot, { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'preferences.json'), '{}');
    fs.writeFileSync(path.join(conversationsRoot, 'conversation-1.json'), '{"messages":["must survive"]}');

    const discovered = await inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: path.join(root, 'constitution'),
      coreDefaultProfileRoot: path.join(root, 'core-default'),
      coreNamedProfilesRoot: path.join(root, 'core-profiles'),
    });

    expect(assertDesktopOnlyRecoveryCaptureReady(discovered).readyToCapture).toBe(true);
    expect(discovered.userDataRoots).toContainEqual(
      expect.objectContaining({ relativePath: 'conversations', disposition: 'captured' })
    );
    expect(
      discovered.authorities
        .find(({ id }) => id === 'desktop.runtime-files')
        ?.evidence.some(({ path: evidencePath, state }) => evidencePath === conversationsRoot && state === 'directory')
    ).toBe(true);
  });

  it('blocks capture when userData contains a genuinely unclassified mutable authority root', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-unknown-authority-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'mystery-authority'), { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'preferences.json'), '{}');
    fs.writeFileSync(path.join(userDataRoot, 'mystery-authority', 'state.json'), '{}');

    const discovered = await inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: path.join(root, 'constitution'),
      coreDefaultProfileRoot: path.join(root, 'core-default'),
      coreNamedProfilesRoot: path.join(root, 'core-profiles'),
    });

    expect(() => assertDesktopOnlyRecoveryCaptureReady(discovered)).toThrow('UNKNOWN_AUTHORITY_ROOT');
  });

  it('rejects present Core state before capture even if a caller could fabricate local lease behavior', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-core-block-'));
    roots.push(root);
    const coreInventory = await productionInventory(root, true);

    expect(() => assertDesktopOnlyRecoveryCaptureReady(coreInventory)).toThrow('CORE_QUIESCENCE_UNAVAILABLE');
  });

  it('composes the production entry point through inventory, dry-run, online backup, sealing, and publication', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-production-compose-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const destinationRoot = path.join(root, 'recovery-points');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite-production');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'preferences.json'), '{}');
    const opened: string[] = [];

    const result = await captureProductionRecoveryPoint(
      {
        destinationRoot,
        userDataRoot,
        sourceAppVersion: '0.11.18',
        sourceReleaseTrack: 'stable',
        desktopProfileLockHeld: true,
      },
      {
        resolveCoreRoots: () => ({
          defaultCoreRoot: path.join(root, 'absent-core-default'),
          namedCoreRoot: path.join(root, 'absent-core-profiles'),
          constitutionRoot: path.join(root, 'absent-constitution'),
        }),
        createDatabaseDriver: async (databasePath) => productionDriver(databasePath, () => opened.push(databasePath)),
        sealFile: async (sourcePath, outputPath) => {
          await fs.promises.writeFile(outputPath, Buffer.concat([Buffer.from('sealed:'), fs.readFileSync(sourcePath)]));
        },
        allowUnsafePathFallbackForTests: true,
      }
    );

    expect(opened).toHaveLength(2);
    expect(result.snapshotPath.startsWith(destinationRoot)).toBe(true);
    expect(fs.existsSync(result.manifestPath)).toBe(true);
    expect(result.manifest.files.some(({ authority }) => authority === 'desktop.database')).toBe(true);
  });

  it('blocks a new authority root created after initial inventory but before capture', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-late-root-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const destinationRoot = path.join(root, 'recovery-points');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite-production');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'preferences.json'), '{}');
    let opens = 0;

    await expect(
      captureProductionRecoveryPoint(
        {
          destinationRoot,
          userDataRoot,
          sourceAppVersion: '0.11.18',
          sourceReleaseTrack: 'stable',
          desktopProfileLockHeld: true,
        },
        {
          resolveCoreRoots: () => ({
            defaultCoreRoot: path.join(root, 'absent-core-default'),
            namedCoreRoot: path.join(root, 'absent-core-profiles'),
            constitutionRoot: path.join(root, 'absent-constitution'),
          }),
          createDatabaseDriver: async (databasePath) =>
            productionDriver(databasePath, () => {
              opens += 1;
              if (opens === 1) {
                fs.mkdirSync(path.join(userDataRoot, 'late-unknown'));
                fs.writeFileSync(path.join(userDataRoot, 'late-unknown', 'state.json'), '{}');
              }
            }),
          sealFile: async () => undefined,
          allowUnsafePathFallbackForTests: true,
        }
      )
    ).rejects.toThrow('UNKNOWN_AUTHORITY_ROOT');

    expect(opens).toBe(1);
    expect(fs.existsSync(destinationRoot)).toBe(false);
  });

  it('reclassifies the namespace immediately before publication and removes staging on late drift', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-post-quiescence-root-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const destinationRoot = path.join(root, 'recovery-points');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite-production');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'preferences.json'), '{}');
    let injected = false;

    await expect(
      captureProductionRecoveryPoint(
        {
          destinationRoot,
          userDataRoot,
          sourceAppVersion: '0.11.18',
          sourceReleaseTrack: 'stable',
          desktopProfileLockHeld: true,
        },
        {
          resolveCoreRoots: () => ({
            defaultCoreRoot: path.join(root, 'absent-core-default'),
            namedCoreRoot: path.join(root, 'absent-core-profiles'),
            constitutionRoot: path.join(root, 'absent-constitution'),
          }),
          createDatabaseDriver: async (databasePath) => productionDriver(databasePath),
          sealFile: async (sourcePath, outputPath) => {
            await fs.promises.copyFile(sourcePath, outputPath);
            if (!injected) {
              injected = true;
              fs.mkdirSync(path.join(userDataRoot, 'late-after-quiescence'));
              fs.writeFileSync(path.join(userDataRoot, 'late-after-quiescence', 'state.json'), '{}');
            }
          },
          allowUnsafePathFallbackForTests: true,
        }
      )
    ).rejects.toThrow('UNKNOWN_AUTHORITY_ROOT');

    expect(injected).toBe(true);
    expect(fs.existsSync(destinationRoot) ? fs.readdirSync(destinationRoot) : []).toEqual([]);
  });

  it('blocks unknown mutable state before opening SQLite or mutating the destination', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-production-block-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const destinationRoot = path.join(root, 'recovery-points');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'unknown-state'), { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite-production');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'preferences.json'), '{}');
    const driverOpened = vi.fn();

    await expect(
      captureProductionRecoveryPoint(
        {
          destinationRoot,
          userDataRoot,
          sourceAppVersion: '0.11.18',
          sourceReleaseTrack: 'stable',
          desktopProfileLockHeld: true,
        },
        {
          resolveCoreRoots: () => ({
            defaultCoreRoot: path.join(root, 'absent-core-default'),
            namedCoreRoot: path.join(root, 'absent-core-profiles'),
            constitutionRoot: path.join(root, 'absent-constitution'),
          }),
          createDatabaseDriver: async (databasePath) => productionDriver(databasePath, driverOpened),
          sealFile: async () => undefined,
        }
      )
    ).rejects.toThrow('UNKNOWN_AUTHORITY_ROOT');

    expect(driverOpened).not.toHaveBeenCalled();
    expect(fs.existsSync(destinationRoot)).toBe(false);
  });

  it('rejects a destination whose symlink-resolved path aliases live state', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-destination-'));
    roots.push(root);
    const liveRoot = path.join(root, 'live');
    const alias = path.join(root, 'live-alias');
    fs.mkdirSync(liveRoot);
    fs.symlinkSync(liveRoot, alias);

    await expect(assertRecoveryDestinationDisjoint(path.join(alias, 'snapshots'), [liveRoot])).rejects.toThrow(
      'disjoint from live state'
    );
    await expect(
      assertRecoveryDestinationDisjoint(path.join(root, 'disposable', 'snapshots'), [liveRoot])
    ).resolves.toBeUndefined();
  });
});

describe('healthy v2 external recovery authority capture boundary', () => {
  it('provisions and restarts one authority only under explicit healthy-v2 capture', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-authority-capture-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const config = path.join(userDataRoot, 'config');
    fs.mkdirSync(config, { recursive: true });
    const vault = new TestVault();
    const input = {
      userDataRoot,
      desktopSchemaVersion: 53,
      inventory: healthyV2Inventory(config),
      request: { confirmed: true as const, existingRecordDigests: [] },
    };

    const created = await provisionHealthyV2ExternalRecoveryAuthority(input, { externalRecoveryVault: vault });
    expect(created.authorityRoot).toBe(resolveExternalRecoveryAuthorityRoot(userDataRoot));
    expect(fs.existsSync(path.join(created.authorityRoot, 'events', '000000.json'))).toBe(true);
    expect(vault.wrapCalls).toBe(1);

    const restarted = await provisionHealthyV2ExternalRecoveryAuthority(input, { externalRecoveryVault: vault });
    expect(restarted.canonicalStateBytes).toEqual(created.canonicalStateBytes);
    expect(vault.wrapCalls).toBe(1);
  });

  it('rejects an unconfirmed/non-v2 source before invoking a vault or authority writer', async () => {
    const loadOrCreate = vi.fn();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-authority-capture-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    fs.mkdirSync(userDataRoot);
    const vault = new TestVault();

    await expect(
      provisionHealthyV2ExternalRecoveryAuthority(
        {
          userDataRoot,
          desktopSchemaVersion: 52,
          inventory: healthyV2Inventory(path.join(userDataRoot, 'config')),
          request: { confirmed: true, existingRecordDigests: [] },
        },
        { externalRecoveryVault: vault, loadOrCreateExternalRecoveryAuthority: loadOrCreate }
      )
    ).rejects.toThrow('explicit healthy v2 capture');
    expect(loadOrCreate).not.toHaveBeenCalled();
    expect(vault.wrapCalls).toBe(0);
  });

  it('rejects missing v2 revision authority and wipes loaded secret ownership on success', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-authority-capture-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    fs.mkdirSync(userDataRoot);
    const vault = new TestVault();
    const loadOrCreate = vi.fn();
    await expect(
      provisionHealthyV2ExternalRecoveryAuthority(
        {
          userDataRoot,
          desktopSchemaVersion: 53,
          inventory: inventory(path.join(userDataRoot, 'config')),
          request: { confirmed: true, existingRecordDigests: [] },
        },
        { externalRecoveryVault: vault, loadOrCreateExternalRecoveryAuthority: loadOrCreate }
      )
    ).rejects.toThrow('present v2 revision authority');
    expect(loadOrCreate).not.toHaveBeenCalled();

    const activeSecret = Buffer.alloc(32, 7);
    loadOrCreate.mockResolvedValueOnce({
      authorityRoot: resolveExternalRecoveryAuthorityRoot(userDataRoot),
      state: {} as never,
      canonicalStateBytes: Buffer.from('{}'),
      activeSecret,
      coveredRecordDigests: [],
      reconciledState: false,
    });
    await provisionHealthyV2ExternalRecoveryAuthority(
      {
        userDataRoot,
        desktopSchemaVersion: 53,
        inventory: healthyV2Inventory(path.join(userDataRoot, 'config')),
        request: { confirmed: true, existingRecordDigests: [] },
      },
      { externalRecoveryVault: vault, loadOrCreateExternalRecoveryAuthority: loadOrCreate }
    );
    expect(activeSecret).toEqual(Buffer.alloc(32));
  });
});
