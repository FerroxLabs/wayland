/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Connect a single pasted API key during onboarding (main process).
 *
 * Uses the app's real provider detection - the SAME `ProviderDetector` +
 * `SkRaceResolver` that the Models settings use - instead of a naive prefix
 * guess. This matters because many providers share the bare `sk-` prefix
 * (OpenAI, DeepSeek, Moonshot/Kimi, Qwen, …): a prefix-only guess sends a
 * DeepSeek key to the OpenAI endpoint, which rejects it. Here an ambiguous
 * `sk-` key is raced against every candidate provider's `/v1/models` endpoint
 * and connected to whichever one actually accepts it.
 *
 * Flow:
 *  1. `ProviderDetector.detect()` - structural/prefix match (no I/O).
 *  2. For a bare `sk-` key (`ambiguous-sk`), `SkRaceResolver.resolve()` races
 *     the key against the candidate endpoints and picks the live match.
 *  3. Persist through the model-registry connect path (tested, keychained,
 *     catalog built, pickers revalidated).
 *
 * Never throws - always resolves a renderer-safe `ConnectPastedKeyResult`.
 */

import { ProviderDetector, SkRaceResolver, type ProviderId } from '@process/providers';
import { connectModelRegistryProvider } from '@process/providers/ipc/modelRegistryIpc';

import type { ConnectPastedKeyResult } from '@/common/types/onboarding';

/**
 * Detect the provider a pasted key belongs to (racing live endpoints for the
 * ambiguous `sk-` family) and connect it. See module docs for the full flow.
 *
 * @param rawKey The key the user pasted into the onboarding "add a key" field.
 */
export async function connectPastedKey(rawKey: string): Promise<ConnectPastedKeyResult> {
  try {
    const key = rawKey.trim();
    if (!key) return { ok: false, error: 'unrecognized' };

    const detection = new ProviderDetector().detect(key);

    let providerId: ProviderId;
    switch (detection.kind) {
      case 'unique':
      case 'structural':
        providerId = detection.provider;
        break;
      case 'ambiguous-sk': {
        // Bare sk- shared by OpenAI/DeepSeek/Moonshot/Qwen/…: probe live to find
        // the real owner instead of guessing.
        const race = await new SkRaceResolver().resolve(key, detection.candidates);
        if (race.kind === 'matched') providerId = race.provider;
        else if (race.kind === 'multiple') providerId = race.providers[0];
        else return { ok: false, error: 'no-match' };
        break;
      }
      case 'multi-field':
        // The provider needs more than a bare key (e.g. region + secret); the
        // onboarding paste field can't satisfy it - send the user to Settings.
        return { ok: false, error: 'needs-fields', providerId: detection.provider };
      default:
        return { ok: false, error: 'unrecognized' };
    }

    const connected = await connectModelRegistryProvider(providerId, { key });
    if (connected.ok) return { ok: true, providerId };
    return { ok: false, error: 'failed', providerId };
  } catch {
    return { ok: false, error: 'failed' };
  }
}
