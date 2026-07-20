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
    await fs.rm(workspace, { recursive: true });
    await fs.mkdir(workspace);

    await expect(
      recordManagedWorkspaceProvenance(
        { authorityRoot, workRoot, workspace, installationId: INSTALLATION_ID, creationIdentity: originalIdentity },
        codec
      )
    ).rejects.toThrow('MANAGED_WORKSPACE_PROVENANCE_UNSAFE_TARGET');
  });

  it('rejects a successor identity even when it reuses the created pathname', async () => {
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
    await fs.rm(workspace, { recursive: true });
    await fs.mkdir(workspace);

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
