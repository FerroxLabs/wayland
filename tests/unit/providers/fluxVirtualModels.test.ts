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

describe('Flux tiers carry the context window the Router actually advertises', () => {
  // Customers told Sean they were "using up context so quickly" because the
  // meter read 200K. GET https://api.fluxrouter.ai/v1/models (checked live,
  // 2026-08-23) reports max_input_tokens 1000000 for all four tiers. We were
  // understating the product by 5x on our own screen.
  it('backfills a window on the UPSTREAM rows, which is where the tiers really arrive', () => {
    // The Router returns these ids itself, so the virtual-injection path is
    // skipped for them. A fix that only touched the virtuals would have
    // changed nothing the user could see.
    const upstream = [
      { id: 'flux-auto', providerId: 'flux-router', displayName: 'Flux Auto', family: 'flux-auto', kind: 'text', enriched: false, tags: [] },
      { id: 'flux-fast', providerId: 'flux-router', displayName: 'Flux Fast', family: 'flux-fast', kind: 'text', enriched: false, tags: [] },
    ] as never;

    const out = injectFluxVirtualModels(upstream);
    for (const id of ['flux-auto', 'flux-fast']) {
      expect(out.find((m) => m.id === id)?.contextWindow).toBe(1_000_000);
    }
  });

  it('does not clobber a real window the catalog already resolved', () => {
    const upstream = [
      { id: 'flux-auto', providerId: 'flux-router', displayName: 'Flux Auto', family: 'flux-auto', kind: 'text', enriched: true, contextWindow: 2_000_000, tags: [] },
    ] as never;
    expect(injectFluxVirtualModels(upstream).find((m) => m.id === 'flux-auto')?.contextWindow).toBe(2_000_000);
  });

  it('gives every injected virtual tier the window too', () => {
    const out = injectFluxVirtualModels([] as never);
    for (const id of ['flux-auto', 'flux-reasoning', 'flux-standard', 'flux-fast']) {
      expect(out.find((m) => m.id === id)?.contextWindow).toBe(1_000_000);
    }
  });
});
