/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';
import Ajv2020 from 'ajv/dist/2020';
import coreEventSchema from '../../../../contracts/wayland-desktop-core/v1/schema/core-event.schema.json';
import hostCommandSchema from '../../../../contracts/wayland-desktop-core/v1/schema/host-command.schema.json';
import manifest from '../../../../contracts/wayland-desktop-core/v1/manifest.json';
import type { WCoreCommand, WCoreEvent } from './protocol';

type JsonObject = Record<string, unknown>;
type ReplayDisposition = 'advanced' | 'duplicate' | 'ignored_after_terminal';

export const DESKTOP_CORE_V1_PRODUCER_COMMIT = '9b58c893' as const;

/**
 * Pinned to Core `116f2d21` ("fix(protocol): announce a call that runs without
 * approval", 2026-08-12, on `lane/v0130-build`), the tree the 0.13.0 binary
 * `sha256:c55205d4b36cd5fd843c767c897e8edb30a4dd193e74da0a8fdad0dcdb24b229`
 * was built from. All four values below were read from that commit's manifest
 * and then confirmed identical to a real `ready` frame off the binary.
 *
 * ⚠️ Identify an engine by sha256, NEVER by `--version`. The dev build that
 * used to sit in `resources/bundled-wayland-core/` self-reports `0.12.26` and
 * is not the release; reading its version string is what produced the wrong
 * baseline in the first place.
 *
 * The observer compares these for EQUALITY - no range, no dual acceptance - so
 * the pin, the corpus under `contracts/wayland-desktop-core/v1/` and the
 * shipped engine all move in ONE commit or every session dies on frame 1.
 *
 * Three distinct contract sets are live, all three verified by execution:
 *   published v0.12.26  minor 12 / gen-13 / schema `23fb3048…`
 *   C-1..C-5 dev build  minor 13 / gen-14 / schema `4971f456…`
 *   0.13.0              minor 14 / gen-14 / schema `306d83e1…`  <- pinned here
 */
export const DESKTOP_CORE_V1_PIN = {
  name: 'wayland-desktop-core',
  major: 1,
  minor: 14,
  generator: 'wcore-desktop-contract-gen/14',
  fixtureDigest: 'sha256:9d5ef0ca25d3a1a3085ed39a64ec70b7e55c39b43e76ced17d08b7674b77b233',
  schemaDigest: 'sha256:306d83e19fa01a83c1d17d6365c9159efeb94373b8328259cbf842d783e00152',
  sourceInputsDigest: 'sha256:59b607a0fd8bcd94eeb7e708926f1f29259e54a47a46e3cbea70ff77f21ab8ae',
  capabilities: {
    anvil_receipts: 'publication_bound',
    browser_events: 'shape_only',
    contract_negotiation: 'available',
    cua_events: 'shape_only',
    durable_child_model_v1: 'available',
    durable_goals_v1: 'available',
    effective_execution_policy_revisions: 'available',
    host_delegated_delivery: 'available',
    operator_tool_effect_resolution_v1: 'available',
    plugin_events: 'shape_only',
    runtime_diagnostics_v1: 'available',
    runtime_mcp_lifecycle_v1: 'available',
    semantic_failover_receipts: 'available',
    session_persistence_v1: 'available',
    session_persistence_v2: 'available',
    turn_recovery_v1: 'available',
    workflow_lifecycle_v1: 'available',
  },
} as const;

/*
 * The seven-event corpus-drift allowlist that used to live here is GONE, and
 * deliberately so.
 *
 * It existed because Core's producer emitted 59 event types while the corpus
 * generated from the same tree declared only 52 - and `workspace_policy` fires
 * immediately after `ready` on every session, so that one frame failed every
 * session closed. That was C-1, and it is fixed at
 * {@link DESKTOP_CORE_V1_PRODUCER_COMMIT}: the manifest now declares all 59,
 * verified by checking each of the seven names against `manifest.counts` and
 * the events list rather than trusting the changelog.
 *
 * Those types are therefore no longer "unknown", so the allowlist branch was
 * unreachable for them - dead code guarding a fixed bug. They now take the
 * ordinary path: schema-validated, then dispatched, where `WCoreAgent`'s
 * `default:` arm logs and drops the ones Desktop has no model for. Same
 * outcome, one mechanism instead of two, and a real schema check on the way in.
 *
 * Its own instruction was "delete entries as Core adds them to the corpus".
 * Core added all seven.
 */

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateEventSchema = ajv.compile(coreEventSchema as object);
const validateCommandSchema = ajv.compile(hostCommandSchema as object);
const knownEventTypes = new Set(manifest.events.map((entry) => entry.type));
const UTF8_FATAL_DECODER = new TextDecoder('utf-8', { fatal: true });

/** Includes the terminating LF, matching Core's capped protocol reader. */
export const DESKTOP_CORE_MAX_LINE_BYTES = 8 * 1024 * 1024;

export class DesktopCoreContractError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'DesktopCoreContractError';
  }
}

export type DesktopCoreConsumeResult =
  | { kind: 'event'; event: WCoreEvent; disposition: 'advanced'; contract: 'legacy' | 'v1' }
  | {
      kind: 'drop';
      reason: 'unknown_noncritical' | 'duplicate' | 'after_terminal' | 'producer_declared_unmodelled';
    };

export type AnvilDesktopTrustStatus = 'active' | 'invalidated' | 'superseded' | 'historical';

function fail(code: string, message: string): never {
  throw new DesktopCoreContractError(code, message);
}

/**
 * K-03: closes the confirmed defect where a `stream_end`/`error` frame that
 * Core has fully written to stdout, but whose trailing LF delimiter never
 * arrives (the engine stays alive and simply goes idle right after writing
 * it), was buffered in `inputRemainder` forever with zero observable trace -
 * leaving the Desktop UI's running state stuck indefinitely. Recovery is
 * triggered purely by having received enough bytes to form one complete,
 * structurally valid JSON object - never by a timer, satisfying the "fix the
 * cause, not a timeout" constraint.
 *
 * Every `WCoreEvent` variant is a JSON object, so this short-circuits unless
 * `buf` starts with `{`. Otherwise it scans byte-by-byte tracking brace
 * nesting depth and JSON string/escape state (an unescaped `"` toggles
 * whether the scan is inside a string; a `\` while inside a string causes the
 * next byte to be skipped from toggling/parsing, so an escaped quote or
 * backslash inside a string value never mis-toggles nesting or string state).
 * The moment depth returns to exactly zero after having gone positive, the
 * byte offset immediately after that closing `}` is returned. This function
 * does no JSON-grammar validation beyond brace/string balance -
 * `consumeLine()`'s own `JSON.parse` plus schema/reducer checks remain the
 * real validator; this only decides WHEN to attempt parsing, never WHAT is
 * accepted.
 */
function findCompleteObjectEnd(buf: Buffer): number | null {
  let start = 0;
  while (start < buf.length && (buf[start] === 0x20 || buf[start] === 0x09 || buf[start] === 0x0d)) start += 1;
  if (start >= buf.length || buf[start] !== 0x7b) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < buf.length; i += 1) {
    const byte = buf[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (byte === 0x5c) {
        escaped = true;
      } else if (byte === 0x22) {
        inString = false;
      }
      continue;
    }
    if (byte === 0x22) {
      inString = true;
    } else if (byte === 0x7b) {
      depth += 1;
    } else if (byte === 0x7d) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return null;
}

/**
 * Rejects a command carrying a number JS cannot represent exactly.
 *
 * Core's schema bounds `additional_tokens` at `u64::MAX`
 * (18446744073709551615) and the corpus ships
 * `adversarial/commands/continue-with-budget-overflow-tokens.jsonl` one over.
 * Both land on the SAME IEEE-754 double, so an Ajv `maximum` check on the
 * parsed value cannot tell them apart.
 *
 * This runs inside `validateOutboundCommand`, which is the real production
 * serialization boundary (`index.ts` writes
 * `JSON.stringify(validateOutboundCommand(cmd))`). An earlier version scanned
 * the raw line instead and was therefore dead in production, and skipped any
 * literal containing `.` or an exponent - so `18446744073709551616e0` walked
 * straight through. Cross-audit (Codex 5.6 Sol) caught both.
 *
 * The rule is magnitude, not lexical form: any finite number whose absolute
 * value exceeds `Number.MAX_SAFE_INTEGER` has already lost precision by the
 * time it is a JS value, so forwarding it would assert a validation that never
 * really happened. Ordinary fractional values (`additional_cost_usd: 2.5`) are
 * untouched.
 */
function assertNumbersAreRepresentable(value: unknown, path = 'command'): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      fail('command_number_unrepresentable', `Desktop command ${path} is not a finite number`);
    }
    if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      fail(
        'command_integer_unrepresentable',
        `Desktop command ${path} exceeds the exact JSON integer range`
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertNumbersAreRepresentable(child, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as JsonObject)) {
      assertNumbersAreRepresentable(child, `${path}.${key}`);
    }
  }
}

function asObject(value: unknown, field = 'top_level'): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('malformed', `${field} must be an object`);
  return value as JsonObject;
}

function stringField(object: JsonObject, field: string, nonempty = true): string {
  const value = object[field];
  if (typeof value !== 'string' || (nonempty && value.length === 0)) fail('malformed', `${field} must be a string`);
  return value;
}

function uintField(object: JsonObject, field: string): number {
  const value = object[field];
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail('malformed', `${field} must be an unsigned integer`);
  return value as number;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as JsonObject)
        .toSorted(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

function canonicalString(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function assertNoRequiredExtensions(object: JsonObject, type: string): void {
  if (!Object.prototype.hasOwnProperty.call(object, 'required_extensions')) return;
  if (!Array.isArray(object.required_extensions)) {
    fail('malformed_critical_extensions', `Core event ${type} has malformed required_extensions`);
  }
  if (object.required_extensions.length > 0) {
    fail(
      'unknown_critical_extension',
      `Core event ${type} requires unsupported extension ${String(object.required_extensions[0])}`
    );
  }
}

function validateSchema(validator: typeof validateEventSchema, value: unknown, label: string): void {
  if (!validator(value)) {
    const detail = ajv.errorsText(validator.errors, { separator: '; ' });
    fail('schema_invalid', `${label} failed the pinned schema: ${detail}`);
  }
}

function assertDescriptor(contract: JsonObject): void {
  const expected = DESKTOP_CORE_V1_PIN;
  if (contract.name !== expected.name) fail('contract_name_mismatch', 'unsupported Core contract name');
  if (contract.major !== expected.major) fail('contract_major_mismatch', 'unsupported Core contract major');
  if (contract.minor !== expected.minor) fail('contract_minor_mismatch', 'Core contract minor differs from the pin');
  if (contract.generator !== expected.generator)
    fail('generator_mismatch', 'Core contract generator differs from the pin');
  if (contract.fixture_digest !== expected.fixtureDigest)
    fail('fixture_digest_mismatch', 'Core fixture digest differs from the pin');
  if (contract.schema_digest !== expected.schemaDigest)
    fail('schema_digest_mismatch', 'Core schema digest differs from the pin');
  if (contract.source_inputs_digest !== expected.sourceInputsDigest) {
    fail('source_inputs_digest_mismatch', 'Core source-input digest differs from the pin');
  }
  if (canonicalString(contract.capabilities) !== canonicalString(expected.capabilities)) {
    fail('capability_status_mismatch', 'Core contract capability statuses differ from the pin');
  }
}

function validatePolicyShape(snapshotValue: unknown, initial: boolean): JsonObject {
  const snapshot = asObject(snapshotValue, 'execution_policy');
  if (snapshot.contract_version !== '1.0') fail('policy_version', 'unsupported execution-policy contract');
  if (snapshot.critical !== true) fail('policy_noncritical', 'execution policy must be contract-critical');
  const revision = uintField(snapshot, 'revision');
  if (initial && revision !== 0) fail('policy_sequence', 'initial execution-policy revision must be zero');
  const reason = stringField(snapshot, 'reason');
  if (!['launch', 'mode_change', 'resume', 'expiry'].includes(reason))
    fail('policy_reason', 'unknown execution-policy reason');
  uintField(snapshot, 'effective_at_unix_ms');

  const policy = asObject(snapshot.policy, 'policy');
  const posture = stringField(policy, 'posture');
  const approvals = stringField(policy, 'approvals');
  const sandbox = stringField(policy, 'sandbox');
  stringField(policy, 'source');
  if (typeof policy.managed_floor_active !== 'boolean') fail('policy_shape', 'managed_floor_active must be boolean');
  if (!['smart', 'managed', 'dangerous'].includes(posture)) fail('policy_shape', 'unknown policy posture');
  if (!['prompt', 'auto_edit', 'bypass'].includes(approvals)) fail('policy_shape', 'unknown approval posture');
  if (!['required', 'bypass'].includes(sandbox)) fail('policy_shape', 'unknown sandbox posture');

  const activation = policy.dangerous_activation_id;
  const expiry = policy.dangerous_expires_at_unix_ms;
  if (posture === 'dangerous') {
    if (approvals !== 'bypass' || sandbox !== 'bypass' || typeof activation !== 'string' || !activation) {
      fail('policy_inconsistent', 'dangerous policy is missing its lease identity');
    }
    if (!Number.isSafeInteger(expiry) || (expiry as number) < 0)
      fail('policy_inconsistent', 'dangerous lease expiry is invalid');
  } else if (sandbox !== 'required' || activation !== undefined || expiry !== undefined) {
    fail('policy_inconsistent', 'non-dangerous policy cannot bypass sandbox or carry a dangerous lease');
  }
  if (posture === 'managed' && policy.managed_floor_active !== true) {
    fail('policy_inconsistent', 'managed posture requires an active managed floor');
  }
  // `ready.execution_policy` is nested while later revisions are top-level
  // events. The envelope `type` is not part of the policy snapshot identity.
  const { type: _envelopeType, ...normalized } = snapshot;
  return normalized;
}

class PolicyReducer {
  private current: JsonObject | null = null;

  apply(value: unknown, initial = false): ReplayDisposition {
    const snapshot = validatePolicyShape(value, initial);
    const revision = snapshot.revision as number;
    if (!this.current) {
      if (revision !== 0) fail('policy_sequence', 'execution-policy stream did not start at revision zero');
      this.current = snapshot;
      return 'advanced';
    }
    const currentRevision = this.current.revision as number;
    if (revision === currentRevision) {
      if (canonicalString(snapshot) !== canonicalString(this.current))
        fail('policy_conflict', 'conflicting execution-policy duplicate');
      return 'duplicate';
    }
    if (revision !== currentRevision + 1) fail('policy_sequence', 'execution-policy revision gap or regression');
    this.current = snapshot;
    return 'advanced';
  }
}

type TurnState = { terminal: string | null; tools: Set<string> };
type ToolState = { msgId: string; terminal: string | null };

class OrdinaryTurnToolReducer {
  private readonly turns = new Map<string, TurnState>();
  private readonly tools = new Map<string, ToolState>();

  apply(event: JsonObject): ReplayDisposition {
    const type = stringField(event, 'type');
    const ordinary = new Set([
      'stream_start',
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
    ]);
    if (!ordinary.has(type)) return 'advanced';
    if (type === 'error' && event.msg_id == null) return 'advanced';
    const msgId = stringField(event, 'msg_id');

    if (type === 'stream_start') {
      if (this.turns.has(msgId)) fail('turn_conflict', `turn ${msgId} started more than once`);
      this.turns.set(msgId, { terminal: null, tools: new Set() });
      return 'advanced';
    }

    const turn = this.turns.get(msgId);
    if (!turn) fail('turn_sequence', `turn event ${type} arrived before stream_start`);
    if (turn.terminal) {
      if (type === 'stream_end' || type === 'error') {
        const terminal = canonicalString(event);
        if (turn.terminal !== terminal) fail('turn_terminal_conflict', `turn ${msgId} emitted conflicting terminals`);
        return 'duplicate';
      }
      return 'ignored_after_terminal';
    }

    if (type === 'stream_end' || type === 'error') {
      turn.terminal = canonicalString(event);
      return 'advanced';
    }

    // A call reaches us announced one of two ways. `tool_request` is the gated
    // path. `call_announced` (Core 0.13.0, minor 14) is the ungated one - force
    // mode, an allow-listed tool, a command-scoped grant, a recovered approval,
    // or a tool just granted `Always`. Before it existed those calls dispatched
    // with nothing on the wire and we failed closed on the `tool_running` that
    // followed, which is what killed Smart Trader's setup mid-turn.
    //
    // Core gave the frame no `tool_` prefix so hosts predating it drop it
    // through their default arm. Dropping it is NOT sufficient here: the
    // `tool_running` behind it would still find no matching request and fail
    // closed on the exact path the frame exists to fix. It has to REGISTER.
    const announcesCall = type === 'tool_request' || type === 'call_announced';
    if (!announcesCall && !type.startsWith('tool_')) return 'advanced';
    const callId = stringField(event, 'call_id');
    if (announcesCall) {
      if (this.tools.has(callId)) fail('tool_conflict', `tool ${callId} was requested more than once`);
      this.tools.set(callId, { msgId, terminal: null });
      turn.tools.add(callId);
      return 'advanced';
    }
    const tool = this.tools.get(callId);
    // Two different faults used to share one message, which made the failure
    // undiagnosable from a log: a call_id nobody announced, and a call_id
    // announced on a DIFFERENT turn. Core needs to know which one it emitted,
    // and the call_id is the only handle on the offending frame.
    if (!tool) {
      fail('tool_sequence', `tool event ${type} has no matching request (call_id=${callId}, msg_id=${msgId})`);
    }
    if (tool.msgId !== msgId) {
      fail(
        'tool_sequence',
        `tool event ${type} was requested on turn ${tool.msgId} but arrived on turn ${msgId} (call_id=${callId})`
      );
    }
    if (tool.terminal) {
      if (type === 'tool_result' || type === 'tool_cancelled') {
        const terminal = canonicalString(event);
        if (terminal !== tool.terminal) fail('tool_terminal_conflict', `tool ${callId} emitted conflicting terminals`);
        return 'duplicate';
      }
      return 'ignored_after_terminal';
    }
    if (type === 'tool_result' || type === 'tool_cancelled') tool.terminal = canonicalString(event);
    return 'advanced';
  }
}

type WorkflowNode = { state: string; childRunId?: string };
type WorkflowChild = {
  parentCallId: string;
  agentName: string;
  parentChildRunId?: string;
  nextSequence: number;
  terminal?: string;
};
type WorkflowRun = {
  workflowId: string;
  expectedNodeCount: number;
  nextSequence: number;
  nodes: Map<string, WorkflowNode>;
  children: Map<string, WorkflowChild>;
  terminal?: string;
};

function nodeTerminal(state: string): boolean {
  return ['succeeded', 'failed', 'blocked'].includes(state);
}

class WorkflowReducer {
  private readonly acceptedEvents = new Map<string, string>();
  private readonly runs = new Map<string, WorkflowRun>();

  apply(event: JsonObject): ReplayDisposition {
    const type = stringField(event, 'type');
    if (!['workflow_started', 'workflow_node_event', 'sub_agent_event', 'workflow_finished'].includes(type))
      return 'advanced';
    // The legacy compatibility sub-agent fixture is presentation-only and can
    // never create workflow authority.
    if (type === 'sub_agent_event' && event.run_id === undefined) return 'advanced';

    const runId = stringField(event, 'run_id');
    const eventId = stringField(event, 'event_id');
    const canonical = canonicalString(event);
    const previousBytes = this.acceptedEvents.get(eventId);
    if (previousBytes !== undefined) {
      if (previousBytes !== canonical) fail('workflow_duplicate_conflict', `workflow event ${eventId} conflicts`);
      return 'duplicate';
    }

    let disposition: ReplayDisposition;
    if (type === 'workflow_started') disposition = this.start(event, runId);
    else if (type === 'workflow_node_event') disposition = this.node(event, runId);
    else if (type === 'sub_agent_event') disposition = this.child(event, runId);
    else disposition = this.finish(event, runId);
    this.acceptedEvents.set(eventId, canonical);
    return disposition;
  }

  private start(event: JsonObject, runId: string): ReplayDisposition {
    if (uintField(event, 'sequence') !== 0) fail('workflow_sequence', 'workflow start sequence must be zero');
    if (this.runs.has(runId)) fail('workflow_duplicate_run', `workflow run ${runId} already exists`);
    this.runs.set(runId, {
      workflowId: stringField(event, 'workflow_id'),
      expectedNodeCount: uintField(event, 'node_count'),
      nextSequence: 1,
      nodes: new Map(),
      children: new Map(),
    });
    return 'advanced';
  }

  private run(runId: string): WorkflowRun {
    const run = this.runs.get(runId);
    if (!run) fail('workflow_unknown_run', `workflow run ${runId} has not started`);
    return run;
  }

  private sequence(run: WorkflowRun, event: JsonObject): void {
    const observed = uintField(event, 'sequence');
    if (observed !== run.nextSequence)
      fail('workflow_sequence', `expected workflow sequence ${run.nextSequence}, got ${observed}`);
  }

  private node(event: JsonObject, runId: string): ReplayDisposition {
    const run = this.run(runId);
    if (run.terminal) return 'ignored_after_terminal';
    this.sequence(run, event);
    const nodeId = stringField(event, 'node_id');
    const state = stringField(event, 'state');
    const childRunId = typeof event.child_run_id === 'string' && event.child_run_id ? event.child_run_id : undefined;
    const previous = run.nodes.get(nodeId);
    if (previous && nodeTerminal(previous.state)) {
      if (nodeTerminal(state) && state !== previous.state)
        fail('workflow_terminal_conflict', `node ${nodeId} has conflicting terminals`);
      if (previous.childRunId && childRunId && previous.childRunId !== childRunId) {
        fail('workflow_child_correlation', `node ${nodeId} changed child identity`);
      }
      run.nextSequence += 1;
      return 'ignored_after_terminal';
    }
    if (previous?.childRunId && childRunId && previous.childRunId !== childRunId) {
      fail('workflow_child_correlation', `node ${nodeId} changed child identity`);
    }
    if (childRunId) {
      const claimed = [...run.nodes.entries()].find(
        ([otherId, node]) => otherId !== nodeId && node.childRunId === childRunId
      );
      if (claimed) fail('workflow_child_correlation', `child ${childRunId} is linked to multiple nodes`);
    }
    run.nodes.set(nodeId, { state, childRunId: childRunId ?? previous?.childRunId });
    run.nextSequence += 1;
    return 'advanced';
  }

  private child(event: JsonObject, runId: string): ReplayDisposition {
    const run = this.run(runId);
    if (run.terminal) return 'ignored_after_terminal';
    const childRunId = stringField(event, 'child_run_id');
    const parentCallId = stringField(event, 'parent_call_id');
    const nodeId = parentCallId.startsWith('workflow:') ? parentCallId.slice('workflow:'.length) : '';
    if (!nodeId) fail('workflow_child_parent', `child ${childRunId} has no workflow parent`);
    const node = run.nodes.get(nodeId);
    if (!node || node.childRunId !== childRunId) {
      fail('workflow_child_correlation', `child ${childRunId} is not linked to node ${nodeId}`);
    }
    if (nodeTerminal(node.state))
      fail('workflow_child_after_terminal', `child ${childRunId} emitted after node terminal`);
    const sequence = uintField(event, 'child_sequence');
    const terminal = typeof event.terminal_state === 'string' ? event.terminal_state : undefined;
    if (terminal) {
      const inner = asObject(event.inner, 'inner');
      const innerType = stringField(inner, 'type');
      if ((terminal === 'succeeded' && innerType !== 'info') || (terminal === 'failed' && innerType !== 'error')) {
        fail('workflow_child_terminal', `child ${childRunId} terminal disagrees with inner event`);
      }
    }
    const previous = run.children.get(childRunId);
    if (!previous) {
      if (sequence !== 0) fail('workflow_child_sequence', `child ${childRunId} did not start at zero`);
      run.children.set(childRunId, {
        parentCallId,
        agentName: stringField(event, 'agent_name'),
        parentChildRunId: typeof event.parent_child_run_id === 'string' ? event.parent_child_run_id : undefined,
        nextSequence: 1,
        terminal,
      });
      return 'advanced';
    }
    if (
      previous.parentCallId !== parentCallId ||
      previous.agentName !== stringField(event, 'agent_name') ||
      previous.parentChildRunId !==
        (typeof event.parent_child_run_id === 'string' ? event.parent_child_run_id : undefined)
    ) {
      fail('workflow_child_correlation', `child ${childRunId} changed correlation identity`);
    }
    if (sequence !== previous.nextSequence)
      fail('workflow_child_sequence', `child ${childRunId} sequence gap or regression`);
    previous.nextSequence += 1;
    if (previous.terminal) {
      if (terminal && terminal !== previous.terminal)
        fail('workflow_child_terminal', `child ${childRunId} has conflicting terminals`);
      return 'ignored_after_terminal';
    }
    previous.terminal = terminal;
    return 'advanced';
  }

  private finish(event: JsonObject, runId: string): ReplayDisposition {
    const run = this.run(runId);
    const terminal = stringField(event, 'terminal_state');
    if (run.terminal) {
      if (run.terminal !== terminal) fail('workflow_terminal_conflict', `run ${runId} has conflicting terminals`);
      return 'ignored_after_terminal';
    }
    this.sequence(run, event);
    if (stringField(event, 'workflow_id') !== run.workflowId)
      fail('workflow_identity', `run ${runId} changed workflow identity`);
    if (event.succeeded !== (terminal === 'succeeded'))
      fail('workflow_terminal_conflict', 'workflow success flag is inconsistent');
    if (run.nodes.size !== run.expectedNodeCount) fail('workflow_node_count', `run ${runId} node count mismatch`);
    if ([...run.nodes.values()].some((node) => !nodeTerminal(node.state)))
      fail('workflow_active_nodes', `run ${runId} has active nodes`);
    if ([...run.children.values()].some((child) => !child.terminal))
      fail('workflow_active_children', `run ${runId} has active children`);
    for (const childRunId of run.children.keys()) {
      if (![...run.nodes.values()].some((node) => node.childRunId === childRunId)) {
        fail('workflow_child_correlation', `child ${childRunId} has no explicit node link`);
      }
    }
    for (const [nodeId, node] of run.nodes) {
      if (!node.childRunId) continue;
      const child = run.children.get(node.childRunId);
      if (!child) fail('workflow_child_correlation', `node ${nodeId} has no correlated child evidence`);
      if (node.state === 'succeeded' && child.terminal === 'failed') {
        fail('workflow_terminal_conflict', `succeeded node ${nodeId} has a failed child`);
      }
    }
    if (terminal === 'succeeded') {
      if ([...run.nodes.values()].some((node) => node.state === 'failed'))
        fail('workflow_terminal_conflict', 'successful run has failed nodes');
      if ([...run.children.values()].some((child) => child.terminal === 'failed')) {
        fail('workflow_terminal_conflict', 'successful run has failed children');
      }
    }
    run.nextSequence += 1;
    run.terminal = terminal;
    return 'advanced';
  }
}

type StoredReceipt = { event: JsonObject; canonical: string; status: AnvilDesktopTrustStatus };

function sha256Domain(domain: string, body: JsonObject): string {
  return `sha256:${createHash('sha256').update(`${domain}\0`).update(JSON.stringify(body)).digest('hex')}`;
}

function receiptDigestBody(receipt: JsonObject): JsonObject {
  const ordered: JsonObject = {
    receipt_id: receipt.receipt_id,
    event_id: receipt.event_id,
    origin: receipt.origin,
    contract_version: receipt.contract_version,
  };
  if (Array.isArray(receipt.required_extensions) && receipt.required_extensions.length) {
    ordered.required_extensions = receipt.required_extensions;
  }
  Object.assign(ordered, {
    session_id: receipt.session_id,
    run_id: receipt.run_id,
    task_id: receipt.task_id,
    sequence: receipt.sequence,
    issued_at_unix_ms: receipt.issued_at_unix_ms,
    digest_algorithm: receipt.digest_algorithm,
    artifact_scope: receipt.artifact_scope,
    artifact_digest: receipt.artifact_digest,
    gate_closure_digest: receipt.gate_closure_digest,
    receipt_body_digest: '',
  });
  if (receipt.supersedes_receipt_id !== undefined) ordered.supersedes_receipt_id = receipt.supersedes_receipt_id;
  Object.assign(ordered, {
    terminal_state: receipt.terminal_state,
    stamp: receipt.stamp,
    checks_passed: receipt.checks_passed,
    checks_total: receipt.checks_total,
  });
  if (receipt.coverage !== undefined) ordered.coverage = receipt.coverage;
  Object.assign(ordered, {
    iterations: receipt.iterations,
    valve_fires: receipt.valve_fires,
    cost_microcents: receipt.cost_microcents,
    priced: receipt.priced,
    engine_version: receipt.engine_version,
  });
  return ordered;
}

function invalidationDigestBody(invalidation: JsonObject): JsonObject {
  const ordered: JsonObject = {
    event_id: invalidation.event_id,
    origin: invalidation.origin,
    contract_version: invalidation.contract_version,
  };
  if (Array.isArray(invalidation.required_extensions) && invalidation.required_extensions.length) {
    ordered.required_extensions = invalidation.required_extensions;
  }
  Object.assign(ordered, {
    receipt_id: invalidation.receipt_id,
    session_id: invalidation.session_id,
    run_id: invalidation.run_id,
    task_id: invalidation.task_id,
    sequence: invalidation.sequence,
    issued_at_unix_ms: invalidation.issued_at_unix_ms,
    reason: invalidation.reason,
    prior_artifact_digest: invalidation.prior_artifact_digest,
  });
  if (invalidation.observed_artifact_digest !== undefined) {
    ordered.observed_artifact_digest = invalidation.observed_artifact_digest;
  }
  ordered.invalidation_body_digest = '';
  return ordered;
}

function validDigest(value: unknown): value is string {
  return typeof value === 'string' && /^sha256:[0-9a-fA-F]{64}$/.test(value);
}

class AnvilReducer {
  private readonly nextSequence = new Map<string, number>();
  private readonly eventBytes = new Map<string, string>();
  private readonly receipts = new Map<string, StoredReceipt>();

  apply(event: JsonObject): ReplayDisposition {
    const type = stringField(event, 'type');
    if (!['anvil_receipt', 'anvil_receipt_invalidated'].includes(type)) return 'advanced';
    this.validate(event, type);
    const eventId = stringField(event, 'event_id');
    const canonical = canonicalString(event);
    const priorEvent = this.eventBytes.get(eventId);
    if (priorEvent !== undefined) {
      if (priorEvent !== canonical) fail('anvil_event_conflict', `Anvil event ${eventId} conflicts`);
      return 'duplicate';
    }
    const sessionId = stringField(event, 'session_id');
    const expected = this.nextSequence.get(sessionId) ?? 0;
    const observed = uintField(event, 'sequence');
    if (observed !== expected)
      fail(
        observed > expected ? 'anvil_sequence_gap' : 'anvil_out_of_order',
        `expected Anvil sequence ${expected}, got ${observed}`
      );

    if (type === 'anvil_receipt') this.applyReceipt(event, canonical);
    else this.applyInvalidation(event);
    this.eventBytes.set(eventId, canonical);
    this.nextSequence.set(sessionId, expected + 1);
    return 'advanced';
  }

  private validate(event: JsonObject, type: string): void {
    if (event.origin !== 'core/anvil') fail('anvil_origin', 'Anvil authority must originate in Core');
    const version = stringField(event, 'contract_version');
    if (version.split('.')[0] !== '1') fail('anvil_version', `unsupported Anvil contract ${version}`);
    const extensions = event.required_extensions;
    if (Array.isArray(extensions) && extensions.length)
      fail('anvil_critical_extension', `unknown Anvil extension ${String(extensions[0])}`);
    for (const field of ['receipt_id', 'event_id', 'session_id', 'run_id', 'task_id']) stringField(event, field);
    if (type === 'anvil_receipt') {
      for (const field of ['artifact_scope', 'terminal_state', 'stamp', 'engine_version']) stringField(event, field);
      if (
        event.digest_algorithm !== 'sha256' ||
        !validDigest(event.artifact_digest) ||
        !validDigest(event.gate_closure_digest)
      ) {
        fail('anvil_digest', 'Anvil receipt digest fields are invalid');
      }
      if (!validDigest(event.receipt_body_digest)) fail('anvil_body_digest', 'Anvil receipt body digest is invalid');
      const expected = sha256Domain('wayland-core:anvil-receipt-body:v1', receiptDigestBody(event));
      if (event.receipt_body_digest !== expected) fail('anvil_body_digest', 'Anvil receipt body digest mismatch');
      if (uintField(event, 'checks_passed') > uintField(event, 'checks_total'))
        fail('anvil_checks', 'Anvil checks passed exceeds total');
    } else {
      if (
        !validDigest(event.prior_artifact_digest) ||
        (event.observed_artifact_digest !== undefined && !validDigest(event.observed_artifact_digest))
      ) {
        fail('anvil_digest', 'Anvil invalidation digest fields are invalid');
      }
      if (!validDigest(event.invalidation_body_digest))
        fail('anvil_invalidation_digest', 'Anvil invalidation body digest is invalid');
      const expected = sha256Domain('wayland-core:anvil-invalidation-body:v1', invalidationDigestBody(event));
      if (event.invalidation_body_digest !== expected)
        fail('anvil_invalidation_digest', 'Anvil invalidation body digest mismatch');
    }
  }

  private applyReceipt(event: JsonObject, canonical: string): void {
    const receiptId = stringField(event, 'receipt_id');
    const previous = this.receipts.get(receiptId);
    if (previous) {
      if (previous.canonical !== canonical) fail('anvil_receipt_conflict', `Anvil receipt ${receiptId} conflicts`);
      return;
    }
    if (typeof event.supersedes_receipt_id === 'string') {
      const superseded = this.receipts.get(event.supersedes_receipt_id);
      if (!superseded) fail('anvil_unknown_receipt', `unknown superseded receipt ${event.supersedes_receipt_id}`);
      if (superseded.event.session_id !== event.session_id || superseded.event.task_id !== event.task_id) {
        fail('anvil_correlation', 'superseded receipt correlation mismatch');
      }
      superseded.status = 'superseded';
    }
    this.receipts.set(receiptId, { event, canonical, status: 'active' });
  }

  private applyInvalidation(event: JsonObject): void {
    const receiptId = stringField(event, 'receipt_id');
    const stored = this.receipts.get(receiptId);
    if (!stored) fail('anvil_unknown_receipt', `unknown invalidated receipt ${receiptId}`);
    if (
      stored.event.session_id !== event.session_id ||
      stored.event.run_id !== event.run_id ||
      stored.event.task_id !== event.task_id ||
      stored.event.artifact_digest !== event.prior_artifact_digest
    ) {
      fail('anvil_correlation', `Anvil invalidation ${receiptId} correlation mismatch`);
    }
    stored.status = event.reason === 'superseded' ? 'superseded' : 'invalidated';
  }

  revokePublicationBoundTrust(): string[] {
    const revoked: string[] = [];
    for (const [receiptId, receipt] of this.receipts) {
      if (receipt.status === 'active') {
        receipt.status = 'historical';
        revoked.push(receiptId);
      }
    }
    return revoked;
  }

  status(receiptId: string): AnvilDesktopTrustStatus | undefined {
    return this.receipts.get(receiptId)?.status;
  }
}

/**
 * Stateful Desktop consumer for the pinned v1 producer contract.
 *
 * A released legacy Core that does not advertise `ready.contract` keeps the
 * existing path. Once a producer advertises v1, the whole session is pinned
 * and every line must pass schema and semantic replay before UI dispatch.
 */
export class DesktopCoreV1Consumer {
  private mode: 'unnegotiated' | 'legacy' | 'v1' | 'failed' = 'unnegotiated';
  private readyCanonical: string | null = null;
  private readonly policy = new PolicyReducer();
  private readonly ordinary = new OrdinaryTurnToolReducer();
  private readonly workflow = new WorkflowReducer();
  private readonly anvil = new AnvilReducer();
  private inputRemainder = Buffer.alloc(0);
  // K-03: set the moment an eager recovery (see consumeChunk) consumes a
  // complete frame without its own delimiter; cleared as soon as that
  // delimiter is observed (possibly in a later chunk) so a merely-delayed,
  // not-lost `\n`/`\r\n` is silently absorbed instead of being misread as a
  // new, zero-length line.
  private awaitingOrphanDelimiter = false;

  consumeLine(line: string): DesktopCoreConsumeResult {
    if (this.mode === 'failed') fail('session_failed', 'Core contract session already failed closed');
    if (Buffer.byteLength(line, 'utf8') + 1 > DESKTOP_CORE_MAX_LINE_BYTES) {
      this.mode = 'failed';
      fail('oversized_line', `Core protocol line exceeds ${DESKTOP_CORE_MAX_LINE_BYTES} bytes`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      this.mode = 'failed';
      fail('malformed_json', 'Core emitted malformed JSON');
    }
    try {
      const object = asObject(parsed);
      const type = stringField(object, 'type');
      if (this.mode === 'legacy')
        return { kind: 'event', event: object as WCoreEvent, disposition: 'advanced', contract: 'legacy' };
      if (this.mode === 'unnegotiated') return this.negotiate(object, type);
      if (type === 'ready') {
        const canonical = canonicalString(object);
        if (canonical !== this.readyCanonical)
          fail('duplicate_ready_conflict', 'Core emitted a conflicting ready descriptor');
        return { kind: 'drop', reason: 'duplicate' };
      }
      assertNoRequiredExtensions(object, type);
      if (!knownEventTypes.has(type)) {
        if (object.critical === false) return { kind: 'drop', reason: 'unknown_noncritical' };
        fail(
          object.critical === true ? 'unknown_critical' : 'unknown_criticality',
          `unknown Core event ${type} is not explicitly noncritical`
        );
      }
      validateSchema(validateEventSchema, object, `Core event ${type}`);
      const disposition = this.reduce(object);
      if (disposition === 'duplicate') return { kind: 'drop', reason: 'duplicate' };
      if (disposition === 'ignored_after_terminal') return { kind: 'drop', reason: 'after_terminal' };
      return { kind: 'event', event: object as WCoreEvent, disposition: 'advanced', contract: 'v1' };
    } catch (error) {
      this.mode = 'failed';
      throw error;
    }
  }

  /**
   * Decode raw stdout bytes without replacement characters or unbounded JSONL
   * buffering. Every returned frame has passed the same semantic consumer as
   * `consumeLine`.
   */
  consumeChunk(chunk: Buffer | string): DesktopCoreConsumeResult[] {
    if (this.mode === 'failed') fail('session_failed', 'Core contract session already failed closed');
    const incoming = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
    let cursor = this.inputRemainder.length ? Buffer.concat([this.inputRemainder, incoming]) : incoming;
    this.inputRemainder = Buffer.alloc(0);
    const results: DesktopCoreConsumeResult[] = [];

    try {
      while (cursor.length > 0) {
        // K-03: an earlier eager recovery consumed a complete frame without
        // its own delimiter. If the delimiter is now here (possibly having
        // arrived in a later chunk than the frame it terminates), absorb it
        // silently before resuming normal scanning - it is not a new,
        // zero-length line.
        if (this.awaitingOrphanDelimiter) {
          if (cursor.length >= 2 && cursor[0] === 0x0d && cursor[1] === 0x0a) {
            cursor = cursor.subarray(2);
            this.awaitingOrphanDelimiter = false;
          } else if (cursor.length >= 1 && cursor[0] === 0x0a) {
            cursor = cursor.subarray(1);
            this.awaitingOrphanDelimiter = false;
          } else {
            // Non-delimiter bytes are next, so the orphan delimiter is not
            // merely late - it is never coming, and the engine has moved on to
            // the following frame. Retire the flag NOW.
            //
            // Cross-audit (Kimi K3): leaving it set let it survive an
            // intervening newline-terminated frame and then silently absorb the
            // NEXT bare newline anywhere in the stream - a zero-length line this
            // consumer is required to reject. That turned a fail-closed protocol
            // validator lenient for the rest of the session after any single
            // eager recovery. The flag may only ever consume the delimiter that
            // immediately follows the frame it belongs to; an empty cursor still
            // carries it into the next chunk, which is the genuine
            // delayed-delimiter case it exists for.
            this.awaitingOrphanDelimiter = false;
          }
          if (cursor.length === 0) break;
        }
        const newline = cursor.indexOf(0x0a);
        if (newline < 0) {
          // A future LF would make a body at the cap exceed the cap.
          if (cursor.length >= DESKTOP_CORE_MAX_LINE_BYTES) {
            fail('oversized_line', `Core protocol line exceeds ${DESKTOP_CORE_MAX_LINE_BYTES} bytes`);
          }
          // K-03: the delimiter has not arrived, but the bytes already
          // buffered may already form one complete, structurally valid JSON
          // object (see findCompleteObjectEnd's contract). If so, recover it
          // eagerly through the SAME consumeLine validation every normal
          // line goes through - this changes WHEN parsing is attempted,
          // never WHAT is accepted. Gated to sessions that have already
          // negotiated (`legacy`/`v1`): the confirmed defect is a mid-
          // conversation frame (stream_end/error) arriving long after
          // negotiation, and restricting eager recovery to that window
          // preserves the pre-existing, intentionally-pinned "requires a
          // terminating newline" behavior for the FIRST (negotiation) frame
          // - `finishInput()`'s unterminated_jsonl failure for a truncated
          // opening handshake is itself correct, load-bearing behavior, not
          // an instance of this defect.
          // Cross-audit (Codex 5.6 Sol): eager recovery is valid ONLY when the
          // complete object is ALL the buffered bytes. Recovering a complete
          // object that has more bytes behind it would accept a stream that
          // violates JSONL framing - two concatenated objects with no delimiter
          // between them both became accepted events, where the pre-fix consumer
          // kept one unterminated invalid frame and failed closed on
          // `finishInput()`. That is a change to WHAT is accepted, not merely
          // WHEN it is parsed, which is exactly what this recovery promised not
          // to do.
          //
          // Requiring `eagerEnd === cursor.length` also preserves a frame with
          // trailing JSON whitespace (`{...}   \n`): those spaces stay buffered
          // with the object instead of being stranded and later parsed as their
          // own malformed line, so the newline terminates the whole line exactly
          // as before.
          //
          // The real defect is unaffected: a final `stream_end`/`error` body
          // whose delimiter has not arrived IS all the buffered bytes.
          const eagerCandidate = this.mode === 'unnegotiated' ? null : findCompleteObjectEnd(cursor);
          const eagerEnd = eagerCandidate === cursor.length ? eagerCandidate : null;
          if (eagerEnd !== null) {
            let eagerLine: string;
            try {
              eagerLine = UTF8_FATAL_DECODER.decode(cursor.subarray(0, eagerEnd));
            } catch {
              fail('invalid_utf8', 'Core emitted invalid UTF-8');
            }
            results.push(this.consumeLine(eagerLine));
            this.awaitingOrphanDelimiter = true;
            cursor = cursor.subarray(eagerEnd);
            continue;
          }
          // Copy the tail so a tiny partial frame cannot retain a large chunk.
          this.inputRemainder = Buffer.from(cursor);
          break;
        }
        if (newline + 1 > DESKTOP_CORE_MAX_LINE_BYTES) {
          fail('oversized_line', `Core protocol line exceeds ${DESKTOP_CORE_MAX_LINE_BYTES} bytes`);
        }
        let frame = cursor.subarray(0, newline);
        if (frame.length > 0 && frame[frame.length - 1] === 0x0d) frame = frame.subarray(0, -1);
        let line: string;
        try {
          line = UTF8_FATAL_DECODER.decode(frame);
        } catch {
          fail('invalid_utf8', 'Core emitted invalid UTF-8');
        }
        results.push(this.consumeLine(line));
        cursor = cursor.subarray(newline + 1);
      }
      return results;
    } catch (error) {
      this.inputRemainder = Buffer.alloc(0);
      this.mode = 'failed';
      throw error;
    }
  }

  finishInput(): void {
    if (this.mode === 'failed') return;
    if (this.inputRemainder.length > 0) {
      this.inputRemainder = Buffer.alloc(0);
      this.mode = 'failed';
      fail('unterminated_jsonl', 'Core stdout ended with an unterminated JSONL frame');
    }
  }

  private negotiate(object: JsonObject, type: string): DesktopCoreConsumeResult {
    if (type !== 'ready') fail('ready_required', 'Core must negotiate before emitting events');
    if (object.contract === undefined) {
      this.mode = 'legacy';
      return { kind: 'event', event: object as WCoreEvent, disposition: 'advanced', contract: 'legacy' };
    }
    assertNoRequiredExtensions(object, type);
    validateSchema(validateEventSchema, object, 'Core ready');
    const contract = asObject(object.contract, 'contract');
    assertDescriptor(contract);
    const capabilities = asObject(object.capabilities, 'capabilities');
    const modes = capabilities.modes;
    if (
      !Array.isArray(modes) ||
      typeof capabilities.current_mode !== 'string' ||
      !modes.includes(capabilities.current_mode)
    ) {
      fail('ready_capabilities', 'Core current mode is not advertised');
    }
    this.policy.apply(object.execution_policy, true);
    this.readyCanonical = canonicalString(object);
    this.mode = 'v1';
    return { kind: 'event', event: object as WCoreEvent, disposition: 'advanced', contract: 'v1' };
  }

  private reduce(object: JsonObject): ReplayDisposition {
    const type = object.type;
    if (type === 'execution_policy') return this.policy.apply(object);
    if (['workflow_started', 'workflow_node_event', 'workflow_finished'].includes(type as string)) {
      return this.workflow.apply(object);
    }
    if (type === 'sub_agent_event' && object.run_id !== undefined) return this.workflow.apply(object);
    if (type === 'anvil_receipt' || type === 'anvil_receipt_invalidated') return this.anvil.apply(object);
    return this.ordinary.apply(object);
  }

  validateOutboundCommand(command: WCoreCommand | unknown): WCoreCommand {
    if (this.mode !== 'v1') return command as WCoreCommand;
    // Before the schema: Ajv compares already-rounded doubles and cannot see a
    // u64 overflow. This is the production boundary - `index.ts` serializes
    // whatever this returns.
    assertNumbersAreRepresentable(command);
    validateSchema(validateCommandSchema, command, 'Desktop command');
    return command as WCoreCommand;
  }

  validateOutboundCommandLine(line: string): WCoreCommand {
    let command: unknown;
    try {
      command = JSON.parse(line);
    } catch {
      fail('command_malformed_json', 'Desktop command is not valid JSON');
    }
    return this.validateOutboundCommand(command);
  }

  markWorkspaceMutated(): string[] {
    return this.anvil.revokePublicationBoundTrust();
  }

  markDisconnected(): string[] {
    return this.anvil.revokePublicationBoundTrust();
  }

  anvilStatus(receiptId: string): AnvilDesktopTrustStatus | undefined {
    return this.anvil.status(receiptId);
  }

  get negotiatedContract(): 'legacy' | 'v1' | null {
    return this.mode === 'legacy' || this.mode === 'v1' ? this.mode : null;
  }
}
