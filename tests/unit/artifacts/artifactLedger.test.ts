/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  MAX_ARTIFACT_BYTES,
  MAX_DECLARATIONS_PER_RUN,
  readArtifactLedger,
  registerArtifacts,
} from '../../../src/process/services/artifacts/artifactLedger';

/**
 * P2-7. A metadata ledger, NOT a store.
 *
 * The bytes never move. The ledger records where a deliverable is, what it
 * hashed to, which run produced it, and who declared it - which is what makes
 * a series listable, a provenance chain real, and a file findable again after
 * the user drags the folder somewhere else in Finder. There is deliberately no
 * second copy of the bytes: a blob store would double the disk cost and add a
 * quota and retention surface this milestone does not need.
 *
 * THE SECURITY POSTURE THAT SHAPES REGISTRATION: A DECLARATION IS A CLAIM, NOT
 * A PROOF. The declaring party is a skill - model-authored text executing in a
 * shell. "I produced ../../../.ssh/id_rsa" is a sentence anybody can write. So
 * registration verifies every claim against the filesystem before it becomes a
 * record, and a rejected claim is reported rather than thrown, so one bad
 * declaration in a run cannot take the run's real deliverables down with it.
 */

const tmpRoots: string[] = [];

function tmpWorkspace(): { workspace: string; runDir: string; ledgerPath: string } {
  const root = mkdtempSync(path.join(os.tmpdir(), 'wl-ledger-'));
  tmpRoots.push(root);
  const workspace = path.join(root, 'workspace');
  const runDir = path.join(workspace, 'artifacts', 'market', '2026-08-20', 'r1');
  mkdirSync(runDir, { recursive: true });
  return { workspace, runDir, ledgerPath: path.join(root, 'artifact-ledger.jsonl') };
}

afterAll(() => {
  for (const root of tmpRoots) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Temp dirs are reaped by the OS.
    }
  }
});

const RUN = { taskId: 'weekday-morning-report', runId: 'r-abc', declaredBy: 'wayland-morning-report' };

describe('a declaration that checks out becomes a record', () => {
  it('records metadata about the file and never copies it', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    writeFileSync(path.join(runDir, 'brief.html'), '<h1>brief</h1>', 'utf-8');

    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: [{ path: 'brief.html', title: 'Morning brief' }],
      now: new Date(2026, 7, 20, 7, 0, 0),
    });

    expect(result.rejected).toEqual([]);
    expect(result.registered).toHaveLength(1);
    const record = result.registered[0];
    expect(record.relativePath).toBe('artifacts/market/2026-08-20/r1/brief.html');
    expect(record.title).toBe('Morning brief');
    expect(record.sizeBytes).toBe(14);
    expect(record.sha256).toBe(createHash('sha256').update('<h1>brief</h1>').digest('hex'));
    expect(record.taskId).toBe(RUN.taskId);
    expect(record.runId).toBe(RUN.runId);
    expect(record.declaredBy).toBe(RUN.declaredBy);
    expect(record.state).toBe('published');

    // No blob store: nothing was written next to the ledger except the ledger.
    const persisted = await readArtifactLedger(ledgerPath);
    expect(persisted).toEqual(result.registered);
  });

  it('gives the same file the same id across a re-registration, so counts cannot inflate', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    writeFileSync(path.join(runDir, 'brief.html'), 'x', 'utf-8');
    const input = { ledgerPath, workspace, runDir, ...RUN, declarations: [{ path: 'brief.html' }] };

    const first = await registerArtifacts(input);
    const second = await registerArtifacts(input);

    expect(second.registered[0].artifactId).toBe(first.registered[0].artifactId);
    expect(await readArtifactLedger(ledgerPath)).toHaveLength(1);
  });

  it('survives a torn trailing line without losing the records before it', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    writeFileSync(path.join(runDir, 'brief.html'), 'x', 'utf-8');
    await registerArtifacts({ ledgerPath, workspace, runDir, ...RUN, declarations: [{ path: 'brief.html' }] });

    appendFileSync(ledgerPath, '{"version":1,"artifactId":"tor', 'utf-8');

    expect(await readArtifactLedger(ledgerPath)).toHaveLength(1);
  });

  it('reads an absent ledger as empty rather than throwing', async () => {
    const { ledgerPath } = tmpWorkspace();
    expect(await readArtifactLedger(ledgerPath)).toEqual([]);
  });

  /**
   * The reader validates every row, not just the last one, because the ledger
   * is an APPEND-ONLY FILE beside the workspace: anything with write access to
   * the app's data directory can add a line, and a row is later handed to
   * Open/Reveal affordances as a host-blessed location. Only the "torn trailing
   * line" case was covered, so every one of these shapes was accepted.
   */
  it.each([
    ['a relative path that traverses out', '{"version":1,"artifactId":"a1","workspace":"/ws","relativePath":"../../.ssh/id_rsa","sha256":"x","sizeBytes":1}'],
    ['an absolute relative path', '{"version":1,"artifactId":"a2","workspace":"/ws","relativePath":"/etc/passwd","sha256":"x","sizeBytes":1}'],
    ['a version this build does not know', '{"version":2,"artifactId":"a3","workspace":"/ws","relativePath":"brief.md","sha256":"x","sizeBytes":1}'],
    ['a size that is not a whole number', '{"version":1,"artifactId":"a4","workspace":"/ws","relativePath":"brief.md","sha256":"x","sizeBytes":1.5}'],
    ['a row that is not an object', '"not a record"'],
  ])('drops %s while keeping the real records around it', async (_label, row) => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    writeFileSync(path.join(runDir, 'brief.html'), 'x', 'utf-8');
    await registerArtifacts({ ledgerPath, workspace, runDir, ...RUN, declarations: [{ path: 'brief.html' }] });
    // Known positive: the real record reads back before the bad row is added.
    expect(await readArtifactLedger(ledgerPath)).toHaveLength(1);

    appendFileSync(ledgerPath, `${row}\n`, 'utf-8');

    const read = await readArtifactLedger(ledgerPath);
    expect(read).toHaveLength(1);
    expect(read[0].relativePath.endsWith('brief.html')).toBe(true);
  });
});

describe('a declaration is a claim, not a proof', () => {
  async function reject(declaration: unknown): Promise<string> {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: [declaration],
    });
    expect(result.registered).toEqual([]);
    expect(await readArtifactLedger(ledgerPath)).toEqual([]);
    return result.rejected[0]?.reason ?? 'NOT REJECTED';
  }

  it('rejects a traversal out of the run directory', async () => {
    expect(await reject({ path: '../../../../../../etc/passwd' })).toBe('traversal');
  });

  it('rejects an absolute path', async () => {
    expect(await reject({ path: path.join(path.sep, 'etc', 'passwd') })).toBe('absolute');
  });

  it('rejects a home-relative path', async () => {
    expect(await reject({ path: '~/.ssh/id_rsa' })).toBe('home-relative');
  });

  it('rejects a NUL-truncation form', async () => {
    expect(await reject({ path: 'brief.html\0.png' })).toBe('unsafe-form');
  });

  it('rejects an empty or non-string path', async () => {
    expect(await reject({ path: '' })).toBe('empty');
    expect(await reject({ path: 42 })).toBe('not-a-string');
    expect(await reject('brief.html')).toBe('not-an-object');
  });

  it('rejects a file that does not exist', async () => {
    expect(await reject({ path: 'never-written.html' })).toBe('missing');
  });

  // Windows needs elevation or Developer Mode to create a symlink.
  it.skipIf(process.platform === 'win32')('rejects a symlink, even one pointing at a legitimate in-workspace file', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    writeFileSync(path.join(runDir, 'real.html'), 'real', 'utf-8');
    symlinkSync(path.join(runDir, 'real.html'), path.join(runDir, 'link.html'));

    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: [{ path: 'link.html' }, { path: 'real.html' }],
    });

    expect(result.rejected).toEqual([{ path: 'link.html', reason: 'symlink' }]);
    // The good declaration in the same run still lands.
    expect(result.registered.map((r) => path.basename(r.relativePath))).toEqual(['real.html']);
  });

  it.skipIf(process.platform === 'win32')('rejects a symlink that escapes the workspace entirely', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    const outside = path.join(os.tmpdir(), `wl-outside-${process.pid}.txt`);
    writeFileSync(outside, 'secret', 'utf-8');
    tmpRoots.push(outside);
    symlinkSync(outside, path.join(runDir, 'escape.txt'));

    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: [{ path: 'escape.txt' }],
    });
    expect(result.rejected).toEqual([{ path: 'escape.txt', reason: 'symlink' }]);
  });

  it.skipIf(process.platform === 'win32')('rejects a file reached through a symlinked ANCESTOR directory', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    const outsideDir = mkdtempSync(path.join(os.tmpdir(), 'wl-outside-dir-'));
    tmpRoots.push(outsideDir);
    writeFileSync(path.join(outsideDir, 'stolen.txt'), 'secret', 'utf-8');
    symlinkSync(outsideDir, path.join(runDir, 'sub'));

    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: [{ path: 'sub/stolen.txt' }],
    });

    // The leaf itself is a regular file; only collapsing the ancestor chain
    // reveals that it is not in the workspace at all.
    expect(result.registered).toEqual([]);
    expect(result.rejected[0].reason).toBe('escapes-workspace');
  });

  it('rejects a directory declared as an artifact', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    mkdirSync(path.join(runDir, 'subdir'));
    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: [{ path: 'subdir' }],
    });
    expect(result.rejected).toEqual([{ path: 'subdir', reason: 'not-regular-file' }]);
  });

  // `mkfifo` is POSIX-only; Windows has no equivalent to create through fs.
  it.skipIf(process.platform === 'win32')('rejects a non-regular file such as a FIFO', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    const fifo = path.join(runDir, 'pipe');
    execFileSync('mkfifo', [fifo]);
    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: [{ path: 'pipe' }],
    });
    // A FIFO read would block the main process forever; it must never be hashed.
    expect(result.rejected).toEqual([{ path: 'pipe', reason: 'not-regular-file' }]);
  });

  it('rejects a file over the size cap instead of hashing it', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    writeFileSync(path.join(runDir, 'huge.bin'), Buffer.alloc(MAX_ARTIFACT_BYTES + 1));
    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: [{ path: 'huge.bin' }],
    });
    expect(result.rejected).toEqual([{ path: 'huge.bin', reason: 'too-large' }]);
  });

  it('caps how many artifacts one run may declare', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    const declarations: Array<{ path: string }> = [];
    for (let i = 0; i <= MAX_DECLARATIONS_PER_RUN; i += 1) {
      writeFileSync(path.join(runDir, `f${i}.txt`), String(i), 'utf-8');
      declarations.push({ path: `f${i}.txt` });
    }
    const result = await registerArtifacts({ ledgerPath, workspace, runDir, ...RUN, declarations });
    expect(result.registered).toHaveLength(MAX_DECLARATIONS_PER_RUN);
    expect(result.rejected).toEqual([{ path: `f${MAX_DECLARATIONS_PER_RUN}.txt`, reason: 'too-many' }]);
  });

  it('treats a non-array declarations payload as declaring nothing', async () => {
    const { workspace, runDir, ledgerPath } = tmpWorkspace();
    writeFileSync(path.join(runDir, 'brief.html'), 'x', 'utf-8');
    const result = await registerArtifacts({
      ledgerPath,
      workspace,
      runDir,
      ...RUN,
      declarations: { path: 'brief.html' },
    });
    expect(result).toEqual({ registered: [], rejected: [] });
    expect(await readArtifactLedger(ledgerPath)).toEqual([]);
  });
});
