import { describe, expect, it } from 'vitest';

import { FLUX_MODEL_IDS } from '@/common/config/flux';
import type { AcpModelInfo } from '@/common/types/acpTypes';
import { resolvePinnedModelInfo } from '@renderer/components/agent/acpModelPin';

const info = (currentModelId: string, ids: string[]): AcpModelInfo => ({
  source: 'models',
  sourceDetail: 'test',
  currentModelId,
  currentModelLabel: currentModelId,
  canSwitch: true,
  availableModels: ids.map((id) => ({ id, label: id.toUpperCase() })),
});

const NO_PINS = { fluxModelId: null, showFlux: false, userChangedModel: false, selectedModelId: null };

describe('resolvePinnedModelInfo', () => {
  it('pins the user in-chat selection when a refresh reports the agent default (#136/#146/#149)', () => {
    // This is the bug: the 1.5s poll reports `default`; the user picked `opus`.
    const out = resolvePinnedModelInfo(info('default', ['opus', 'default']), {
      ...NO_PINS,
      userChangedModel: true,
      selectedModelId: 'opus',
    });
    expect(out.currentModelId).toBe('opus');
    expect(out.currentModelLabel).toBe('OPUS');
  });

  it('does NOT pin before the user has changed the model (lets the agent value through)', () => {
    const next = info('default', ['opus', 'default']);
    const out = resolvePinnedModelInfo(next, { ...NO_PINS, userChangedModel: false, selectedModelId: 'opus' });
    expect(out).toBe(next); // unchanged reference
    expect(out.currentModelId).toBe('default');
  });

  it('does NOT pin a selection that is no longer offered', () => {
    const next = info('default', ['opus', 'default']);
    const out = resolvePinnedModelInfo(next, { ...NO_PINS, userChangedModel: true, selectedModelId: 'gone' });
    expect(out).toBe(next);
    expect(out.currentModelId).toBe('default');
  });

  it('is a no-op when the refresh already reports the selected model', () => {
    const next = info('opus', ['opus', 'default']);
    const out = resolvePinnedModelInfo(next, { ...NO_PINS, userChangedModel: true, selectedModelId: 'opus' });
    expect(out).toBe(next);
  });

  it('pins a Flux tier ahead of a native selection when Flux is showable', () => {
    const flux = FLUX_MODEL_IDS[0];
    const out = resolvePinnedModelInfo(info('sonnet', ['sonnet', 'opus']), {
      fluxModelId: flux,
      showFlux: true,
      userChangedModel: true,
      selectedModelId: 'opus',
    });
    expect(out.currentModelId).toBe(flux);
  });

  it('ignores the Flux pin when Flux is not showable, falling back to the native pin', () => {
    const flux = FLUX_MODEL_IDS[0];
    const out = resolvePinnedModelInfo(info('default', ['opus', 'default']), {
      fluxModelId: flux,
      showFlux: false,
      userChangedModel: true,
      selectedModelId: 'opus',
    });
    expect(out.currentModelId).toBe('opus');
  });

  // #207: the Claude flyout emits registry ids ("claude-opus-4-8") while the
  // agent advertises slot ids ("opus"). An exact-only match left the native pin
  // dead, so a flux-routed Claude teammate's native pick fell through to the
  // agent's reported Flux model on every poll (reverted to Flux Fast).
  it('holds a native Claude pick when the flyout id is a registry id and the agent reports Flux (#207)', () => {
    const out = resolvePinnedModelInfo(info('flux-fast', ['sonnet', 'opus', 'haiku']), {
      fluxModelId: null, // selectedFluxModelRef is cleared once a native model is picked
      showFlux: true,
      userChangedModel: true,
      selectedModelId: 'claude-opus-4-8',
      backend: 'claude',
    });
    expect(out.currentModelId).toBe('opus');
    expect(out.currentModelLabel).toBe('OPUS'); // friendly slot label, not the raw registry id
  });

  it('maps the Claude registry id to the matching slot (sonnet, not opus) (#207)', () => {
    const out = resolvePinnedModelInfo(info('flux-fast', ['sonnet', 'opus', 'haiku']), {
      fluxModelId: null,
      showFlux: true,
      userChangedModel: true,
      selectedModelId: 'claude-sonnet-4-6',
      backend: 'claude',
    });
    expect(out.currentModelId).toBe('sonnet');
  });

  it('does NOT substring-match for non-Claude backends (no false slot match)', () => {
    // For codex, "gpt-5-codex" must NOT be coerced onto the available "gpt-5".
    const next = info('o3', ['gpt-5', 'o3']);
    const out = resolvePinnedModelInfo(next, {
      ...NO_PINS,
      userChangedModel: true,
      selectedModelId: 'gpt-5-codex',
      backend: 'codex',
    });
    // The pick has no exact row, so it is neither coerced onto the look-alike
    // "gpt-5" nor dropped back to the agent default "o3" — it is HELD verbatim so
    // a background acp_model_info event can't revert the codex selection.
    expect(out.currentModelId).toBe('gpt-5-codex');
    expect(out.currentModelId).not.toBe('gpt-5');
    expect(out.currentModelLabel).toBe('gpt-5-codex');
  });

  it('holds a codex pick when a background event reports the agent default (no exact row)', () => {
    // The revert bug: the agent poll reports its default "gpt-5" with a list that
    // does not include the user's picked "gpt-5-codex". Previously this fell
    // through to the default; now the pick is held.
    const out = resolvePinnedModelInfo(info('gpt-5', ['gpt-5', 'o3']), {
      ...NO_PINS,
      userChangedModel: true,
      selectedModelId: 'gpt-5-codex',
      backend: 'codex',
    });
    expect(out.currentModelId).toBe('gpt-5-codex');
  });

  it('pins the exact codex row when the event DOES advertise the pick', () => {
    const out = resolvePinnedModelInfo(info('gpt-5', ['gpt-5', 'gpt-5-codex']), {
      ...NO_PINS,
      userChangedModel: true,
      selectedModelId: 'gpt-5-codex',
      backend: 'codex',
    });
    expect(out.currentModelId).toBe('gpt-5-codex');
    expect(out.currentModelLabel).toBe('GPT-5-CODEX'); // friendly label from the row
  });

  it('does NOT hold a no-longer-offered selection when the backend is unknown (unchanged)', () => {
    // Backend-less cold-start path keeps the historical "drop to agent value"
    // behavior — only a known non-claude ACP backend holds an unmatched pick.
    const next = info('default', ['opus', 'default']);
    const out = resolvePinnedModelInfo(next, { ...NO_PINS, userChangedModel: true, selectedModelId: 'gone' });
    expect(out).toBe(next);
    expect(out.currentModelId).toBe('default');
  });
});
