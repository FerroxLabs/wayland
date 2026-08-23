/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * T2. THE MODEL IS TOLD WHERE TO WRITE.
 *
 * T1 gave chat output a reserved directory. Nothing put anything in it.
 * `WAYLAND_OUTPUT_DIR` was read by exactly ONE consumer in the whole product -
 * the bundled morning-report SKILL.md - so a plain chat with no workflow and no
 * skill was never told the directory existed, and the entire artifacts feature
 * would have shipped as a rail over an empty folder.
 *
 * `buildSpawnConfig` has forwarded `options.systemPrompt` to `--system-prompt`
 * since before this milestone and NOTHING IN `src/process` EVER SET IT. This is
 * the producer for that seam.
 *
 * WHY `--system-prompt` AND NOT `presetRules`. Verified against the real engine
 * binary (wayland-core 0.13.0) by capturing the outgoing provider request:
 *
 *  - `--system-prompt` is APPENDED into the composed system prompt - the base
 *    prompt came back byte-identical with the extra text inserted after it - and
 *    it is present on a `--resume` spawn too.
 *  - `presetRules` goes out as an `init_history` frame that `WCoreAgent` skips
 *    entirely when `resume` is set, so a directive sent that way would be absent
 *    from every turn after an app restart.
 *
 * THE PATH IS NEVER SPELLED OUT HERE. Both halves are read off the SAME captured
 * spawn, and the assertion is that they AGREE: the directory named in the
 * directive must be the directory in `WAYLAND_OUTPUT_DIR`. A directive naming a
 * path the engine was not given is worse than no directive at all, and that is
 * the only failure this seam can actually have.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({
  calls: [] as Array<{ args: string[]; env: Record<string, string> }>,
}));

vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  spawn: (_bin: string, args: string[], opts: { env: Record<string, string> }) => {
    captured.calls.push({ args, env: opts.env });
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
import { mkdtempSync, realpathSync, rmSync } from 'fs';

import { WCoreAgent } from '@process/agent/wcore';
import { clearRunOutputDirs, openRunOutputDir } from '@process/services/artifacts/runOutputDir';

const CONVERSATION = 'convdirective01';
const RUN_ID = 'r-open-run';

let workspace = '';

/** One real `WCoreAgent.start()`, stopped at the spawn. */
async function spawnOnce(opts: { conversationId?: string; rawEngineMode?: boolean } = {}) {
  const before = captured.calls.length;
  const agent = new WCoreAgent({
    workspace,
    conversationId: opts.conversationId,
    rawEngineMode: opts.rawEngineMode ?? true,
    // An explicit key, because `WCoreAgent.start()` throws MissingApiKeyError
    // BEFORE spawning unless one is present or `engineInheritsShellKey` finds
    // `OPENAI_API_KEY` in the ambient environment. Relying on the ambient one
    // meant these three assertions never executed the directive path on a
    // machine without a provider key exported - proven by A/B/A on Windows.
    model: { name: 'm', useModel: 'm', platform: 'openai', baseUrl: '', apiKey: 'test-key' } as never,
    onStreamEvent: () => {},
  });
  await expect(agent.start()).rejects.toThrow('STOP_AFTER_SPAWN');
  expect(captured.calls.length).toBe(before + 1);
  return captured.calls[captured.calls.length - 1];
}

/** The `--system-prompt` value from a captured spawn, or null when absent. */
function systemPromptOf(call: { args: string[] }): string | null {
  const index = call.args.indexOf('--system-prompt');
  return index === -1 ? null : (call.args[index + 1] ?? null);
}

describe('T2 - the spawn tells the model where its deliverables go', () => {
  beforeEach(() => {
    captured.calls.length = 0;
    clearRunOutputDirs();
    // REALPATH'd on purpose. A non-raw spawn runs under
    // `withWCoreProjectConfigLease`, which hands `start()` the CANONICAL
    // workspace, so `/var/...` becomes `/private/var/...` on macOS. A test
    // holding the lexical spelling would compare two different strings for the
    // same directory and read a working spawn as a broken one.
    workspace = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'wl-directive-ws-')));
  });

  afterEach(() => {
    clearRunOutputDirs();
    rmSync(workspace, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('passes --system-prompt naming exactly the directory the engine was given', async () => {
    const call = await spawnOnce({ conversationId: CONVERSATION, rawEngineMode: false });
    const directive = systemPromptOf(call);

    expect(directive).not.toBeNull();
    // Read off the SAME spawn, never rebuilt by this test.
    expect(call.env.WAYLAND_OUTPUT_DIR).toBeTruthy();
    expect(directive).toContain(call.env.WAYLAND_OUTPUT_DIR);
    // And that directory really is the chat namespace, not the series root.
    expect(call.env.WAYLAND_OUTPUT_DIR).toBe(path.join(workspace, 'artifacts', 'chat', CONVERSATION));
  });

  it('names the run staging directory when a scheduled run owns the conversation', async () => {
    const staging = path.join(workspace, 'artifacts', 'market', '.staging', RUN_ID);
    openRunOutputDir(CONVERSATION, RUN_ID, staging);

    const call = await spawnOnce({ conversationId: CONVERSATION, rawEngineMode: false });
    const directive = systemPromptOf(call);

    expect(call.env.WAYLAND_OUTPUT_DIR).toBe(staging);
    expect(directive).toContain(staging);
    // The directive and the env can never name two different places.
    expect(directive).not.toContain(path.join(workspace, 'artifacts', 'chat'));
  });

  it('says the three things a model needs: where, what counts, and where scratch goes', async () => {
    const call = await spawnOnce({ conversationId: CONVERSATION, rawEngineMode: false });
    const directive = systemPromptOf(call) ?? '';

    expect(directive.toLowerCase()).toContain('deliverable');
    expect(directive).toContain(workspace);
    // The scratch half is what keeps the rail from filling with .py helpers on
    // day one, so it is asserted, not assumed.
    expect(directive.toLowerCase()).toMatch(/scratch|intermediate/);
  });

  it('sends no directive in raw-engine mode, where Desktop overrides nothing', async () => {
    // The engine runs on its OWN config.toml there and `buildSpawnConfig`
    // deliberately passes no `--system-prompt`. Pinned so nobody "fixes" the
    // asymmetry into a Desktop override of a power user's own prompt.
    const call = await spawnOnce({ conversationId: CONVERSATION, rawEngineMode: true });

    expect(systemPromptOf(call)).toBeNull();
    // Control from the same run: the env var still reaches raw mode.
    expect(call.env.WAYLAND_OUTPUT_DIR).toBe(path.join(workspace, 'artifacts', 'chat', CONVERSATION));
  });
});
