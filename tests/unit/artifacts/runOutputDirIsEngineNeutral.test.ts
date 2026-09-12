/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo cutover: `resolveOutputDir` is the single producer of the directory an
 * engine is told to write deliverables into AND the directory the turn-end
 * sweep walks. It used to live in `agent/wcore/envBuilder.ts`, so the artifact
 * sweep and the scheduled-run executor - both engine-agnostic - imported a
 * Core module for a path rule. It now lives in `services/artifacts/runOutputDir`
 * and Core re-exports it; the two consumers must not reach into `wcore/` for it,
 * or deleting Core (Phase 3) takes the artifact rail down with it.
 */
import { promises as fs, readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveOutputDir } from '@process/services/artifacts/runOutputDir';
import { resolveOutputDir as coreReExport } from '@process/agent/wcore/envBuilder';
import { clearChatSweepMemo, sweepChatRun } from '@process/services/artifacts/chatRun';

const SRC = path.resolve(__dirname, '../../../src/process');
const source = (rel: string) => readFileSync(path.join(SRC, rel), 'utf8');

describe('resolveOutputDir is engine-neutral', () => {
  it('is exported from services/artifacts/runOutputDir and Core re-exports that same function', () => {
    expect(typeof resolveOutputDir).toBe('function');
    expect(coreReExport).toBe(resolveOutputDir);
  });

  it('the artifact sweep and the scheduled-run executor no longer import anything from agent/wcore', () => {
    for (const rel of ['services/artifacts/chatRun.ts', 'services/cron/WorkerTaskManagerJobExecutor.ts']) {
      const text = source(rel);
      expect(text, rel).not.toMatch(/from '@process\/agent\/wcore\//);
      expect(text, rel).not.toMatch(/from '\.\.\/\.\.\/agent\/wcore\//);
    }
  });
});

describe('the turn-end sweep works for an ACP (fuigo) conversation', () => {
  let root = '';
  let workspace = '';
  let ledgerPath = '';

  beforeEach(async () => {
    clearChatSweepMemo();
    root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-fuigo-sweep-')));
    workspace = path.join(root, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    ledgerPath = path.join(root, 'artifact-ledger.jsonl');
  });

  afterEach(async () => {
    clearChatSweepMemo();
    await fs.rm(root, { recursive: true, force: true });
  });

  it('registers what a Fuigo chat wrote into the chat namespace the resolver names', async () => {
    const conversationId = 'fuigoconv0001';
    const outputDir = resolveOutputDir(workspace, undefined, conversationId);
    expect(outputDir).toBe(path.join(workspace, 'artifacts', 'chat', conversationId));
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'brief.md'), '# brief\n', 'utf8');

    const result = await sweepChatRun({ conversationId, workspace, ledgerPath, declaredBy: 'Fuigo' });

    expect(result.outputDir).toBe(outputDir);
    expect(result.registered.map((r) => path.basename(r.relativePath))).toEqual(['brief.md']);
  });
});
