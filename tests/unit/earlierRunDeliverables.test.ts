/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Locked decision 2: a task that already ran in `new_conversation` mode has
 * several stranded `wcore-temp-*` workspaces holding real past reports. We do
 * not link to them (the product calls that storage "Temporary Space" and
 * retention exists to reclaim it) and we do not copy a whole workspace tree.
 * We find candidate deliverables, show them, and copy only the ones the user
 * keeps - leaving every source workspace untouched.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import fsp from 'fs/promises';
import { existsSync } from 'fs';
import {
  findEarlierRunDeliverables,
  importEarlierRunDeliverables,
} from '@process/services/promotion/earlierRunDeliverables';

let root: string;
let target: string;

const CREATED_AT = Date.UTC(2026, 7, 17, 6, 0, 0);
const RAN_AT = Date.UTC(2026, 7, 17, 7, 30, 0);

/**
 * A pre-fix run: the bundled skill tree copied in when the workspace was made,
 * and the report the run wrote INTO that hidden machinery directory an hour
 * later, because `routines.json` pointed it there.
 */
async function makeStrandedWorkspace(name: string): Promise<string> {
  const ws = path.join(root, name);
  const skillDir = path.join(ws, '.wayland-core', 'skills', 'market-open-report');
  await fsp.mkdir(skillDir, { recursive: true });
  await fsp.writeFile(path.join(skillDir, 'SKILL.md'), 'bundled machinery', 'utf8');
  await fsp.utimes(path.join(skillDir, 'SKILL.md'), new Date(CREATED_AT), new Date(CREATED_AT));

  await fsp.writeFile(path.join(skillDir, 'market-open-2026-08-17.html'), '<h1>open</h1>', 'utf8');
  await fsp.utimes(path.join(skillDir, 'market-open-2026-08-17.html'), new Date(RAN_AT), new Date(RAN_AT));
  await fsp.writeFile(path.join(skillDir, 'run.log'), 'noisy but the user decides', 'utf8');
  await fsp.utimes(path.join(skillDir, 'run.log'), new Date(RAN_AT), new Date(RAN_AT));
  return ws;
}

beforeEach(async () => {
  root = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-earlier-'));
  target = path.join(root, 'Smart Trader');
  await fsp.mkdir(target, { recursive: true });
});
afterEach(async () => {
  await fsp.rm(root, { recursive: true, force: true });
});

describe('finding earlier-run deliverables', () => {
  it('looks inside the hidden machinery dir but never blesses the setup copy', async () => {
    const ws = await makeStrandedWorkspace('wcore-temp-1700000001');

    const { candidates } = await findEarlierRunDeliverables({
      workspaces: [{ conversationId: 'conv-1', workspace: ws, createdAtMs: CREATED_AT }],
    });

    expect(candidates.map((c) => c.relPath).toSorted()).toEqual([
      '.wayland-core/skills/market-open-report/market-open-2026-08-17.html',
      '.wayland-core/skills/market-open-report/run.log',
    ]);
    // The skill file copied in at workspace setup is machinery, not output.
    expect(candidates.some((c) => c.relPath.endsWith('SKILL.md'))).toBe(false);
    expect(candidates.every((c) => c.hidden)).toBe(true);
    expect(candidates.every((c) => c.conversationId === 'conv-1')).toBe(true);
  });

  it('does not treat the extension as proof of anything', async () => {
    const ws = await makeStrandedWorkspace('wcore-temp-1700000002');
    const { candidates } = await findEarlierRunDeliverables({
      workspaces: [{ conversationId: 'conv-1', workspace: ws, createdAtMs: CREATED_AT }],
    });
    // A .log is offered exactly like the .html; the user chooses, not the suffix.
    expect(candidates.find((c) => c.relPath.endsWith('run.log'))).toBeTruthy();
  });

  it('always offers everything in artifacts/, whatever its timestamps say', async () => {
    const ws = path.join(root, 'wcore-temp-1700000003');
    await fsp.mkdir(path.join(ws, 'artifacts'), { recursive: true });
    await fsp.writeFile(path.join(ws, 'artifacts', 'brief.md'), '# brief', 'utf8');
    await fsp.utimes(path.join(ws, 'artifacts', 'brief.md'), new Date(CREATED_AT), new Date(CREATED_AT));

    const { candidates } = await findEarlierRunDeliverables({
      workspaces: [{ conversationId: 'conv-2', workspace: ws, createdAtMs: CREATED_AT }],
    });

    expect(candidates.map((c) => c.relPath)).toEqual(['artifacts/brief.md']);
    expect(candidates[0].declared).toBe(true);
    expect(candidates[0].hidden).toBe(false);
  });

  it('skips symlinks and non-regular files rather than following them', async () => {
    const ws = path.join(root, 'wcore-temp-1700000004');
    await fsp.mkdir(path.join(ws, 'artifacts'), { recursive: true });
    await fsp.writeFile(path.join(root, 'outside.txt'), 'not yours', 'utf8');
    await fsp.symlink(path.join(root, 'outside.txt'), path.join(ws, 'artifacts', 'leak.txt'));

    const { candidates } = await findEarlierRunDeliverables({
      workspaces: [{ conversationId: 'conv-3', workspace: ws, createdAtMs: CREATED_AT }],
    });

    expect(candidates).toEqual([]);
  });

  it('tolerates a workspace that is already gone', async () => {
    const { candidates } = await findEarlierRunDeliverables({
      workspaces: [{ conversationId: 'conv-4', workspace: path.join(root, 'never-existed'), createdAtMs: 0 }],
    });
    expect(candidates).toEqual([]);
  });
});

describe('importing the chosen deliverables', () => {
  it('copies only the selected files into the series and leaves the source untouched', async () => {
    const ws = await makeStrandedWorkspace('wcore-temp-1700000005');
    const { candidates } = await findEarlierRunDeliverables({
      workspaces: [{ conversationId: 'conv-1', workspace: ws, createdAtMs: CREATED_AT }],
    });
    const keep = candidates.filter((c) => c.relPath.endsWith('.html'));

    const result = await importEarlierRunDeliverables(target, keep);

    expect(result.failed).toEqual([]);
    expect(result.imported).toHaveLength(1);
    const published = path.join(target, result.imported[0].relPath);
    expect(await fsp.readFile(published, 'utf8')).toBe('<h1>open</h1>');
    expect(result.imported[0].relPath).toBe(
      path.join('artifacts', '2026-08-17', 'imported-conv-1', 'market-open-2026-08-17.html')
    );
    // The one the user did not keep is not there.
    expect(existsSync(path.join(target, 'artifacts', '2026-08-17', 'imported-conv-1', 'run.log'))).toBe(false);
    // Rule 9: the source workspace is completely untouched.
    expect(await fsp.readdir(path.join(ws, '.wayland-core', 'skills', 'market-open-report'))).toHaveLength(3);
    // A real file, never a link back into Temporary Space.
    expect((await fsp.lstat(published)).isSymbolicLink()).toBe(false);
    // No staging directory survives.
    expect((await fsp.readdir(path.join(target, 'artifacts', '2026-08-17'))).toSorted()).toEqual(['imported-conv-1']);
  });

  it('refuses a relative path that escapes the source workspace', async () => {
    const ws = await makeStrandedWorkspace('wcore-temp-1700000006');
    await fsp.writeFile(path.join(root, 'secret.txt'), 'not yours', 'utf8');

    const result = await importEarlierRunDeliverables(target, [
      { conversationId: 'conv-1', sourceWorkspace: ws, relPath: '../secret.txt' },
    ]);

    expect(result.imported).toEqual([]);
    expect(result.failed).toEqual([{ relPath: '../secret.txt', reason: 'outside-workspace' }]);
    expect(existsSync(path.join(target, 'artifacts'))).toBe(false);
  });

  it('does not overwrite a file already published under the same name', async () => {
    const ws = await makeStrandedWorkspace('wcore-temp-1700000007');
    const selection = [
      {
        conversationId: 'conv-1',
        sourceWorkspace: ws,
        relPath: '.wayland-core/skills/market-open-report/market-open-2026-08-17.html',
      },
    ];

    const first = await importEarlierRunDeliverables(target, selection);
    const second = await importEarlierRunDeliverables(target, selection);

    expect(first.imported[0].relPath).not.toBe(second.imported[0].relPath);
    expect(second.imported[0].relPath).toContain('market-open-2026-08-17 (2).html');
    expect(await fsp.readFile(path.join(target, first.imported[0].relPath), 'utf8')).toBe('<h1>open</h1>');
  });
});
