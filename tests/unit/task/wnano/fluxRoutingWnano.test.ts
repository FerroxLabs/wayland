import { describe, it, expect } from 'vitest';
import { resolveFluxRouting, FILE_HANDOFF_FLUX_BACKENDS } from '@process/task/fluxRouting';

const ctx = (over = {}) => ({
  backend: 'wnano',
  selectedModelId: undefined,
  fluxConnected: true,
  fluxKey: 'sk-flux-test',
  fluxKeyFilePath: '/userdata/wnano/flux-api-key-conv-1',
  routeThroughFlux: false,
  ...over,
});

describe('resolveFluxRouting wnano arm (C8 FLUX_API_KEY_FILE handoff)', () => {
  it('emits FLUX_API_KEY_FILE (the path, never the secret)', () => {
    const out = resolveFluxRouting(ctx());
    expect(out.routing).toBe('flux');
    expect(out.env).toEqual({ FLUX_API_KEY_FILE: '/userdata/wnano/flux-api-key-conv-1' });
  });

  it('never emits FLUX_API_KEY, even though a connected key exists', () => {
    const out = resolveFluxRouting(ctx());
    expect(out.env.FLUX_API_KEY).toBeUndefined();
    expect(JSON.stringify(out.env)).not.toContain('sk-flux-test');
  });

  it('strips ambient FLUX_API_KEY/FLUX_TEST_KEY so the connected key file wins (mutual exclusivity)', () => {
    const out = resolveFluxRouting(ctx());
    expect(out.stripKeys).toContain('FLUX_API_KEY');
    expect(out.stripKeys).toContain('FLUX_TEST_KEY');
  });

  it('does NOT strip native provider keys - wnano consumes them as its multi-provider credentials', () => {
    const out = resolveFluxRouting(ctx());
    expect(out.stripKeys).not.toContain('OPENAI_API_KEY');
    expect(out.stripKeys).not.toContain('ANTHROPIC_API_KEY');
    expect(out.stripKeys).not.toContain('XAI_API_KEY');
  });

  it('hands off unconditionally: a non-flux model pick and toggle off still get the file', () => {
    const out = resolveFluxRouting(ctx({ selectedModelId: 'openai:gpt-5.6-terra', routeThroughFlux: false }));
    expect(out.routing).toBe('flux');
    expect(out.env.FLUX_API_KEY_FILE).toBe('/userdata/wnano/flux-api-key-conv-1');
  });

  it('keeps the routing decision stable across model switches (no respawn churn)', () => {
    const fluxModel = resolveFluxRouting(ctx({ selectedModelId: 'flux-auto' }));
    const colonModel = resolveFluxRouting(ctx({ selectedModelId: 'anthropic:claude-opus-4-8' }));
    expect(fluxModel.routing).toBe('flux');
    expect(colonModel.routing).toBe(fluxModel.routing);
  });

  it('falls back to native when the key file could not be written (ambient-env fallback)', () => {
    const out = resolveFluxRouting(ctx({ fluxKeyFilePath: undefined }));
    expect(out.routing).toBe('native');
    expect(out.env).toEqual({});
    expect(out.stripKeys).toEqual([]);
  });

  it('stays native when flux is not connected (ambient FLUX_API_KEY dev fallback flows)', () => {
    const out = resolveFluxRouting(ctx({ fluxConnected: false, fluxKey: undefined }));
    expect(out.routing).toBe('native');
    expect(out.env).toEqual({});
    expect(out.stripKeys).toEqual([]);
  });

  it('registers wnano in the file-handoff backend set', () => {
    expect(FILE_HANDOFF_FLUX_BACKENDS).toContain('wnano');
  });
});
