/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Closed set of telemetry events fed into the Launchpad predictive widget.
 * Adding a new event type requires updating both the producer (usually a
 * renderer hook) and the dashboard analytics that consumes them.
 */
export type UsageEventType =
  | 'launchpad.card_clicked'
  | 'launchpad.view_all_clicked'
  | 'launchpad.intent_pill_clicked'
  | 'launchpad.intent_prompt_clicked'
  | 'guid.assistant_selected'
  | 'guid.cli_selected'
  | 'guid.model_selected'
  | 'guid.message_sent'
  | 'guid.foreground'
  | 'dashboard.opened'
  | 'dashboard.widget_clicked'
  | 'dashboard.summary_requested'
  // Workflow Launch Surface (v0.6.0) - see spec §4.3, §8, §11.1, §9.
  | 'workflow.session_started'
  | 'workflow.step_marker'
  | 'workflow.ask_emitted'
  | 'workflow.ask_answered'
  | 'workflow.session_completed'
  | 'workflow.autonomous_step_dispatched'
  | 'workflow.autonomous_step_completed'
  | 'workflow.autonomous_step_timeout'
  | 'workflow.parent_run_stalled'
  | 'workflow.resume_repoke'
  | 'workflow.marker_invalid'
  | 'workflow.marker_html_escaped'
  | 'workflow.marker_false_strip'
  | 'workflow.step_transition'
  | 'workflow.regress_attempt'
  | 'workflow.backtrack'
  | 'workflow.step_auto_completed'
  | 'workflow.poke_cap_hit'
  | 'workflow.orphaned_ask';

export type UsageEvent = {
  id: string;
  timestampMs: number;
  eventType: UsageEventType;
  anchorId?: string;
  assistantId?: string;
  cliBackend?: string;
  metadata?: Record<string, unknown>;
};

export interface IUsageEventRepository {
  append(event: UsageEvent): Promise<void>;
  findSince(sinceMs: number): Promise<UsageEvent[]>;
  findByType(eventType: UsageEventType, sinceMs: number): Promise<UsageEvent[]>;
  /**
   * Delete events older than the supplied cutoff (epoch ms). Returns the
   * number of rows removed. Cross-audit MED-4: bounded growth for
   * long-lived installs - aggregator only queries the last 7 days.
   */
  prune(cutoffMs: number): Promise<number>;
}
