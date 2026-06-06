import { describe, it, expect } from 'vitest';
import { resolveFluxRouting } from '@process/task/fluxRouting';

describe('R13 - Flux is additive and reversible', () => {
  it('no flux key -> generic backend stays native (no env injected, nothing to strand)', () => {
    const out = resolveFluxRouting({
      backend: 'qwen',
      selectedModelId: 'flux-auto',
      fluxConnected: false,
      fluxKey: undefined,
      routeThroughFlux: true,
    });
    expect(out.routing).toBe('native');
    expect(out.env).toEqual({});
  });

  it('connected-but-empty key is treated as not connected', () => {
    const out = resolveFluxRouting({
      backend: 'qwen',
      selectedModelId: undefined,
      fluxConnected: true,
      fluxKey: '',
      routeThroughFlux: true,
    });
    expect(out.routing).toBe('native');
  });
});
