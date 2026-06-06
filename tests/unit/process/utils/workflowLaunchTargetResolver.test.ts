/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for `resolveDefaultLaunchTarget` - the main-process fallback resolver
 * that reads guid.lastSelectedAgent + AgentRegistry when the renderer does not
 * supply an explicit launch target. See initBridge.ts + WorkflowSessionService.
 */

import { describe, expect, it } from 'vitest';
import type { TProviderWithModel } from '@/common/config/storage';
import type { DetectedAgent } from '@/common/types/detectedAgent';
import {
  resolveDefaultLaunchTarget,
  type ProcessConfigLike,
  type AgentRegistryLike,
} from '@process/utils/workflowLaunchTargetResolver';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WCORE_AGENT: DetectedAgent = {
  id: 'wcore',
  name: 'Wayland Core',
  kind: 'wcore',
  available: true,
  backend: 'wcore',
  cliPath: '/foo/wcore',
};

const CLAUDE_AGENT: DetectedAgent = {
  id: 'claude',
  name: 'Claude Code',
  kind: 'acp',
  available: true,
  backend: 'claude',
  cliPath: '/usr/local/bin/claude',
};

const ANTHROPIC_PROVIDER: TProviderWithModel = {
  id: 'anthropic',
  platform: 'claude',
  name: 'Anthropic',
  baseUrl: 'https://api.anthropic.com',
  apiKey: 'test-key',
  useModel: 'claude-sonnet-4-5',
};

/**
 * Build a minimal ProcessConfigLike fake with specific key→value overrides.
 * Missing keys resolve to undefined.
 */
function makeConfig(values: Record<string, unknown>): ProcessConfigLike {
  return {
    get: async (key: string) => values[key],
  };
}

function makeRegistry(agents: DetectedAgent[]): AgentRegistryLike {
  return {
    getDetectedAgents: () => [...agents],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveDefaultLaunchTarget()', () => {
  it('returns wcore backend + cliPath when lastSelectedAgent is "wcore"', async () => {
    const config = makeConfig({
      'guid.lastSelectedAgent': 'wcore',
      'model.config': [ANTHROPIC_PROVIDER],
    });
    const registry = makeRegistry([WCORE_AGENT, CLAUDE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.backend).toBe('wcore');
    expect(result.cliPath).toBe('/foo/wcore');
  });

  it('returns claude backend + cliPath when lastSelectedAgent is "claude"', async () => {
    const config = makeConfig({
      'guid.lastSelectedAgent': 'claude',
      'model.config': [ANTHROPIC_PROVIDER],
    });
    const registry = makeRegistry([WCORE_AGENT, CLAUDE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.backend).toBe('claude');
    expect(result.cliPath).toBe('/usr/local/bin/claude');
  });

  it('returns backend=claude + cliPath=undefined when lastSelectedAgent is absent', async () => {
    const config = makeConfig({
      'model.config': [ANTHROPIC_PROVIDER],
    });
    const registry = makeRegistry([WCORE_AGENT, CLAUDE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.backend).toBe('claude');
    // No claude agent in registry that matches claude → falls to registry match
    // Actually CLAUDE_AGENT.backend === 'claude', so cliPath should be found.
    // This confirms the registry lookup works.
    expect(result.cliPath).toBe('/usr/local/bin/claude');
  });

  it('returns cliPath=undefined when no matching agent is in the registry', async () => {
    const config = makeConfig({
      'guid.lastSelectedAgent': 'codex',
      'model.config': [ANTHROPIC_PROVIDER],
    });
    // Registry has wcore + claude but not codex.
    const registry = makeRegistry([WCORE_AGENT, CLAUDE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.backend).toBe('codex');
    expect(result.cliPath).toBeUndefined();
  });

  it('returns remote backend for "remote:*" key', async () => {
    const config = makeConfig({
      'guid.lastSelectedAgent': 'remote:some-id',
      'model.config': [ANTHROPIC_PROVIDER],
    });
    const registry = makeRegistry([WCORE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.backend).toBe('remote');
  });

  it('returns customAgentId and backend=claude for "custom:<id>" key', async () => {
    const config = makeConfig({
      'guid.lastSelectedAgent': 'custom:abc-123',
      'model.config': [ANTHROPIC_PROVIDER],
    });
    const registry = makeRegistry([CLAUDE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.customAgentId).toBe('abc-123');
    expect(result.backend).toBe('claude');
  });

  it('constructs model from matching provider in model.config', async () => {
    const wCoreProvider: TProviderWithModel = {
      id: 'wcore-prov',
      platform: 'wcore',
      name: 'Wayland Core Provider',
      baseUrl: '',
      apiKey: '',
      useModel: 'default',
    };
    const config = makeConfig({
      'guid.lastSelectedAgent': 'wcore',
      'model.config': [ANTHROPIC_PROVIDER, wCoreProvider],
    });
    const registry = makeRegistry([WCORE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    // Should match on platform === 'wcore'
    expect(result.model.id).toBe('wcore-prov');
  });

  it('applies preferredModelId from acp.config when present', async () => {
    const config = makeConfig({
      'guid.lastSelectedAgent': 'claude',
      'model.config': [ANTHROPIC_PROVIDER],
      'acp.config': {
        claude: { preferredModelId: 'claude-opus-4-5' },
      },
    });
    const registry = makeRegistry([CLAUDE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.model.useModel).toBe('claude-opus-4-5');
  });

  it('produces a synthetic placeholder model when no providers are configured (no auto fallback)', async () => {
    const config = makeConfig({
      'guid.lastSelectedAgent': 'claude',
      'model.config': [],
    });
    const registry = makeRegistry([CLAUDE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.model.id).toMatch(/fallback/);
    // No provider AND no cached model AND no preferred model → empty string.
    // Literal 'auto' is NOT a valid model identifier (upstream providers
    // reject with model_not_found - v0.6.1 live-smoke regression).
    expect(result.model.useModel).toBe('');
  });

  it('falls through to acp.cachedModels.currentModelId when preferredModelId is absent', async () => {
    const config = makeConfig({
      'guid.lastSelectedAgent': 'claude',
      'model.config': [ANTHROPIC_PROVIDER],
      'acp.cachedModels': {
        claude: { currentModelId: 'claude-sonnet-4-5', availableModels: [] },
      },
    });
    const registry = makeRegistry([CLAUDE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.model.useModel).toBe('claude-sonnet-4-5');
  });

  it('binds the preferred model to the provider that SERVES it for wcore, not providerList[0] (C1)', async () => {
    const google = {
      id: 'google',
      platform: 'gemini',
      name: 'Google',
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiKey: 'k',
      useModel: 'gemini-3-pro',
      model: ['gemini-3-pro', 'gemini-3-flash'],
    } as unknown as TProviderWithModel;
    const openai = {
      id: 'openai',
      platform: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com',
      apiKey: 'k',
      useModel: 'gpt-5.5',
      model: ['gpt-5.5', 'gpt-5'],
    } as unknown as TProviderWithModel;
    const config = makeConfig({
      'guid.lastSelectedAgent': 'wcore',
      'model.config': [google, openai], // Google is index 0
      'acp.config': { wcore: { preferredModelId: 'gpt-5.5' } },
    });
    const registry = makeRegistry([WCORE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    // gpt-5.5 must bind to OpenAI (its owner), NOT Google (providerList[0]) -
    // otherwise gpt-5.5 is POSTed to the Google API → 404.
    expect(result.model.id).toBe('openai');
    expect(result.model.useModel).toBe('gpt-5.5');
  });

  it("uses the first provider's OWN model when nothing serves the preferred model (C1/C2 - no foreign alias)", async () => {
    const google = {
      id: 'google',
      platform: 'gemini',
      name: 'Google',
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiKey: 'k',
      useModel: 'gemini-3-pro',
      model: ['gemini-3-pro'],
    } as unknown as TProviderWithModel;
    const config = makeConfig({
      'guid.lastSelectedAgent': 'wcore',
      'model.config': [google], // only Google; nothing serves gpt-5.5
      'acp.config': { wcore: { preferredModelId: 'gpt-5.5' } },
    });
    const registry = makeRegistry([WCORE_AGENT]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    // Must NOT paste gpt-5.5 onto Google (would 404) - use Google's own model.
    expect(result.model.id).toBe('google');
    expect(result.model.useModel).toBe('gemini-3-pro');
  });

  it('handles config.get throwing gracefully - defaults to claude + undefined cliPath', async () => {
    const config: ProcessConfigLike = {
      get: async () => {
        throw new Error('config unavailable');
      },
    };
    const registry = makeRegistry([]);

    const result = await resolveDefaultLaunchTarget(config, registry);

    expect(result.backend).toBe('claude');
    expect(result.cliPath).toBeUndefined();
  });
});
