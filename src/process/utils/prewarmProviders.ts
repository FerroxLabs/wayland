/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadAnthropic } from '@/common/api/AnthropicRotatingClient';
import { loadGoogleGenAI } from '@/common/api/GeminiRotatingClient';
import { loadOpenAI as loadOpenAIClient } from '@/common/api/OpenAIRotatingClient';
import { loadAwsBedrock, loadOpenAI as loadOpenAIBridge } from '@process/bridge/modelBridge';

/**
 * Cron-aware pre-warm for the lazy AI SDK loaders.
 *
 * Background: the four AI provider SDKs (anthropic, google/genai, openai,
 * aws-sdk/client-bedrock) defer their module evaluation until the first
 * call into the corresponding provider. This keeps idle main-process RSS
 * lower for users who don't actively use a given provider. But scheduled
 * (cron) tasks that fire in the background would pay that first-call
 * latency (~200-500 ms) on their first run.
 *
 * Solution: at boot, after the cron service loads enabled jobs from the
 * database, call this with the list of backends referenced by those jobs.
 * SDKs referenced by cron jobs are pre-loaded eagerly; SDKs not referenced
 * stay lazy.
 *
 * The mapping intentionally only covers backends that talk directly to
 * an AI provider from THIS process. ACP backends (claude / codex / qwen /
 * goose / kimi / opencode / codebuddy / droid / auggie / copilot / qoder /
 * vibe / cursor / kiro / hermes / snow / custom) spawn their own external
 * CLI binaries and don't use our in-process SDKs - they don't need pre-warm.
 * Same for the 'wcore' (spawned Rust engine), 'remote' (WebSocket), and
 * 'nanobot' / 'openclaw-gateway' (external CLIs) backends.
 */

type LoaderFn = () => Promise<unknown>;

// Backend identifier -> SDK loaders to pre-warm.
const BACKEND_TO_LOADERS: Record<string, LoaderFn[]> = {
  // Gemini backend talks to @google/genai directly from this process via
  // GeminiRotatingClient. Pre-warm so the first scheduled fire is instant.
  gemini: [loadGoogleGenAI],
};

// Loaders covered by the mapping (the union of all values above), used
// for the "pre-warm everything" fallback when callers don't know the
// backend list yet. Kept for completeness; currently unused.
export const ALL_PROVIDER_LOADERS: LoaderFn[] = [
  loadAnthropic,
  loadGoogleGenAI,
  loadOpenAIClient,
  loadOpenAIBridge,
  loadAwsBedrock,
];

/**
 * Pre-warm AI SDKs for the providers referenced by the given backend list.
 * Backends with no in-process SDK (ACP CLIs, wcore, remote, etc.) are
 * silently skipped. Loaders are fired in parallel; failures are logged
 * but never thrown - pre-warm is best-effort, not load-bearing.
 *
 * @param backends - Backend identifier strings (typically from
 *   `cronJob.metadata.agentType` after de-duplication).
 */
export async function prewarmProviderSdks(backends: ReadonlyArray<string>): Promise<void> {
  const loaders = new Set<LoaderFn>();
  for (const backend of new Set(backends)) {
    const mapped = BACKEND_TO_LOADERS[backend];
    if (mapped) {
      for (const fn of mapped) loaders.add(fn);
    }
  }
  if (loaders.size === 0) return;

  const results = await Promise.allSettled(Array.from(loaders).map((fn) => fn()));
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length > 0) {
    for (const f of failures) {
      console.warn('[prewarmProviderSdks] loader failed (non-fatal):', f.reason);
    }
  }
}
