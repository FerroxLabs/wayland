/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('updater rollback acceptance runner', () => {
  it('emits a machine-readable blocker instead of passing without a signed candidate', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'wayland-m8c-runner-'));
    temporaryRoots.push(root);
    const outputPath = path.join(root, 'receipt.json');
    const result = spawnSync('bun', ['scripts/run-updater-rollback-reupgrade.ts', '--out', outputPath], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    const receipt = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(receipt).toMatchObject({
      contract: 'wayland-updater-rollback-reupgrade-run/1.0',
      status: 'blocked',
      code: 'M8C_REQUIRED_EVIDENCE_MISSING',
      detail: 'signed-candidate-artifact',
    });
  });
});
