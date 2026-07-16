/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpAgentManager.computeFluxRouting - native-model belt-and-suspenders.
 *
 * The team/workflow failure (#555-adjacent): a spawn arrives with NO explicit
 * model (team_spawn_agent is usually called with no model), the global
 * `system.routeThroughFlux` toggle is ON, and the backend (codex) natively runs
 * the customer's OpenAI model (gpt-5.6-sol via an OpenAI API key OR a ChatGPT
 * subscription). Without a resolved model the toggle forced the spawn to Flux,
 * which 400s "the 'gpt-5.6-sol' model does not exist". computeFluxRouting now
 * falls back to the backend's OWN resolved model (cached CLI model / configured
 * preferred id) so the routing decision stays `native`.
 *
 * Mirrors fluxRoutingRespawn.test.ts's bare-manager (Object.create) pattern, but
 * exercises the REAL computeFluxRouting, stubbing only the flux-key seam and the
 * ProcessConfig reads.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// AcpAgentManager pulls a large process-side graph; the database module is the
// only hard dependency its top-level imports need here.
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn() }));

// Hoisted so the vi.mock factory (also hoisted) can reference it safely.
const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: mockGet, getConfig: vi.fn(() => ({})) },
}));

import AcpAgentManager from '@process/task/AcpAgentManager';

type RoutingResult = { routing: 'flux' | 'native' | 'unknown' };

/** ProcessConfig.get stub driven by a per-test config map. */
function stubConfig(map: {
  routeThroughFlux?: boolean;
  cachedModels?: Record<string, { currentModelId?: string }>;
  acpConfig?: Record<string, { preferredModelId?: string }>;
}): void {
  mockGet.mockImplementation((key: string) => {
    switch (key) {
      case 'system.routeThroughFlux':
        return Promise.resolve(map.routeThroughFlux ?? false);
      case 'acp.cachedModels':
        return Promise.resolve(map.cachedModels ?? {});
      case 'acp.config':
        return Promise.resolve(map.acpConfig ?? {});
      default:
        return Promise.resolve(undefined);
    }
  });
}

/** Bare AcpAgentManager with the flux key seam stubbed to a connected key. */
function bareManager(): { manager: AcpAgentManager } {
  const manager = Object.create(AcpAgentManager.prototype) as AcpAgentManager;
  const m = manager as unknown as Record<string, unknown>;
  m.readFluxKey = vi.fn().mockResolvedValue('sk-flux-test');
  return { manager };
}

const compute = (manager: AcpAgentManager, backend: string, selectedModelId: string | undefined) =>
  (
    manager as unknown as {
      computeFluxRouting: (b: string, s: string | undefined) => Promise<RoutingResult>;
    }
  ).computeFluxRouting(backend, selectedModelId);

describe('AcpAgentManager.computeFluxRouting - resolved-native-model guard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('routes native when a team/workflow spawn has no model but codex cached gpt-5.6-sol (toggle ON)', async () => {
    stubConfig({ routeThroughFlux: true, cachedModels: { codex: { currentModelId: 'gpt-5.6-sol' } } });
    const { manager } = bareManager();
    expect((await compute(manager, 'codex', undefined)).routing).toBe('native');
  });

  it('routes native from the configured preferred model when there is no cached model (toggle ON)', async () => {
    stubConfig({ routeThroughFlux: true, acpConfig: { codex: { preferredModelId: 'gpt-5.6-sol' } } });
    const { manager } = bareManager();
    expect((await compute(manager, 'codex', undefined)).routing).toBe('native');
  });

  it('routes native for an explicit non-flux pick even with the toggle ON (threaded model)', async () => {
    stubConfig({ routeThroughFlux: true });
    const { manager } = bareManager();
    expect((await compute(manager, 'codex', 'gpt-5.6-sol')).routing).toBe('native');
  });

  it('still routes to Flux when the spawn has genuinely no model (no pick, no cache) + toggle ON', async () => {
    stubConfig({ routeThroughFlux: true });
    const { manager } = bareManager();
    expect((await compute(manager, 'codex', undefined)).routing).toBe('flux');
  });

  it('does NOT consult the backend identity when an explicit model is passed', async () => {
    stubConfig({ routeThroughFlux: true, cachedModels: { codex: { currentModelId: 'gpt-5.6-sol' } } });
    const { manager } = bareManager();
    await compute(manager, 'codex', 'gpt-5.6-sol');
    // acp.cachedModels / acp.config are only read on the no-explicit-model path.
    expect(mockGet).not.toHaveBeenCalledWith('acp.cachedModels');
    expect(mockGet).not.toHaveBeenCalledWith('acp.config');
  });
});
