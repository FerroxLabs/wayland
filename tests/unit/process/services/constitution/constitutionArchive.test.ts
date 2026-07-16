/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConstitutionArchiveStore } from '@process/services/constitution/constitutionArchive';

describe('ConstitutionArchiveStore', () => {
  let parent: string;
  let root: string;
  let store: ConstitutionArchiveStore;

  beforeEach(async () => {
    parent = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-constitution-history-'));
    root = path.join(parent, '.wayland');
    await fs.mkdir(root, { mode: 0o700 });
    store = new ConstitutionArchiveStore(root);
  });

  afterEach(async () => {
    await fs.rm(parent, { recursive: true, force: true });
  });

  it('archives Constitution prose before overwrite and exposes metadata only', async () => {
    const source = path.join(root, 'CONSTITUTION.md');
    await fs.writeFile(source, 'private authored rules', { mode: 0o600 });

    const archived = store.archiveFile(source, { kind: 'constitution', sourceName: 'CONSTITUTION.md' });

    expect(archived).toMatchObject({
      targetKind: 'constitution',
      sourceName: 'CONSTITUTION.md',
      bytes: Buffer.byteLength('private authored rules'),
    });
    expect(JSON.stringify(archived)).not.toContain('private authored rules');
    expect(store.list()).toEqual([archived]);

    const recordPath = path.join(root, 'archives', 'constitution-history', 'active', `${archived?.archiveId}.json`);
    const record = JSON.parse(await fs.readFile(recordPath, 'utf8')) as {
      content: string;
      contentDigest: string;
    };
    expect(record.content).toBe('private authored rules');
    expect(record.contentDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('restores a Constitution without losing the version it replaces', async () => {
    const source = path.join(root, 'CONSTITUTION.md');
    await fs.writeFile(source, 'version one', { mode: 0o600 });
    const first = store.archiveFile(source, { kind: 'constitution', sourceName: 'CONSTITUTION.md' });
    if (!first) throw new Error('Expected archive');
    await fs.writeFile(source, 'version two', { mode: 0o600 });

    const restored = store.restore(first.archiveId);

    expect(restored).toEqual(first);
    expect(await fs.readFile(source, 'utf8')).toBe('version one');
    expect(store.list()).toEqual([
      expect.objectContaining({ targetKind: 'constitution', bytes: Buffer.byteLength('version two') }),
    ]);
    await expect(
      fs.stat(path.join(root, 'archives', 'constitution-history', 'restored', `${first.archiveId}.json`))
    ).resolves.toBeDefined();
  });

  it('restores a specialist overlay to its exact confined identity', async () => {
    const specialists = path.join(root, 'specialists');
    await fs.mkdir(specialists);
    const source = path.join(specialists, 'copy.md');
    await fs.writeFile(source, 'copy rules', { mode: 0o600 });
    const archived = store.archiveFile(source, {
      kind: 'specialist',
      specialistId: 'copy',
      sourceName: 'copy.md',
    });
    if (!archived) throw new Error('Expected archive');
    await fs.unlink(source);

    store.restore(archived.archiveId);

    expect(await fs.readFile(source, 'utf8')).toBe('copy rules');
  });

  it('fails closed when archived prose is tampered', async () => {
    const source = path.join(root, 'CONSTITUTION.md');
    await fs.writeFile(source, 'original', { mode: 0o600 });
    const archived = store.archiveFile(source, { kind: 'constitution', sourceName: 'CONSTITUTION.md' });
    if (!archived) throw new Error('Expected archive');
    const recordPath = path.join(root, 'archives', 'constitution-history', 'active', `${archived.archiveId}.json`);
    const record = JSON.parse(await fs.readFile(recordPath, 'utf8')) as { content: string };
    record.content = 'tampered';
    await fs.writeFile(recordPath, JSON.stringify(record), { mode: 0o600 });

    expect(() => store.list()).toThrow('digest mismatch');
    expect(() => store.restore(archived.archiveId)).toThrow('digest mismatch');
    expect(await fs.readFile(source, 'utf8')).toBe('original');
  });

  it('rejects child symlink redirection without writing outside the Wayland root', async () => {
    if (process.platform === 'win32') return;
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-constitution-outside-'));
    try {
      await fs.symlink(outside, path.join(root, 'archives'));
      const source = path.join(root, 'CONSTITUTION.md');
      await fs.writeFile(source, 'rules', { mode: 0o600 });

      expect(() => store.archiveFile(source, { kind: 'constitution', sourceName: 'CONSTITUTION.md' })).toThrow(
        'Unsafe Constitution history directory'
      );
      expect(await fs.readdir(outside)).toEqual([]);
    } finally {
      await fs.rm(outside, { recursive: true, force: true });
    }
  });

  it('accepts a trusted top-level Wayland root symlink but rejects a symlink restore destination', async () => {
    if (process.platform === 'win32') return;
    const alias = path.join(parent, 'wayland-alias');
    await fs.symlink(root, alias);
    const aliasStore = new ConstitutionArchiveStore(alias);
    const source = path.join(root, 'CONSTITUTION.md');
    await fs.writeFile(source, 'rules', { mode: 0o600 });
    const archived = aliasStore.archiveFile(source, { kind: 'constitution', sourceName: 'CONSTITUTION.md' });
    if (!archived) throw new Error('Expected archive');

    const outside = path.join(parent, 'outside.md');
    await fs.writeFile(outside, 'outside', { mode: 0o600 });
    await fs.unlink(source);
    await fs.symlink(outside, source);

    expect(() => aliasStore.restore(archived.archiveId)).toThrow('Unsafe Constitution restore destination');
    expect(await fs.readFile(outside, 'utf8')).toBe('outside');
  });

  it('rejects invalid history identifiers before filesystem lookup', () => {
    expect(() => store.restore('../../etc/passwd')).toThrow('Invalid Constitution history id');
  });
});
