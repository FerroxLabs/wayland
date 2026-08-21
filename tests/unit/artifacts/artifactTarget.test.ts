/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9. The renderer asks to open an ARTIFACT ID. Everything between that id
 * and an OS launcher is here.
 *
 * The interesting cases are not "does it find the file". They are the ones
 * where the filesystem changed under us between the ledger being written and
 * the user clicking Open - which, on a workspace an agent writes to on a cron,
 * is not a hypothetical.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { registerArtifacts } from '@process/services/artifacts/artifactLedger';
import type { ArtifactRecord } from '@process/services/artifacts/artifactLedger';
import { readVerifiedArtifact, resolveArtifactTarget } from '@process/services/artifacts/artifactTarget';

let root: string;
let workspace: string;
let ledgerPath: string;

const register = async (relative: string, contents: string): Promise<ArtifactRecord> => {
  await fs.mkdir(path.dirname(path.join(workspace, relative)), { recursive: true });
  await fs.writeFile(path.join(workspace, relative), contents);
  const result = await registerArtifacts({
    ledgerPath,
    workspace,
    runDir: workspace,
    taskId: 'morning-brief',
    runId: 'r1',
    declaredBy: 'market-open-report',
    declarations: [{ path: relative, title: 'Morning Brief' }],
  });
  expect(result.rejected).toEqual([]);
  expect(result.registered).toHaveLength(1);
  return result.registered[0];
};

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'artifact-target-'));
  workspace = path.join(root, 'workspace');
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
  await fs.mkdir(workspace, { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('resolveArtifactTarget', () => {
  it('resolves a registered artifact to its canonical path', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const outcome = await resolveArtifactTarget(record.artifactId, [record]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.path.endsWith(path.join('2026-08-20', 'r1', 'brief.html'))).toBe(true);
    expect(outcome.record.artifactId).toBe(record.artifactId);
  });

  it('refuses an id that is not an id, before touching the filesystem', async () => {
    for (const bogus of ['', '../../etc/passwd', 'NOT-HEX', 'a'.repeat(31), 'a'.repeat(33), 'A'.repeat(32)]) {
      const outcome = await resolveArtifactTarget(bogus, []);
      expect(outcome.ok).toBe(false);
    }
  });

  it('refuses an id the ledger does not know', async () => {
    const outcome = await resolveArtifactTarget('a'.repeat(32), []);
    expect(outcome.ok).toBe(false);
  });

  it('refuses a record whose relative path escapes the workspace', async () => {
    const record = await register('artifacts/brief.html', 'x');
    const tampered: ArtifactRecord = { ...record, relativePath: '../../../../etc/passwd' };
    const outcome = await resolveArtifactTarget(tampered.artifactId, [tampered]);
    expect(outcome.ok).toBe(false);
  });

  it('refuses a SYMLINKED LEAF - the record would name one file and open another', async () => {
    const record = await register('artifacts/brief.html', '<h1>brief</h1>');
    const secret = path.join(root, 'secret.command');
    await fs.writeFile(secret, '#!/bin/sh\necho pwned\n');
    const target = path.join(workspace, record.relativePath);
    await fs.rm(target);
    await fs.symlink(secret, target);
    const outcome = await resolveArtifactTarget(record.artifactId, [record]);
    expect(outcome.ok).toBe(false);
  });

  it('refuses a SYMLINKED ANCESTOR - checking only the leaf is not enough', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    // Swap the `r1` DIRECTORY for a link to somewhere else. The leaf is still a
    // plain file; every byte of the path still looks in-workspace.
    const elsewhere = path.join(root, 'elsewhere');
    await fs.mkdir(elsewhere, { recursive: true });
    await fs.writeFile(path.join(elsewhere, 'brief.html'), '<h1>brief</h1>');
    const runDir = path.join(workspace, 'artifacts', '2026-08-20', 'r1');
    await fs.rm(runDir, { recursive: true, force: true });
    await fs.symlink(elsewhere, runDir);

    const outcome = await resolveArtifactTarget(record.artifactId, [record]);
    expect(outcome.ok).toBe(false);
  });

  it('refuses a directory swapped in where a file was recorded', async () => {
    const record = await register('artifacts/brief.html', 'x');
    const target = path.join(workspace, record.relativePath);
    await fs.rm(target);
    await fs.mkdir(target);
    const outcome = await resolveArtifactTarget(record.artifactId, [record]);
    expect(outcome.ok).toBe(false);
  });

  it('refuses when the bytes no longer match the ledger digest', async () => {
    const record = await register('artifacts/brief.html', '<h1>brief</h1>');
    await fs.writeFile(path.join(workspace, record.relativePath), '<h1>SOMETHING ELSE ENTIRELY</h1>');
    const outcome = await resolveArtifactTarget(record.artifactId, [record]);
    expect(outcome.ok).toBe(false);
  });

  it('refuses when the file is gone', async () => {
    const record = await register('artifacts/brief.html', 'x');
    await fs.rm(path.join(workspace, record.relativePath));
    const outcome = await resolveArtifactTarget(record.artifactId, [record]);
    expect(outcome.ok).toBe(false);
  });
});

describe('readVerifiedArtifact', () => {
  it('returns the bytes the ledger vouched for', async () => {
    const record = await register('artifacts/brief.html', '<h1>brief</h1>');
    const outcome = await readVerifiedArtifact(record.artifactId, [record]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.contents.toString('utf-8')).toBe('<h1>brief</h1>');
  });

  it('refuses to hand over bytes that no longer match the digest', async () => {
    const record = await register('artifacts/brief.html', '<h1>brief</h1>');
    await fs.writeFile(path.join(workspace, record.relativePath), 'swapped');
    const outcome = await readVerifiedArtifact(record.artifactId, [record]);
    expect(outcome.ok).toBe(false);
  });

  /**
   * The SAME LENGTH, which is the only version of this that reaches the digest.
   *
   * Every other tamper case here changes the byte count, so
   * `stat.size !== record.sizeBytes` refuses first and the sha256 comparison
   * never runs - delete the digest check and they all still pass. This one
   * keeps the size identical (14 bytes either way), so the digest is the only
   * thing left standing between a swapped file and the recipient.
   *
   * The scenario is not theoretical: an agent with workspace write access
   * replaces the deliverable during the confirmation pause. The dialog names
   * `brief.html` and the honest size; without this check the bytes on the wire
   * are the attacker's.
   */
  it('refuses bytes swapped for DIFFERENT content of the SAME length', async () => {
    const original = '<h1>brief</h1>';
    const tampered = '<h1>EVIL!</h1>';
    expect(tampered.length).toBe(original.length);

    const record = await register('artifacts/brief.html', original);
    await fs.writeFile(path.join(workspace, record.relativePath), tampered);

    const outcome = await readVerifiedArtifact(record.artifactId, [record]);
    expect(outcome.ok).toBe(false);
    // Control, same fixture: the untampered file IS handed over, so the refusal
    // above is the digest deciding and not the read failing for some other reason.
    const clean = await register('artifacts/clean.html', original);
    const ok = await readVerifiedArtifact(clean.artifactId, [clean]);
    expect(ok.ok).toBe(true);
  });
});
