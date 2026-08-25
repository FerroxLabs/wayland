/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1002 - wnano's provider resolution, and why it is NOT a vendor-locked row.
 *
 * The obvious reading of the gap is "wnano is forced into a single-provider
 * row". It is not, and it must not be. `ACP_BACKEND_UNDERLYING_PROVIDER` is the
 * VENDOR-LOCKED map (grok->xai, kimi->moonshot, ...): one provider each, because
 * those CLIs can only ever run their own vendor's models. Wayland Nano is
 * first-party and multi-provider - its backend entry says so
 * (`authRequired: false`, "Draws on the providers connected in Wayland; no own
 * login") and every spawn is handed `WAYLAND_NANO_PROVIDERS` carrying each
 * CONNECTED provider from {@link NANO_KNOWN_PROVIDER_IDS}. Giving it a row here
 * would pin it to one vendor and make the mismatch worse.
 *
 * So the absence of a wnano row is correct, and these assertions freeze it
 * against a well-meaning "fix" that adds one. What was wrong lived one layer up:
 * `curatedForAgent` fell through to `return []` for wnano, so the picker offered
 * Flux Auto and nothing else while Nano was being advertised 17 providers'
 * models. That half is fixed and pinned in
 * `tests/unit/process/providers/modelRegistryIpc.test.ts`
 * ("curatedForAgent wnano provider parity (#1002)").
 *
 * Each half below carries a positive control, so a rename or a moved map cannot
 * turn this into a vacuous pass.
 */

import { describe, expect, it } from 'vitest';
import {
  ACP_BACKEND_UNDERLYING_PROVIDER,
  CLI_UNDERLYING_PROVIDER,
  resolveBackendCandidateProviders,
} from '@/process/providers/backendProviderResolution';
import { NANO_KNOWN_PROVIDER_IDS } from '@/process/task/wnano/providersPayload';

describe('#1002 wnano provider resolution', () => {
  it('resolves real candidates for the backends that DO have a row (positive control)', () => {
    expect(resolveBackendCandidateProviders('kimi')).toEqual(['moonshot']);
    expect(resolveBackendCandidateProviders('grok')).toEqual(['xai']);
    expect(resolveBackendCandidateProviders('codex')).toEqual(['chatgpt-subscription', 'openai']);
    expect(CLI_UNDERLYING_PROVIDER.claude).toBe('anthropic');
  });

  it('has NO vendor-locked row for wnano, so it resolves no single default provider', () => {
    expect(Object.keys(ACP_BACKEND_UNDERLYING_PROVIDER)).not.toContain('wnano');
    expect(resolveBackendCandidateProviders('wnano')).toEqual([]);
  });

  it('and the spawn payload advertises the full multi-provider set to Nano', () => {
    expect(NANO_KNOWN_PROVIDER_IDS.length).toBeGreaterThan(1);
    for (const providerId of ['flux-router', 'anthropic', 'openai', 'moonshot', 'xai'] as const) {
      expect(NANO_KNOWN_PROVIDER_IDS).toContain(providerId);
    }
  });
});
