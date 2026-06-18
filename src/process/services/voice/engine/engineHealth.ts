/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { EngineErrorKind } from './types';

const PERSISTENT_KINDS: ReadonlySet<EngineErrorKind> = new Set(['auth', 'quota']);
const PERSISTENT_SUSPEND_MS = 60 * 60 * 1000;
const TRANSIENT_SUSPEND_MS = 5 * 60 * 1000;
const TRANSIENT_THRESHOLD = 3;

type HealthRecord = { consecutiveFailures: number; suspendedUntil: number; reason: string };

/**
 * In-memory engine health: persistent failures (auth/quota) suspend an engine
 * immediately for 60 min; transient kinds suspend for 5 min after 3
 * consecutive failures. The user's configured chain order is never rewritten -
 * health is an overlay that drops suspended engines to the BOTTOM of the
 * effective order (last resort, never removed). Success resets the record.
 */
export class EngineHealthTracker {
  private records = new Map<string, HealthRecord>();
  constructor(private readonly now: () => number = Date.now) {}

  recordSuccess(engineId: string): void {
    this.records.delete(engineId);
  }

  recordFailure(engineId: string, kind: EngineErrorKind | undefined, message: string): void {
    const rec = this.records.get(engineId) ?? { consecutiveFailures: 0, suspendedUntil: 0, reason: '' };
    rec.consecutiveFailures += 1;
    if (kind && PERSISTENT_KINDS.has(kind)) {
      rec.suspendedUntil = this.now() + PERSISTENT_SUSPEND_MS;
      rec.reason = `${kind}: ${message}`;
    } else if (rec.consecutiveFailures >= TRANSIENT_THRESHOLD) {
      rec.suspendedUntil = this.now() + TRANSIENT_SUSPEND_MS;
      rec.reason = `${rec.consecutiveFailures} consecutive failures: ${message}`;
    }
    this.records.set(engineId, rec);
  }

  isSuspended(engineId: string): boolean {
    const rec = this.records.get(engineId);
    return Boolean(rec && rec.suspendedUntil > this.now());
  }

  suspensionReason(engineId: string): string | null {
    const rec = this.records.get(engineId);
    return rec && rec.suspendedUntil > this.now() ? rec.reason : null;
  }

  /** User's configured order is authority; suspended engines drop to the bottom. */
  effectiveOrder(chain: string[]): string[] {
    const healthy = chain.filter((id) => !this.isSuspended(id));
    const suspended = chain.filter((id) => this.isSuspended(id));
    return [...healthy, ...suspended];
  }

  /** Manual reset (Settings) and key/config-change hook. */
  reset(engineId?: string): void {
    if (engineId) this.records.delete(engineId);
    else this.records.clear();
  }
}

export const sharedEngineHealth = new EngineHealthTracker();
