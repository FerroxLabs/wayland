/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #998 - the message layer of the per-tool filtering shim.
 *
 * WHY THIS EXISTS. The user can switch INDIVIDUAL tools off for a connector.
 * That is honoured on the legacy `codex` and `gemini` backends by a client-side
 * allowlist, and is inert on ACP and Wayland Core, because the host-to-engine
 * wire has no per-tool field: `add_mcp_server` carries exactly
 * name/transport/command/args/env/url/headers/allow_local, and the engine
 * connects to the MCP server ITSELF. Whatever the server exposes, the engine
 * sees. Withholding the connector covers "all off"; a strict subset has no
 * expression on the wire at all.
 *
 * So Desktop interposes. The engine is handed a descriptor pointing at this
 * shim; the shim connects to the real server and re-exports only the allowed
 * subset. The subset stops being UI state the engine is asked to respect and
 * becomes a process boundary it cannot cross - the engine never holds the real
 * server's descriptor. That is fail-closed by construction, unlike a marker
 * scheme where an unmarked server is always injected.
 *
 * WHAT THIS IS NOT. It is not a request/response gateway. Progress flows
 * server->engine and cancellation flows engine->server while a call is still
 * running, so anything that waits for a response before writing would deadlock
 * long-running tools. This is a pipe with exactly two exceptions:
 *
 *   1. a result to a request WE saw as `tools/list` has its tool array filtered
 *   2. a `tools/call` for a disallowed tool is refused here and NEVER forwarded
 *
 * Everything else - notifications, progress, cancellation, resources, prompts,
 * the `initialize` handshake and its `serverInfo` - relays untouched and in
 * order. Identity passthrough is load-bearing: engines namespace tools as
 * `server__tool`, so substituting the shim's own name would break per-chat model
 * memory between sessions. Filtering changes list membership, never tool names.
 */

/** A decoded JSON-RPC message. Deliberately loose: we relay what we do not touch. */
export type JsonRpcMessage = Record<string, unknown>;

export type ToolFilterOptions = {
  /** Exact tool names the engine is permitted to see and call. */
  allowed: readonly string[];
  sendToEngine: (message: JsonRpcMessage) => void;
  sendToUpstream: (message: JsonRpcMessage) => void;
};

export type ToolFilter = {
  /** A message the engine sent toward the server. */
  fromEngine: (message: JsonRpcMessage) => void;
  /** A message the server sent toward the engine. */
  fromUpstream: (message: JsonRpcMessage) => void;
};

/** JSON-RPC "method not found" - the honest code for a tool that is not there. */
const METHOD_NOT_FOUND = -32601;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Build the message filter.
 *
 * The allowlist is compared by EXACT string. It comes from app state, never
 * from the engine or the server, so a tool description carrying a prompt
 * injection cannot widen it - there is no pattern for it to influence.
 */
export function createToolFilter(options: ToolFilterOptions): ToolFilter {
  const allowed = new Set(options.allowed);
  // Ids of in-flight requests the ENGINE issued as `tools/list`. Only replies to
  // these are filtered: a `resources/list` reply that happens to carry a `tools`
  // key must pass through untouched, and an id is forgotten once answered so a
  // later reuse of the same id is not mistaken for a tool list.
  const pendingToolLists = new Set<string>();

  const idKey = (id: unknown): string => `${typeof id}:${String(id)}`;

  const fromEngine = (message: JsonRpcMessage): void => {
    const method = message.method;

    if (method === 'tools/list' && message.id !== undefined) {
      pendingToolLists.add(idKey(message.id));
      options.sendToUpstream(message);
      return;
    }

    if (method === 'tools/call') {
      const params = isRecord(message.params) ? message.params : undefined;
      const name = typeof params?.name === 'string' ? params.name : undefined;
      if (name === undefined || !allowed.has(name)) {
        // Refused HERE. The real server never receives the request, which is the
        // whole point: enforcement is a boundary, not a request the engine is
        // trusted to honour. A notification (no id) is simply dropped - there is
        // nothing to answer and nothing may be forwarded.
        if (message.id !== undefined) {
          options.sendToEngine({
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: METHOD_NOT_FOUND,
              message: `Tool ${name ?? '(unnamed)'} is not available on this connector in this chat.`,
            },
          });
        }
        return;
      }
    }

    options.sendToUpstream(message);
  };

  const fromUpstream = (message: JsonRpcMessage): void => {
    if (message.id === undefined || !pendingToolLists.delete(idKey(message.id))) {
      options.sendToEngine(message);
      return;
    }

    // A reply to a request we saw as tools/list. An error reply, or a result
    // with no `tools` array, has nothing to filter and passes as-is rather than
    // being rewritten into a shape the engine did not expect.
    const result = isRecord(message.result) ? message.result : undefined;
    if (!result || !Array.isArray(result.tools)) {
      options.sendToEngine(message);
      return;
    }

    const tools = result.tools.filter(
      (tool) => isRecord(tool) && typeof tool.name === 'string' && allowed.has(tool.name)
    );
    options.sendToEngine({ ...message, result: { ...result, tools } });
  };

  return { fromEngine, fromUpstream };
}
