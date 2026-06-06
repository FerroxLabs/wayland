import { describe, it, expect } from 'vitest';
import {
  FLUX_PROVIDER_ID,
  FLUX_AUTO_MODEL,
  FLUX_MODEL_IDS,
  FLUX_SURFACE,
  isFluxProvider,
  isFluxModelId,
} from '@/common/config/flux';

describe('flux constants', () => {
  it('pins the canonical provider id and default model', () => {
    expect(FLUX_PROVIDER_ID).toBe('flux-router');
    expect(FLUX_AUTO_MODEL).toBe('flux-auto');
    expect(FLUX_MODEL_IDS).toEqual(['flux-auto', 'flux-reasoning', 'flux-standard', 'flux-fast']);
  });

  it('exposes the three rotating surfaces', () => {
    expect(FLUX_SURFACE.openai).toBe('https://api.fluxrouter.ai/v1');
    expect(FLUX_SURFACE.anthropic).toBe('https://api.fluxrouter.ai/anthropic');
  });

  it('detects flux provider and model ids', () => {
    expect(isFluxProvider('flux-router')).toBe(true);
    expect(isFluxProvider('openai')).toBe(false);
    expect(isFluxModelId('flux-auto')).toBe(true);
    expect(isFluxModelId('flux-reasoning')).toBe(true);
    expect(isFluxModelId('gpt-5')).toBe(false);
  });
});
