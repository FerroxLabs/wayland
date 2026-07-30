/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * End-to-end through the real `WCoreAgent`, not just the decoder in isolation.
 *
 * Every frame here is a byte copy from Core's corpus, pushed through the same
 * `routeFrame` the stdout reader calls, and the assertions are on what the
 * agent actually did with it: stream events emitted, console severity, and the
 * execution policy it now holds.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WCoreAgent } from '../../src/process/agent/wcore/index';
import type { DecodeOutcome } from '../../src/process/agent/wcore/contract/types';
import { WCoreFrameDecoder } from '../../src/process/agent/wcore/contract/decoder';

const CORPUS = join(__dirname, '../../resources/wcore-contract/v1');
const frame = (relative: string) => readFileSync(join(CORPUS, relative), 'utf8').trim();
const READY = frame('events/ready.json');

type Emitted = { type: string; data: unknown };

/** A `WCoreAgent` with its stream sink captured and its decode path reachable. */
function harness() {
  const emitted: Emitted[] = [];
  const agent = new WCoreAgent({
    onStreamEvent: (event: Emitted) => void emitted.push(event),
  } as never);

  const decoder = new WCoreFrameDecoder();
  const route = (line: string): DecodeOutcome => {
    const outcome = decoder.decode(line);
    // Exactly what the stdout `line` handler does.
    (agent as unknown as { routeFrame(o: DecodeOutcome, l: string): void }).routeFrame(outcome, line);
    return outcome;
  };

  return { agent, emitted, route };
}

let logs: { error: string[]; warn: string[]; info: string[]; debug: string[] };

beforeEach(() => {
  logs = { error: [], warn: [], info: [], debug: [] };
  for (const level of ['error', 'warn', 'info', 'debug'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logs[level].push(args.map(String).join(' '));
    });
  }
});

afterEach(() => vi.restoreAllMocks());

describe('WCoreAgent frame routing', () => {
  it('negotiates the golden ready and records the launch execution policy', () => {
    const { agent, route } = harness();
    expect(route(READY).kind).toBe('negotiated');

    expect(agent.contractNegotiation?.fit).toBe('exact');
    expect(agent.capabilities?.tool_approval).toBe(true);
    // The security posture used to be discarded with the rest of the `ready`
    // frame; it now lands on the agent.
    expect(agent.executionPolicy).toMatchObject({
      revision: 0,
      reason: 'launch',
      policy: { approvals: 'prompt', posture: 'smart', sandbox: 'required' },
    });
    expect(logs.error).toEqual([]);
    expect(logs.warn).toEqual([]);
  });

  it('applies an execution_policy revision instead of dropping it', () => {
    const { agent, route } = harness();
    route(READY);
    route(frame('events/execution_policy.json'));

    expect(agent.executionPolicy).toMatchObject({
      revision: 1,
      reason: 'mode_change',
      policy: { approvals: 'auto_edit', posture: 'smart' },
    });
    expect(logs.info.join('\n')).toContain('execution policy r1');
    expect(logs.error).toEqual([]);
  });

  it('refuses to walk the posture backwards on a replayed revision', () => {
    const { agent, route } = harness();
    route(READY);
    route(frame('events/execution_policy.json'));
    // Replay revision 0 (the launch posture) after revision 1 has taken effect.
    const stale = JSON.parse(frame('events/execution_policy.json'));
    stale.revision = 0;
    stale.policy.approvals = 'bypass';
    route(JSON.stringify(stale));

    expect(agent.executionPolicy?.revision).toBe(1);
    expect(agent.executionPolicy?.policy.approvals).toBe('auto_edit');
    expect(logs.warn.join('\n')).toContain('stale execution_policy revision 0');
  });

  it('reports an unhandled safety event at error level rather than dropping it', () => {
    const { route } = harness();
    route(READY);
    const outcome = route(frame('events/workflow_started.json'));

    expect(outcome).toMatchObject({ kind: 'event', criticality: 'safety', handled: false });
    expect(logs.error.join('\n')).toContain('contract event "workflow_started" (safety)');
    expect(logs.error.join('\n')).toContain('no handler');
  });

  it('reports an unhandled observational event at warn, not error', () => {
    const { route } = harness();
    route(READY);
    route(frame('events/goal_snapshot.json'));

    expect(logs.error).toEqual([]);
    expect(logs.warn.join('\n')).toContain('contract event "goal_snapshot" (observational)');
  });

  it('drops an unknown non-critical event quietly, at debug', () => {
    const { route } = harness();
    route(READY);
    route(frame('adversarial/events/unknown-noncritical.jsonl'));

    expect(logs.error).toEqual([]);
    expect(logs.warn).toEqual([]);
    expect(logs.debug.join('\n')).toContain('future_observation');
  });

  it('surfaces an unknown critical event to the user instead of swallowing it', () => {
    const { emitted, route } = harness();
    route(READY);
    route(frame('adversarial/events/unknown-critical.jsonl'));

    expect(logs.error.join('\n')).toContain('unknown-critical-event');
    expect(emitted.at(-1)).toMatchObject({ type: 'error' });
    expect(String(emitted.at(-1)?.data)).toContain('future_authority');
  });

  it('rejects bootstrap on a forged ready', async () => {
    const { agent, route } = harness();
    const bootstrap = agent.bootstrap;
    // Keep the rejection from being unhandled while we assert on it.
    const settled = bootstrap.then(
      () => 'resolved',
      (err: Error) => err.message
    );

    route(frame('adversarial/events/fixture-mismatch.jsonl'));

    await expect(settled).resolves.toContain('contract negotiation failed');
    expect(agent.contractNegotiation).toBeUndefined();
    expect(logs.error.join('\n')).toContain('contract-digest-mismatch');
  });

  it('still bootstraps on the golden ready (both directions)', async () => {
    const { agent, route } = harness();
    route(READY);
    await expect(agent.bootstrap).resolves.toBeUndefined();
  });

  it('does not dispatch a frame that violated the contract', () => {
    const { emitted, route } = harness();
    route(READY);
    const good = emitted.length;

    const bad = JSON.parse(frame('events/text_delta.json'));
    bad.text = 12345; // wire says string
    route(JSON.stringify(bad));

    // No `content` stream event was produced from the malformed frame — only
    // the loud error. Dispatching it would have put a number where the
    // renderer expects text.
    expect(emitted.slice(good).map((e) => e.type)).toEqual(['error']);
    expect(logs.error.join('\n')).toContain('schema-violation');

    // Both directions: the untouched frame does produce content.
    route(frame('events/text_delta.json'));
    expect(emitted.at(-1)).toMatchObject({ type: 'content' });
  });

  it('carries a normal turn end to end', () => {
    const { emitted, route } = harness();
    route(READY);
    for (const name of ['stream_start', 'text_delta', 'stream_end']) {
      expect(route(frame(`events/${name}.json`)).kind).toBe('event');
    }
    expect(emitted.map((e) => e.type)).toEqual(['start', 'content', 'finish']);
    expect(logs.error).toEqual([]);
  });
});
