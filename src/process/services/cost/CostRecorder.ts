/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ICostRepository } from './types';

/**
 * Pricing contract owned by WS-B. Pinned in VERIFIED-ANCHORS.md. WS-A codes to
 * this signature so it does not hard-depend on WS-B's implementation file.
 */
export interface ModelPricing {
  /**
   * USD for a per-turn token split. Returns undefined for an unknown/undefined
   * model id so the recorder can fall back to cost_source='unknown'.
   */
  priceTokens(
    modelId: string | undefined,
    t: { input: number; output: number; cacheRead?: number }
  ): number | undefined;
}

export type CostSource = 'engine' | 'computed' | 'unknown';

/**
 * Input to recordTurnFinish. Exactly ONE cost_event row is written per call.
 * Pinned in VERIFIED-ANCHORS.md - WS-C calls this at each backend finish.
 */
export type TurnFinish = {
  conversationId: string;
  backend: string;
  modelId?: string;
  costSource: CostSource;
  /** engine path (ACP): per-conversation CUMULATIVE high-water marks. */
  cumulativeUsd?: number;
  cumulativeTokens?: number;
  /** computed path (wcore/gemini): per-turn split. */
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cronId?: string;
  teamId?: string;
  ts: number;
};

type Baseline = { usd: number; tokens: number };

/**
 * Main-process singleton. Converts a backend finish signal into exactly one
 * cost_event row, applying the R1 delta logic for the engine path.
 *
 *  - 'engine'   delta = cumulative - per-conversation baseline, clamped >= 0,
 *               then the baseline advances to the new cumulative. This is the
 *               whole point: acp usage_update.cost/used are a cumulative gauge,
 *               so pricing per event would N-count. We record one delta at
 *               turn finish.
 *  - 'computed' price input/output via ModelPricing (per-turn, no baseline).
 *               If pricing is undefined, downgrade to cost_source='unknown'
 *               with cost_usd=0 (tokens still recorded).
 *  - 'unknown'  cost_usd=0, record token total if any.
 */
/**
 * Optional post-record hook (Stage 1 budgets). Fired once per recorded turn,
 * AFTER the cost_event row is inserted, with the turn's scope context so the
 * BudgetController can run non-blocking warn enforcement. Never throws into the
 * recording path (the recorder guards it); must not block.
 */
export type TurnRecordedHook = (ctx: { modelId?: string; backend: string; teamId?: string }) => void;

export class CostRecorder {
  private readonly baselines = new Map<string, Baseline>();
  private onTurnRecorded?: TurnRecordedHook;

  constructor(
    private readonly repo: ICostRepository,
    private readonly pricing: ModelPricing
  ) {}

  /**
   * Register a post-record hook for budget enforcement. Wired in initBridge.ts
   * after both the recorder and the BudgetController exist. Optional: with no
   * hook set, recording behaves exactly as before.
   */
  setTurnRecordedHook(hook: TurnRecordedHook): void {
    this.onTurnRecorded = hook;
  }

  recordTurnFinish(e: TurnFinish): void {
    if (e.costSource === 'engine') {
      this.recordEngine(e);
    } else if (e.costSource === 'computed') {
      this.recordComputed(e);
    } else {
      this.recordUnknown(e);
    }
    this.notifyRecorded(e);
  }

  private notifyRecorded(e: TurnFinish): void {
    if (!this.onTurnRecorded) return;
    try {
      this.onTurnRecorded({ modelId: e.modelId, backend: e.backend, teamId: e.teamId });
    } catch (err) {
      console.warn('[CostRecorder] turn-recorded hook failed:', err);
    }
  }

  /** Drop a conversation's baseline on close/reset so it restarts at zero. */
  resetBaseline(conversationId: string): void {
    this.baselines.delete(conversationId);
  }

  private recordEngine(e: TurnFinish): void {
    const cumulativeUsd = e.cumulativeUsd ?? 0;
    const cumulativeTokens = e.cumulativeTokens ?? 0;
    const baseline = this.baselines.get(e.conversationId) ?? { usd: 0, tokens: 0 };

    // Clamp negatives to 0 to survive session resets / compaction where the
    // cumulative gauge drops below the prior high-water mark.
    const deltaUsd = Math.max(0, cumulativeUsd - baseline.usd);
    const deltaTokens = Math.max(0, cumulativeTokens - baseline.tokens);

    // Advance the baseline to the new high-water mark (never regress).
    this.baselines.set(e.conversationId, {
      usd: Math.max(baseline.usd, cumulativeUsd),
      tokens: Math.max(baseline.tokens, cumulativeTokens),
    });

    this.repo.insert({
      conversationId: e.conversationId,
      backend: e.backend,
      modelId: e.modelId,
      costUsd: deltaUsd,
      tokensTotal: deltaTokens,
      costSource: 'engine',
      cronId: e.cronId,
      teamId: e.teamId,
      createdAt: e.ts,
    });
  }

  private recordComputed(e: TurnFinish): void {
    const input = e.inputTokens ?? 0;
    const output = e.outputTokens ?? 0;
    const cacheRead = e.cacheReadTokens;
    const priced = this.pricing.priceTokens(e.modelId, { input, output, cacheRead });

    if (priced === undefined) {
      this.repo.insert({
        conversationId: e.conversationId,
        backend: e.backend,
        modelId: e.modelId,
        costUsd: 0,
        tokensTotal: input + output,
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
        cacheReadTokens: e.cacheReadTokens,
        costSource: 'unknown',
        cronId: e.cronId,
        teamId: e.teamId,
        createdAt: e.ts,
      });
      return;
    }

    this.repo.insert({
      conversationId: e.conversationId,
      backend: e.backend,
      modelId: e.modelId,
      costUsd: priced,
      tokensTotal: input + output,
      inputTokens: e.inputTokens,
      outputTokens: e.outputTokens,
      cacheReadTokens: e.cacheReadTokens,
      costSource: 'computed',
      cronId: e.cronId,
      teamId: e.teamId,
      createdAt: e.ts,
    });
  }

  private recordUnknown(e: TurnFinish): void {
    const input = e.inputTokens ?? 0;
    const output = e.outputTokens ?? 0;
    const tokensTotal = input + output || (e.cumulativeTokens ?? 0);
    this.repo.insert({
      conversationId: e.conversationId,
      backend: e.backend,
      modelId: e.modelId,
      costUsd: 0,
      tokensTotal,
      inputTokens: e.inputTokens,
      outputTokens: e.outputTokens,
      cacheReadTokens: e.cacheReadTokens,
      costSource: 'unknown',
      cronId: e.cronId,
      teamId: e.teamId,
      createdAt: e.ts,
    });
  }
}

let singleton: CostRecorder | undefined;

/** Install the process-wide CostRecorder. Called once from initBridge. */
export function setCostRecorder(recorder: CostRecorder): void {
  singleton = recorder;
}

/** Get the process-wide CostRecorder, or undefined before it is wired. */
export function getCostRecorder(): CostRecorder | undefined {
  return singleton;
}
