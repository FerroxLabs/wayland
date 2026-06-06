import { describe, it, expect } from 'vitest';
import { resolveFluxRouting, GENERIC_FLUX_BACKENDS } from '@process/task/fluxRouting';

const ctx = (over = {}) => ({
  backend: 'qwen',
  selectedModelId: undefined,
  fluxConnected: true,
  fluxKey: 'sk-flux-test',
  routeThroughFlux: true,
  ...over,
});

describe('resolveFluxRouting', () => {
  it('routes a generic backend through Flux when toggle on + connected', () => {
    expect(resolveFluxRouting(ctx()).routing).toBe('flux');
  });
  it('routes when the selected model is a flux model even with toggle off', () => {
    expect(resolveFluxRouting(ctx({ routeThroughFlux: false, selectedModelId: 'flux-auto' })).routing).toBe('flux');
  });
  it('stays native when toggle off and a non-flux model is chosen', () => {
    expect(resolveFluxRouting(ctx({ routeThroughFlux: false, selectedModelId: 'gpt-5' })).routing).toBe('native');
  });
  it('stays native when no flux key / not connected', () => {
    expect(resolveFluxRouting(ctx({ fluxConnected: false, fluxKey: undefined })).routing).toBe('native');
  });
  it('routes claude through Flux via the anthropic surface (not openai)', () => {
    const out = resolveFluxRouting(ctx({ backend: 'claude' }));
    expect(out.routing).toBe('flux');
    expect(out.env.ANTHROPIC_BASE_URL).toBe('https://api.fluxrouter.ai/anthropic');
    expect(out.env.ANTHROPIC_AUTH_TOKEN).toBe('sk-flux-test');
    // Both auth headers pinned to the Flux key (binary prefers x-api-key; a stale
    // cc-switch ANTHROPIC_API_KEY must never win).
    expect(out.env.ANTHROPIC_API_KEY).toBe('sk-flux-test');
    expect(out.env.ANTHROPIC_MODEL).toBe('flux-auto');
    expect(out.env.OPENAI_BASE_URL).toBeUndefined();
  });
  it('strips native ANTHROPIC_* for claude so a flux spawn is mutually exclusive', () => {
    const out = resolveFluxRouting(ctx({ backend: 'claude' }));
    expect(out.stripKeys).toContain('ANTHROPIC_API_KEY');
    expect(out.stripKeys).toContain('ANTHROPIC_AUTH_TOKEN');
    expect(out.stripKeys).toContain('ANTHROPIC_BASE_URL');
    expect(out.stripKeys).toContain('ANTHROPIC_MODEL');
  });
  it('keeps claude native when no flux model + toggle off', () => {
    expect(
      resolveFluxRouting(ctx({ backend: 'claude', routeThroughFlux: false, selectedModelId: 'sonnet' })).routing
    ).toBe('native');
  });
  it('routes codex through Flux via the responses surface (emits only FLUX_API_KEY)', () => {
    const out = resolveFluxRouting(ctx({ backend: 'codex' }));
    expect(out.routing).toBe('flux');
    expect(out.env).toEqual({ FLUX_API_KEY: 'sk-flux-test' });
    // codex reads FLUX_API_KEY for its bearer; provider SELECTION is applied
    // separately (CODEX_HOME), so no OPENAI_*/ANTHROPIC_* surface env here.
    expect(out.env.OPENAI_BASE_URL).toBeUndefined();
    expect(out.env.ANTHROPIC_BASE_URL).toBeUndefined();
  });
  it('strips native OpenAI/Codex keys for codex (mutual exclusivity), keeps FLUX_API_KEY', () => {
    const out = resolveFluxRouting(ctx({ backend: 'codex' }));
    expect(out.stripKeys).toContain('OPENAI_API_KEY');
    expect(out.stripKeys).toContain('CODEX_API_KEY');
    expect(out.stripKeys).not.toContain('FLUX_API_KEY');
  });
  it('keeps codex native when no flux model + toggle off', () => {
    expect(
      resolveFluxRouting(ctx({ backend: 'codex', routeThroughFlux: false, selectedModelId: 'gpt-5' })).routing
    ).toBe('native');
  });
  it('keeps codex native when flux not connected', () => {
    expect(resolveFluxRouting(ctx({ backend: 'codex', fluxConnected: false, fluxKey: undefined })).routing).toBe(
      'native'
    );
  });
  it('emits mutually-exclusive env: flux surface only, plus strip list for native keys', () => {
    const out = resolveFluxRouting(ctx());
    expect(out.env).toEqual({
      OPENAI_BASE_URL: 'https://api.fluxrouter.ai/v1',
      OPENAI_API_KEY: 'sk-flux-test',
      OPENAI_MODEL: 'flux-auto',
    });
    expect(out.stripKeys).toContain('OPENAI_API_KEY');
    expect(out.stripKeys).toContain('OPENROUTER_API_KEY'); // native keys stripped for mutual exclusivity
    expect(out.stripKeys).toContain('OPENAI_MODEL');
  });
  it('coerces the model to flux-auto so a non-auto flux tier id is never sent to Flux', () => {
    const out = resolveFluxRouting(ctx({ selectedModelId: 'flux-fast' }));
    expect(out.routing).toBe('flux');
    expect(out.env.OPENAI_MODEL).toBe('flux-auto');
  });
  it('keeps an explicit native model native even with the toggle on (openai backend: qwen)', () => {
    // R5 rule 1: an explicit per-chat pick wins over the global toggle.
    const out = resolveFluxRouting(ctx({ backend: 'qwen', selectedModelId: 'qwen3-coder', routeThroughFlux: true }));
    expect(out.routing).toBe('native');
  });
  it('keeps an explicit native model native even with the toggle on (anthropic backend: claude)', () => {
    const out = resolveFluxRouting(ctx({ backend: 'claude', selectedModelId: 'sonnet', routeThroughFlux: true }));
    expect(out.routing).toBe('native');
  });
  it('routes a flux model even with the toggle off', () => {
    expect(resolveFluxRouting(ctx({ selectedModelId: 'flux-auto', routeThroughFlux: false })).routing).toBe('flux');
  });
  it('routes through Flux when no model is selected and the toggle is on (default role)', () => {
    expect(resolveFluxRouting(ctx({ selectedModelId: undefined, routeThroughFlux: true })).routing).toBe('flux');
  });
  it('stays native when no model is selected and the toggle is off', () => {
    expect(resolveFluxRouting(ctx({ selectedModelId: undefined, routeThroughFlux: false })).routing).toBe('native');
  });
  it('lists only the empirically-proven env-routable backends (qwen, goose)', () => {
    // Verified 2026-06-05 against a live capture server: qwen + goose route
    // flux-auto through Flux via R13-safe env injection. opencode/qoder need the
    // config-writing setup assistant; droid/auggie/copilot/kiro/vibe are
    // vendor-locked and not Flux-routable.
    expect(GENERIC_FLUX_BACKENDS).toContain('qwen');
    expect(GENERIC_FLUX_BACKENDS).toContain('goose');
    expect(GENERIC_FLUX_BACKENDS).not.toContain('opencode');
    expect(GENERIC_FLUX_BACKENDS).not.toContain('droid');
    expect(GENERIC_FLUX_BACKENDS).not.toContain('claude');
  });
  it('injects backend-specific env so goose selects the openai provider + flux-auto', () => {
    const out = resolveFluxRouting(ctx({ backend: 'goose' }));
    expect(out.routing).toBe('flux');
    expect(out.env.GOOSE_PROVIDER).toBe('openai');
    expect(out.env.GOOSE_MODEL).toBe('flux-auto');
    expect(out.env.OPENAI_BASE_URL).toBe('https://api.fluxrouter.ai/v1');
    // backend-specific vars must also be stripped first for mutual exclusivity
    expect(out.stripKeys).toContain('GOOSE_PROVIDER');
    expect(out.stripKeys).toContain('GOOSE_MODEL');
  });
  it('does not inject goose env for a non-goose backend (qwen stays minimal)', () => {
    const out = resolveFluxRouting(ctx({ backend: 'qwen' }));
    expect(out.env.GOOSE_PROVIDER).toBeUndefined();
    expect(out.env.OPENAI_MODEL).toBe('flux-auto');
  });
  it('resolves a config-only/vendor-locked backend (opencode) to unknown, never flux', () => {
    expect(resolveFluxRouting(ctx({ backend: 'opencode' })).routing).toBe('unknown');
  });
});
