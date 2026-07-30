/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Drive Core's real corpus through the Desktop decoder.
 *
 * Every fixture here is a byte copy of something Core generated — no frame in
 * this file was written by reading `protocol.ts`. Both directions are proved
 * throughout: golden frames must pass, adversarial frames must be refused, and
 * the adversarial cases are the ones Core itself asserts against in
 * `wcore-protocol/tests/desktop_contract_adversarial.rs`.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CONTRACT_EVENT_TYPES,
  PINNED_CONTRACT,
  WCoreFrameDecoder,
  relaxedNestedOneOfCount,
} from '../../src/process/agent/wcore/contract/decoder';
import { UNHANDLED_CONTRACT_EVENTS } from '../../src/process/agent/wcore/contract/coverage';

const CORPUS = join(__dirname, '../../resources/wcore-contract/v1');

const readFrame = (relative: string) => readFileSync(join(CORPUS, relative), 'utf8').trim();
const READY = readFrame('events/ready.json');

/** A decoder that has already consumed the golden `ready`. */
function negotiated(): WCoreFrameDecoder {
  const decoder = new WCoreFrameDecoder();
  const outcome = decoder.decode(READY);
  expect(outcome.kind, JSON.stringify(outcome)).toBe('negotiated');
  return decoder;
}

const eventFixtures = readdirSync(join(CORPUS, 'events'))
  .filter((name) => name.endsWith('.json'))
  .toSorted();

describe('negotiation', () => {
  it('accepts the golden ready and pins the published digests', () => {
    const decoder = new WCoreFrameDecoder();
    const outcome = decoder.decode(READY);
    expect(outcome).toMatchObject({ kind: 'negotiated' });
    if (outcome.kind !== 'negotiated') throw new Error('unreachable');
    expect(outcome.negotiation.fit).toBe('exact');
    expect(outcome.negotiation.warnings).toEqual([]);
    expect(outcome.negotiation.producer.fixture_digest).toBe(PINNED_CONTRACT.fixture_digest);
    expect(outcome.negotiation.producer.schema_digest).toBe(PINNED_CONTRACT.schema_digest);
  });

  it('surfaces the execution policy carried on ready instead of discarding it', () => {
    const outcome = new WCoreFrameDecoder().decode(READY);
    if (outcome.kind !== 'negotiated') throw new Error('expected negotiated');
    // The security posture rode in on `ready` all along; the old decoder typed
    // `ready` as `{version, session_id?, capabilities}` and dropped the rest.
    expect(outcome.frame.execution_policy).toMatchObject({
      critical: true,
      policy: { approvals: 'prompt', posture: 'smart', sandbox: 'required' },
      revision: 0,
    });
  });

  it('refuses everything before ready', () => {
    const outcome = new WCoreFrameDecoder().decode(readFrame('events/execution_policy.json'));
    expect(outcome).toMatchObject({ kind: 'refused', code: 'ready-required', fatal: true });
  });

  it('refuses a second ready', () => {
    expect(negotiated().decode(READY)).toMatchObject({
      kind: 'refused',
      code: 'duplicate-ready',
      fatal: true,
    });
  });

  // Core's own adversarial vectors, asserted in
  // `ready_replay_fails_closed_on_major_schema_and_fixture_mismatch`.
  it.each([
    ['version-mismatch.jsonl', 'contract-major-mismatch'],
    ['schema-mismatch.jsonl', 'contract-digest-mismatch'],
    ['fixture-mismatch.jsonl', 'contract-digest-mismatch'],
  ])('refuses forged ready %s', (fixture, code) => {
    const outcome = new WCoreFrameDecoder().decode(readFrame(`adversarial/events/${fixture}`));
    expect(outcome).toMatchObject({ kind: 'refused', code, fatal: true });
  });

  it('refuses a ready whose digests are forged but is otherwise byte-identical to golden', () => {
    // The precise attack from the UAT: a `ready` that differs from golden only
    // in its digests. Before this decoder existed the two were indistinguishable.
    const forged = JSON.parse(READY);
    forged.contract.fixture_digest = `sha256:${'a'.repeat(64)}`;
    forged.contract.schema_digest = `sha256:${'b'.repeat(64)}`;
    const outcome = new WCoreFrameDecoder().decode(JSON.stringify(forged));
    expect(outcome).toMatchObject({ kind: 'refused', code: 'contract-digest-mismatch' });

    // Both directions: restoring the digests makes the same frame acceptable,
    // so the refusal is about the digests and not about re-serialisation.
    forged.contract.fixture_digest = PINNED_CONTRACT.fixture_digest;
    forged.contract.schema_digest = PINNED_CONTRACT.schema_digest;
    expect(new WCoreFrameDecoder().decode(JSON.stringify(forged))).toMatchObject({
      kind: 'negotiated',
    });
  });

  it('refuses a foreign producer name', () => {
    const forged = JSON.parse(READY);
    forged.contract.name = 'not-wayland';
    expect(new WCoreFrameDecoder().decode(JSON.stringify(forged))).toMatchObject({
      kind: 'refused',
      code: 'contract-name-mismatch',
      fatal: true,
    });
  });

  it('refuses a ready with no contract block at all', () => {
    const forged = JSON.parse(READY);
    delete forged.contract;
    expect(new WCoreFrameDecoder().decode(JSON.stringify(forged))).toMatchObject({
      kind: 'refused',
      code: 'contract-missing',
      fatal: true,
    });
  });

  it('refuses a ready whose contract block is present but malformed', () => {
    const forged = JSON.parse(READY);
    forged.contract = { name: PINNED_CONTRACT.name, major: PINNED_CONTRACT.major };
    expect(new WCoreFrameDecoder().decode(JSON.stringify(forged))).toMatchObject({
      kind: 'refused',
      code: 'invalid-ready',
      fatal: true,
    });
  });

  it('refuses a ready whose current_mode is not one of its own modes', () => {
    const forged = JSON.parse(READY);
    forged.capabilities.current_mode = 'ghost';
    expect(new WCoreFrameDecoder().decode(JSON.stringify(forged))).toMatchObject({
      kind: 'refused',
      code: 'invalid-ready',
    });
  });

  it('accepts a newer minor as degraded rather than bricking', () => {
    const newer = JSON.parse(READY);
    newer.contract.minor = PINNED_CONTRACT.minor + 1;
    newer.contract.fixture_digest = `sha256:${'c'.repeat(64)}`;
    const outcome = new WCoreFrameDecoder().decode(JSON.stringify(newer));
    if (outcome.kind !== 'negotiated') throw new Error(`expected negotiated, got ${outcome.kind}`);
    expect(outcome.negotiation.fit).toBe('minor-drift');
    expect(outcome.negotiation.warnings.join(' ')).toContain('degraded');
  });

  it('warns without refusing on generator, source-input and capability drift', () => {
    const drifted = JSON.parse(READY);
    drifted.contract.generator = 'wcore-desktop-contract-gen/99';
    drifted.contract.source_inputs_digest = `sha256:${'d'.repeat(64)}`;
    drifted.contract.capabilities.browser_events = 'unavailable';
    const outcome = new WCoreFrameDecoder().decode(JSON.stringify(drifted));
    if (outcome.kind !== 'negotiated') throw new Error(`expected negotiated, got ${outcome.kind}`);
    expect(outcome.negotiation.fit).toBe('exact');
    expect(outcome.negotiation.warnings).toHaveLength(3);
  });
});

describe('golden corpus replay', () => {
  it('validates every event fixture Core ships', () => {
    const failures: string[] = [];
    const seen = new Set<string>();
    for (const name of eventFixtures) {
      const decoder = negotiated();
      const frame = readFrame(`events/${name}`);
      const outcome = name === 'ready.json' ? decoder.decode(READY) : decoder.decode(frame);
      if (name === 'ready.json') continue;
      if (outcome.kind !== 'event') {
        failures.push(`${name}: ${outcome.kind} ${JSON.stringify(outcome)}`);
        continue;
      }
      seen.add(outcome.type);
    }
    expect(failures).toEqual([]);
    // Every contract event type except `ready` has a golden fixture and passed.
    expect([...seen].toSorted()).toEqual(CONTRACT_EVENT_TYPES.filter((t) => t !== 'ready'));
  });

  it('validates the back-compat fixtures, and refuses exactly the two Core also refuses', () => {
    const dir = join(CORPUS, 'compat/events');
    const refused: string[] = [];
    for (const name of readdirSync(dir).toSorted()) {
      if (name === 'ready.minimal.json') continue; // negotiation, covered below
      const outcome = negotiated().decode(readFileSync(join(dir, name), 'utf8').trim());
      if (outcome.kind !== 'event') refused.push(name);
    }
    // `anvil_receipt.legacy.json` is a pre-contract receipt shape. Core's own
    // `desktop_contract_adversarial.rs` asserts its reducer returns
    // `AnvilReceiptError::Malformed` for it, so refusing it is agreement with
    // Core, not a Desktop bug.
    expect(refused).toEqual(['anvil_receipt.legacy.json']);
  });

  it('refuses a pre-negotiation ready with an actionable error', () => {
    const minimal = readFrame('compat/events/ready.minimal.json');
    const outcome = new WCoreFrameDecoder().decode(minimal);
    expect(outcome).toMatchObject({ kind: 'refused', code: 'contract-missing', fatal: true });
    if (outcome.kind !== 'refused') throw new Error('unreachable');
    expect(outcome.message).toContain('Update wcore');
  });

  it('delivers execution_policy instead of dropping it', () => {
    const outcome = negotiated().decode(readFrame('events/execution_policy.json'));
    expect(outcome).toMatchObject({
      kind: 'event',
      type: 'execution_policy',
      criticality: 'safety',
      handled: true,
    });
    if (outcome.kind !== 'event') throw new Error('unreachable');
    expect(outcome.frame.policy).toMatchObject({ approvals: 'auto_edit', sandbox: 'required' });
  });

  it('replays the policy revision stream', () => {
    const decoder = negotiated();
    // The stream's own leading `ready` is a policy-reducer fixture (it carries
    // no `contract` block); negotiation is done from the golden `ready` above.
    const lines = readFrame('adversarial/policy/valid-revisions.jsonl')
      .split('\n')
      .filter(Boolean)
      .filter((line) => !line.includes('"type":"ready"'));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const outcome = decoder.decode(line);
      expect(outcome, line).toMatchObject({ kind: 'event', type: 'execution_policy' });
    }
  });

  it('reports contract events this host has no handler for', () => {
    const decoder = negotiated();
    const unhandled: string[] = [];
    for (const name of eventFixtures) {
      if (name === 'ready.json') continue;
      const outcome = decoder.decode(readFrame(`events/${name}`));
      if (outcome.kind === 'event' && !outcome.handled) unhandled.push(outcome.type);
    }
    // Valid frames, correctly decoded, that this host still does nothing with.
    // They are no longer silent: `decoder.ts` logs safety gaps at error level.
    expect(unhandled.toSorted()).toEqual(UNHANDLED_CONTRACT_EVENTS.toSorted());
  });
});

describe('nested oneOf relaxation', () => {
  it('relaxes exactly the nested oneOf keywords the corpus schema contains', () => {
    // Pins the blast radius. If Core changes the schema shape this fails, and
    // somebody has to look at whether the relaxation still makes sense.
    expect(relaxedNestedOneOfCount()).toBe(10);
  });

  it('is required: the corpus goal_snapshot cannot satisfy its own oneOf', () => {
    // Both `tasks.items.oneOf` branches are `additionalProperties: true` with no
    // `required`, so every object matches both and `oneOf` is unsatisfiable.
    // Control that the defect is real rather than assumed.
    const schema = JSON.parse(readFileSync(join(CORPUS, 'schema/core-event.schema.json'), 'utf8')) as {
      oneOf: { properties?: { type?: { const?: string } }; [k: string]: unknown }[];
    };
    const branch = schema.oneOf.find((b) => b.properties?.type?.const === 'goal_snapshot') as never;
    const items = branch as Record<string, never> as unknown as {
      properties: { goal: { properties: { tasks: { items: { oneOf: Record<string, unknown>[] } } } } };
    };
    for (const taskBranch of items.properties.goal.properties.tasks.items.oneOf) {
      expect(taskBranch.required, 'branch would be distinguishable if it had required').toBeUndefined();
      expect(taskBranch.additionalProperties).toBe(true);
    }
  });

  it('still rejects a genuinely malformed goal_snapshot task', () => {
    // The relaxation must not turn goal_snapshot into an unvalidated passthrough.
    const frame = JSON.parse(readFrame('events/goal_snapshot.json'));
    frame.goal.tasks[0].attempts = 'two';
    expect(negotiated().decode(JSON.stringify(frame))).toMatchObject({
      kind: 'refused',
      code: 'schema-violation',
    });
    // Both directions: the untouched fixture passes.
    expect(negotiated().decode(readFrame('events/goal_snapshot.json'))).toMatchObject({
      kind: 'event',
      type: 'goal_snapshot',
    });
  });

  it('still rejects a malformed nullable union in provider_failover_receipt', () => {
    const frame = JSON.parse(readFrame('events/provider_failover_receipt.json'));
    frame.receipt.selected_model = 42;
    expect(negotiated().decode(JSON.stringify(frame))).toMatchObject({
      kind: 'refused',
      code: 'schema-violation',
    });
    // Null is a legal value for that union, so the relaxation kept it accepting.
    frame.receipt.selected_model = null;
    expect(negotiated().decode(JSON.stringify(frame))).toMatchObject({ kind: 'event' });
  });
});

describe('forward compatibility for unknown events', () => {
  it('drops an unknown event that declares itself non-critical', () => {
    expect(negotiated().decode(readFrame('adversarial/events/unknown-noncritical.jsonl'))).toEqual({
      kind: 'dropped',
      type: 'future_observation',
      reason: 'unknown-noncritical',
    });
  });

  it('refuses an unknown event that declares itself critical', () => {
    expect(negotiated().decode(readFrame('adversarial/events/unknown-critical.jsonl'))).toMatchObject({
      kind: 'refused',
      code: 'unknown-critical-event',
      type: 'future_authority',
      fatal: false,
    });
  });

  it('refuses an unknown event with no criticality classification', () => {
    expect(negotiated().decode(readFrame('adversarial/events/unknown-criticality.jsonl'))).toMatchObject({
      kind: 'refused',
      code: 'unknown-criticality',
      type: 'future_unclassified',
    });
  });

  it('keeps the session alive after refusing an unknown frame', () => {
    const decoder = negotiated();
    decoder.decode(readFrame('adversarial/events/unknown-critical.jsonl'));
    // A per-frame refusal must not poison the stream: the next good frame still
    // decodes. A validator that rejects everything after one bad frame is as
    // broken as one that accepts everything.
    expect(decoder.decode(readFrame('events/execution_policy.json'))).toMatchObject({
      kind: 'event',
      type: 'execution_policy',
    });
  });
});

describe('malformed frames', () => {
  it.each([
    ['not json at all', 'malformed-frame'],
    ['[]', 'malformed-frame'],
    ['"a string"', 'malformed-frame'],
    ['{}', 'malformed-frame'],
    ['{"type":7}', 'malformed-frame'],
  ])('refuses %s', (line, code) => {
    expect(negotiated().decode(line)).toMatchObject({ kind: 'refused', code });
  });

  it('refuses a known event whose payload violates the contract', () => {
    const bad = JSON.parse(readFrame('events/execution_policy.json'));
    bad.policy.posture = 'unrestricted';
    const outcome = negotiated().decode(JSON.stringify(bad));
    expect(outcome).toMatchObject({ kind: 'refused', code: 'schema-violation', fatal: false });

    // Both directions: the same frame with the real enum value passes, so the
    // refusal is the enum and not a blanket reject.
    bad.policy.posture = 'managed';
    expect(negotiated().decode(JSON.stringify(bad))).toMatchObject({ kind: 'event' });
  });

  it('tolerates a forward-additive field on a known event', () => {
    // Core's schemas are `additionalProperties: true` by design. A new field on
    // an existing event is additive and must not be treated as a violation.
    const frame = JSON.parse(readFrame('events/execution_policy.json'));
    frame.future_field = { anything: true };
    expect(negotiated().decode(JSON.stringify(frame))).toMatchObject({ kind: 'event' });
  });

  it('lets a shape mismatch through, marked degraded, under minor drift', () => {
    const newer = JSON.parse(READY);
    newer.contract.minor = PINNED_CONTRACT.minor + 1;
    const decoder = new WCoreFrameDecoder();
    expect(decoder.decode(JSON.stringify(newer)).kind).toBe('negotiated');

    const bad = JSON.parse(readFrame('events/execution_policy.json'));
    bad.policy.posture = 'unrestricted';
    const outcome = decoder.decode(JSON.stringify(bad));
    expect(outcome).toMatchObject({ kind: 'event', type: 'execution_policy' });
    if (outcome.kind !== 'event') throw new Error('unreachable');
    expect(outcome.degraded).toBeTruthy();
  });
});
