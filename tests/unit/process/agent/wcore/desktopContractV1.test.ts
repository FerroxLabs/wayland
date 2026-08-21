/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { FSWatcher, watch } from 'node:fs';
import {
  DESKTOP_CORE_V1_PIN,
  DESKTOP_CORE_V1_PRODUCER_COMMIT,
  DESKTOP_CORE_MAX_LINE_BYTES,
  DesktopCoreContractError,
  DesktopCoreV1Consumer,
} from '@/process/agent/wcore/desktopContractV1';
import { AnvilPersistentMutationWatcher } from '@/process/agent/wcore/anvilMutationWatcher';

const root = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8')) as {
  contract: { name: string; major: number; minor: number };
  counts: { child_types: number; commands: number; events: number; fixtures: number };
  generator: string;
  fixture_digest: string;
  schema_digest: string;
  source_inputs_digest: string;
  fixture_inventory: string[];
};

function text(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8').trimEnd();
}

function json(relative: string): Record<string, unknown> {
  return JSON.parse(text(relative)) as Record<string, unknown>;
}

function lines(relative: string): string[] {
  return text(relative).split('\n');
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .toSorted(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

function canonicalJsonBytes(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(canonicalize(value))}\n`);
}

function digestNamed(entries: Array<[string, Buffer]>): string {
  const hash = createHash('sha256');
  for (const [relative, bytes] of entries.toSorted(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))) {
    hash.update(relative);
    hash.update(Buffer.from([0]));
    hash.update(bytes);
  }
  return `sha256:${hash.digest('hex')}`;
}

function negotiated(): DesktopCoreV1Consumer {
  const consumer = new DesktopCoreV1Consumer();
  expect(consumer.consumeLine(text('events/ready.json'))).toMatchObject({ kind: 'event', contract: 'v1' });
  return consumer;
}

function expectContractError(run: () => unknown, code?: string): void {
  try {
    run();
    throw new Error('expected DesktopCoreContractError');
  } catch (error) {
    expect(error).toBeInstanceOf(DesktopCoreContractError);
    if (code) expect((error as DesktopCoreContractError).code).toBe(code);
  }
}

function seedOrdinary(consumer: DesktopCoreV1Consumer, event: Record<string, unknown>): void {
  const type = event.type;
  const msgId = typeof event.msg_id === 'string' ? event.msg_id : null;
  if (
    !msgId ||
    ![
      'text_delta',
      'thinking',
      'tool_request',
      'call_announced',
      'tool_running',
      'tool_chunk',
      'tool_result',
      'tool_cancelled',
      'tool_panicked',
      'stream_end',
      'error',
    ].includes(type as string)
  ) {
    return;
  }
  consumer.consumeLine(JSON.stringify({ type: 'stream_start', msg_id: msgId }));
  // `tool_request` and `call_announced` are the two frames that ANNOUNCE a
  // call, so neither may be preceded by a synthetic announcement - seeding one
  // would make the fixture collide with itself as a duplicate.
  if (typeof event.call_id !== 'string' || type === 'tool_request' || type === 'call_announced') return;
  consumer.consumeLine(
    JSON.stringify({
      type: 'tool_request',
      msg_id: msgId,
      call_id: event.call_id,
      tool: { name: event.tool_name ?? 'FixtureTool', category: 'info', args: {}, description: 'fixture' },
    })
  );
}

function replayCanonicalEvent(relative: string): void {
  if (relative === 'events/ready.json') {
    expect(new DesktopCoreV1Consumer().consumeLine(text(relative))).toMatchObject({ kind: 'event', contract: 'v1' });
    return;
  }
  const consumer = negotiated();
  const event = json(relative);
  if (relative === 'events/anvil_receipt_invalidated.json') {
    consumer.consumeLine(text('events/anvil_receipt.json'));
  } else if (relative === 'events/workflow_node_event.json') {
    for (const line of lines('adversarial/workflow/valid-lifecycle.jsonl').slice(0, 2)) consumer.consumeLine(line);
  } else if (relative === 'events/sub_agent_event.json') {
    for (const line of lines('adversarial/workflow/valid-lifecycle.jsonl').slice(0, 3)) consumer.consumeLine(line);
  } else if (relative === 'events/workflow_finished.json') {
    for (const line of lines('adversarial/workflow/valid-lifecycle.jsonl').slice(0, -1)) consumer.consumeLine(line);
  } else {
    seedOrdinary(consumer, event);
  }
  expect(consumer.consumeLine(JSON.stringify(event))).toMatchObject({ kind: 'event', contract: 'v1' });
}

describe('Wayland Core Desktop v1 producer pin', () => {
  it('pins the exact validation-only producer identity without changing the released engine', () => {
    expect(DESKTOP_CORE_V1_PRODUCER_COMMIT).toBe('0ccaa90b');
    expect(manifest.contract).toEqual({ name: DESKTOP_CORE_V1_PIN.name, major: 1, minor: 16 });
    expect(manifest.generator).toBe(DESKTOP_CORE_V1_PIN.generator);
    expect(manifest.fixture_digest).toBe(DESKTOP_CORE_V1_PIN.fixtureDigest);
    expect(manifest.schema_digest).toBe(DESKTOP_CORE_V1_PIN.schemaDigest);
    expect(manifest.source_inputs_digest).toBe(DESKTOP_CORE_V1_PIN.sourceInputsDigest);
    // The bundled engine and this pin must move together: Core's own host
    // observer rejects a descriptor mismatch in either direction, so a pin that
    // does not name the bundled release is a broken install, not a stale note.
    //
    // Moved v0.13.0 -> v0.13.2 by re-deriving from the released manifest, which
    // is what this assertion demands rather than patching the string. v0.13.2
    // advertises the SAME contract identity - minor 14, gen/14, an identical
    // schema_digest and an identical capability set - so the corpus shape did
    // not move. Only the stamped `fixture_digest` and `source_inputs_digest`
    // changed, and exactly six vendored fixtures carry that stamp; every other
    // byte of the corpus is unchanged.
    //
    // v0.13.2 -> v0.13.3 moved NOTHING in the contract: the released manifest
    // carries byte-identical fixture, schema and source-inputs digests, the same
    // gen/14 generator and the same seventeen capability statuses. Re-derived
    // from that manifest, not assumed - the assertions above are what prove it,
    // and they are unchanged because the bytes are.
    //
    // That distinction is the whole risk. assertDescriptor fails closed on both
    // of those fields, so bumping the bundled tag WITHOUT re-vendoring them
    // would have handed users a build that dies at the handshake on every turn
    // - the same shape of failure as the `contract_minor_mismatch` (pin 14 vs
    // engine 12) that preceded the v0.13.0 move.
    //
    // v0.13.3 -> v0.13.4 is the first move since v0.13.0 that changes the
    // corpus SHAPE, not just its stamp: minor 14 -> 16, gen/14 -> gen/16, a new
    // `render_artifact` event, three new capabilities, and `always_path` added
    // to the `tool_approve` scope schema. Re-derived from the released
    // manifest and cross-checked against the SIGNED release asset
    // `wayland-core-v0.13.4-desktop-contract-v1.tar.gz`: 176 files, 176 digest
    // matches, with a deliberately wrong comparison shown to report a mismatch.
    //
    // Note what did NOT move: commands 23 -> 23. Core added `grant_path`,
    // `revoke_path` and `grant_workspace_capability` to the protocol but
    // shipped no command fixtures, and the command schema is generated from the
    // fixture set over a closed `oneOf`, so all three stay unsendable under a
    // negotiated contract (FerroxLabs/wayland-core#314).
    //
    // If the pin is ever NOT 16 this whole assertion is stale and the coupling
    // must be re-derived from the released manifest, not patched.
    expect(DESKTOP_CORE_V1_PIN.minor).toBe(16);
    expect(readFileSync(path.resolve(process.cwd(), 'scripts/prepareWaylandCore.js'), 'utf8')).toContain(
      "const DEFAULT_WCORE_VERSION = 'v0.13.4'"
    );
  });

  it('recomputes the producer fixture and schema digests from the vendored bytes', () => {
    const fixtureEntries = manifest.fixture_inventory.map((relative) => {
      let bytes = readFileSync(path.join(root, relative));
      // Mirrors `fixtures_digest` in Core's `contract/generate.rs`: the six
      // fixtures the generator stamps the descriptor onto are hashed with
      // `contract.fixture_digest` zeroed, because the digest cannot contain
      // itself. Keep this list identical to the producer's or the recompute
      // silently stops proving anything.
      if (
        [
          'events/ready.json',
          'compat/events/ready.journaled-without-replay.json',
          'compat/events/ready.disabled-by-host.legacy.json',
          'adversarial/events/version-mismatch.jsonl',
          'adversarial/events/schema-mismatch.jsonl',
          'adversarial/events/fixture-mismatch.jsonl',
        ].includes(relative)
      ) {
        const value = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
        const contract = value.contract as Record<string, unknown>;
        contract.fixture_digest = `sha256:${'0'.repeat(64)}`;
        bytes = canonicalJsonBytes(value);
      }
      return [relative, bytes] as [string, Buffer];
    });
    expect(digestNamed(fixtureEntries)).toBe(DESKTOP_CORE_V1_PIN.fixtureDigest);

    const schemaEntries = readdirSync(path.join(root, 'schema')).map((name) => [
      `schema/${name}`,
      readFileSync(path.join(root, 'schema', name)),
    ]) as Array<[string, Buffer]>;
    expect(digestNamed(schemaEntries)).toBe(DESKTOP_CORE_V1_PIN.schemaDigest);
  });

  // 52 -> 59 events is C-1: the seven producer events the old corpus omitted
  // are now declared, so the corpus finally describes the whole wire. 59 -> 60
  // is 0.13.0's `call_announced`, the frame for a call that dispatches without
  // passing an approval gate.
  it('contains exactly the advertised 23 commands, 61 events, and 171 fixtures', () => {
    expect(manifest.counts).toEqual({ child_types: 3, commands: 23, events: 61, fixtures: 171 });
    // The inventory and the declared count must agree - a corpus that ships a
    // fixture it does not list, or lists one it does not ship, is the exact
    // class of drift C-1 was.
    expect(manifest.fixture_inventory).toHaveLength(manifest.counts.fixtures);
    for (const relative of manifest.fixture_inventory)
      expect(() => readFileSync(path.join(root, relative))).not.toThrow();
  });
});

// Core 0.13.0 emits `tool_request` only for calls that pass an approval gate.
// A call that skips the gate - force mode, an allow-listed tool, a
// command-scoped grant, a recovered approval, or a tool just granted `Always` -
// is announced by `call_announced` instead. Before that frame existed those
// calls dispatched with nothing on the wire and the `tool_running` behind them
// failed closed, exiting the engine mid-turn and blocking Smart Trader's setup.
//
// The frame carries no `tool_` prefix so older hosts drop it. Dropping is NOT
// enough for us: the reducer has to REGISTER the call, or the `tool_running`
// still finds no matching request and we reproduce the original crash exactly.
describe('call_announced (Core 0.13.0 ungated call path)', () => {
  const announced = json('events/call_announced.json');
  const callId = announced.call_id as string;
  const msgId = announced.msg_id as string;

  function started(): DesktopCoreV1Consumer {
    const consumer = negotiated();
    consumer.consumeLine(JSON.stringify({ type: 'stream_start', msg_id: msgId }));
    return consumer;
  }

  it('registers the call so the tool_running behind it is accepted', () => {
    const consumer = started();
    expect(consumer.consumeLine(text('events/call_announced.json'))).toMatchObject({ kind: 'event' });
    expect(
      consumer.consumeLine(JSON.stringify({ ...json('events/tool_running.json'), call_id: callId, msg_id: msgId }))
    ).toMatchObject({ kind: 'event' });
    expect(
      consumer.consumeLine(JSON.stringify({ ...json('events/tool_result.json'), call_id: callId, msg_id: msgId }))
    ).toMatchObject({ kind: 'event' });
  });

  it('still fails closed on a tool_running nobody announced', () => {
    const consumer = started();
    expectContractError(() =>
      consumer.consumeLine(
        JSON.stringify({ ...json('events/tool_running.json'), call_id: 'never-announced', msg_id: msgId })
      )
    );
  });

  it('still rejects a call announced twice', () => {
    const consumer = started();
    consumer.consumeLine(text('events/call_announced.json'));
    expectContractError(() => consumer.consumeLine(text('events/call_announced.json')));
  });

  it('still rejects a call announced on one turn and run on another', () => {
    const consumer = started();
    consumer.consumeLine(text('events/call_announced.json'));
    consumer.consumeLine(JSON.stringify({ type: 'stream_start', msg_id: 'msg-other' }));
    expectContractError(() =>
      consumer.consumeLine(
        JSON.stringify({ ...json('events/tool_running.json'), call_id: callId, msg_id: 'msg-other' })
      )
    );
  });
});

describe('actual Desktop consumer corpus replay', () => {
  it('replays every canonical event through negotiation, schema, and the relevant reducer', () => {
    for (const name of readdirSync(path.join(root, 'events')).toSorted()) replayCanonicalEvent(`events/${name}`);
  });

  it('accepts every canonical and compatibility command and rejects every malformed command', () => {
    const consumer = negotiated();
    for (const directory of ['commands', 'compat/commands']) {
      for (const name of readdirSync(path.join(root, directory)).toSorted()) {
        expect(consumer.validateOutboundCommand(json(`${directory}/${name}`))).toEqual(json(`${directory}/${name}`));
      }
    }
    for (const name of readdirSync(path.join(root, 'adversarial/commands')).toSorted()) {
      const raw = text(`adversarial/commands/${name}`);
      expectContractError(() => consumer.validateOutboundCommandLine(raw));
    }
  });

  it('replays legacy compatibility event shapes but never promotes the legacy Anvil receipt', () => {
    for (const name of readdirSync(path.join(root, 'compat/events')).toSorted()) {
      const relative = `compat/events/${name}`;
      if (name === 'ready.minimal.json') {
        expect(new DesktopCoreV1Consumer().consumeLine(text(relative))).toMatchObject({
          kind: 'event',
          contract: 'legacy',
        });
        continue;
      }
      // The two non-default `ready` postures carry the same descriptor stamp as
      // `events/ready.json`, so each has to negotiate a session of its own.
      // `journaled-without-replay` is the keyring-less production frame (named
      // session, no crash replay) and `disabled-by-host.legacy` is the corpus's
      // only `session_id: null`. Replaying either through an already-negotiated
      // consumer would just re-prove the duplicate-ready guard.
      if (name === 'ready.journaled-without-replay.json' || name === 'ready.disabled-by-host.legacy.json') {
        expect(new DesktopCoreV1Consumer().consumeLine(text(relative))).toMatchObject({
          kind: 'event',
          contract: 'v1',
        });
        continue;
      }
      const consumer = negotiated();
      const event = json(relative);
      seedOrdinary(consumer, event);
      if (name === 'anvil_receipt.legacy.json') expectContractError(() => consumer.consumeLine(JSON.stringify(event)));
      else expect(consumer.consumeLine(JSON.stringify(event))).toMatchObject({ kind: 'event' });
    }
  });

  // C-1 replaced the seven-event drift allowlist. Those types are DECLARED now,
  // so this asserts the mechanism that replaced it rather than deleting the
  // coverage: each of the seven is a first-class corpus event, which is what
  // makes the allowlist dead code, and the unknown-event rule that guarded the
  // rest of the wire is unchanged.
  it('declares the seven formerly-undeclared producer events, and still fails closed on a truly unknown one', () => {
    const formerlyUndeclared = [
      'workspace_policy',
      'capability_activation',
      'compact_offload',
      'mid_flight_monitor_decision',
      'provider_attempt',
      'provider_failure',
      'provider_retry',
    ];
    const declared = new Set(manifest.events.map((event) => event.type));
    for (const type of formerlyUndeclared) expect(declared.has(type)).toBe(true);

    // Each one now replays as a real event off its own fixture, schema-checked -
    // it is no longer waved through on a name. workspace_policy is the one that
    // matters: it fires immediately after ready on EVERY session, and it is the
    // frame that used to fail every session closed.
    for (const type of formerlyUndeclared) {
      const consumer = negotiated();
      const fixture = json(`events/${type}.json`);
      expect(consumer.consumeLine(JSON.stringify(fixture))).toMatchObject({ kind: 'event', contract: 'v1' });
      // And the session keeps running afterwards.
      expect(consumer.consumeLine(JSON.stringify({ type: 'stream_start', msg_id: 'm1' }))).toMatchObject({
        kind: 'event',
        contract: 'v1',
      });
    }

    // The unknown-event rule is untouched: a type outside the corpus with no
    // `critical` flag still fails the session closed rather than being guessed at.
    expectContractError(
      () => negotiated().consumeLine(JSON.stringify({ type: 'some_future_core_event' })),
      'unknown_criticality'
    );
    expectContractError(
      () => negotiated().consumeLine(JSON.stringify({ type: 'some_future_core_event', critical: true })),
      'unknown_critical'
    );
    expect(negotiated().consumeLine(JSON.stringify({ type: 'some_future_core_event', critical: false }))).toEqual({
      kind: 'drop',
      reason: 'unknown_noncritical',
    });
  });

  it('rejects an unrepresentable number on the production object path, not just the line path', () => {
    const consumer = negotiated();
    // The guard must live where production actually serializes. index.ts writes
    // JSON.stringify(validateOutboundCommand(cmd)) - it never calls the line
    // variant, so a line-only check was dead code (cross-audit, Codex 5.6 Sol).
    expectContractError(
      () => consumer.validateOutboundCommand(json('adversarial/commands/continue-with-budget-overflow-tokens.jsonl')),
      'command_integer_unrepresentable'
    );
    // Decimal and exponent spellings of the same overflow must not slip past.
    for (const additional_tokens of [18446744073709551616, 1.8446744073709552e19]) {
      expectContractError(
        () => consumer.validateOutboundCommand({ type: 'continue_with_budget', request_id: 'r1', additional_tokens }),
        'command_integer_unrepresentable'
      );
    }
    // And it must not reach past the vector it exists for.
    expect(consumer.validateOutboundCommand(json('commands/continue_with_budget.json'))).toEqual(
      json('commands/continue_with_budget.json')
    );
    expect(consumer.validateOutboundCommandLine('{"type":"ping","note":"18446744073709551616"}')).toMatchObject({
      type: 'ping',
    });
  });

  it('fails closed on malformed, version/digest mismatch, unknown-critical, and unknown-criticality vectors', () => {
    for (const relative of [
      'adversarial/events/version-mismatch.jsonl',
      'adversarial/events/schema-mismatch.jsonl',
      'adversarial/events/fixture-mismatch.jsonl',
    ]) {
      expectContractError(() => new DesktopCoreV1Consumer().consumeLine(text(relative)));
    }
    expect(negotiated().consumeLine(text('adversarial/events/unknown-noncritical.jsonl'))).toEqual({
      kind: 'drop',
      reason: 'unknown_noncritical',
    });
    expectContractError(
      () => negotiated().consumeLine(text('adversarial/events/unknown-critical.jsonl')),
      'unknown_critical'
    );
    expectContractError(
      () => negotiated().consumeLine(text('adversarial/events/unknown-criticality.jsonl')),
      'unknown_criticality'
    );
    expectContractError(() => new DesktopCoreV1Consumer().consumeLine('{not-json'), 'malformed_json');
  });

  it('fails closed on generic critical extensions and malformed extension declarations', () => {
    expectContractError(
      () =>
        negotiated().consumeLine(
          JSON.stringify({ type: 'info', message: 'future', required_extensions: ['future-authority'] })
        ),
      'unknown_critical_extension'
    );
    expectContractError(
      () =>
        negotiated().consumeLine(
          JSON.stringify({ type: 'future_observation', critical: false, required_extensions: ['future-authority'] })
        ),
      'unknown_critical_extension'
    );
    expectContractError(
      () =>
        negotiated().consumeLine(
          JSON.stringify({ type: 'info', message: 'future', required_extensions: 'future-authority' })
        ),
      'malformed_critical_extensions'
    );
  });

  // K-03: this title describes the general case, not the new eager-completion
  // exception added below (`DesktopCoreV1Consumer.consumeChunk` recovers a
  // complete-but-unterminated stream_end/error frame without waiting for its
  // newline). The assertions here remain accurate post-fix: the split at byte
  // 17 lands mid-object (the `ready` fixture's opening brace/properties are
  // not yet a complete, balanced JSON object at that offset), so it is
  // correctly still buffered either way. See the 'K-03: unterminated final
  // line recovery' describe block below for the new exception's coverage.
  it('bounds raw JSONL frames, rejects invalid UTF-8, and requires a terminating newline', () => {
    const split = new DesktopCoreV1Consumer();
    const ready = Buffer.from(`${text('events/ready.json')}\n`);
    expect(split.consumeChunk(ready.subarray(0, 17))).toEqual([]);
    expect(split.consumeChunk(ready.subarray(17))).toHaveLength(1);

    const invalidUtf8 = new DesktopCoreV1Consumer();
    expectContractError(() => invalidUtf8.consumeChunk(Buffer.from([0xc3, 0x28, 0x0a])), 'invalid_utf8');

    const oversized = new DesktopCoreV1Consumer();
    expectContractError(
      () => oversized.consumeChunk(Buffer.alloc(DESKTOP_CORE_MAX_LINE_BYTES, 0x61)),
      'oversized_line'
    );

    const unterminated = new DesktopCoreV1Consumer();
    expect(unterminated.consumeChunk(Buffer.from('{"type":"ready"}'))).toEqual([]);
    expectContractError(() => unterminated.finishInput(), 'unterminated_jsonl');
  });
});

describe('deferred consumer reducers', () => {
  it('ordinary_turn_tool_replay_reducer accepts a full lifecycle without deduplicating equal text', () => {
    const consumer = negotiated();
    const frames = [
      { type: 'stream_start', msg_id: 'm1' },
      { type: 'text_delta', msg_id: 'm1', text: 'same' },
      { type: 'text_delta', msg_id: 'm1', text: 'same' },
      {
        type: 'tool_request',
        msg_id: 'm1',
        call_id: 'c1',
        tool: { name: 'Read', category: 'info', args: {}, description: 'read' },
      },
      { type: 'tool_running', msg_id: 'm1', call_id: 'c1', tool_name: 'Read' },
      { type: 'tool_chunk', msg_id: 'm1', call_id: 'c1', tool_name: 'Read', chunk: 'one' },
      {
        type: 'tool_result',
        msg_id: 'm1',
        call_id: 'c1',
        tool_name: 'Read',
        status: 'success',
        output: 'ok',
        output_type: 'text',
      },
      { type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' },
    ];
    for (const frame of frames) expect(consumer.consumeLine(JSON.stringify(frame))).toMatchObject({ kind: 'event' });
  });

  it('ordinary_turn_tool_replay_reducer rejects gaps/conflicts and absorbs events after terminal state', () => {
    const gap = negotiated();
    gap.consumeLine(JSON.stringify({ type: 'stream_start', msg_id: 'm1' }));
    expectContractError(() =>
      gap.consumeLine(JSON.stringify({ type: 'tool_running', msg_id: 'm1', call_id: 'missing', tool_name: 'Read' }))
    );

    const conflict = negotiated();
    conflict.consumeLine(JSON.stringify({ type: 'stream_start', msg_id: 'm1' }));
    conflict.consumeLine(JSON.stringify({ type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' }));
    expect(conflict.consumeLine(JSON.stringify({ type: 'text_delta', msg_id: 'm1', text: 'late' }))).toEqual({
      kind: 'drop',
      reason: 'after_terminal',
    });
    expectContractError(() =>
      conflict.consumeLine(
        JSON.stringify({ type: 'error', msg_id: 'm1', error: { code: 'late', message: 'late', retryable: false } })
      )
    );
  });

  it('replays the execution-policy revision vectors through the Desktop policy reducer', () => {
    const replayPolicyVector = (name: string): ReturnType<DesktopCoreV1Consumer['consumeLine']>[] => {
      const consumer = negotiated();
      return lines(`adversarial/policy/${name}`)
        .slice(1)
        .map((line) => {
          const value = JSON.parse(line) as Record<string, unknown>;
          const event =
            value.type === 'ready'
              ? { type: 'execution_policy', ...(value.execution_policy as Record<string, unknown>) }
              : value;
          return consumer.consumeLine(JSON.stringify(event));
        });
    };

    for (const result of replayPolicyVector('valid-revisions.jsonl')) {
      expect(result).toMatchObject({ kind: 'event' });
    }
    const duplicateResults = replayPolicyVector('duplicate-identical.jsonl');
    expect(duplicateResults.at(-1)).toEqual({ kind: 'drop', reason: 'duplicate' });
    for (const name of [
      'duplicate-conflict.jsonl',
      'noncritical.jsonl',
      'revision-gap.jsonl',
      'version-mismatch.jsonl',
    ]) {
      expectContractError(() => replayPolicyVector(name));
    }
  });

  it('replays workflow lifecycle, duplicate, gap, conflict, and post-terminal vectors', () => {
    const valid = negotiated();
    for (const line of lines('adversarial/workflow/valid-lifecycle.jsonl'))
      expect(valid.consumeLine(line)).toMatchObject({ kind: 'event' });
    const duplicate = negotiated();
    const duplicateResults = lines('adversarial/workflow/duplicate-identical.jsonl').map((line) =>
      duplicate.consumeLine(line)
    );
    expect(duplicateResults.at(-1)).toEqual({ kind: 'drop', reason: 'duplicate' });
    for (const name of [
      'child-duplicate-conflict.jsonl',
      'child-sequence-gap.jsonl',
      'conflicting-node-terminal.jsonl',
      'duplicate-conflict.jsonl',
      'sequence-gap.jsonl',
    ]) {
      const consumer = negotiated();
      expectContractError(() => {
        for (const line of lines(`adversarial/workflow/${name}`)) consumer.consumeLine(line);
      });
    }
    const afterTerminal = negotiated();
    const results = lines('adversarial/workflow/after-terminal.jsonl').map((line) => afterTerminal.consumeLine(line));
    expect(results.at(-1)).toEqual({ kind: 'drop', reason: 'after_terminal' });

    const unlinked = negotiated();
    const unlinkedFrames = lines('adversarial/workflow/valid-lifecycle.jsonl').map(
      (line) => JSON.parse(line) as Record<string, unknown>
    );
    delete unlinkedFrames[1].child_run_id;
    delete unlinkedFrames[2].child_run_id;
    unlinked.consumeLine(JSON.stringify(unlinkedFrames[0]));
    unlinked.consumeLine(JSON.stringify(unlinkedFrames[1]));
    unlinked.consumeLine(JSON.stringify(unlinkedFrames[2]));
    expectContractError(() => unlinked.consumeLine(JSON.stringify(unlinkedFrames[3])), 'workflow_child_correlation');
  });

  it('anvil_desktop_replay_reducer verifies digests, invalidation, stale replay, and every fail-closed vector', () => {
    const valid = negotiated();
    for (const line of lines('adversarial/anvil/valid-invalidation.jsonl')) valid.consumeLine(line);
    expect(valid.anvilStatus('receipt-desktop-001')).toBe('invalidated');

    const stale = negotiated();
    const staleResults = lines('adversarial/anvil/stale-replay.jsonl').map((line) => stale.consumeLine(line));
    expect(staleResults.at(-1)).toEqual({ kind: 'drop', reason: 'duplicate' });
    expect(stale.anvilStatus('receipt-desktop-001')).toBe('invalidated');

    const duplicate = negotiated();
    const duplicateResults = lines('adversarial/anvil/duplicate-identical.jsonl').map((line) =>
      duplicate.consumeLine(line)
    );
    expect(duplicateResults.at(-1)).toEqual({ kind: 'drop', reason: 'duplicate' });

    for (const name of [
      'altered-body.jsonl',
      'altered-invalidation-body.jsonl',
      'duplicate-conflict.jsonl',
      'out-of-order.jsonl',
      'sequence-gap.jsonl',
      'unknown-critical-extension.jsonl',
      'version-mismatch.jsonl',
    ]) {
      const consumer = negotiated();
      expectContractError(() => {
        for (const line of lines(`adversarial/anvil/${name}`)) consumer.consumeLine(line);
      });
    }

    const nested = negotiated();
    expect(nested.consumeLine(text('adversarial/anvil/nested-receipt-inert.jsonl'))).toMatchObject({ kind: 'event' });
    expect(nested.anvilStatus('receipt-desktop-001')).toBeUndefined();
  });

  it('anvil_persistent_mutation_watcher revokes publication-bound trust and requires fresh Core validation', () => {
    const consumer = negotiated();
    consumer.consumeLine(text('events/anvil_receipt.json'));
    expect(consumer.anvilStatus('receipt-desktop-001')).toBe('active');

    let mutation: (() => void) | undefined;
    const fakeWatcher = Object.assign(new EventEmitter(), { close: vi.fn() }) as unknown as FSWatcher;
    const fakeWatch = ((_path: string, _options: unknown, listener: () => void) => {
      mutation = listener;
      return fakeWatcher;
    }) as typeof watch;
    const watcher = new AnvilPersistentMutationWatcher('/workspace', () => consumer.markWorkspaceMutated(), fakeWatch);
    watcher.start();
    mutation?.();
    expect(consumer.anvilStatus('receipt-desktop-001')).toBe('historical');
    expect(fakeWatcher.close).not.toHaveBeenCalled();
    watcher.stop();
    expect(fakeWatcher.close).toHaveBeenCalledOnce();

    const unsupported = negotiated();
    unsupported.consumeLine(text('events/anvil_receipt.json'));
    const unsupportedWatcher = new AnvilPersistentMutationWatcher(
      '/workspace',
      () => unsupported.markWorkspaceMutated(),
      (() => {
        throw new Error('recursive watch unsupported');
      }) as typeof watch
    );
    unsupportedWatcher.start();
    expect(unsupported.anvilStatus('receipt-desktop-001')).toBe('historical');
    expect(unsupportedWatcher.active).toBe(false);

    const reconnect = negotiated();
    reconnect.consumeLine(text('events/anvil_receipt.json'));
    reconnect.markDisconnected();
    expect(reconnect.anvilStatus('receipt-desktop-001')).toBe('historical');
  });
});

// K-03: a complete `stream_end`/`error` frame whose bytes are fully received
// but whose trailing `\n` delimiter has not yet arrived (or never arrives)
// left the running UI state stuck indefinitely with zero observable trace -
// the confirmed root cause of "turn shows running minutes after Core already
// finished, with no further engine activity in the log." Cases 1-4 below are
// RED against pre-fix code: cases 1-3 currently return `[]` for the
// unterminated frame (nothing is recovered until a later delimiter or
// `finishInput()` arrives), and case 4's second `consumeChunk` call (feeding
// only the orphan `\n`) would currently throw `malformed_json`, since nothing
// consumed the first object early and a lone `\n` is read as a zero-length
// line. Cases 5-6 already pass unmodified today - call this out explicitly,
// as K-01's PRF-03 did for its own already-correct behavior, so "already
// green" is not mistaken for "test written wrong."
describe('K-03: unterminated final line recovery', () => {
  it('does NOT accept two concatenated objects with no delimiter between them', () => {
    // Cross-audit (Codex 5.6 Sol). Eager recovery returned at the first balanced
    // closing brace and then kept scanning, so a stream violating JSONL framing
    // yielded two accepted events. The pre-fix consumer kept one unterminated
    // invalid frame and failed closed on finishInput(). Recovery must change
    // WHEN a frame is parsed, never WHAT is accepted.
    const consumer = negotiated();
    const twoObjects =
      `${JSON.stringify({ type: 'stream_start', msg_id: 'm1' })}` +
      `${JSON.stringify({ type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' })}`;

    // Nothing is delivered: this is one malformed, unterminated frame.
    expect(consumer.consumeChunk(Buffer.from(twoObjects))).toEqual([]);
    expectContractError(() => consumer.finishInput(), 'unterminated_jsonl');
  });

  it('does NOT eagerly deliver a valid object that has trailing garbage behind it', () => {
    const consumer = negotiated();
    const withGarbage = `${JSON.stringify({ type: 'stream_start', msg_id: 'm1' })} not-json`;

    expect(consumer.consumeChunk(Buffer.from(withGarbage))).toEqual([]);
  });

  it('preserves a frame with trailing JSON whitespace before its delayed newline', () => {
    // Cross-audit (Codex 5.6 Sol). Eager extraction stopped exactly after `}`,
    // stranding the spaces; the later newline then parsed them as their own
    // line and threw malformed_json. Before the fix, JSON.parse accepted the
    // same newline-terminated frame with trailing whitespace normally.
    const consumer = negotiated();
    const streamStart = `${JSON.stringify({ type: 'stream_start', msg_id: 'm1' })}\n`;
    expect(consumer.consumeChunk(Buffer.from(streamStart))).toHaveLength(1);

    const bodyWithSpaces = `${JSON.stringify({ type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' })}   `;
    // Held, not stranded.
    expect(consumer.consumeChunk(Buffer.from(bodyWithSpaces))).toEqual([]);

    const results = consumer.consumeChunk(Buffer.from('\n'));
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ kind: 'event', event: { type: 'stream_end', msg_id: 'm1' } });
  });

  it('does NOT let a stale orphan-delimiter flag absorb a later malformed empty line', () => {
    // K-02/K-03 cross-audit (Kimi K3). `awaitingOrphanDelimiter` was cleared
    // only by consuming a leading delimiter, so it survived a normal
    // newline-terminated frame. Once ANY eager recovery had happened, the next
    // bare newline anywhere in the stream was silently absorbed - a zero-length
    // line this consumer is supposed to reject. That is protocol leniency in a
    // security-load-bearing validator; it must stay fail-closed.
    const consumer = negotiated();
    const turnOne =
      `${JSON.stringify({ type: 'stream_start', msg_id: 'm1' })}\n` +
      JSON.stringify({ type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' });

    // Eager recovery of the unterminated stream_end sets the flag.
    expect(consumer.consumeChunk(Buffer.from(turnOne))).toHaveLength(2);

    // The orphan delimiter never arrives; the engine moves straight on to the
    // next turn, followed by a spurious empty line that must be rejected.
    const nextFrame = `${JSON.stringify({ type: 'stream_start', msg_id: 'm2' })}\n\n`;

    expectContractError(() => consumer.consumeChunk(Buffer.from(nextFrame)), 'malformed_json');
  });

  it('still absorbs a genuinely delayed delimiter that arrives in a later chunk', () => {
    // The reconciliation this flag exists for must keep working: a merely LATE
    // newline is not a new zero-length line and must not become malformed_json.
    const consumer = negotiated();
    const turnOne =
      `${JSON.stringify({ type: 'stream_start', msg_id: 'm1' })}\n` +
      JSON.stringify({ type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' });

    expect(consumer.consumeChunk(Buffer.from(turnOne))).toHaveLength(2);
    // The delimiter arrives alone, in its own chunk, exactly as the engine
    // would have sent it had the write not been split.
    expect(consumer.consumeChunk(Buffer.from('\n'))).toEqual([]);
    expect(() => consumer.finishInput()).not.toThrow();
  });

  it('recovers a content-free stream_end the instant its bytes are complete, without its trailing newline', () => {
    const consumer = negotiated();
    const streamStart = `${JSON.stringify({ type: 'stream_start', msg_id: 'm1' })}\n`;
    const streamEndBody = JSON.stringify({ type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' });

    // ONE consumeChunk call carries the complete stream_start line AND the
    // complete-but-unterminated stream_end body.
    const results = consumer.consumeChunk(Buffer.from(streamStart + streamEndBody));

    expect(results).toHaveLength(2);
    expect(results[1]).toMatchObject({
      kind: 'event',
      event: { type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' },
    });
  });

  it('recovers an unterminated error frame identically, covering the TRN-02 error path', () => {
    const consumer = negotiated();
    const streamStart = `${JSON.stringify({ type: 'stream_start', msg_id: 'm2' })}\n`;
    const errorBody = JSON.stringify({
      type: 'error',
      msg_id: 'm2',
      error: { code: 'provider_error', message: 'provider stream failed', retryable: true },
    });

    const results = consumer.consumeChunk(Buffer.from(streamStart + errorBody));

    expect(results).toHaveLength(2);
    expect(results[1]).toMatchObject({
      kind: 'event',
      event: { type: 'error', msg_id: 'm2', error: { code: 'provider_error', retryable: true } },
    });
  });

  it('recovers the literal "no assistant text, no tools" repro - the closest unit-level analog to TRN-03', () => {
    const consumer = negotiated();
    const streamStart = `${JSON.stringify({ type: 'stream_start', msg_id: 'm3' })}\n`;
    // No text_delta, no tool_request between stream_start and stream_end.
    const streamEndBody = JSON.stringify({ type: 'stream_end', msg_id: 'm3', finish_reason: 'stop' });

    const results = consumer.consumeChunk(Buffer.from(streamStart + streamEndBody));

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ kind: 'event', event: { type: 'stream_start', msg_id: 'm3' } });
    expect(results[1]).toMatchObject({
      kind: 'event',
      event: { type: 'stream_end', msg_id: 'm3', finish_reason: 'stop' },
    });
  });

  it('anti-regression: a merely-delayed (not lost) delimiter is silently absorbed, not misread as malformed_json', () => {
    const consumer = negotiated();
    const streamStart = `${JSON.stringify({ type: 'stream_start', msg_id: 'm4' })}\n`;
    const streamEndBody = JSON.stringify({ type: 'stream_end', msg_id: 'm4', finish_reason: 'stop' });

    const firstResults = consumer.consumeChunk(Buffer.from(streamStart + streamEndBody));
    expect(firstResults).toHaveLength(2);
    expect(firstResults[1]).toMatchObject({ kind: 'event', event: { type: 'stream_end', msg_id: 'm4' } });

    // The delayed delimiter arrives alone in a later chunk - not a new,
    // zero-length line; not a malformed_json error.
    const orphanResults = consumer.consumeChunk(Buffer.from('\n'));
    expect(orphanResults).toEqual([]);

    // The consumer was not left in a poisoned state by the orphan `\n`: a
    // fresh, complete, newline-terminated event for a NEW exchange still
    // parses normally afterward.
    const configChanged = `${JSON.stringify({ type: 'config_changed', capabilities: {} })}\n`;
    const thirdResults = consumer.consumeChunk(Buffer.from(configChanged));
    expect(thirdResults).toHaveLength(1);
    expect(thirdResults[0]).toMatchObject({ kind: 'event', event: { type: 'config_changed' } });
  });

  it('anti-regression: genuinely incomplete data (mid-field, no closing brace) is buffered unaffected - already green today', () => {
    const consumer = negotiated();
    consumer.consumeChunk(Buffer.from(`${JSON.stringify({ type: 'stream_start', msg_id: 'm1' })}\n`));

    // Cut mid-field (inside the "finish_reason" key name itself), no closing
    // brace, no newline. The scanner's depth never returns to zero, so this
    // must remain genuinely incomplete - zero behavior change from today.
    const truncated = '{"type":"stream_end","msg_id":"m1","finish_rea';
    expect(consumer.consumeChunk(Buffer.from(truncated))).toEqual([]);

    // A second consumeChunk call supplies the rest of the body plus the
    // newline - the SAME consumer parses it normally afterward, proving the
    // truncated attempt neither threw nor flipped the consumer to 'failed'.
    const completion = consumer.consumeChunk(Buffer.from('son":"stop"}\n'));
    expect(completion).toHaveLength(1);
    expect(completion[0]).toMatchObject({
      kind: 'event',
      event: { type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' },
    });
  });

  it('anti-regression: a non-object leftover falls back untouched by the {-prefix short-circuit - already green today', () => {
    const consumer = new DesktopCoreV1Consumer();
    // A lone partial UTF-8 continuation-lead byte, no newline: not `{`-prefixed,
    // so findCompleteObjectEnd short-circuits to null immediately and this
    // falls through to exactly today's buffering behavior.
    expect(consumer.consumeChunk(Buffer.from([0xc3]))).toEqual([]);
  });
});
