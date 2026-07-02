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

export type ToolInfo = {
  name: string;
  category: ToolCategory;
  args: Record<string, unknown>;
  description: string;
};

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

export type WCoreEvent =
  | {
      type: 'ready';
      version: string;
      session_id?: string;
      capabilities: WCoreCapabilities;
    }
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
  | { type: 'tool_approve'; call_id: string; scope: 'once' | 'always'; answer?: string }
  | { type: 'tool_deny'; call_id: string; reason?: string }
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
