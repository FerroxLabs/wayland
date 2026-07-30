/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The build-time half of the fix.
 *
 * Runtime validation makes a dropped frame loud in production; these tests make
 * it loud in CI, before the release. If Core adds an event type, the partition
 * check below fails until someone either handles it or writes it down.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { HANDLED_CONTRACT_EVENTS, UNHANDLED_CONTRACT_EVENTS } from '../../src/process/agent/wcore/contract/coverage';
import { CONTRACT_EVENT_TYPES } from '../../src/process/agent/wcore/contract/decoder';
import generated from '../../src/process/agent/wcore/contract/generated/wcoreContract.generated.json';

const AGENT_SOURCE = join(__dirname, '../../src/process/agent/wcore/index.ts');
const PROTOCOL_SOURCE = join(__dirname, '../../src/process/agent/wcore/protocol.ts');

/** Case arms of the `switch (event.type)` in `WCoreAgent.handleEvent`. */
function switchArms(): string[] {
  const source = readFileSync(AGENT_SOURCE, 'utf8');
  const start = source.indexOf('private handleEvent(');
  expect(start, 'handleEvent not found — this extractor is broken, not the code').toBeGreaterThan(0);
  const end = source.indexOf('\n  private async handleHostSendMessage(', start);
  expect(end, 'handleEvent end marker not found').toBeGreaterThan(start);
  return [...source.slice(start, end).matchAll(/^\s*case '([a-z_]+)':/gm)].map((m) => m[1]).toSorted();
}

describe('wcore contract event coverage', () => {
  it('extracts case arms from the real switch (control)', () => {
    const arms = switchArms();
    // Positive control: a variant everyone agrees is handled.
    expect(arms).toContain('text_delta');
    // Negative control: a contract event nobody handles. If this ever starts
    // being handled the assertion below catches it; if the extractor silently
    // matched everything, this would fail.
    expect(arms).not.toContain('workflow_started');
  });

  it('declares exactly the event types the switch handles', () => {
    expect(HANDLED_CONTRACT_EVENTS.toSorted()).toEqual(switchArms());
  });

  it('partitions every contract event into handled or knowingly-unhandled', () => {
    const declared = [...HANDLED_CONTRACT_EVENTS, ...UNHANDLED_CONTRACT_EVENTS].toSorted();
    expect(declared).toEqual(CONTRACT_EVENT_TYPES.toSorted());
    expect(new Set(declared).size, 'an event type is in both sets').toBe(declared.length);
  });

  it('keeps every safety-criticality gap written down rather than silent', () => {
    const criticality = generated.eventCriticality as Record<string, string>;
    const unhandledSafety = UNHANDLED_CONTRACT_EVENTS.filter((t) => criticality[t] === 'safety');
    // Not an assertion that the gap is acceptable — an assertion that the gap
    // is exactly this size. Shrinking it requires editing this number.
    expect(unhandledSafety).toHaveLength(16);
    expect(unhandledSafety).not.toContain('execution_policy');
  });

  it('records the host commands Desktop cannot send', () => {
    const protocol = readFileSync(PROTOCOL_SOURCE, 'utf8');
    const commandSection = protocol.slice(protocol.indexOf('export type WCoreCommand'));
    expect(commandSection.length, 'WCoreCommand union not found').toBeGreaterThan(0);
    const declared = new Set([...commandSection.matchAll(/type: '([a-z_]+)'/g)].map((m) => m[1]));
    const missing = generated.commandTypes.filter((type) => !declared.has(type));
    // Companion gap to the unhandled events: Desktop never sends these, which
    // is why it can never receive several of the responses above.
    expect(missing.toSorted()).toEqual(
      [
        'continue_with_budget',
        'get_runtime_diagnostics',
        'goal_advance',
        'goal_cancel',
        'goal_declare_task',
        'goal_open',
        'goal_resync',
        'remove_mcp_server',
        'resolve_interrupted_approval',
        'resolve_unknown_tool_effect',
        'resume_turn',
        'session_resync',
      ].toSorted()
    );
  });
});
