/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Flux Router provider registration lock (Wave 2).
 *
 * Flux Router connects as a fixed-endpoint, Bearer, OpenAI-compatible gateway.
 * The connect → test → catalog path is fully generic, so it only works if
 * `flux-router` is registered across every map the path reads. These assertions
 * pin that registration so a regression (a dropped map entry, a reordered key
 * rule) fails CI instead of silently breaking connect for a real `sk-flux-` key.
 *
 * The CHAT_START_* maps live module-private in `modelRegistryIpc` (which pulls
 * in sqlite/electron deps) and `TEST_MODEL` is private to `ConnectionTester`;
 * those are covered behind their public surfaces. This file locks the
 * independently-importable registration sites.
 */

import { describe, expect, it } from 'vitest';

import { PROVIDER_ENDPOINTS } from '../../../../src/process/providers/detection/providerEndpoints';
import { authStrategyFor } from '../../../../src/process/providers/detection/providerAuth';
import { PROVIDER_KEY_PATTERNS } from '../../../../src/process/providers/detection/providerKeyPatterns';

describe('flux-router provider registration', () => {
  it('registers the fixed Flux gateway models endpoint', () => {
    expect(PROVIDER_ENDPOINTS['flux-router']).toBe('https://api.fluxrouter.ai/v1/models');
  });

  it('authenticates with Bearer (the OpenAI-compatible default, not anthropic/query)', () => {
    expect(authStrategyFor('flux-router')).toEqual({ kind: 'bearer' });
  });

  it('matches sk-flux- keys to flux-router', () => {
    const rule = PROVIDER_KEY_PATTERNS.find((r) => r.provider === 'flux-router');
    expect(rule).toBeDefined();
    expect(rule?.match).toBe('unique');
    expect(rule?.test('sk-flux-abc123')).toBe(true);
    // A bare sk- key must NOT be claimed by the flux rule (it owns sk-flux- only).
    expect(rule?.test('sk-abc123')).toBe(false);
  });

  it('orders the sk-flux- rule before the structural bare-sk shapes', () => {
    // Detection iterates `SORTED_PATTERNS` by descending priority; within a tie
    // array order wins. The flux-router rule (priority 100) must rank ahead of
    // the structural sk- variants (priority 95) so a `sk-flux-...` key resolves
    // uniquely instead of falling into ambiguous bare-sk handling.
    const fluxRule = PROVIDER_KEY_PATTERNS.find((r) => r.provider === 'flux-router');
    const structuralRule = PROVIDER_KEY_PATTERNS.find((r) => r.match === 'structural');
    expect(fluxRule).toBeDefined();
    expect(structuralRule).toBeDefined();
    expect(fluxRule!.priority).toBeGreaterThan(structuralRule!.priority);
  });
});
