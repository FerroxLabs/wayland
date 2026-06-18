/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import log from 'electron-log';
import { getTtsEngine } from './registry';
import { EngineError, type TtsChunk } from './types';
import { sharedEngineHealth, type EngineHealthTracker } from './engineHealth';

export type FailoverNotice = { failedEngine: string; fellBackTo: string; error: string };

export type ChainConfigSlice = {
  chain: string[];
  engines: Partial<Record<string, { voice?: string; speed?: number }>>;
};

export type ChainResult = {
  ok: boolean;
  engineUsed?: string;
  notices: FailoverNotice[];
  error?: string;
};

/**
 * Walks the health-adjusted engine chain: unavailable engines are silently
 * skipped (not installed / wrong platform / no key); synthesis FAILURES record
 * into the health tracker, advance to the next engine, and produce a failover
 * notice the renderer can surface. Never throws - envelope result (the IPC
 * bridge swallows provider rejections).
 */
export const runTtsChain = async (
  text: string,
  config: ChainConfigSlice,
  onChunk: (c: TtsChunk) => void,
  signal?: AbortSignal,
  health: EngineHealthTracker = sharedEngineHealth,
): Promise<ChainResult> => {
  const notices: FailoverNotice[] = [];
  let lastError = 'no engines in chain';
  let lastFailed: string | null = null;

  for (const id of health.effectiveOrder(config.chain)) {
    if (signal?.aborted) return { ok: false, notices, error: 'aborted' };
    const engine = getTtsEngine(id);
    if (!engine) {
      lastError = `unknown engine: ${id}`;
      continue;
    }

    const avail = await engine.available().catch((e) => ({ ok: false, reason: String(e) }));
    if (!avail.ok) {
      log.info('[voice-chain] skip', { engine: id, reason: avail.reason });
      continue;
    }

    const settings = config.engines[id] ?? {};
    const startedAt = Date.now();
    try {
      await engine.synthesize(text, { voice: settings.voice, speed: settings.speed }, onChunk, signal);
      log.info('[voice-chain] ok', { engine: id, ms: Date.now() - startedAt });
      health.recordSuccess(id);
      if (lastFailed) notices.push({ failedEngine: lastFailed, fellBackTo: id, error: lastError });
      return { ok: true, engineUsed: id, notices };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      lastFailed = id;
      health.recordFailure(id, err instanceof EngineError ? err.kind : undefined, lastError);
      log.error('[voice-chain] failed', { engine: id, ms: Date.now() - startedAt, error: lastError });
    }
  }
  return { ok: false, notices, error: lastError };
};

/**
 * Pre-warm the engine that the next synthesis would actually use: walk the
 * health-adjusted order, find the FIRST available engine that exposes a
 * `warmup`, call it, and stop. Only one engine is warmed (the active one) so
 * we never boot a worker for an engine that would not be used. Best-effort -
 * never throws; returns the warmed engine id (or {} when nothing was warmed).
 */
export const warmTtsChain = async (
  config: ChainConfigSlice,
  health: EngineHealthTracker = sharedEngineHealth,
): Promise<{ warmed?: string }> => {
  for (const id of health.effectiveOrder(config.chain)) {
    const engine = getTtsEngine(id);
    if (!engine || !engine.warmup) continue;
    const avail = await engine.available().catch(() => ({ ok: false }));
    if (!avail.ok) continue;
    try {
      await engine.warmup();
      log.info('[voice-chain] warmed', { engine: id });
      return { warmed: id };
    } catch (err) {
      log.warn('[voice-chain] warmup failed', { engine: id, error: String(err) });
      return {};
    }
  }
  return {};
};
