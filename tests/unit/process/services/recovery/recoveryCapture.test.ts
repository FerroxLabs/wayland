/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fingerprintDesktopRecoveryState } from '@process/services/recovery/recoveryCapture';
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
