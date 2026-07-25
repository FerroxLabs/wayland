import { existsSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ProjectConfigTransaction,
  recoverProjectConfigTransaction,
} from '@process/agent/wcore/projectConfigTransaction';

describe('WCore project config crash transaction', () => {
  let root: string;
  let target: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'wayland-wcore-config-'));
    target = join(root, '.wcore.toml');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('restores the exact original bytes after an ordinary launch', () => {
    const original = '# user bytes\r\n[tools]\r\nauto = false\r\n';
    writeFileSync(target, original);
    const transaction = ProjectConfigTransaction.begin(target, '[providers.test]\nbase_url = "safe"\n');

    expect(readFileSync(target, 'utf-8')).toContain('providers.test');
    transaction.restore();

    expect(readFileSync(target, 'utf-8')).toBe(original);
    expect(existsSync(`${target}.wayland-desktop.transaction.json`)).toBe(false);
    expect(existsSync(`${target}.wayland-desktop.backup`)).toBe(false);
  });

  it('removes a launch-only file when no project config existed before', () => {
    const transaction = ProjectConfigTransaction.begin(target, '[providers.test]\nbase_url = "safe"\n');
    expect(existsSync(target)).toBe(true);

    transaction.restore();
    expect(existsSync(target)).toBe(false);
  });

  it('heals a process-death journal on the next launch', () => {
    writeFileSync(target, 'original\n');
    ProjectConfigTransaction.begin(target, 'temporary-authority\n');

    expect(recoverProjectConfigTransaction(target)).toBe('restored');
    expect(readFileSync(target, 'utf-8')).toBe('original\n');
  });

  it('preserves a user edit made after the temporary file was published', () => {
    writeFileSync(target, 'original\n');
    ProjectConfigTransaction.begin(target, 'temporary-authority\n');
    writeFileSync(target, 'user-newer\n');

    expect(recoverProjectConfigTransaction(target)).toBe('preserved-newer');
    expect(readFileSync(target, 'utf-8')).toBe('user-newer\n');
  });

  it('fails closed on a malformed recovery marker', () => {
    writeFileSync(`${target}.wayland-desktop.transaction.json`, '{"version":99}\n');
    expect(() => recoverProjectConfigTransaction(target)).toThrow(/invalid/i);
  });

  it('rejects a final-component project-config symlink without copying its target', () => {
    const secret = join(root, 'credential.txt');
    writeFileSync(secret, 'do-not-copy\n');
    symlinkSync(secret, target);

    expect(() => ProjectConfigTransaction.begin(target, 'temporary-authority\n')).toThrow(/non-regular|symbolic|ELOOP/i);
    expect(readFileSync(secret, 'utf-8')).toBe('do-not-copy\n');
    expect(existsSync(`${target}.wayland-desktop.backup`)).toBe(false);
  });
});
