import { describe, it, expect } from 'vitest';
import type { CatalogModel } from '@process/providers/types';
import { Curator } from '@process/providers/catalog/Curator';

const curator = new Curator();

const fluxAuto: CatalogModel = {
  id: 'flux-auto',
  providerId: 'flux-router',
  displayName: 'Flux Auto',
  family: 'flux-auto',
  kind: 'text',
  enriched: false,
  tags: [],
};

describe('Curator flux hero-exception', () => {
  it('keeps unenriched flux models enabled so they survive the picker filter', () => {
    const out = curator.curate([fluxAuto]);
    const auto = out.find((m) => m.id === 'flux-auto');
    expect(auto?.enabled).toBe(true);
  });

  it('keeps all four tier aliases enabled', () => {
    const tiers: CatalogModel[] = ['flux-auto', 'flux-reasoning', 'flux-standard', 'flux-fast'].map((id) => ({
      ...fluxAuto,
      id,
      family: id,
    }));
    const out = curator.curate(tiers);
    expect(out.filter((m) => m.enabled)).toHaveLength(4);
  });

  it('still disables an unenriched non-flux model', () => {
    const other: CatalogModel = { ...fluxAuto, id: 'mystery-1', providerId: 'openai', family: 'mystery' };
    const out = curator.curate([other]);
    expect(out.find((m) => m.id === 'mystery-1')?.enabled).toBe(false);
  });

  it('does NOT force-enable a non-tier flux-router model (only the tier aliases are hero)', () => {
    // The real flux-router catalog returns 40+ branded route models; only the
    // four tier aliases should get the hero exception, the rest follow normal
    // curation (an unenriched non-tier route stays disabled).
    const route: CatalogModel = {
      ...fluxAuto,
      id: 'anthropic/claude-opus-4-6',
      displayName: 'Flux Pinned Claude Opus 4.6',
      family: 'anthropic/claude-opus-4-6',
      enriched: false,
    };
    const out = curator.curate([route]);
    expect(out.find((m) => m.id === 'anthropic/claude-opus-4-6')?.enabled).toBe(false);
  });
});
