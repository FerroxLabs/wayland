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

  it('keeps unenriched local Ollama models enabled so they survive the picker filter', () => {
    // Local Ollama is keyless + unenriched (no /v1/models to enrich), same class
    // as the flux/chatgpt-subscription virtual sets. Without the exception it
    // lands enabled:false and disappears from the WCore picker entirely.
    const ollama: CatalogModel[] = [
      { ...fluxAuto, id: 'qwen3:32b', providerId: 'ollama-local', family: 'qwen3', displayName: 'qwen3:32b' },
      {
        ...fluxAuto,
        id: 'hf.co/Jackrong/Qwen3.5-27B',
        providerId: 'ollama-local',
        family: 'hf.co/Jackrong/Qwen3.5-27B',
        displayName: 'Qwen3.5 27B',
      },
    ];
    const out = curator.curate(ollama);
    expect(out.filter((m) => m.enabled)).toHaveLength(2);
    // user-installed local models are selectable but not promoted to Recommended
    expect(out.every((m) => m.recommended === false)).toBe(true);
  });

  it('keeps unenriched Sakana models enabled so a connected Sakana provider is usable', () => {
    // Sakana (fugu/fugu-ultra) is a new provider not yet in models.dev, so its
    // live `/v1/models` entries are unenriched and would land enabled:false,
    // hiding the whole provider from the picker. Same class as Ollama/flux.
    const sakana: CatalogModel[] = [
      { ...fluxAuto, id: 'fugu', providerId: 'sakana', family: 'fugu', displayName: 'fugu', enriched: false },
      {
        ...fluxAuto,
        id: 'fugu-ultra',
        providerId: 'sakana',
        family: 'fugu-ultra',
        displayName: 'fugu-ultra',
        enriched: false,
      },
    ];
    const out = curator.curate(sakana);
    expect(out.filter((m) => m.enabled)).toHaveLength(2);
    expect(out.every((m) => m.recommended === false)).toBe(true);
  });

  it('force-enables non-tier flux-router route models too (Flux Router → all models on)', () => {
    // The real flux-router catalog returns 40+ branded route models. Flux Router
    // users expect every routed model available out of the box, so the whole
    // provider is force-enabled — not just the four tier aliases. (Previously an
    // unenriched non-tier route fell through to normal curation and stayed
    // disabled, hiding it from the picker.)
    const route: CatalogModel = {
      ...fluxAuto,
      id: 'anthropic/claude-opus-4-6',
      displayName: 'Flux Pinned Claude Opus 4.6',
      family: 'anthropic/claude-opus-4-6',
      enriched: false,
    };
    const out = curator.curate([route]);
    const curated = out.find((m) => m.id === 'anthropic/claude-opus-4-6');
    expect(curated?.enabled).toBe(true);
    // Routed models stay out of the Recommended zone (recommended: false).
    expect(curated?.recommended).toBe(false);
  });

  it('drops unenriched image/audio flux-router arms from the chat picker (kind:text but not chattable)', () => {
    // These land kind:'text' because models.dev has not enriched them, and the
    // Flux all-on rule would otherwise force-enable them straight into the chat
    // dropdown. Image + audio arms must never reach the chat picker.
    const arms: CatalogModel[] = [
      { ...fluxAuto, id: 'gpt-image-high', family: 'gpt-image-high', displayName: 'GPT Image High' },
      { ...fluxAuto, id: 'nano-banana', family: 'nano-banana', displayName: 'Nano Banana' },
      { ...fluxAuto, id: 'flux-voice', family: 'flux-voice', displayName: 'Flux Voice' },
      { ...fluxAuto, id: 'flux-voice-fast', family: 'flux-voice-fast', displayName: 'Flux Voice Fast' },
      // A real chat arm must survive alongside them.
      {
        ...fluxAuto,
        id: 'perplexity/sonar-reasoning-pro',
        family: 'sonar',
        displayName: 'Flux Pinned Sonar Reasoning Pro',
      },
    ];
    const out = curator.curate(arms);
    expect(out.map((m) => m.id)).toEqual(['perplexity/sonar-reasoning-pro']);
  });
});
