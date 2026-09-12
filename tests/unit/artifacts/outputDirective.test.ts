/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The deliverables directive for an ACP turn. Core sent it on `--system-prompt`;
 * Fuigo has no such channel, so it is resolved per turn from the ONE producer
 * (`resolveOutputDir`) and prepended to the outgoing prompt.
 */
import { afterEach, describe, expect, it } from 'vitest';
import path from 'node:path';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { buildOutputDirective, resolveTurnOutputDirective } from '@process/services/artifacts/outputDirective';
import { clearRunOutputDirs, openRunOutputDir } from '@process/services/artifacts/runOutputDir';

const dirs: string[] = [];
afterEach(() => {
  clearRunOutputDirs();
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function workspace(): string {
  const ws = mkdtempSync(path.join(tmpdir(), 'output-directive-'));
  dirs.push(ws);
  return ws;
}

describe('resolveTurnOutputDirective', () => {
  it('names the chat namespace, as a permanent path the model may cite, when no run is open', () => {
    const ws = workspace();
    const text = resolveTurnOutputDirective(ws, 'conv-1');
    const chatDir = path.join(ws, 'artifacts', 'chat', 'conv-1');
    expect(text).toContain(`go in ${chatDir}.`);
    expect(text).toContain(`name its path inside ${chatDir}`);
    expect(text).not.toContain('staging area');
  });

  it("names the open run's staging directory and forbids printing it (it is gone after publication)", () => {
    const ws = workspace();
    const staging = path.join(ws, 'artifacts', 'market', '.staging', 'run-1');
    mkdirSync(staging, { recursive: true });
    openRunOutputDir('conv-1', 'run-1', staging);

    const text = resolveTurnOutputDirective(ws, 'conv-1');
    expect(text).toContain(`go in ${staging}.`);
    expect(text).toContain('do NOT print it');
    expect(text).not.toContain('name its path inside');
  });

  it('falls back to the permanent chat namespace when the open run points outside the workspace', () => {
    const ws = workspace();
    const elsewhere = workspace();
    openRunOutputDir('conv-1', 'run-1', path.join(elsewhere, 'x'));

    const text = resolveTurnOutputDirective(ws, 'conv-1');
    expect(text).toContain(path.join(ws, 'artifacts', 'chat', 'conv-1'));
    expect(text).not.toContain(elsewhere);
    expect(text).not.toContain('staging area');
  });

  it('is absent without a workspace - there is nothing to resolve against', () => {
    expect(resolveTurnOutputDirective(undefined, 'conv-1')).toBeUndefined();
  });

  it('never mentions the environment variable no shell command can see', () => {
    expect(buildOutputDirective('/ws/artifacts/chat/c')).not.toContain('WAYLAND_OUTPUT_DIR');
    expect(buildOutputDirective('/ws/artifacts/s/.staging/r', { ephemeral: true })).not.toContain('WAYLAND_OUTPUT_DIR');
  });
});
