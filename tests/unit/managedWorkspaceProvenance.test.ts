/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  loadManagedWorkspaceProvenance,
  managedWorkspaceProvenanceLedgerPath,
  recordManagedWorkspaceProvenance,
  type ManagedWorkspaceProvenanceCodec,
} from '@/process/services/managedWorkspaceProvenance';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const INSTALLATION_ID = 'installation-a';
const codec: ManagedWorkspaceProvenanceCodec = {
  encrypt: (plaintext) => Buffer.from([...plaintext].toReversed().join(''), 'utf8').toString('base64'),
  decrypt: (ciphertext) => [...Buffer.from(ciphertext, 'base64').toString('utf8')].toReversed().join(''),
};

describe('managed workspace provenance', () => {
  let root: string;
  let authorityRoot: string;
  let workRoot: string;
  let workspace: string;

  async function creationIdentity() {
    const stat = await fs.lstat(workspace);
    return {
      canonicalRoot: await fs.realpath(workRoot),
      canonicalPath: await fs.realpath(workspace),
      device: stat.dev,
      inode: stat.ino,
    };
  }

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-provenance-'));
    authorityRoot = path.join(root, 'authority');
    workRoot = path.join(root, 'work');
    workspace = path.join(workRoot, 'claude-temp-1736900000000');
    await fs.mkdir(workspace, { recursive: true });
  });

  /**
   * Replace `workspace` with a directory that is genuinely a different object.
   *
   * `rm` then `mkdir` at the same path is NOT enough. Linux hands the freed
   * inode straight back, so the replacement is indistinguishable from the
   * original and the identity checks under test never trip; macOS APFS never
   * reuses an inode. Measured 3/3 reused on ubuntu and 3/3 fresh on APFS, which
   * is exactly why these two cases passed locally and failed only on ubuntu.
   *
   * Creating the successor while the original still exists guarantees a distinct
   * inode, and a rename preserves the inode it was created with, so this holds
   * on every filesystem.
   */
  async function replaceWorkspaceWithDistinctDirectory(): Promise<void> {
    const successor = `${workspace}.successor`;
    await fs.mkdir(successor);
    await fs.rm(workspace, { recursive: true });
    await fs.rename(successor, workspace);
  }

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('records and reloads an encrypted installation-bound filesystem identity', async () => {
    const recorded = await recordManagedWorkspaceProvenance(
      {
        authorityRoot,
        workRoot,
        workspace,
        installationId: INSTALLATION_ID,
        creationIdentity: await creationIdentity(),
        createdAtMs: 123,
      },
      codec
    );
    const loaded = await loadManagedWorkspaceProvenance(authorityRoot, INSTALLATION_ID, codec);

    expect(loaded).toEqual({ state: 'complete', records: [recorded], errors: [] });
    expect(recorded).toMatchObject({
      installationId: INSTALLATION_ID,
      canonicalRoot: await fs.realpath(workRoot),
      canonicalPath: await fs.realpath(workspace),
      createdAtMs: 123,
    });
    const ciphertext = await fs.readFile(managedWorkspaceProvenanceLedgerPath(authorityRoot), 'utf8');
    expect(ciphertext).not.toContain(INSTALLATION_ID);
    expect(ciphertext).not.toContain(workspace);
  });

  it('rejects a copied ledger from another installation', async () => {
    await recordManagedWorkspaceProvenance(
      {
        authorityRoot,
        workRoot,
        workspace,
        installationId: INSTALLATION_ID,
        creationIdentity: await creationIdentity(),
      },
      codec
    );
    await expect(loadManagedWorkspaceProvenance(authorityRoot, 'installation-b', codec)).resolves.toMatchObject({
      state: 'error',
      records: [],
    });
  });

  it('rejects path reuse when the directory identity changes', async () => {
    const originalIdentity = await creationIdentity();
    await recordManagedWorkspaceProvenance(
      { authorityRoot, workRoot, workspace, installationId: INSTALLATION_ID, creationIdentity: originalIdentity },
      codec
    );
    await replaceWorkspaceWithDistinctDirectory();
    // Prove the premise instead of trusting the filesystem to provide it.
    expect((await fs.lstat(workspace)).ino).not.toBe(originalIdentity.inode);

    await expect(
      recordManagedWorkspaceProvenance(
        { authorityRoot, workRoot, workspace, installationId: INSTALLATION_ID, creationIdentity: originalIdentity },
        codec
      )
    ).rejects.toThrow('MANAGED_WORKSPACE_PROVENANCE_UNSAFE_TARGET');
  });

  it('rejects a successor identity even when it reuses the created pathname', async () => {
    const recorded = await recordManagedWorkspaceProvenance(
      {
        authorityRoot,
        workRoot,
        workspace,
        installationId: INSTALLATION_ID,
        creationIdentity: await creationIdentity(),
      },
      codec
    );
    await replaceWorkspaceWithDistinctDirectory();
    expect((await fs.lstat(workspace)).ino).not.toBe(recorded.inode);

    await expect(
      recordManagedWorkspaceProvenance(
        {
          authorityRoot,
          workRoot,
          workspace,
          installationId: INSTALLATION_ID,
          creationIdentity: await creationIdentity(),
        },
        codec
      )
    ).rejects.toThrow('MANAGED_WORKSPACE_PROVENANCE_PATH_REUSED');
  });

  it('fails closed for malformed ciphertext without returning partial records', async () => {
    await fs.mkdir(authorityRoot, { recursive: true });
    await fs.writeFile(managedWorkspaceProvenanceLedgerPath(authorityRoot), 'not-a-ledger');

    await expect(loadManagedWorkspaceProvenance(authorityRoot, INSTALLATION_ID, codec)).resolves.toMatchObject({
      state: 'error',
      records: [],
    });
  });
});
