/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyRouteOrRollback } from '@process/connectors/verifyRoute';

describe('verifyRouteOrRollback', () => {
  let tmpDir: string;
  let configPath: string;
  let backupPath: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'flux-verify-'));
    configPath = path.join(tmpDir, 'opencode.json');
    backupPath = path.join(tmpDir, 'opencode.json.bak');
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('probe true → ok, no rollback, config untouched', async () => {
    const sentinel = '{"provider":{"flux":"new"}}';
    await fs.promises.writeFile(configPath, sentinel, 'utf-8');
    const before = await fs.promises.readFile(configPath);

    const result = await verifyRouteOrRollback({
      configPath,
      backupPath,
      probe: async () => true,
    });

    expect(result).toEqual({ ok: true, rolledBack: false });
    const after = await fs.promises.readFile(configPath);
    expect(after.equals(before)).toBe(true);
  });

  it('probe false → default restore brings back backup content', async () => {
    const backupContent = '{"provider":{"flux":"old"}}';
    await fs.promises.writeFile(backupPath, backupContent, 'utf-8');
    await fs.promises.writeFile(configPath, '{"provider":{"flux":"new"}}', 'utf-8');

    const result = await verifyRouteOrRollback({
      configPath,
      backupPath,
      probe: async () => false,
    });

    expect(result).toEqual({ ok: false, rolledBack: true });
    const restored = await fs.promises.readFile(configPath, 'utf-8');
    expect(restored).toBe(backupContent);
  });

  it('probe throws → same rollback path as false', async () => {
    const backupContent = '{"provider":{"flux":"old"}}';
    await fs.promises.writeFile(backupPath, backupContent, 'utf-8');
    await fs.promises.writeFile(configPath, '{"provider":{"flux":"new"}}', 'utf-8');

    const result = await verifyRouteOrRollback({
      configPath,
      backupPath,
      probe: async () => {
        throw new Error('connection refused');
      },
    });

    expect(result).toEqual({ ok: false, rolledBack: true });
    const restored = await fs.promises.readFile(configPath, 'utf-8');
    expect(restored).toBe(backupContent);
  });

  it('missing backup + probe false → default restore deletes the config', async () => {
    await fs.promises.writeFile(configPath, '{"provider":{"flux":"new"}}', 'utf-8');
    // backupPath intentionally not created.

    const result = await verifyRouteOrRollback({
      configPath,
      backupPath,
      probe: async () => false,
    });

    expect(result).toEqual({ ok: false, rolledBack: true });
    await expect(fs.promises.access(configPath)).rejects.toThrow();
  });

  it('restore throws → ok:false, rolledBack:false, does not throw', async () => {
    await fs.promises.writeFile(configPath, '{"provider":{"flux":"new"}}', 'utf-8');
    const restore = vi.fn(async () => {
      throw new Error('disk full');
    });

    const result = await verifyRouteOrRollback({
      configPath,
      backupPath,
      probe: async () => false,
      restore,
    });

    expect(result).toEqual({ ok: false, rolledBack: false });
    expect(restore).toHaveBeenCalledWith(backupPath, configPath);
  });
});
