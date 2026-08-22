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

import { CANCELLATION_LABEL_MAX_CHARS, WCoreAgent } from '@process/agent/wcore';
import { activeRunOutputDir, clearRunOutputDirs, openRunOutputDir } from '@process/services/artifacts/runOutputDir';

const SCHEDULED_CHAT = 'conv-scheduled-run';
const USER_CHAT = 'conv-the-user-opened-here';
const RUN_ID = 'r-run-under-test';

/**
 * T1 moved the RUNLESS destination. A spawn that carries a conversation and has
 * no run open used to be handed `<workspace>/artifacts` - the SERIES ROOT, the
 * cron control plane holding `.latest.json`, `.aliases.json` and `.staging/`.
 * Anything written there is classified as a series by path shape alone and can
 * be deleted by the next publication's `retireStaleAliases`. It is now handed
 * its own reserved `artifacts/chat/<conversationId>/`.
 *
 * Nothing this file was protecting has been given up: every case below still
 * asserts the run-open destination, still asserts a chat is never redirected
 * into another conversation's staging tree, and still asserts an out-of-
 * workspace hint is refused - and each now also asserts the runless spawn stays
 * OUT of the series root, which it previously landed in.
 */
const chatNamespaceFor = (conversationId: string) => path.join(workspace, 'artifacts', 'chat', conversationId);
const seriesRoot = () => path.join(workspace, 'artifacts');

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

  it('hands the scheduled run its staging directory, not its chat namespace', async () => {
    // Known negative, from the same spawn path: with no run open the engine
    // gets that conversation's chat namespace, so the positive below is not
    // "any env at all". It is NOT the series root - see the T1 note above.
    const runless = (await spawnEnvFor(SCHEDULED_CHAT)).WAYLAND_OUTPUT_DIR;
    expect(runless).toBe(chatNamespaceFor(SCHEDULED_CHAT));
    expect(runless).not.toBe(staging);
    expect(runless).not.toBe(seriesRoot());

    openRunOutputDir(SCHEDULED_CHAT, RUN_ID, staging);
    const env = await spawnEnvFor(SCHEDULED_CHAT);

    expect(env.WAYLAND_OUTPUT_DIR).toBe(staging);
    // ...and the value really is the registry's, not a path this test rebuilt.
    expect(env.WAYLAND_OUTPUT_DIR).toBe(activeRunOutputDir(SCHEDULED_CHAT));
  });

  it('leaves the user own chat in the task folder in its own chat namespace', async () => {
    openRunOutputDir(SCHEDULED_CHAT, RUN_ID, staging);

    // Same workspace, different conversation: the user opened a chat in the
    // task's folder while the scheduled run is in flight. Keyed on the
    // workspace, this spawn was silently redirected into the run's staging
    // directory and its output was published as the run's deliverable.
    const env = await spawnEnvFor(USER_CHAT);
    expect(env.WAYLAND_OUTPUT_DIR).toBe(chatNamespaceFor(USER_CHAT));
    expect(env.WAYLAND_OUTPUT_DIR).not.toBe(staging);
    expect(env.WAYLAND_OUTPUT_DIR).not.toBe(seriesRoot());
    // ...and not the OTHER conversation's namespace either.
    expect(env.WAYLAND_OUTPUT_DIR).not.toBe(chatNamespaceFor(SCHEDULED_CHAT));

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
    expect(env.WAYLAND_OUTPUT_DIR).not.toBe(outside);
    expect(env.WAYLAND_OUTPUT_DIR.startsWith(workspace + path.sep)).toBe(true);
    expect(env.WAYLAND_OUTPUT_DIR).toBe(chatNamespaceFor(SCHEDULED_CHAT));
  });

  it('stands the engine in the same directory it names as the output root', async () => {
    openRunOutputDir(SCHEDULED_CHAT, RUN_ID, staging);
    await spawnEnvFor(SCHEDULED_CHAT);
    const call = captured.calls[captured.calls.length - 1];
    expect(call.cwd).toBe(workspace);
    expect(call.env.WAYLAND_OUTPUT_DIR.startsWith(workspace)).toBe(true);
  });
});


/**
 * A3 - THE 330s REAP, IN WORDS A PERSON CAN READ.
 *
 * Core parks a gated tool call on `ToolApprovalManager` with a 300s TTL and
 * sweeps every 30s (`DEFAULT_APPROVAL_TTL` / `DEFAULT_REAP_INTERVAL`,
 * `wcore-protocol/src/lib.rs:27,32`), so an unanswered gate is denied between
 * 300s and 330s with the EXACT literal at `:266`. That reason flows verbatim
 * into `ProtocolEvent::ToolCancelled.reason`
 * (`wcore-agent/src/orchestration/mod.rs:1191`), and Desktop rendered it as the
 * tool_group node's `description` with an EMPTY `name` - so after five and a
 * half minutes of silence the transcript said, with no title:
 *
 *     approval timed out (no host response)
 *
 * These tests drive the REAL `WCoreAgent.handleEvent` and read the REAL
 * emitted node. Nothing is mocked but the spawn, which never happens here.
 */
describe('A3: the engine cancel reason a person actually reads', () => {
  /** Byte-for-byte Core's literal. If Core changes it, case 1 goes red. */
  const CORE_REAP_REASON = 'approval timed out (no host response)';

  function nodeFor(reason: string) {
    const events: Array<{ type: string; data: unknown; msg_id: string }> = [];
    const agent = new WCoreAgent({
      workspace: os.tmpdir(),
      rawEngineMode: true,
      model: { name: 'm', useModel: 'm', platform: 'openai', baseUrl: '' } as never,
      onStreamEvent: (e: { type: string; data: unknown; msg_id: string }) => events.push(e),
    });
    (agent as unknown as { handleEvent: (e: unknown) => void }).handleEvent({
      type: 'tool_cancelled',
      msg_id: 'm-1',
      call_id: 'call-42',
      reason,
    });
    const group = events.find((e) => e.type === 'tool_group');
    expect(group).toBeDefined();
    return (group!.data as Array<Record<string, unknown>>)[0];
  }

  it('names the reap and says it in plain English, and the raw engine string never reaches the user', () => {
    const node = nodeFor(CORE_REAP_REASON);
    expect(node.callId).toBe('call-42');
    expect(node.status).toBe('Canceled');
    // The defect: an untitled node. A name is the whole point.
    expect(node.name).toBeTruthy();
    expect(String(node.name)).not.toBe('');
    expect(String(node.description)).not.toContain('no host response');
    expect(String(node.name) + ' ' + String(node.description)).toMatch(/5 minutes/);
    expect(String(node.description).length).toBeGreaterThan(20);
  });

  it('fits the row: the collapsed label clamps at 75 chars and cuts mid-sentence past it', () => {
    // Not a style nit. The first two drafts of this sentence were BOTH cut at
    // exactly 75 characters in the running app - "...after 5 minut..." and
    // "...Nothing was..." - so the user read half of it. The clamp is on the
    // string, not on pixels: the span measured 540px inside a 726px box.
    const node = nodeFor(CORE_REAP_REASON);
    const label = `${String(node.name)}: ${String(node.description)}`;
    expect(label.length).toBeLessThanOrEqual(CANCELLATION_LABEL_MAX_CHARS);
    // ...and it is a whole sentence, not a fragment that happens to be short.
    expect(String(node.description).trim().endsWith('.')).toBe(true);
  });

  it('KNOWN NEGATIVE: every other cancel reason still passes through untouched', () => {
    // Without this the first test would pass against a function that rewrote
    // EVERY cancellation, which would bury the reason the user needs on a
    // denial, a ForgeFlow decline or a Crucible cancel.
    for (const reason of ['ForgeFlow declined', 'Crucible declined - no spend.', 'Tool denied: not allowed']) {
      const node = nodeFor(reason);
      expect(node.name).toBe('');
      expect(node.description).toBe(reason);
      expect(node.status).toBe('Canceled');
      expect(node.callId).toBe('call-42');
    }
  });

  it('matches Core\'s literal exactly - a near miss is NOT rewritten', () => {
    const node = nodeFor('approval timed out');
    expect(node.name).toBe('');
    expect(node.description).toBe('approval timed out');
  });
});
