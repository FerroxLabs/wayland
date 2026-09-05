/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// wcore JSON Stream Protocol types
// Reference: wayland-core/docs/json-stream-protocol.md
//
// Engine source-of-truth: wayland-core/crates/wcore-protocol/src/events.rs
// (ProtocolEvent enum). When the engine adds a variant, mirror it here AND
// add a handler arm in index.ts. Per the W0 Host Decoder Contract, unknown
// variants MUST drop silently - but a variant the engine has shipped (e.g.
// BrowserPolicyDenied) is NOT unknown; failing to enumerate it means
// safety-critical policy-denied events get silently dropped in production.

// ============================================
// Agent -> Client Events (stdout)
// ============================================

export type ToolCategory = 'info' | 'edit' | 'exec' | 'mcp';

/**
 * Access level on a path grant. Mirrors `wcore-protocol::commands::PathGrantAccess`
 * (`#[serde(rename_all = "snake_case")]`). `write` is expressible on the wire and
 * REFUSED by the engine — Core keeps it legible rather than absent so a host
 * cannot ship a button promising more than it delivers.
 */
export type PathGrantAccess = 'read' | 'write';

/**
 * A boundary a tool call is about to cross, classified by the engine BEFORE the
 * call runs (wayland-core v0.13.4, #1099).
 *
 * Mirrors `wcore-protocol::events::ToolEscalation`, an internally tagged enum
 * (`#[serde(tag = "kind", rename_all = "snake_case")]`), so the discriminant
 * arrives as `kind`. Switch on `kind` rather than assuming the single variant:
 * Core made it an enum precisely so a second answer to "why am I being asked?"
 * can arrive without breaking a host that already shipped.
 *
 * The win over the old flow is the ordering. Previously a read outside the
 * workspace was REFUSED and then explained; this arrives with the approval
 * request, so the user answers a folder question instead of reading a path out
 * of a failure message.
 */
export type ToolEscalation = {
  kind: 'path_boundary';
  /** The path the call named, canonicalized. */
  target: string;
  /** `read` today; write outside the workspace is not grantable. */
  access: PathGrantAccess;
  /**
   * The CONTAINING DIRECTORY of `target` — what a grant actually opens.
   * Core is explicit that putting `target` on the button would be a button
   * that lies about its own scope, so this is the value the card must show.
   */
  suggested_root: string;
};

export type ToolInfo = {
  name: string;
  category: ToolCategory;
  args: Record<string, unknown>;
  description: string;
  /**
   * Present only when the engine classified this call as crossing a boundary.
   * Additive and `skip_serializing_if = "Option::is_none"` on the engine side,
   * so an unescalated `tool_request` is byte-identical to what shipped before.
   */
  escalation?: ToolEscalation;
};

/**
 * The scope an approval is granted under. Mirrors
 * `wcore-protocol::commands::ApprovalScope`, an EXTERNALLY tagged enum with
 * `rename_all = "snake_case"`: unit variants serialise as bare strings
 * (`"once"`, `"always"`) and struct variants as a single-key object
 * (`{"always_path":{"root":"/Users/me/reports","write":false}}`).
 *
 * `always_path` EXPANDS the session's filesystem authority beyond the sandbox
 * root — unlike `always`, which only narrows an authority the session already
 * has. It is the only answer that resolves a `path_boundary` escalation:
 * `once` leaves the read refused, because the authority plumbing cannot run the
 * call under a one-shot grant.
 */
export type ApprovalScope =
  | 'once'
  | 'always'
  /**
   * Prefix-scoped always-allow. NARROWS an authority the session already has:
   * only commands in the same category whose normalized head matches `prefix`
   * are auto-approved (`{"always_prefix":{"prefix":"cargo "}}`). Desktop does
   * not send it today; it is here because this file is a mirror of
   * `wcore-protocol::commands::ApprovalScope` and a mirror with a hole in it
   * is how a host ends up mis-decoding the variant it never enumerated.
   */
  | { always_prefix: { prefix: string } }
  | { always_path: { root: string; write: boolean } };

/**
 * The CLOSED media-type vocabulary a `render_artifact` frame may carry.
 * Mirrors `wcore-protocol::events::RenderMime`. Closed on purpose: a future
 * value must not arrive as free text and be accepted by a host that has never
 * heard of it, so anything outside this set is refused rather than guessed.
 */
export type RenderMime = 'text/plain' | 'text/markdown' | 'text/html';

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
};

/**
 * Capabilities advertised by the engine in the `ready` event.
 *
 * v0.1.21 baseline fields are always serialized. W0 forward-additive flags
 * (`streaming_tools` through `gepa_enabled`) are `#[serde(default,
 * skip_serializing_if = is_false)]` on the engine side - they appear in
 * the JSON only when set true, and default to `false` when absent. Each
 * flag gates one or more new event types (see Host Decoder Contract
 * "Flag → event-type mapping" table in docs/json-stream-protocol.md).
 *
 * The host doesn't need to gate rendering on these flags: the contract
 * says hosts MAY use them to decide which `type` strings to recognise,
 * but MUST tolerate unknown variants regardless.
 */
export type WCoreCapabilities = {
  // v0.1.21 baseline
  tool_approval: boolean;
  thinking: boolean;
  effort: boolean;
  effort_levels: string[];
  modes: string[];
  /** Current mode; added in v0.2.x engine. Optional for back-compat with ≤0.1.21. */
  current_mode?: string;
  mcp: boolean;

  // W0 forward-additive flags - all default false; absent in serialized
  // JSON when off (skip_serializing_if invariant on the engine side).
  streaming_tools?: boolean;
  sub_agent_traces?: boolean;
  cost_attribution?: boolean;
  hitl_suspend?: boolean;
  non_destructive_compact?: boolean;
  structured_traces?: boolean;
  rpc_tool_script?: boolean;
  browser_suite?: boolean;
  computer_use?: boolean;
  plugins?: boolean;
  gepa_enabled?: boolean;
};

/**
 * `stream_end.finish_reason` - required field in v0.2.x engine; absent on ≤0.1.21.
 *
 * #457: `'max_turns'` is forward-additive. Today the engine maps a MaxTurns stop
 * to `'length'` (engine.rs MaxTurns->length), making "needs more turns"
 * indistinguishable from token truncation and surfacing the wrong remedy. The
 * engine (Rust) leg to emit a distinct `'max_turns'` is owned by Core; the
 * desktop tolerates and surfaces it here the moment Core ships it.
 */
export type FinishReason = 'stop' | 'length' | 'error' | 'max_turns';

/** Circuit breaker states emitted by `provider_circuit_event`. */
export type CircuitState = 'closed' | 'open' | 'half_open';

/** One per-turn cost row carried by `session_cost`. */
export type TurnCost = {
  turn: number;
  model: string;
  /** Structured provider id (`anthropic`, `bedrock`, `openai`, `vertex`, `ollama`). */
  provider: string;
  cost_usd: number;
};

export type WCoreContractCapabilityStatus = 'available' | 'publication_bound' | 'shape_only' | 'unavailable';

export type WCoreContractDescriptor = {
  name: string;
  major: number;
  minor: number;
  generator: string;
  fixture_digest: string;
  schema_digest: string;
  source_inputs_digest: string;
  capabilities: Record<string, WCoreContractCapabilityStatus>;
};

export type WCoreExecutionPolicy = {
  critical: true;
  contract_version: string;
  revision: number;
  reason: 'launch' | 'mode_change' | 'resume' | 'expiry';
  effective_at_unix_ms: number;
  policy: {
    posture: 'smart' | 'managed' | 'dangerous';
    approvals: 'prompt' | 'auto_edit' | 'bypass';
    sandbox: 'required' | 'bypass';
    source: string;
    managed_floor_active: boolean;
    dangerous_activation_id?: string;
    dangerous_expires_at_unix_ms?: number;
  };
};

/**
 * The read/write boundary Core is ACTUALLY enforcing, as Core reports it.
 *
 * Mirrors `wcore-types::workspace_trust::WorkspacePolicyReceipt`. Note the
 * nesting: unlike `execution_policy`, which the engine emits with
 * `#[serde(flatten)]`, this one is a plain named field, so the receipt arrives
 * under `policy` and NOT at the top level of the frame.
 *
 * Output-only. Echoing any field of it back to the engine cannot mint trust or
 * authority - it is a receipt, not a request.
 *
 * WHY THE HOST CARES. `readable_roots` is the authoritative answer to "what can
 * this chat actually reach", and Core's own protocol doc says to prefer it over
 * tracking grants host-side. It is also the ONLY structural confirmation a
 * `grant_path` landed: `emit_path_grant` flattens its typed `PathGrantError`
 * (`FilesystemRoot`, `RequiresLocalOperator`, `WriteNotGrantable`, `NoParent`,
 * `CapReached`) into an untyped `info` string and emits this receipt only in
 * the `Ok` arm. There is no typed refusal to catch.
 *
 * CAVEAT ON `readable_roots` AS A CONTAINMENT CLAIM: these are the roots Core
 * applies to its OWN file tools and hands to the OS sandbox. Whether the OS
 * then stops a shell child from leaving them is a property of `backend` - the
 * Windows default (`windows_job_object`) does not confine the filesystem. A
 * host must qualify any "the workspace is a boundary" wording by `backend`.
 */
export type WCoreWorkspacePolicy = {
  trust: {
    level: 'untrusted' | 'trusted';
    source:
      | 'default'
      | 'managed'
      | 'user'
      | 'local_session'
      | 'project'
      | 'skill'
      | 'hook'
      | 'mcp'
      | 'remote'
      | 'child';
    fingerprint: string;
    explanation: string;
  };
  profile: 'strict' | 'trusted_local_smart';
  /** e.g. `sandbox-exec`, `bubblewrap`, `windows_job_object`. Free text by design. */
  backend: string;
  writable_roots: string[];
  readable_roots: string[];
  capabilities: Array<{ name: string; executable: string; read_only_roots: string[] }>;
};

export type WCoreEvent =
  | {
      type: 'ready';
      version: string;
      session_id?: string;
      capabilities: WCoreCapabilities;
      /** Present only on a negotiated Desktop producer contract. */
      contract?: WCoreContractDescriptor;
      execution_policy?: WCoreExecutionPolicy;
    }
  | ({ type: 'execution_policy' } & WCoreExecutionPolicy)
  | { type: 'workspace_policy'; policy: WCoreWorkspacePolicy }
  | { type: 'stream_start'; msg_id: string }
  | { type: 'text_delta'; text: string; msg_id: string }
  | { type: 'thinking'; text: string; msg_id: string; subject?: string }
  | {
      type: 'tool_request';
      msg_id: string;
      call_id: string;
      tool: ToolInfo;
    }
  | {
      /** Core has already approved this call; the host must not request approval again. */
      type: 'call_announced';
      msg_id: string;
      call_id: string;
      tool: ToolInfo;
    }
  | {
      type: 'tool_running';
      msg_id: string;
      call_id: string;
      tool_name: string;
    }
  | {
      type: 'tool_result';
      msg_id: string;
      call_id: string;
      tool_name: string;
      status: 'success' | 'error';
      output: string;
      output_type: 'text' | 'diff' | 'image';
      metadata?: Record<string, unknown>;
    }
  | { type: 'tool_cancelled'; msg_id: string; call_id: string; reason: string }
  // ── #1098 render_artifact — CONTENT handed to the host, no path ────
  //
  // The sanctioned replacement for shelling out to `open` (#1102: the macOS
  // seatbelt profile is `(deny default)` and never grants `lsopen`, so `open`
  // fails -54; granting it would be an execution-confinement escape). This
  // frame needs ZERO filesystem authority at the host.
  //
  // SECURITY: `content` is UNTRUSTED — model-authored or read out of the
  // workspace — and carries NO path, so a host must never offer Open or Reveal
  // on it: there is nothing to hand the OS. `text/html` must be rendered only
  // in a sandboxed surface with no host-process bridge.
  //
  // `critical` is always the JSON literal `false`, carried explicitly so a host
  // pinned to an older contract corpus drops the frame instead of hard-erroring
  // on a missing classification.
  | {
      type: 'render_artifact';
      msg_id: string;
      call_id: string;
      /** Short label for the surface. Engine-capped at 256 bytes. */
      title: string;
      mime: RenderMime;
      /** Engine-capped at 1 MiB, already secret-scrubbed engine-side. */
      content: string;
      /** `content` is a truncated prefix; the surface should badge it partial. */
      truncated: boolean;
      critical: false;
    }
  | {
      type: 'stream_end';
      msg_id: string;
      usage?: TokenUsage;
      /**
       * Why the model stopped. Optional for protocol back-compat: wcore ≤0.1.21
       * omits this field. When `length`, the response was truncated because the
       * token budget was exhausted (commonly caused by Gemini Pro thinking
       * tokens consuming the entire allocation before any visible output).
       */
      finish_reason?: FinishReason;
    }
  | {
      type: 'error';
      msg_id: string | null;
      error: { code: string; message: string; retryable: boolean };
    }
  | { type: 'info'; msg_id: string; message: string }
  | { type: 'config_changed'; capabilities: WCoreCapabilities }
  | { type: 'mcp_ready'; name: string; tools: string[] }
  // #713: the engine failed to connect a configured MCP server. `reason`
  // carries the engine's actionable remediation text (e.g. the `[security]
  // egress_allow` hint). Emitted once per failed server, typically at
  // session start while MCP servers are being registered.
  | { type: 'mcp_failed'; name: string; reason: string }
  | { type: 'pong' }
  // ── W1: F9 structured trace ──────────────────────────────────────
  | {
      type: 'trace_event';
      msg_id: string;
      /** Opaque trace payload; the host treats this as `unknown` JSON. */
      trace: unknown;
    }
  // ── W6: F7 end-of-session cost aggregate ──────────────────────────
  | {
      type: 'session_cost';
      session_id: string;
      total_cost_usd: number;
      per_turn: TurnCost[];
    }
  // ── W7: F2 sub-agent event ────────────────────────────────────────
  | {
      type: 'sub_agent_event';
      parent_call_id: string;
      agent_name: string;
      /** Serialized inner `WCoreEvent` from the sub-agent; opaque to the host. */
      inner: unknown;
      run_id?: string;
      child_run_id?: string;
      parent_child_run_id?: string;
      child_sequence?: number;
      event_id?: string;
      terminal_state?: 'succeeded' | 'failed';
    }
  | {
      type: 'workflow_started';
      workflow_id: string;
      name: string;
      node_count: number;
      run_id: string;
      event_id: string;
      sequence: number;
      parent_run_id?: string;
    }
  | {
      type: 'workflow_node_event';
      run_id: string;
      node_id: string;
      event_id: string;
      sequence: number;
      state: 'queued' | 'running' | 'succeeded' | 'failed' | 'blocked';
      child_run_id?: string;
      failure?: { code: string; message: string; retryable: boolean };
    }
  | {
      type: 'workflow_finished';
      workflow_id: string;
      run_id: string;
      event_id: string;
      sequence: number;
      succeeded: boolean;
      terminal_state: 'succeeded' | 'failed';
      failure?: { code: string; message: string; retryable: boolean };
    }
  // ── W7: F4 streaming tool-result chunk ────────────────────────────
  | {
      type: 'tool_chunk';
      msg_id: string;
      call_id: string;
      tool_name: string;
      chunk: string;
    }
  // ── W7: F8 provider circuit-breaker transition ────────────────────
  | {
      type: 'provider_circuit_event';
      primary: string;
      fallback?: string;
      state: CircuitState;
      error?: string;
    }
  // ── W7: S4 hitl suspend / approval ────────────────────────────────
  | {
      type: 'approval_required';
      call_id: string;
      resume_token: string;
      /** Wave SC opaque handle for UI matching. Same value as `resume_token`. */
      correlation_id?: string;
      reason: string;
      context: string;
    }
  | {
      type: 'suspend';
      reason: string;
      resume_token: string;
    }
  | {
      type: 'approval_resume';
      resume_token: string;
      approved: boolean;
    }
  // ── W8a A.7 budget cap exceeded ───────────────────────────────────
  | {
      type: 'budget_exceeded';
      reason: string;
      observed: string;
      limit: string;
    }
  // ── Wave RB tool panic recovery ───────────────────────────────────
  | {
      type: 'tool_panicked';
      msg_id: string;
      call_id: string;
      tool_name: string;
      panic_message: string;
    }
  // ── Wave RB plugin registration failure ───────────────────────────
  | {
      type: 'plugin_registration_failed';
      plugin_name: string;
      surface: string;
      error_kind: string;
      message: string;
    }
  // ── W8a H.1 plugin-emitted event ──────────────────────────────────
  | {
      type: 'plugin_event';
      plugin_name: string;
      event_type: string;
      payload: unknown;
    }
  // ── W10B F12 GEPA evolution event ─────────────────────────────────
  | {
      type: 'evolution_event';
      run_id: string;
      generation: number;
      parent_id: string;
      child_id: string;
      mutation_kind: string;
      score: number;
      retained: boolean;
    }
  // ── W8c.1 E.14 browser ops ────────────────────────────────────────
  | {
      type: 'browser_event';
      msg_id: string;
      call_id: string;
      op: string;
      url?: string;
      summary: string;
    }
  | {
      type: 'browser_policy_denied';
      msg_id: string;
      url: string;
      reason: string;
    }
  // ── W8c.2 F.9 CUA ops ─────────────────────────────────────────────
  | {
      type: 'cua_event';
      msg_id: string;
      call_id: string;
      op: string;
      /** `[x, y]` screen coords for mouse/key ops; absent for screenshot/wait/etc. */
      coords?: [number, number];
      summary: string;
    }
  | {
      type: 'cua_policy_denied';
      msg_id: string;
      op: string;
      app?: string;
      reason: string;
    }
  // #537 host-send-transport hook. When the engine is host-delegated
  // (WAYLAND_SEND_MESSAGE_HOST_DELEGATE=1 at spawn) its `send_message` tool
  // routes the send to the HOST instead of the engine's channel table (which is
  // empty under the desktop → "unknown channel: email"). The engine emits this
  // request; the host fulfils it through its own outbound channel plugins and
  // replies with `host_send_message_result` (correlated by `call_id`).
  // `platform`/`chat_id`/`thread_id` mirror the engine's ParsedTarget.
  | {
      type: 'host_send_message_request';
      call_id: string;
      platform: string;
      chat_id?: string;
      thread_id?: string;
      body: string;
      subject?: string;
      conversation_id?: string;
    }
  | {
      type: 'anvil_receipt';
      receipt_id: string;
      event_id: string;
      origin: 'core/anvil';
      contract_version: string;
      session_id: string;
      run_id: string;
      task_id: string;
      sequence: number;
      artifact_digest: string;
      gate_closure_digest: string;
      receipt_body_digest: string;
      [key: string]: unknown;
    }
  | {
      type: 'anvil_receipt_invalidated';
      receipt_id: string;
      event_id: string;
      origin: 'core/anvil';
      contract_version: string;
      session_id: string;
      run_id: string;
      task_id: string;
      sequence: number;
      reason: 'artifact_mutated' | 'gate_revoked' | 'superseded';
      prior_artifact_digest: string;
      invalidation_body_digest: string;
      [key: string]: unknown;
    };

// ============================================
// Client -> Agent Commands (stdin)
// ============================================

export type WCoreCommand =
  | { type: 'message'; msg_id: string; content: string; files?: string[] }
  | { type: 'stop' }
  // `answer` (wayland-core v0.9.3+, additive) threads an AskUserQuestion-class
  // tool's chosen option back through the approval channel; the engine
  // synthesizes the tool result from it (guarded engine-side on
  // tool_name == "AskUserQuestion"). Omitted for a plain approval; older
  // engines ignore the extra field (serde default None).
  // `scope` widened to `ApprovalScope` for #1099. `'once'`/`'always'` keep the
  // exact bare-string wire form they always had; `always_path` is the object
  // form an older engine never sees because an older host never sends it.
  | { type: 'tool_approve'; call_id: string; scope: ApprovalScope; answer?: string }
  | { type: 'tool_deny'; call_id: string; reason?: string }
  // #1099 boundary axis. `grant_path` gives this session standing READ access to
  // a folder outside the workspace; it is a sibling of `grant_workspace_capability`,
  // NOT of `tool_approve`, because the user-initiated flow (operator picks a
  // folder in a picker) has no pending `call_id` to hang a scope on.
  //
  // Core REFUSES it unless the launcher opted in with `--allow-host-path-grants`
  // (which itself requires `--json-stream`). Through contract 1.22 that refusal
  // arrived as an untyped `info` string; contract 1.23 (Core v0.13.12) types it
  // as a `grant_refused` event carrying `reason: "local_opt_in_required"` and
  // the offending `grant_id`. Either way there is NO updated `workspace_policy`
  // receipt - so the receipt, not the absence of an error, is still what tells a
  // host the grant landed.
  | {
      type: 'grant_path';
      /** Host-chosen and stable: the ONLY handle `revoke_path` accepts. */
      grant_id: string;
      /** May be a file - Core grants the containing directory. */
      root: string;
      /** Omitted = `read`. `write` is expressible and REFUSED, never downgraded. */
      access?: PathGrantAccess;
      /** Unix ms deadline, evaluated at USE time. Omitted = process lifetime. */
      expires_at_ms?: number;
    }
  // Deliberately NOT gated on the launcher opt-in: taking authority away is
  // always permitted, and an unknown id is a no-op, so revoking is idempotent
  // and a host that crashed mid-flow can clean up without knowing what landed.
  | { type: 'revoke_path'; grant_id: string }
  // W7 S4 HITL: resume a suspended turn waiting on an `approval_required`.
  // Engine-side resolve is idempotent — a stale/duplicate token is ignored.
  | { type: 'approval_resume'; resume_token: string; approved: boolean }
  | { type: 'init_history'; text: string }
  | { type: 'set_mode'; mode: 'default' | 'auto_edit' | 'yolo' }
  | {
      type: 'set_config';
      model?: string;
      thinking?: string;
      thinking_budget?: number;
      effort?: string;
    }
  | {
      type: 'add_mcp_server';
      name: string;
      transport: string;
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
      headers?: Record<string, string>;
    }
  // #537 reply to `host_send_message_request`. `ok=true` → the engine resolves
  // the tool call as sent (optional `message_id` receipt); `ok=false`/`error`
  // → the engine surfaces a real send failure to the model (never a false
  // success). Correlated to the request by `call_id`.
  | {
      type: 'host_send_message_result';
      call_id: string;
      ok: boolean;
      message_id?: string;
      error?: string;
    }
  | { type: 'ping' };
