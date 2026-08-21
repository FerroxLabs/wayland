/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The `grant_path` / `revoke_path` protocol seam and its launch flag.
 *
 * WHAT THESE GUARD. Every one of the three moving parts fails SILENTLY if it
 * breaks: a renamed wire field is a no-op on the engine, a missing
 * `--allow-host-path-grants` turns every grant into an untyped `info` line the
 * host never reads, and a dropped `workspace_policy` frame leaves the host
 * asserting a boundary it never confirmed. None of that reddens a suite on its
 * own, so each is pinned here by MECHANISM - the exact bytes on the wire, the
 * exact arg, the call site - rather than by an outcome a broader rule supplies.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { WCoreAgent, type WCoreAgentOptions } from '@/process/agent/wcore';
import { buildSpawnConfig } from '@/process/agent/wcore/envBuilder';
import { DesktopCoreV1Consumer } from '@/process/agent/wcore/desktopContractV1';
import type { WCoreEvent, WCoreWorkspacePolicy } from '@/process/agent/wcore/protocol';
import type { TProviderWithModel } from '@/common/config/storage';

// ── harness ───────────────────────────────────────────────────────────

type Emitted = { type: string; data?: unknown; msg_id?: string };

/**
 * A `WCoreAgent` wired to a fake stdin, so the assertions read the bytes the
 * production `writeCommand` actually serializes. Nothing here re-implements the
 * command shape: `written` is whatever `JSON.stringify` put on the pipe.
 */
function makeAgent() {
  const emitted: Emitted[] = [];
  const written: string[] = [];
  const options = {
    workspace: '/tmp/wcore-test',
    model: {} as never,
    onStreamEvent: (event: Emitted) => emitted.push(event),
  } as unknown as WCoreAgentOptions;
  const agent = new WCoreAgent(options);
  const internals = agent as unknown as {
    childProcess: unknown;
    transportAlive: boolean;
    handleEvent: (event: WCoreEvent) => void;
  };
  internals.childProcess = {
    stdin: {
      writable: true,
      destroyed: false,
      writableEnded: false,
      write: (line: string) => written.push(line),
    },
  };
  internals.transportAlive = true;
  return { agent, emitted, written, feed: (event: WCoreEvent) => internals.handleEvent(event) };
}

/** The single JSON object the agent wrote, parsed. */
function soleCommand(written: string[]): Record<string, unknown> {
  expect(written).toHaveLength(1);
  return JSON.parse(written[0]) as Record<string, unknown>;
}

function policy(readableRoots: string[]): WCoreWorkspacePolicy {
  return {
    trust: {
      level: 'trusted',
      source: 'user',
      fingerprint: 'd14a',
      explanation: 'fingerprint-bound local trust decision is current',
    },
    profile: 'trusted_local_smart',
    backend: 'sandbox-exec',
    writable_roots: ['/workspace'],
    readable_roots: readableRoots,
    capabilities: [],
  };
}

function model(): TProviderWithModel {
  return {
    id: 'test-provider',
    platform: 'openai',
    name: 'Test Provider',
    baseUrl: '',
    apiKey: 'test-key',
    useModel: 'gpt-test',
  } as TProviderWithModel;
}

// ── the wire shape ────────────────────────────────────────────────────

describe('grant_path / revoke_path wire shape', () => {
  it("serializes grant_path with Core's exact field names", () => {
    const { agent, written } = makeAgent();
    void agent.grantPath({ grantId: '3f2a', root: '/Users/me/Downloads/Mortgage' });
    // Byte-exact, not toMatchObject: a field Core does not know is dropped by
    // serde and a field Core needs under a different name is simply absent, and
    // BOTH failures look identical from the host - an accepted command that
    // grants nothing.
    expect(soleCommand(written)).toEqual({
      type: 'grant_path',
      grant_id: '3f2a',
      root: '/Users/me/Downloads/Mortgage',
    });
  });

  it("omits access and expires_at_ms when unset so Core's serde defaults apply", () => {
    const { agent, written } = makeAgent();
    void agent.grantPath({ grantId: '3f2a', root: '/tmp/reports' });
    const command = soleCommand(written);
    // Presence, not value: `"access": undefined` survives as a missing key but
    // `"access": null` does not deserialize into `PathGrantAccess`, and an
    // explicit `expires_at_ms: null` would fail Core's `Option<u64>` decode.
    expect('access' in command).toBe(false);
    expect('expires_at_ms' in command).toBe(false);
  });

  it('carries access and expires_at_ms when the caller sets them', () => {
    const { agent, written } = makeAgent();
    void agent.grantPath({
      grantId: '3f2a',
      root: '/tmp/reports',
      access: 'read',
      expiresAtMs: 1755640000000,
    });
    expect(soleCommand(written)).toEqual({
      type: 'grant_path',
      grant_id: '3f2a',
      root: '/tmp/reports',
      access: 'read',
      expires_at_ms: 1755640000000,
    });
  });

  it('serializes revoke_path carrying the grant id Core keys the store on', () => {
    const { agent, written } = makeAgent();
    void agent.revokePath('3f2a');
    expect(soleCommand(written)).toEqual({ type: 'revoke_path', grant_id: '3f2a' });
  });
});

// ── the receipt is what confirms a grant, not the absence of an error ──

describe('workspace_policy is consumed, not dropped', () => {
  it('records the receipt and its readable_roots', () => {
    const { agent, feed, emitted } = makeAgent();
    // Positive control in the same test: before any receipt the host knows
    // nothing, so a green assertion below cannot come from a pre-seeded value.
    expect(agent.workspacePolicy).toBeNull();
    expect(agent.workspaceReadableRoots).toEqual([]);

    feed({ type: 'workspace_policy', policy: policy(['/workspace', '/Users/me/Downloads/Mortgage']) });

    expect(agent.workspaceReadableRoots).toEqual(['/workspace', '/Users/me/Downloads/Mortgage']);
    expect(agent.workspacePolicy?.backend).toBe('sandbox-exec');
    // The frame must also reach stream consumers - the arm forwards, it does
    // not merely stash.
    expect(emitted.filter((e) => e.type === 'workspace_policy')).toHaveLength(1);
  });

  it('leaves the host with no policy when an unrelated frame arrives', () => {
    // Control for the test above: proves the recording is keyed on the frame
    // type and not on "any frame at all".
    const { agent, feed } = makeAgent();
    feed({ type: 'stream_start', msg_id: 'm1' });
    expect(agent.workspacePolicy).toBeNull();
  });

  it('resolves grantPath with the receipt that arrives AFTER the write', async () => {
    const { agent, feed } = makeAgent();
    // The waiter must be armed before the command is written, or a receipt on
    // the very next line is missed and a landed grant reads as refused.
    const settled = agent.grantPath({ grantId: '3f2a', root: '/tmp/reports' });
    feed({ type: 'workspace_policy', policy: policy(['/workspace', '/tmp/reports']) });
    await expect(settled).resolves.toMatchObject({ readable_roots: ['/workspace', '/tmp/reports'] });
  });

  it('catches a receipt Core writes on the SAME tick as the command', async () => {
    // Pins the ORDER inside grantPath: the waiter is armed before the write.
    // Core emits the receipt from the same command-loop iteration, so a host
    // that subscribes after writing misses it and reports a landed grant as
    // refused. Arming after the write turns this green test null.
    const { agent, feed, written } = makeAgent();
    const internals = agent as unknown as { childProcess: { stdin: { write: (line: string) => void } } };
    internals.childProcess.stdin.write = (line: string) => {
      written.push(line);
      feed({ type: 'workspace_policy', policy: policy(['/workspace', '/tmp/reports']) });
    };
    await expect(agent.grantPath({ grantId: '3f2a', root: '/tmp/reports' }, 5)).resolves.toMatchObject({
      readable_roots: ['/workspace', '/tmp/reports'],
    });
  });

  it("resolves grantPath with null when no receipt follows - Core's only refusal signal", async () => {
    const { agent } = makeAgent();
    // Core answers a refused grant with an untyped `info` string and emits NO
    // updated receipt, so "nothing threw" must not read as "it landed".
    await expect(agent.grantPath({ grantId: '3f2a', root: '/' }, 5)).resolves.toBeNull();
  });

  it('resolves revokePath with the receipt', async () => {
    const { agent, feed } = makeAgent();
    const settled = agent.revokePath('3f2a');
    feed({ type: 'workspace_policy', policy: policy(['/workspace']) });
    await expect(settled).resolves.toMatchObject({ readable_roots: ['/workspace'] });
  });
});

// ── the launch flag ───────────────────────────────────────────────────

describe('--allow-host-path-grants is opt-in per spawn', () => {
  const workspace = '/tmp/test-workspace';

  it('is absent by default, and present only when the option is set', () => {
    const off = buildSpawnConfig(model(), { workspace });
    const on = buildSpawnConfig(model(), { workspace, allowHostPathGrants: true });
    // Both halves in one test: the "absent" assertion alone would pass on a
    // build where the flag can never be emitted at all.
    expect(off.args).not.toContain('--allow-host-path-grants');
    expect(on.args).toContain('--allow-host-path-grants');
  });

  it('is passed in raw-engine mode too, alongside the json-stream arg it requires', () => {
    const off = buildSpawnConfig(model(), { workspace, rawEngine: true });
    const on = buildSpawnConfig(model(), { workspace, rawEngine: true, allowHostPathGrants: true });
    expect(off.args).not.toContain('--allow-host-path-grants');
    expect(on.args).toContain('--allow-host-path-grants');
    // Core's clap declares `requires = "json_stream"`, so the flag without it
    // aborts the spawn at argument parsing.
    expect(on.args).toContain('--json-stream');
    // Raw-engine's contract is session-protocol args ONLY: no provider/model
    // override may ride along with it.
    expect(on.args).not.toContain('--provider');
    expect(on.args).not.toContain('--model');
  });

  it('is NOT implied by --auto-approve', () => {
    // Autopilot answers the prompting question. It must not widen the boundary:
    // a mode toggle that also hands out filesystem authority is consent nobody
    // gave. Positive control that this spawn really is the auto-approve one.
    const args = buildSpawnConfig(model(), { workspace, autoApprove: true }).args;
    expect(args).toContain('--auto-approve');
    expect(args).not.toContain('--allow-host-path-grants');
  });
});

// ── tripwire: the pinned corpus predates these commands ───────────────

describe('pinned v1 host-command corpus vs the path-grant commands', () => {
  const corpus = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
  const ready = readFileSync(path.join(corpus, 'events/ready.json'), 'utf8').trimEnd();

  function negotiated(): DesktopCoreV1Consumer {
    const consumer = new DesktopCoreV1Consumer();
    expect(consumer.consumeLine(ready)).toMatchObject({ kind: 'event', contract: 'v1' });
    return consumer;
  }

  /**
   * DELIBERATE TRIPWIRE - this test is written to go RED when the gap closes.
   *
   * `contracts/wayland-desktop-core/v1` is a byte-for-byte mechanical import
   * from a pinned Core commit, so it must not be hand-edited to add these
   * commands; its digests are pinned in `desktopContractV1.test.ts`. The corpus
   * is at contract 1.14 and `grant_path` / `revoke_path` exist only on Core
   * `main`, so `validateOutboundCommand` rejects them today.
   *
   * That resolves itself: `assertDescriptor` is exact-match on the contract
   * minor, so the first Core release carrying these commands CANNOT negotiate
   * against this corpus at all - it forces the re-import that adds them. When
   * that lands, delete this test.
   */
  it('still rejects grant_path and revoke_path, so the seam is unsendable until the corpus is re-imported', () => {
    const consumer = negotiated();
    // Positive control FIRST: prove this validator accepts something, or a
    // rejection below could just mean the fixture never reached the schema.
    expect(() => consumer.validateOutboundCommand({ type: 'tool_deny', call_id: 'c1', reason: 'no' })).not.toThrow();
    expect(() => consumer.validateOutboundCommand({ type: 'grant_path', grant_id: 'g1', root: '/tmp/x' })).toThrow(
      /pinned schema/
    );
    expect(() => consumer.validateOutboundCommand({ type: 'revoke_path', grant_id: 'g1' })).toThrow(/pinned schema/);
  });

  /**
   * NOT this lane's code, recorded here because the same re-import fixes it and
   * nothing else in the suite says it out loud: the `always_path` approval scope
   * that answers a `path_boundary` escalation card is ALSO absent from the
   * pinned schema, so today that card's "always allow this folder" answer throws
   * at the contract boundary instead of reaching Core.
   */
  it('still rejects the always_path approval scope the escalation card sends', () => {
    const consumer = negotiated();
    expect(() =>
      consumer.validateOutboundCommand({ type: 'tool_approve', call_id: 'c1', scope: 'once' })
    ).not.toThrow();
    expect(() =>
      consumer.validateOutboundCommand({
        type: 'tool_approve',
        call_id: 'c1',
        scope: { always_path: { root: '/tmp/reports', write: false } },
      })
    ).toThrow(/pinned schema/);
  });
});
