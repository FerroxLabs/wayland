/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrateDirectoryWithRecovery, verifyDirectoryFiles } from '../../src/process/utils/utils';

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-dir-migration-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('verifyDirectoryFiles byte identity', () => {
  it('rejects equal filename structure with different file bytes', async () => {
    const left = path.join(root, 'left');
    const right = path.join(root, 'right');
    fs.mkdirSync(left);
    fs.mkdirSync(right);
    fs.writeFileSync(path.join(left, 'wayland-config.txt'), 'provider=A');
    fs.writeFileSync(path.join(right, 'wayland-config.txt'), 'provider=B');

    await expect(verifyDirectoryFiles(left, right)).resolves.toBe(false);
  });

  it('accepts byte-identical nested regular files', async () => {
    const left = path.join(root, 'left');
    const right = path.join(root, 'right');
    fs.mkdirSync(path.join(left, 'nested'), { recursive: true });
    fs.mkdirSync(path.join(right, 'nested'), { recursive: true });
    fs.writeFileSync(path.join(left, 'nested', 'chat.txt'), Buffer.from([0, 1, 2, 255]));
    fs.writeFileSync(path.join(right, 'nested', 'chat.txt'), Buffer.from([0, 1, 2, 255]));

    await expect(verifyDirectoryFiles(left, right)).resolves.toBe(true);
  });
});

describe('migrateDirectoryWithRecovery', () => {
  it('publishes an exact recovery copy and receipt before removing the legacy source name', async () => {
    const source = path.join(root, 'legacy');
    const destination = path.join(root, 'active');
    const recoveryRoot = path.join(root, 'recovery');
    fs.mkdirSync(path.join(source, 'assistants'), { recursive: true });
    fs.writeFileSync(path.join(source, 'wayland-config.txt'), 'secret config bytes');
    fs.writeFileSync(path.join(source, 'assistants', 'custom.md'), 'custom assistant bytes');

    const result = await migrateDirectoryWithRecovery(source, destination, recoveryRoot);

    expect(result.migrated).toBe(true);
    expect(result.sourceRetained).toBe(false);
    expect(result.recoveryPath).toBeDefined();
    expect(fs.existsSync(source)).toBe(false);
    await expect(verifyDirectoryFiles(destination, result.recoveryPath as string)).resolves.toBe(true);
    const receipt = JSON.parse(fs.readFileSync(`${result.recoveryPath as string}.json`, 'utf8')) as {
      kind: string;
      sourcePath: string;
      recoveryPath: string;
    };
    expect(receipt.kind).toBe('wayland-legacy-config-recovery');
    expect(receipt.sourcePath).toBe(path.resolve(source));
    expect(receipt.recoveryPath).toBe(path.resolve(result.recoveryPath as string));
  });

  it('keeps the legacy source when the recovery location cannot be published', async () => {
    const source = path.join(root, 'legacy');
    const destination = path.join(root, 'active');
    const blockedRecoveryRoot = path.join(root, 'recovery-blocker');
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, 'wayland-config.txt'), 'keep me');
    fs.writeFileSync(blockedRecoveryRoot, 'not a directory');

    const result = await migrateDirectoryWithRecovery(source, destination, blockedRecoveryRoot);

    expect(result).toMatchObject({ migrated: true, sourceRetained: true });
    expect(fs.readFileSync(path.join(source, 'wayland-config.txt'), 'utf8')).toBe('keep me');
    expect(fs.readFileSync(path.join(destination, 'wayland-config.txt'), 'utf8')).toBe('keep me');
  });

  it.skipIf(process.platform === 'win32')('rejects symlink-following as migration identity', async () => {
    const source = path.join(root, 'legacy');
    const destination = path.join(root, 'active');
    const recoveryRoot = path.join(root, 'recovery');
    const external = path.join(root, 'external-secret');
    fs.mkdirSync(source);
    fs.writeFileSync(external, 'outside bytes');
    fs.symlinkSync(external, path.join(source, 'linked-secret'));

    const result = await migrateDirectoryWithRecovery(source, destination, recoveryRoot);

    expect(result).toEqual({ migrated: false, sourceRetained: true });
    expect(fs.lstatSync(path.join(source, 'linked-secret')).isSymbolicLink()).toBe(true);
  });
});
