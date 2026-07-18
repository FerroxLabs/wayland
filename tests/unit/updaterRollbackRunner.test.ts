/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('updater rollback acceptance runner', () => {
  it('emits a machine-readable blocker without an attested packaged observation', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'wayland-m8c-runner-'));
    temporaryRoots.push(root);
    const outputPath = path.join(root, 'receipt.json');
    const result = spawnSync('bun', ['scripts/run-updater-rollback-reupgrade.ts', '--out', outputPath], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toMatchObject({
      contract: 'wayland-updater-rollback-reupgrade-run/1.0',
      status: 'blocked',
      code: 'M8C_REQUIRED_EVIDENCE_MISSING',
      detail: 'attested-packaged-observation',
    });
  });

  it('cannot promote a caller-authored observation without canonical provenance', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'wayland-m8c-unattested-'));
    temporaryRoots.push(root);
    const observationPath = path.join(root, 'observation.json');
    const outputPath = path.join(root, 'result.json');
    writeFileSync(observationPath, '{}');

    const result = spawnSync(
      'bun',
      ['scripts/run-updater-rollback-reupgrade.ts', '--observation', observationPath, '--out', outputPath],
      { cwd: process.cwd(), encoding: 'utf8' }
    );

    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toMatchObject({
      contract: 'wayland-updater-rollback-reupgrade-run/1.0',
      status: 'blocked',
      code: 'M8C_OBSERVATION_INVALID',
    });
  });
});
