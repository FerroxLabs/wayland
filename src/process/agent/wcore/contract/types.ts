/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Outcome types for the Core protocol frame decoder.
 *
 * Kept in their own module so `index.ts` can import the union without pulling
 * in ajv and the compiled schema.
 */

/** Criticality class Core assigns to each contract event in `manifest.json`. */
export type EventCriticality = 'required' | 'safety' | 'observational';

/** The `contract` descriptor Core embeds in every `ready` frame. */
export type ContractDescriptor = {
  name: string;
  major: number;
  minor: number;
  generator: string;
  fixture_digest: string;
  schema_digest: string;
  source_inputs_digest: string;
  capabilities: Record<string, string>;
};

/**
 * How far the producer's contract diverges from the one this build pinned.
 *
 * `exact` is the only state in which digest equality is meaningful: the digests
 * are taken over the corpus of one specific `major.minor`, so under any version
 * drift they are *expected* to differ and carry no tamper signal.
 */
export type NegotiationFit = 'exact' | 'minor-drift';

export type Negotiation = {
  fit: NegotiationFit;
  producer: ContractDescriptor;
  /** Non-fatal divergences worth logging (digest drift under a minor skew, etc.). */
  warnings: string[];
};

export type DecodeRefusalCode =
  /** The line was not JSON, or not a JSON object, or had no string `type`. */
  | 'malformed-frame'
  /** A frame arrived before `ready`; nothing can be trusted pre-negotiation. */
  | 'ready-required'
  /** A second `ready` on one session. */
  | 'duplicate-ready'
  /** `ready` was missing or malformed in a field negotiation depends on. */
  | 'invalid-ready'
  /** `ready` carried no `contract` block — the engine predates negotiation. */
  | 'contract-missing'
  /** Producer is not `wayland-desktop-core`. */
  | 'contract-name-mismatch'
  /** Producer major != pinned major. */
  | 'contract-major-mismatch'
  /** Same `major.minor`, different corpus digest — tamper or a broken build. */
  | 'contract-digest-mismatch'
  /** Known event type whose payload violates the pinned schema. */
  | 'schema-violation'
  /** Unknown event type carrying `critical: true`. */
  | 'unknown-critical-event'
  /** Unknown event type with no `critical` classification at all. */
  | 'unknown-criticality';

export type DecodeOutcome =
  /** A valid `ready`; the session is negotiated. */
  | { kind: 'negotiated'; frame: Record<string, unknown>; negotiation: Negotiation }
  /**
   * A contract event that validated. `handled` is false when the event is in
   * the contract but this host has no case arm for it — the "silent drop" bug.
   */
  | {
      kind: 'event';
      frame: Record<string, unknown>;
      type: string;
      criticality: EventCriticality;
      handled: boolean;
      /** Set when the frame failed schema validation but was let through under minor drift. */
      degraded?: string;
    }
  /** Unknown event type that explicitly declared `critical: false`. */
  | { kind: 'dropped'; type: string; reason: 'unknown-noncritical' }
  /** The frame is refused. Never dispatched to handlers. */
  | { kind: 'refused'; code: DecodeRefusalCode; message: string; type?: string; fatal: boolean };
