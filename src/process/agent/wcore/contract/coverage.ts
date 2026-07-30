/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Which contract events this host actually consumes, and which it knowingly
 * does not.
 *
 * These two sets exist so that "Desktop silently ignores an event Core ships"
 * becomes a build failure rather than a production discovery. Three tests in
 * `tests/contract/` hold them honest:
 *
 *  1. `HANDLED_CONTRACT_EVENTS` must equal the `case '…':` arms in
 *     `../index.ts` — the constant cannot drift from the switch.
 *  2. Every contract event must appear in exactly one of the two sets — a new
 *     Core event fails CI until someone triages it.
 *  3. Nothing in `UNHANDLED_CONTRACT_EVENTS` may be absent from the contract —
 *     stale entries get cleaned up rather than accumulating.
 */

/**
 * Event types `WCoreAgent.handleEvent` has a case arm for.
 *
 * Keep alphabetically sorted; test (1) compares against the real switch.
 */
export const HANDLED_CONTRACT_EVENTS: readonly string[] = [
  'approval_required',
  'approval_resume',
  'browser_event',
  'browser_policy_denied',
  'budget_exceeded',
  'config_changed',
  'cua_event',
  'cua_policy_denied',
  'error',
  'evolution_event',
  'execution_policy',
  'host_send_message_request',
  'info',
  'mcp_failed',
  'mcp_ready',
  'plugin_event',
  'plugin_registration_failed',
  'pong',
  'provider_circuit_event',
  'ready',
  'session_cost',
  'stream_end',
  'stream_start',
  'sub_agent_event',
  'suspend',
  'text_delta',
  'thinking',
  'tool_cancelled',
  'tool_chunk',
  'tool_panicked',
  'tool_request',
  'tool_result',
  'tool_running',
  'trace_event',
];

/**
 * Contract events this host receives, validates, and then deliberately does
 * not act on — every one of them an open product gap, not a wire problem.
 *
 * A `safety`-criticality entry here means Core considers the frame
 * safety-relevant and Desktop currently has no surface for it. They are logged
 * at error level at runtime (see `decoder.ts`) precisely so the gap is visible.
 *
 * Removing an entry requires adding a real handler. Adding one requires a
 * deliberate decision, which is the point.
 */
export const UNHANDLED_CONTRACT_EVENTS: readonly string[] = [
  // Anvil receipt lifecycle — Desktop has no receipt reducer yet
  // (Core's own DEFERRED.md defers `anvil_desktop_replay_reducer`).
  'anvil_receipt',
  'anvil_receipt_invalidated',
  // Budget grant round-trip; Desktop never sends `continue_with_budget`, so it
  // cannot receive the result. Pairs with the 12 undeclared host commands.
  'budget_grant_result',
  // Durable goals v1 — no Desktop surface.
  'goal_control_refused',
  'goal_snapshot',
  'goal_transition',
  // Runtime MCP lifecycle v1 — Desktop adds servers but never removes them.
  'mcp_removal_result',
  // Semantic failover receipts.
  'provider_failover_receipt',
  // Runtime diagnostics v1 — Desktop never sends `get_runtime_diagnostics`.
  'runtime_diagnostics_snapshot',
  'runtime_diagnostics_unavailable',
  // Turn recovery v1 — Desktop has no resync/replay path.
  'session_recovery_replay',
  'session_recovery_snapshot',
  'session_recovery_unavailable',
  'turn_recovery_lifecycle',
  'unknown_tool_effect_resolved',
  // Workflow lifecycle v1 (ForgeFlows) — no Desktop surface.
  'workflow_finished',
  'workflow_node_event',
  'workflow_started',
];

const HANDLED = new Set(HANDLED_CONTRACT_EVENTS);

export function isHandledContractEvent(type: string): boolean {
  return HANDLED.has(type);
}
