/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9, the seam itself. These run the REAL action code - real ledger, real
 * resolver, real type gate - with only the last inch (the OS launcher, the save
 * dialog) replaced by a recorder, so "it refused" means the launcher was never
 * reached, not that an assertion about source text held.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerArtifacts, type ArtifactRecord } from '@process/services/artifacts/artifactLedger';
import {
  describeArtifactOpenTarget,
  listArtifactSummaries,
  openArtifact,
  revealArtifact,
  saveArtifactCopy,
  type ArtifactHostEffects,
} from '@process/services/artifacts/artifactActions';

let root: string;
let workspace: string;
let ledgerPath: string;
let records: ArtifactRecord[];

const register = async (relative: string, contents: string, runId = 'r1', now?: Date): Promise<ArtifactRecord> => {
  const absolute = path.join(workspace, relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, contents);
  const result = await registerArtifacts({
    ledgerPath,
    workspace,
    runDir: workspace,
    taskId: 'morning-brief',
    runId,
    declaredBy: 'market-open-report',
    // The ledger stamps runAt from the clock, and listArtifactSummaries sorts on
    // it. Two runs registered in the same millisecond tie, so any ordering test
    // must pin the run time rather than race the clock.
    ...(now ? { now } : {}),
    declarations: [{ path: relative, title: 'Morning Brief' }],
  });
  expect(result.rejected).toEqual([]);
  const record = result.registered[0];
  records.push(record);
  return record;
};

const buildEffects = (overrides: Partial<ArtifactHostEffects> = {}) => {
  const launch = vi.fn(async () => ({ ok: true }));
  const reveal = vi.fn(async () => ({ ok: true }));
  const chooseSaveDestination = vi.fn(async () => path.join(root, 'Desktop', 'copy.html'));
  const effects: ArtifactHostEffects = {
    readLedger: async () => records,
    confine: async (target: string) => target,
    launch,
    reveal,
    chooseSaveDestination,
    ...overrides,
  };
  return { effects, launch, reveal, chooseSaveDestination };
};

beforeEach(async () => {
  // realpath, because the ledger records the realpath-collapsed workspace and
  // macOS collapses `/var` to `/private/var`. Comparing against the
  // un-collapsed form asserts a difference the platform invented.
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'artifact-actions-')));
  workspace = path.join(root, 'workspace');
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
  records = [];
  await fs.mkdir(workspace, { recursive: true });
  await fs.mkdir(path.join(root, 'Desktop'), { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('openArtifact', () => {
  it('opens a report the ledger vouches for', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects, launch } = buildEffects();
    await expect(openArtifact(record.artifactId, effects)).resolves.toEqual({ ok: true });
    expect(launch).toHaveBeenCalledTimes(1);
    expect(launch.mock.calls[0][0]).toBe(path.join(workspace, record.relativePath));
  });

  it('REFUSES a .command written inside the workspace, and never reaches the launcher', async () => {
    // The whole point of the type gate. `report.command` is inside an
    // authorized root, so confinement passes it without complaint - and macOS
    // EXECUTES it on open.
    const record = await register('artifacts/2026-08-20/r1/report.command', '#!/bin/sh\nrm -rf ~/Documents\n');
    const { effects, launch } = buildEffects();
    const outcome = await openArtifact(record.artifactId, effects);
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/\.command/);
    expect(launch).not.toHaveBeenCalled();
  });

  it('REFUSES the other launcher-executable types the same way', async () => {
    for (const [name, body] of [
      ['payload.desktop', '[Desktop Entry]\nExec=rm -rf ~\n'],
      ['setup.exe', 'MZ'],
      ['run.sh', '#!/bin/sh\n'],
      ['tool.jar', 'PK'],
      ['macro.xlsm', 'PK'],
    ] as const) {
      const record = await register(`artifacts/2026-08-20/r1/${name}`, body, `run-${name.replace(/\W/g, '')}`);
      const { effects, launch } = buildEffects();
      const outcome = await openArtifact(record.artifactId, effects);
      expect(outcome.ok, `${name} should be refused`).toBe(false);
      expect(launch, `${name} should never reach the launcher`).not.toHaveBeenCalled();
    }
  });

  it('refuses an unknown id without touching the launcher', async () => {
    const { effects, launch } = buildEffects();
    const outcome = await openArtifact('f'.repeat(32), effects);
    expect(outcome.ok).toBe(false);
    expect(launch).not.toHaveBeenCalled();
  });

  it('refuses a path the host confinement rejects, even for a known artifact', async () => {
    const record = await register('artifacts/brief.html', 'x');
    const { effects, launch } = buildEffects({ confine: async () => null });
    const outcome = await openArtifact(record.artifactId, effects);
    expect(outcome.ok).toBe(false);
    expect(launch).not.toHaveBeenCalled();
  });

  it('refuses after the bytes change, even though the path still resolves', async () => {
    const record = await register('artifacts/brief.html', '<h1>brief</h1>');
    await fs.writeFile(path.join(workspace, record.relativePath), '<h1>tampered</h1>');
    const { effects, launch } = buildEffects();
    expect((await openArtifact(record.artifactId, effects)).ok).toBe(false);
    expect(launch).not.toHaveBeenCalled();
  });
});

describe('revealArtifact', () => {
  it('reveals a .command rather than refusing it - selecting a file never runs it', async () => {
    const record = await register('artifacts/report.command', '#!/bin/sh\n');
    const { effects, reveal } = buildEffects();
    await expect(revealArtifact(record.artifactId, effects)).resolves.toEqual({ ok: true });
    expect(reveal).toHaveBeenCalledTimes(1);
  });

  it('still refuses to reveal an artifact whose identity no longer holds', async () => {
    const record = await register('artifacts/brief.html', '<h1>brief</h1>');
    await fs.rm(path.join(workspace, record.relativePath));
    const { effects, reveal } = buildEffects();
    expect((await revealArtifact(record.artifactId, effects)).ok).toBe(false);
    expect(reveal).not.toHaveBeenCalled();
  });
});

describe('saveArtifactCopy', () => {
  it('writes the VERIFIED bytes to the destination the user chose', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects, chooseSaveDestination } = buildEffects();
    const outcome = await saveArtifactCopy(record.artifactId, effects);
    expect(outcome.ok).toBe(true);
    expect(chooseSaveDestination).toHaveBeenCalledWith('brief.html');
    expect(await fs.readFile(path.join(root, 'Desktop', 'copy.html'), 'utf-8')).toBe('<h1>brief</h1>');
  });

  it('saves a .command COPY - copying bytes never executes them', async () => {
    // The type gate belongs to the LAUNCHER, not to the copier. Refusing to
    // save would be security theatre: the file is already on the user's disk.
    const record = await register('artifacts/report.command', '#!/bin/sh\necho hi\n');
    const { effects } = buildEffects({ chooseSaveDestination: async () => path.join(root, 'Desktop', 'out.command') });
    expect((await saveArtifactCopy(record.artifactId, effects)).ok).toBe(true);
    expect(await fs.readFile(path.join(root, 'Desktop', 'out.command'), 'utf-8')).toBe('#!/bin/sh\necho hi\n');
  });

  it('reports a cancelled dialog as a non-error', async () => {
    const record = await register('artifacts/brief.html', 'x');
    const { effects } = buildEffects({ chooseSaveDestination: async () => null });
    expect(await saveArtifactCopy(record.artifactId, effects)).toEqual({ ok: true });
  });

  it('writes nothing when the artifact no longer matches the ledger', async () => {
    const record = await register('artifacts/brief.html', '<h1>brief</h1>');
    await fs.writeFile(path.join(workspace, record.relativePath), 'tampered');
    const { effects, chooseSaveDestination } = buildEffects();
    expect((await saveArtifactCopy(record.artifactId, effects)).ok).toBe(false);
    expect(chooseSaveDestination).not.toHaveBeenCalled();
  });
});

describe('listArtifactSummaries', () => {
  it('hands the renderer the HOST-computed canonical target, newest first', async () => {
    await register('artifacts/2026-08-19/r1/older.html', 'a', 'r1', new Date('2026-08-19T13:30:00.000Z'));
    await register('artifacts/2026-08-20/r2/newer.html', 'b', 'r2', new Date('2026-08-20T13:30:00.000Z'));
    const { effects } = buildEffects();
    const summaries = await listArtifactSummaries(effects);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].fileName).toBe('newer.html');
    expect(summaries[0].canonicalPath).toBe(path.join(workspace, 'artifacts', '2026-08-20', 'r2', 'newer.html'));
    expect(summaries[0].title).toBe('Morning Brief');
  });

  it('never returns an unbounded list', async () => {
    const { effects } = buildEffects({
      readLedger: async () =>
        Array.from({ length: 5000 }, (_unused, index) => ({
          ...records[0],
          artifactId: index.toString(16).padStart(32, '0'),
          workspace,
          relativePath: `artifacts/f${index}.html`,
          runAt: new Date(2026, 0, 1, 0, 0, index).toISOString(),
        })) as ArtifactRecord[],
    });
    await register('artifacts/seed.html', 'x');
    const summaries = await listArtifactSummaries(effects);
    expect(summaries.length).toBeLessThanOrEqual(500);
  });
});

describe('describeArtifactOpenTarget', () => {
  /**
   * The button used to say a bare "Open" and the user could not tell what would
   * happen before clicking. Naming the app fixes that - and must not become a
   * second, laxer way to turn an id into a path, or a promise the click does
   * not keep.
   */
  it('names the app for the CONFINED, ledger-resolved path and nothing else', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects } = buildEffects();
    const resolveName = vi.fn(async () => 'Preview');

    await expect(describeArtifactOpenTarget(record.artifactId, effects, resolveName)).resolves.toEqual({
      applicationName: 'Preview',
    });
    expect(resolveName).toHaveBeenCalledTimes(1);
    expect(resolveName.mock.calls[0][0]).toBe(path.join(workspace, record.relativePath));
  });

  it('names nothing for an id the ledger does not know, and never resolves anything', async () => {
    await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects } = buildEffects();
    const resolveName = vi.fn(async () => 'Preview');

    for (const id of ['f'.repeat(32), '', undefined, { artifactId: 'x' }]) {
      // eslint-disable-next-line no-await-in-loop -- each id is a separate claim
      await expect(describeArtifactOpenTarget(id, effects, resolveName)).resolves.toEqual({ applicationName: null });
    }
    expect(resolveName).not.toHaveBeenCalled();
  });

  it('names nothing when confinement refuses the target', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects } = buildEffects({ confine: async () => null });
    const resolveName = vi.fn(async () => 'Preview');

    await expect(describeArtifactOpenTarget(record.artifactId, effects, resolveName)).resolves.toEqual({
      applicationName: null,
    });
    expect(resolveName).not.toHaveBeenCalled();
  });

  it('names nothing when the file no longer matches what the ledger recorded', async () => {
    // Same identity re-verification `openArtifact` does. A label computed from
    // a file that has since been swapped would describe the wrong document.
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    await fs.writeFile(path.join(workspace, record.relativePath), '<h1>something else entirely</h1>');
    const { effects } = buildEffects();
    const resolveName = vi.fn(async () => 'Preview');

    await expect(describeArtifactOpenTarget(record.artifactId, effects, resolveName)).resolves.toEqual({
      applicationName: null,
    });
    expect(resolveName).not.toHaveBeenCalled();
  });

  it('reports no name rather than failing when the resolver has no answer', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects } = buildEffects();

    await expect(describeArtifactOpenTarget(record.artifactId, effects, async () => null)).resolves.toEqual({
      applicationName: null,
    });
  });
});
