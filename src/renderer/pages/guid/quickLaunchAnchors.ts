/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The 6 quick-launch anchors surfaced on the launchpad cold-start page.
 * Clicking a card: (1) sets the assistant as active preset via
 * useGuidAgentSelection.handleSelect - appears as PresetAgentTag in
 * the action row; (2) prefills the input with `prefill`; (3) fires
 * 'launchpad.card_clicked' telemetry for Phase 2 PredictiveEngine.
 *
 * Cowork is anchor #1 (place-anchor / Sutherland) - the universal
 * autonomous-execution button. Other 5 are recurring entrepreneur jobs.
 */

export type QuickLaunchAnchorId =
  | 'cowork'
  | 'write-copy'
  | 'close-deal'
  | 'launch-it'
  | 'numbers'
  | 'quiet-money';

export type QuickLaunchAnchor = {
  id: QuickLaunchAnchorId;
  label: string;
  sub: string;
  prefill: string;
  assistantId: string;
  lucideIcon: string;
};

export const QUICK_LAUNCH_ANCHORS: readonly QuickLaunchAnchor[] = [
  { id: 'cowork',      label: 'Cowork',       sub: 'Autonomous',         prefill: 'Cowork: ',                  assistantId: 'builtin-cowork',         lucideIcon: 'zap' },
  { id: 'write-copy',  label: 'Write copy',   sub: 'Email, ad, page',    prefill: 'Draft me ',                 assistantId: 'ext-copy',               lucideIcon: 'pen-line' },
  { id: 'close-deal',  label: 'Close a deal', sub: 'Outreach · follow',  prefill: 'Help me close ',            assistantId: 'ext-sales',              lucideIcon: 'handshake' },
  { id: 'launch-it',   label: 'Launch it',    sub: 'Product · promo',    prefill: 'Plan the launch for ',      assistantId: 'ext-product-launch',     lucideIcon: 'rocket' },
  { id: 'numbers',     label: 'Numbers',      sub: 'Runway · ROI',       prefill: 'Run the numbers on ',       assistantId: 'ext-coin',               lucideIcon: 'bar-chart-3' },
  { id: 'quiet-money', label: 'Quiet Money',  sub: 'Wealth coach',       prefill: 'Quiet Money - ',            assistantId: 'ext-quiet-money',        lucideIcon: 'landmark' },
] as const;
