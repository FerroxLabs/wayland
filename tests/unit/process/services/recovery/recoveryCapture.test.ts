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
  fingerprintDesktopRecoveryState,
  provisionHealthyV2ExternalRecoveryAuthority,
} from '@process/services/recovery/recoveryCapture';
import { resolveExternalRecoveryAuthorityRoot } from '@process/services/recovery/externalRecoveryAuthority';
import type { ExternalRecoveryVaultBackend } from '@process/services/recovery/externalRecoveryAuthority';
import type { RecoveryInventory } from '@process/services/recovery/stateAuthorityInventory';

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
