/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { waitForCronReady } from '@process/services/cron/cronReadiness';
import { ExtensionRegistry } from '@process/extensions/ExtensionRegistry';
import { getKickoffEngine } from '@process/services/kickoff/kickoffSingleton';
import type { KickoffResult, KickoffTelemetryEvent, NotRenderedReason } from '@process/services/kickoff/types';

/**
 * IPC surface for the Kickoff system.
 *
 * Two endpoints:
 *   - suggest({ assistantId })  - main process walks the cascade, returns
 *     KickoffSuggestion | { notRendered: NotRenderedReason }
 *   - telemetry(event)          - fire-and-forget log of accept/redirect/
 *     dismiss/not_rendered with cascade reason. v1 just structured-logs;
 *     remote analytics ships post-v1.
 *
 * Validation: assistantId is bounded (1-128 chars, alnum + dash + optional
 * `ext-`/`builtin-` prefix) to avoid pathological payloads. We do NOT
 * throw on bad input - the renderer's `useKickoff` hook treats an `error`
 * notRendered reason as "silently fall through to bare input," which is
 * the same outcome as a real cascade miss.
 *
 * v0.4.7.1 (INIT-1) - `suggest` gates on `ExtensionRegistry.whenInitialized()`
 * with a 3s timeout. Cold-cache window between `initBridge` module load
 * (which registers this IPC handler) and `ExtensionRegistry.initialize()`
 * (inside `app.whenReady`) used to surface `unknown-assistant` for real
 * assistants on deep-link / first-render flows.
 *
 * v0.4.7.1 (C-L-1) - channel names renamed from `kickoff:*` colon form to
 * `kickoff.*` dot form to match dominant ipcBridge convention.
 */
const REGISTRY_READY_TIMEOUT_MS = 3000;
const TELEMETRY_STRING_CAP = 128;

const ASSISTANT_ID_REGEX = /^(ext-|builtin-)?[a-z0-9-]+$/;

export function initKickoffBridge(): void {
  ipcBridge.kickoff.suggest.provider(async (raw: unknown): Promise<KickoffResult> => {
    if (!isSuggestParams(raw)) return { notRendered: 'error' };
    // v0.4.7.1 (INIT-1) - wait for registry, but bounded. On timeout we
    // surface `registry-not-ready` so telemetry can distinguish cold-cache
    // races from real `unknown-assistant`.
    // v0.4.7.1 (G-M-2) - also wait for cron init (in parallel) so first-
    // launch Standing-Company users get Level-1 ritual detection. Cron is
    // a soft signal: if it's still not ready after the timeout we proceed
    // anyway (ritual detection will just degrade to no signal), so we
    // don't return notRendered for cron timeout.
    const [registryReady] = await Promise.all([waitForRegistry(), waitForCron()]);
    if (!registryReady) return { notRendered: 'registry-not-ready' };

    try {
      return await getKickoffEngine().suggest(raw.assistantId);
    } catch (err) {
      // v0.4.7.1 (IPC-2) - distinct `engine-error` reason + sanitized
      // err.name so v2 analytics can group engine bugs separately from
      // legitimate cascade misses. Never include err.message (PII risk).
      const errorName =
        err && typeof err === 'object' && typeof (err as { name?: unknown }).name === 'string'
          ? ((err as { name: string }).name || 'Error')
          : 'Error';
      console.warn('[kickoff.suggest] failed; returning notRendered/engine-error', err);
      return { notRendered: 'engine-error', errorName };
    }
  });

  ipcBridge.kickoff.telemetry.provider(async (raw: unknown): Promise<void> => {
    if (!isTelemetryEvent(raw)) return;
    // v1: structured log to console only. Remote sink wires in v2.
    // v0.4.7.1 (IPC-3) - downgrade to console.debug so production logs
    // aren't crowded; preserve full payload for opt-in verbose mode.
    console.debug('[kickoff.telemetry]', JSON.stringify(raw));
  });
}

async function waitForCron(): Promise<void> {
  // Soft signal - best-effort wait, no diagnostic on timeout. The
  // SignalCollector will degrade Level-1 detection to "no ritual fired
  // recently" if the cron store is empty when read, which is the right
  // graceful behavior for the not-yet-loaded case.
  try {
    await waitForCronReady(REGISTRY_READY_TIMEOUT_MS);
  } catch {
    /* fall through */
  }
}

async function waitForRegistry(): Promise<boolean> {
  try {
    const registry = ExtensionRegistry.getInstance();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), REGISTRY_READY_TIMEOUT_MS);
    });
    const result = await Promise.race([registry.whenInitialized().then(() => 'ready' as const), timeout]);
    if (timer) clearTimeout(timer);
    return result === 'ready';
  } catch {
    // If we can't reach getInstance, treat as not-ready and fall through.
    return false;
  }
}

function isSuggestParams(raw: unknown): raw is { assistantId: string } {
  if (!raw || typeof raw !== 'object') return false;
  const id = (raw as { assistantId?: unknown }).assistantId;
  if (typeof id !== 'string') return false;
  if (id.length === 0 || id.length > 128) return false;
  // v0.4.7.1 (C-M-2) - explicit format check. Tighter than a bare length
  // bound and avoids Unicode-normalization ambiguity. Accepts the two
  // prefix forms the renderer actually sends (`ext-`, `builtin-`) plus
  // bare slug.
  return ASSISTANT_ID_REGEX.test(id);
}

const TELEMETRY_EVENT_NAMES = new Set<KickoffTelemetryEvent['event']>([
  'accepted',
  'redirected',
  'dismissed',
  'not_rendered',
]);

// v0.4.7.1 (C-M-3) - mirror the event-name enum guard for the other two
// enum-typed payload fields so an unknown value is rejected silently
// rather than letting renderer drift leak into the structured log.
const NOT_RENDERED_REASONS = new Set<NotRenderedReason>([
  'no-kickoffs-defined',
  'unknown-assistant',
  'all-levels-missed',
  'engine-error',
  'registry-not-ready',
  'kickoffs-excluded',
  'ipc-error',
  'error',
]);
const VALID_CASCADE_LEVELS = new Set<number>([1, 2, 3, 4]);
const DISMISS_REASONS = new Set<NonNullable<KickoffTelemetryEvent['dismissReason']>>([
  'interaction',
  'typing',
]);

function isTelemetryEvent(raw: unknown): raw is KickoffTelemetryEvent {
  if (!raw || typeof raw !== 'object') return false;
  const e = raw as Record<string, unknown>;
  if (typeof e.event !== 'string' || !TELEMETRY_EVENT_NAMES.has(e.event as KickoffTelemetryEvent['event'])) {
    return false;
  }
  if (e.kickoffId !== undefined) {
    if (typeof e.kickoffId !== 'string') return false;
    if (e.kickoffId.length > TELEMETRY_STRING_CAP) return false; // IPC-3 length cap
  }
  if (e.cascadeLevel !== undefined) {
    if (typeof e.cascadeLevel !== 'number' || !VALID_CASCADE_LEVELS.has(e.cascadeLevel)) return false;
  }
  if (e.notRenderedReason !== undefined) {
    if (typeof e.notRenderedReason !== 'string') return false;
    if (e.notRenderedReason.length > TELEMETRY_STRING_CAP) return false; // IPC-3 length cap
    if (!NOT_RENDERED_REASONS.has(e.notRenderedReason as NotRenderedReason)) return false;
  }
  if (e.dismissReason !== undefined) {
    if (typeof e.dismissReason !== 'string') return false;
    if (!DISMISS_REASONS.has(e.dismissReason as NonNullable<KickoffTelemetryEvent['dismissReason']>)) return false;
  }
  return true;
}
