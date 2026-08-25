/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1002 (assessment) - pins what wnano's provider resolution ACTUALLY is today,
 * because the shape of the gap is not what it looks like from the outside.
 *
 * wnano is NOT "forced into a single-provider row". It has no row at all:
 * `ACP_BACKEND_UNDERLYING_PROVIDER` (the vendor-locked map: grok->xai,
 * kimi->moonshot, ...) has no `wnano` key, and `resolveBackendCandidateProviders`
 * therefore returns an EMPTY candidate list. In `modelRegistryIpc.curatedForAgent`
 * that empty list is the `return []` fall-through, so a wnano chat's model picker
 * offers Flux Auto and nothing else.
 *
 * Meanwhile the SPAWN side already advertises the full multi-provider set: every
 * connected provider in {@link NANO_KNOWN_PROVIDER_IDS} is serialized into
 * `WAYLAND_NANO_PROVIDERS` (AcpAgentManager.buildWnanoProvidersEnv). So Nano is
 * told it can run 17 providers' models while Desktop's picker exposes none of
 * them.
 *
 * These assertions freeze both halves so the asymmetry is a fact in the suite,
 * not a claim in a report. Each half carries a positive control, so a rename or a
 * moved map cannot turn this into a vacuous pass.
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

  it('has NO row for wnano, so its picker candidate list is empty', () => {
    expect(Object.keys(ACP_BACKEND_UNDERLYING_PROVIDER)).not.toContain('wnano');
    expect(resolveBackendCandidateProviders('wnano')).toEqual([]);
  });

  it('yet the spawn payload advertises the full multi-provider set to Nano', () => {
    expect(NANO_KNOWN_PROVIDER_IDS.length).toBeGreaterThan(1);
    for (const providerId of ['flux-router', 'anthropic', 'openai', 'moonshot', 'xai'] as const) {
      expect(NANO_KNOWN_PROVIDER_IDS).toContain(providerId);
    }
  });
});
