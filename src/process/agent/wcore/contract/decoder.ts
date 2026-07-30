/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Runtime validator for the Core → Desktop JSON-stream boundary.
 *
 * This is a TypeScript port of Core's own reference host decoder
 * (`wcore-protocol/src/contract/observation.rs::HostContractObserver`),
 * validating against Core's generated corpus rather than against a schema
 * written by reading `protocol.ts`. Inventing a parallel schema is the exact
 * mistake that let 18 contract events be silently dropped; the schema and the
 * event index here are vendored bytes from Core (see
 * `resources/wcore-contract/VENDORED.md`).
 *
 * ## Version negotiation
 *
 * | producer vs pinned | action | why |
 * |---|---|---|
 * | no `ready` first | refuse, fatal | nothing is trustworthy pre-negotiation; matches Core's `ReadyRequired` |
 * | second `ready` | refuse, fatal | a re-handshake mid-session is not a thing Core does |
 * | `name` differs | refuse, fatal | not our producer |
 * | `major` differs (either way) | refuse, fatal | majors are incompatible by definition; a forged `major: 2` must not be byte-indistinguishable from golden |
 * | `minor` newer or older | accept, warn, `minor-drift` | minors are additive by construction, and the unknown-event `critical` rule already carries the safety decision. Refusing would brick every Desktop the moment Core ships a minor — and Desktop can be pointed at a self-updated engine |
 * | `schema_digest` / `fixture_digest` differ **at the same `major.minor`** | refuse, fatal | one version claiming two different corpora is tamper or a broken build. Nothing legitimate produces it |
 * | any digest differs **under minor drift** | accept, warn | the digests are taken over one specific `major.minor` corpus, so they are *expected* to differ. Enforcing them here would just be refusing minor drift by another name |
 * | `source_inputs_digest` differs | accept, warn | it hashes Core's Rust *sources*, not the wire. A comment change moves it without moving a byte on the wire |
 * | `generator` differs | accept, warn | toolchain provenance; the schema and fixture digests already cover wire shape |
 * | capability status differs | accept, warn | feature drift, not a corrupt wire |
 *
 * This is deliberately one notch more permissive than Core's reference
 * observer, which refuses on minor, generator, `source_inputs_digest` and
 * capability mismatch too. Core's observer is a conformance oracle pinned to
 * one build; Desktop is a shipped app that must survive being pointed at an
 * engine one minor ahead of it. Every relaxation is logged.
 *
 * ## Forward compatibility for unknown events
 *
 * "Not understood" and "invalid" are different, and Core already put the
 * discriminator on the wire: every event carries a criticality, and unknown
 * events carry an explicit `critical` boolean. We follow Core's rule exactly:
 *
 * - unknown type, `critical: false` → drop quietly (`DroppedUnknownNonCritical`)
 * - unknown type, `critical: true`  → refuse the frame (`UnknownCriticalEvent`)
 * - unknown type, no `critical`     → refuse the frame (`UnknownCriticality`)
 *
 * The last one looks harsh for forward compatibility, and it is the deliberate
 * choice: an event whose author did not say whether it is safety-relevant
 * cannot be assumed observational. Core's producer stamps the field, so a
 * frame without it is either not Core or not finished. Diverging here would be
 * re-inventing the semantics instead of consuming them.
 *
 * Refusals are per-frame, not per-session — matching the reference observer,
 * where `observe_json_line` returns `Err` without invalidating the observer.
 * The single exception is negotiation failure, which is `fatal` and does tear
 * the session down: a session that never agreed a contract has no safe state.
 */

import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020.js';

import contractArtifacts from './generated/wcoreContract.generated.json';
import { isHandledContractEvent } from './coverage';
import type { ContractDescriptor, DecodeOutcome, EventCriticality, Negotiation } from './types';

type EventSchemaBranch = {
  properties?: { type?: { const?: string } };
};

/**
 * Rewrite every *nested* `oneOf` in the corpus schema to `anyOf`.
 *
 * Nine of the ten nested `oneOf`s are nullable unions
 * (`[{type:'string'},{type:'null'}]`) whose branches are disjoint, so `anyOf`
 * is exactly equivalent there. The tenth is a defect in the generated corpus:
 * `goal_snapshot.goal.tasks.items.oneOf` has two branches that both declare
 * `additionalProperties: true` and no `required`, so *every* object — including
 * `{}` — matches both and `oneOf` (exactly one) can never be satisfied. Core's
 * own golden `events/goal_snapshot.json` therefore fails Core's own published
 * schema. Filed for Core as C5 in `docs/core-contract-integration.md`.
 *
 * `oneOf` and `anyOf` differ only in whether a multi-branch match is an error.
 * For "is this frame well formed?" that distinction buys nothing, and this is a
 * mechanical transform of Core's bytes rather than a schema we authored — the
 * per-field constraints inside each branch are still enforced. The root `oneOf`
 * is left alone; it is the type discriminator and is handled by dispatch.
 *
 * `RELAXED_ONEOF_COUNT` is asserted in `tests/contract` so any change to the
 * shape of the corpus schema shows up as a failure rather than a silent
 * loosening.
 */
function relaxNestedOneOf(node: unknown, depth: number, stats: { count: number }): unknown {
  if (Array.isArray(node)) return node.map((item) => relaxNestedOneOf(item, depth + 1, stats));
  if (node === null || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'oneOf' && depth > 0) {
      stats.count += 1;
      out.anyOf = relaxNestedOneOf(value, depth + 1, stats);
      continue;
    }
    out[key] = relaxNestedOneOf(value, depth + 1, stats);
  }
  return out;
}

const PINNED: ContractDescriptor = contractArtifacts.descriptor as ContractDescriptor;

const EVENT_CRITICALITY = contractArtifacts.eventCriticality as Record<string, EventCriticality>;

/** Event types the pinned contract declares. */
export const CONTRACT_EVENT_TYPES: readonly string[] = Object.keys(EVENT_CRITICALITY).toSorted();

export const PINNED_CONTRACT: Readonly<ContractDescriptor> = Object.freeze({ ...PINNED });

/**
 * Compile one validator per event `type`.
 *
 * The corpus schema is a 53-branch `oneOf`. Validating against the whole
 * `oneOf` would report "must match exactly one schema in oneOf" for every
 * failure, which is useless for diagnosis, and would cost 53 branch attempts
 * per frame. Splitting by the `type` const gives a precise error and one
 * attempt. `sub_agent_event` legitimately has two branches, so branches are
 * grouped by const and re-wrapped in an `anyOf`.
 */
function compileByType(): { validators: Map<string, ValidateFunction>; relaxed: number } {
  const ajv = new Ajv2020({ strict: false, allErrors: true, allowUnionTypes: true });
  const stats = { count: 0 };
  const branches = new Map<string, EventSchemaBranch[]>();
  for (const raw of (contractArtifacts.eventSchema as { oneOf: EventSchemaBranch[] }).oneOf) {
    const type = raw.properties?.type?.const;
    if (typeof type !== 'string') continue;
    const branch = relaxNestedOneOf(raw, 0, stats) as EventSchemaBranch;
    const bucket = branches.get(type);
    if (bucket) bucket.push(branch);
    else branches.set(type, [branch]);
  }

  const validators = new Map<string, ValidateFunction>();
  for (const [type, group] of branches) {
    validators.set(type, ajv.compile(group.length === 1 ? group[0] : { anyOf: group }));
  }
  return { validators, relaxed: stats.count };
}

let compiled: { validators: Map<string, ValidateFunction>; relaxed: number } | null = null;

/** Number of nested `oneOf` keywords relaxed to `anyOf`. See {@link relaxNestedOneOf}. */
export function relaxedNestedOneOfCount(): number {
  compiled ??= compileByType();
  return compiled.relaxed;
}

function validatorFor(type: string): ValidateFunction | undefined {
  compiled ??= compileByType();
  return compiled.validators.get(type);
}

function describeErrors(validate: ValidateFunction): string {
  return (validate.errors ?? [])
    .slice(0, 4)
    .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
    .join('; ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate the `contract` block of a `ready` frame against the pinned build. */
function negotiate(descriptor: unknown): Negotiation | { error: DecodeOutcome } {
  if (!isRecord(descriptor)) {
    // An engine that predates contract negotiation (≤0.1.21-era `ready`, and
    // Core's own `compat/events/ready.minimal.json`). There is no version to
    // negotiate and no digest to check, so there is nothing to trust. Refusing
    // is the whole point of the negotiation gate — but the operator needs to be
    // told it is an outdated engine, not a corrupt one.
    return {
      error: {
        kind: 'refused',
        code: 'contract-missing',
        message:
          'the engine sent a "ready" with no contract descriptor — it predates contract ' +
          `negotiation and cannot be trusted by this build (pinned ${PINNED.name} ` +
          `v${PINNED.major}.${PINNED.minor}). Update wcore.`,
        type: 'ready',
        fatal: true,
      },
    };
  }

  const producer = descriptor as unknown as ContractDescriptor;

  if (producer.name !== PINNED.name) {
    return {
      error: {
        kind: 'refused',
        code: 'contract-name-mismatch',
        message: `producer contract is "${String(producer.name)}", expected "${PINNED.name}"`,
        type: 'ready',
        fatal: true,
      },
    };
  }

  if (producer.major !== PINNED.major) {
    return {
      error: {
        kind: 'refused',
        code: 'contract-major-mismatch',
        message:
          `producer contract major ${String(producer.major)} is incompatible with ` +
          `the pinned major ${PINNED.major}`,
        type: 'ready',
        fatal: true,
      },
    };
  }

  const fit = producer.minor === PINNED.minor ? 'exact' : 'minor-drift';
  const warnings: string[] = [];

  if (fit === 'exact') {
    // Same declared version: the digests MUST match. This is the tamper check.
    for (const field of ['schema_digest', 'fixture_digest'] as const) {
      if (producer[field] !== PINNED[field]) {
        return {
          error: {
            kind: 'refused',
            code: 'contract-digest-mismatch',
            message:
              `producer ${field} ${String(producer[field])} does not match the pinned ` +
              `v${PINNED.major}.${PINNED.minor} corpus (${PINNED[field]})`,
            type: 'ready',
            fatal: true,
          },
        };
      }
    }
  } else {
    warnings.push(
      `producer contract is v${producer.major}.${producer.minor}, this build pinned ` +
        `v${PINNED.major}.${PINNED.minor} — running degraded; corpus digests are not enforced ` +
        `across a minor skew`
    );
  }

  // Advisory below this line: none of it changes the wire shape, so none of it
  // is worth refusing a session over.
  if (producer.source_inputs_digest !== PINNED.source_inputs_digest) {
    warnings.push('producer source_inputs_digest differs (Core rebuilt from different sources)');
  }
  if (producer.generator !== PINNED.generator) {
    warnings.push(`producer generator ${String(producer.generator)} != pinned ${PINNED.generator}`);
  }
  for (const [capability, status] of Object.entries(PINNED.capabilities)) {
    const actual = producer.capabilities?.[capability];
    if (actual === undefined) warnings.push(`producer does not declare capability "${capability}"`);
    else if (actual !== status) {
      warnings.push(`capability "${capability}" is "${actual}", pinned build expects "${status}"`);
    }
  }
  for (const capability of Object.keys(producer.capabilities ?? {})) {
    if (!(capability in PINNED.capabilities)) {
      warnings.push(`producer declares unknown capability "${capability}"`);
    }
  }

  return { fit, producer, warnings };
}

/**
 * Stateful, single-session decoder. One instance per engine child process:
 * `ready` may arrive exactly once and everything before it is refused.
 */
export class WCoreFrameDecoder {
  private negotiation: Negotiation | null = null;

  get negotiated(): Negotiation | null {
    return this.negotiation;
  }

  /** Decode one JSON Lines frame. Never throws. */
  decode(line: string): DecodeOutcome {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      return {
        kind: 'refused',
        code: 'malformed-frame',
        message: 'frame is not valid JSON',
        fatal: false,
      };
    }

    if (!isRecord(parsed)) {
      return {
        kind: 'refused',
        code: 'malformed-frame',
        message: 'frame is not a JSON object',
        fatal: false,
      };
    }

    const rawType = parsed.type;
    if (rawType === undefined) {
      return {
        kind: 'refused',
        code: 'malformed-frame',
        message: 'frame has no "type"',
        fatal: false,
      };
    }
    if (typeof rawType !== 'string') {
      return {
        kind: 'refused',
        code: 'malformed-frame',
        message: `frame "type" is ${typeof rawType}, expected string`,
        fatal: false,
      };
    }
    const type = rawType;

    if (type === 'ready') return this.decodeReady(parsed);

    if (!this.negotiation) {
      return {
        kind: 'refused',
        code: 'ready-required',
        message: `received "${type}" before the contract was negotiated`,
        type,
        fatal: true,
      };
    }

    const criticality = EVENT_CRITICALITY[type];
    if (criticality === undefined) return decodeUnknownType(parsed, type);

    const validate = validatorFor(type);
    if (validate && !validate(parsed)) {
      const detail = describeErrors(validate);
      // Under a minor skew the pinned schema is not authoritative for this
      // producer, so a shape mismatch is expected drift rather than a
      // violation. Let it through, loudly, instead of blanking the UI.
      if (this.negotiation.fit === 'minor-drift') {
        return {
          kind: 'event',
          frame: parsed,
          type,
          criticality,
          handled: isHandledContractEvent(type),
          degraded: detail,
        };
      }
      return {
        kind: 'refused',
        code: 'schema-violation',
        message: `"${type}" violates the pinned contract: ${detail}`,
        type,
        fatal: false,
      };
    }

    return { kind: 'event', frame: parsed, type, criticality, handled: isHandledContractEvent(type) };
  }

  private decodeReady(frame: Record<string, unknown>): DecodeOutcome {
    if (this.negotiation) {
      return {
        kind: 'refused',
        code: 'duplicate-ready',
        message: 'a second "ready" arrived on an already-negotiated session',
        type: 'ready',
        fatal: true,
      };
    }

    // Checked before schema validation: the schema also requires `contract`,
    // but "your engine is too old" is a far more actionable error than a
    // required-property violation, and it is the single most likely reason a
    // real user's `ready` lacks the block.
    if (!isRecord(frame.contract)) {
      const missing = negotiate(frame.contract);
      if ('error' in missing) return missing.error;
    }

    const validate = validatorFor('ready');
    if (validate && !validate(frame)) {
      return {
        kind: 'refused',
        code: 'invalid-ready',
        message: `"ready" violates the pinned contract: ${describeErrors(validate)}`,
        type: 'ready',
        fatal: true,
      };
    }

    // Beyond the schema: `capabilities.current_mode` must be one of
    // `capabilities.modes`. Core's reference observer enforces this, and it is
    // not expressible in the generated JSON Schema.
    const capabilities = frame.capabilities;
    if (isRecord(capabilities)) {
      const { current_mode: currentMode, modes } = capabilities;
      if (typeof currentMode === 'string' && Array.isArray(modes) && !modes.includes(currentMode)) {
        return {
          kind: 'refused',
          code: 'invalid-ready',
          message: `ready.capabilities.current_mode "${currentMode}" is not one of its own modes`,
          type: 'ready',
          fatal: true,
        };
      }
    }

    const result = negotiate(frame.contract);
    if ('error' in result) return result.error;

    this.negotiation = result;
    return { kind: 'negotiated', frame, negotiation: result };
  }
}

function decodeUnknownType(frame: Record<string, unknown>, type: string): DecodeOutcome {
  const critical = frame.critical;
  if (critical === false) return { kind: 'dropped', type, reason: 'unknown-noncritical' };
  if (critical === true) {
    return {
      kind: 'refused',
      code: 'unknown-critical-event',
      message: `unknown event "${type}" declares itself contract-critical`,
      type,
      fatal: false,
    };
  }
  return {
    kind: 'refused',
    code: 'unknown-criticality',
    message: `unknown event "${type}" carries no "critical" classification`,
    type,
    fatal: false,
  };
}
