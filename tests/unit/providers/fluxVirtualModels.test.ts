import { describe, it, expect } from 'vitest';
import type { CatalogModel } from '@process/providers/types';
import { injectFluxVirtualModels } from '@process/providers/catalog/fluxVirtualModels';

describe('injectFluxVirtualModels', () => {
  it('adds all four flux models when upstream returned none', () => {
    const out = injectFluxVirtualModels([]);
    expect(out.map((m) => m.id)).toEqual(['flux-auto', 'flux-reasoning', 'flux-standard', 'flux-fast']);
    expect(out.every((m) => m.providerId === 'flux-router')).toBe(true);
    expect(out.every((m) => m.enriched === false)).toBe(true);
  });

  it('does not duplicate a model the upstream list already provided', () => {
    const upstream: CatalogModel[] = [
      {
        id: 'flux-auto',
        providerId: 'flux-router',
        displayName: 'Upstream Auto',
        family: 'flux-auto',
        kind: 'text',
        enriched: true,
        tags: [],
      },
    ];
    const out = injectFluxVirtualModels(upstream);
    expect(out.filter((m) => m.id === 'flux-auto')).toHaveLength(1);
    expect(out.find((m) => m.id === 'flux-auto')?.displayName).toBe('Upstream Auto');
    expect(out.map((m) => m.id)).toContain('flux-fast');
  });
});
