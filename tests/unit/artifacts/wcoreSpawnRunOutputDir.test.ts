/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE SPAWN SITE ITSELF, EXECUTED.
 *
 * This replaces a `readFileSync` + `toContain` grep over `wcore/index.ts`. That
 * grep was the ONLY thing in the suite that noticed the spawn-site wiring being
 * deleted: the ten-case series E2E stayed green with `wcore/index.ts` reverted
 * to the merge base, because its `sendMessage` stand-in re-derived the output
 * directory itself through a hand-copied mirror of the spawn call. A mirror
 * proves the mirror. A source-text assertion proves the source text - it cannot
 * tell a working wiring from a plausible-looking one, and it would go green
 * again the moment someone reformatted the line it greps for.
 *
 * So this drives the REAL `WCoreAgent.start()` and reads the env off the REAL
 * `spawn` call. No engine binary is needed: the binary resolver is stubbed and
 * `spawn` throws the moment it has been handed its arguments, which is after
 * everything under test has already happened.
 *
 * Every case is produced in one run alongside its opposite, so a green result
 * cannot come from a spawn that never happened or an env that is empty.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({ calls: [] as Array<{ env: Record<string, string>; cwd?: string }> }));

vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  spawn: (_bin: string, _args: string[], opts: { env: Record<string, string>; cwd?: string }) => {
    captured.calls.push({ env: opts.env, cwd: opts.cwd });
    // Everything the spawn site decides has been decided by now. Stop here
    // rather than fake a live engine: `start()` rethrows and the test catches.
    throw new Error('STOP_AFTER_SPAWN');
  },
}));

vi.mock('@process/agent/wcore/binaryResolver', () => ({
  resolveWCoreBinary: () => '/nonexistent/wcore',
}));

vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: () => ({ collectForwardedEnv: async () => ({}) }),
}));

import os from 'os';
import path from 'path';
import { mkdtempSync, rmSync } from 'fs';

import { WCoreAgent } from '@process/agent/wcore';
import {
  activeRunOutputDir,
  clearRunOutputDirs,
  openRunOutputDir,
} from '@process/services/artifacts/runOutputDir';

const SCHEDULED_CHAT = 'conv-scheduled-run';
const USER_CHAT = 'conv-the-user-opened-here';
const RUN_ID = 'r-run-under-test';

let workspace = '';
let staging = '';

/** One real `WCoreAgent.start()`, stopped at the spawn. Returns that spawn's env. */
async function spawnEnvFor(conversationId?: string): Promise<Record<string, string>> {
  const before = captured.calls.length;
  const agent = new WCoreAgent({
    workspace,
    conversationId,
    // The escape hatch to Core's own config: it skips profile resolution,
    // model hydration and both config leases, none of which this site reads.
    // The spawn block itself is shared with every other launch mode.
    rawEngineMode: true,
    model: { name: 'm', useModel: 'm', platform: 'openai', baseUrl: '' } as never,
    onStreamEvent: () => {},
  });
  await expect(agent.start()).rejects.toThrow('STOP_AFTER_SPAWN');
  expect(captured.calls.length).toBe(before + 1);
  return captured.calls[captured.calls.length - 1].env;
}

describe('the engine spawn reads the run open on ITS OWN conversation', () => {
  beforeEach(() => {
    captured.calls.length = 0;
    clearRunOutputDirs();
    workspace = mkdtempSync(path.join(os.tmpdir(), 'wl-spawn-ws-'));
    staging = path.join(workspace, 'artifacts', 'market', '.staging', RUN_ID);
  });

  afterEach(() => {
    clearRunOutputDirs();
    rmSync(workspace, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('hands the scheduled run its staging directory, not the series root', async () => {
    // Known negative, from the same spawn path: with no run open the engine
    // gets the series root, so the positive below is not "any env at all".
    expect((await spawnEnvFor(SCHEDULED_CHAT)).WAYLAND_OUTPUT_DIR).toBe(path.join(workspace, 'artifacts'));

    openRunOutputDir(SCHEDULED_CHAT, RUN_ID, staging);
    const env = await spawnEnvFor(SCHEDULED_CHAT);

    expect(env.WAYLAND_OUTPUT_DIR).toBe(staging);
    // ...and the value really is the registry's, not a path this test rebuilt.
    expect(env.WAYLAND_OUTPUT_DIR).toBe(activeRunOutputDir(SCHEDULED_CHAT));
  });

  it('leaves the user own chat in the task folder on the series root', async () => {
    openRunOutputDir(SCHEDULED_CHAT, RUN_ID, staging);

    // Same workspace, different conversation: the user opened a chat in the
    // task's folder while the scheduled run is in flight. Keyed on the
    // workspace, this spawn was silently redirected into the run's staging
    // directory and its output was published as the run's deliverable.
    const env = await spawnEnvFor(USER_CHAT);
    expect(env.WAYLAND_OUTPUT_DIR).toBe(path.join(workspace, 'artifacts'));
    expect(env.WAYLAND_OUTPUT_DIR).not.toBe(staging);

    // Control, in the same run: the run IS open, and the chat that owns it
    // still gets it.
    expect((await spawnEnvFor(SCHEDULED_CHAT)).WAYLAND_OUTPUT_DIR).toBe(staging);
  });

  it('carries no run at all for a spawn with no conversation', async () => {
    openRunOutputDir(SCHEDULED_CHAT, RUN_ID, staging);
    expect((await spawnEnvFor(undefined)).WAYLAND_OUTPUT_DIR).toBe(path.join(workspace, 'artifacts'));
  });

  it('refuses a staging directory that resolves outside the workspace', async () => {
    // The registry is written by the run path, but this value becomes a
    // host-blessed write destination handed to model-authored skill text, so
    // the spawn re-checks containment rather than trusting its caller.
    const outside = path.join(os.tmpdir(), 'wl-spawn-elsewhere');
    openRunOutputDir(SCHEDULED_CHAT, RUN_ID, outside);
    expect(activeRunOutputDir(SCHEDULED_CHAT)).toBe(outside);

    const env = await spawnEnvFor(SCHEDULED_CHAT);
    expect(env.WAYLAND_OUTPUT_DIR).toBe(path.join(workspace, 'artifacts'));
  });

  it('stands the engine in the same directory it names as the output root', async () => {
    openRunOutputDir(SCHEDULED_CHAT, RUN_ID, staging);
    await spawnEnvFor(SCHEDULED_CHAT);
    const call = captured.calls[captured.calls.length - 1];
    expect(call.cwd).toBe(workspace);
    expect(call.env.WAYLAND_OUTPUT_DIR.startsWith(workspace)).toBe(true);
  });
});
